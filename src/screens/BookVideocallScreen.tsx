import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import {
  ArrowLeft, Calendar, Clock, Coins, Video, AlertCircle, Check,
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────── */

type AvailableSlot = { day: number; from: string; to: string };

type ProfessionalInfo = {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string;
};

type VideocallConfig = {
  pricePerMinute: number;
  minDurationMin: number;
  maxDurationMin: number;
  availableSlots: AvailableSlot[];
  isActive: boolean;
  professional: ProfessionalInfo;
};

type BookedSlot = { start: string; durationMinutes: number };

/* ─── Helpers ────────────────────────────────────────────────── */

function getNext7Days(): Date[] {
  const days: Date[] = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  return days;
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_NAMES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

/** Parse "HH:MM" to minutes since midnight */
function hmToMinutes(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
}

/** Format minutes since midnight to "HH:MM" */
function minutesToHm(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Build 30-min time-slot starts for a given day, based on availableSlots.
 * Each returned value is minutes since midnight.
 */
function buildTimeSlots(
  dayOfWeek: number,
  availableSlots: AvailableSlot[],
): number[] {
  const matching = availableSlots.filter((s) => s.day === dayOfWeek);
  const slots: number[] = [];

  for (const range of matching) {
    const from = hmToMinutes(range.from);
    const to = hmToMinutes(range.to);
    for (let t = from; t + 30 <= to; t += 30) {
      slots.push(t);
    }
  }

  return slots.sort((a, b) => a - b);
}

/** Check if a candidate booking overlaps any booked slot */
function isSlotBooked(
  candidateDate: Date,
  candidateMinutes: number,
  duration: number,
  bookedSlots: BookedSlot[],
): boolean {
  const candidateStart = new Date(candidateDate);
  candidateStart.setHours(0, 0, 0, 0);
  candidateStart.setMinutes(candidateMinutes);
  const candidateEnd = new Date(candidateStart.getTime() + duration * 60_000);

  return bookedSlots.some((b) => {
    const bStart = new Date(b.start);
    const bEnd = new Date(bStart.getTime() + b.durationMinutes * 60_000);
    return candidateStart < bEnd && candidateEnd > bStart;
  });
}

/* ─── Component ──────────────────────────────────────────────── */

export function BookVideocallScreen() {
  const { professionalId } = useParams<{ professionalId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  /* ── Remote data ── */
  const [config, setConfig] = useState<VideocallConfig | null>(null);
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  /* ── Local selections ── */
  const [duration, setDuration] = useState<number>(0);
  const [selectedDay, setSelectedDay] = useState<Date>(getNext7Days()[0]);
  const [selectedTime, setSelectedTime] = useState<number | null>(null);

  /* ── Booking state ── */
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState('');

  /* ── Derived ── */
  const days = useMemo(() => getNext7Days(), []);
  const totalCost = config ? duration * config.pricePerMinute : 0;
  const insufficientBalance = totalCost > balance;

  const durationSteps = useMemo(() => {
    if (!config) return [];
    const steps: number[] = [];
    for (let d = config.minDurationMin; d <= config.maxDurationMin; d += 5) {
      steps.push(d);
    }
    // Ensure maxDurationMin is included even if not on a 5-min boundary
    if (steps.length > 0 && steps[steps.length - 1] !== config.maxDurationMin) {
      steps.push(config.maxDurationMin);
    }
    return steps;
  }, [config]);

  const timeSlots = useMemo(() => {
    if (!config) return [];
    return buildTimeSlots(selectedDay.getDay(), config.availableSlots);
  }, [config, selectedDay]);

  /* ── Fetch on mount ── */
  useEffect(() => {
    if (!professionalId) return;

    setLoading(true);
    setFetchError('');

    Promise.all([
      api.get<{ config: VideocallConfig }>(`/videocall/config/${professionalId}`),
      api.get<{ bookedSlots: BookedSlot[] }>(`/videocall/booked-slots/${professionalId}`),
      api.get<{ balance: number }>('/wallet'),
    ])
      .then(([cfgRes, slotsRes, walletRes]) => {
        setConfig(cfgRes.config);
        setBookedSlots(slotsRes.bookedSlots);
        setBalance(walletRes.balance);
        setDuration(cfgRes.config.minDurationMin);
      })
      .catch(() => {
        setFetchError('No se pudo cargar la información. Intenta de nuevo.');
      })
      .finally(() => setLoading(false));
  }, [professionalId]);

  /* ── Handlers ── */

  const handleBook = async () => {
    if (!config || selectedTime === null) return;

    setBookError('');

    if (insufficientBalance) {
      setBookError('Saldo insuficiente para agendar esta videollamada.');
      return;
    }

    const scheduledAt = new Date(selectedDay);
    scheduledAt.setHours(0, 0, 0, 0);
    scheduledAt.setMinutes(selectedTime);

    setBooking(true);
    try {
      await api.post('/videocall/book', {
        professionalId,
        scheduledAt: scheduledAt.toISOString(),
        durationMinutes: duration,
      });
      navigate('/lives');
    } catch (err: any) {
      const msg =
        err?.message || 'No se pudo agendar la videollamada. Intenta de nuevo.';
      setBookError(msg);
    } finally {
      setBooking(false);
    }
  };

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-neutral-400 text-sm">Cargando disponibilidad...</p>
        </div>
      </div>
    );
  }

  /* ── Error state ── */
  if (fetchError || !config) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center gap-4 px-6">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-neutral-300 text-center">{fetchError || 'Profesional no encontrado.'}</p>
        <button
          onClick={() => navigate(-1)}
          className="text-primary text-sm font-medium"
        >
          Volver
        </button>
      </div>
    );
  }

  const { professional } = config;

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-10">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-neutral-950/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-surface transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-400" />
          </button>
          <Video className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold">Agendar videollamada</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-5 max-w-lg mx-auto">
        {/* ── Professional info ── */}
        <div className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-4">
          <img
            src={professional.avatarUrl}
            alt={professional.displayName}
            className="w-14 h-14 rounded-full object-cover border-2 border-border"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base truncate">{professional.displayName}</p>
            <p className="text-neutral-500 text-sm truncate">@{professional.username}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-primary font-bold text-lg">{config.pricePerMinute}</p>
            <p className="text-neutral-500 text-xs">tokens/min</p>
          </div>
        </div>

        {/* ── Duration selector ── */}
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <Clock className="w-4 h-4" />
            <span>Duración</span>
            <span className="ml-auto text-white font-semibold">{duration} min</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {durationSteps.map((step) => (
              <button
                key={step}
                onClick={() => { setDuration(step); setBookError(''); }}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                  duration === step
                    ? 'bg-primary text-white'
                    : 'bg-neutral-950 border border-border text-neutral-400 hover:border-primary/50'
                }`}
              >
                {step} min
              </button>
            ))}
          </div>
        </div>

        {/* ── Day selector ── */}
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <Calendar className="w-4 h-4" />
            <span>Fecha</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {days.map((day) => {
              const isSelected =
                selectedDay.toDateString() === day.toDateString();
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => {
                    setSelectedDay(day);
                    setSelectedTime(null);
                    setBookError('');
                  }}
                  className={`flex flex-col items-center shrink-0 w-16 py-2.5 rounded-xl transition-colors ${
                    isSelected
                      ? 'bg-primary text-white'
                      : 'bg-neutral-950 border border-border text-neutral-400 hover:border-primary/50'
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    {DAY_NAMES[day.getDay()]}
                  </span>
                  <span className="text-lg font-bold leading-tight mt-0.5">
                    {day.getDate()}
                  </span>
                  <span className="text-[10px] opacity-60">
                    {MONTH_NAMES[day.getMonth()]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Time slots ── */}
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <Clock className="w-4 h-4" />
            <span>Hora disponible</span>
          </div>

          {timeSlots.length === 0 ? (
            <p className="text-neutral-600 text-sm py-2">
              No hay horarios disponibles este día.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((slot) => {
                const booked = isSlotBooked(
                  selectedDay,
                  slot,
                  duration,
                  bookedSlots,
                );
                const isSelected = selectedTime === slot;

                return (
                  <button
                    key={slot}
                    disabled={booked}
                    onClick={() => {
                      setSelectedTime(slot);
                      setBookError('');
                    }}
                    className={`py-2 rounded-xl text-sm font-medium transition-colors ${
                      booked
                        ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed line-through'
                        : isSelected
                          ? 'bg-primary text-white'
                          : 'bg-neutral-950 border border-border text-neutral-400 hover:border-primary/50'
                    }`}
                  >
                    {minutesToHm(slot)}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Cost summary ── */}
        <div className="bg-gradient-to-br from-primary/20 to-violet-600/10 border border-primary/15 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-neutral-300">
            <Coins className="w-4 h-4 text-primary" />
            <span>Resumen de costo</span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-neutral-400 text-sm">
              {duration} min &times; {config.pricePerMinute} tokens/min
            </span>
            <span className="text-2xl font-bold">{totalCost.toLocaleString('es-CL')} tokens</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-neutral-500 text-sm">Tu saldo</span>
            <span
              className={`font-semibold ${
                insufficientBalance ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {balance.toLocaleString('es-CL')} tokens
            </span>
          </div>

          {insufficientBalance && (
            <div className="flex items-center gap-2 mt-1 bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-400">
                Saldo insuficiente.{' '}
                <button
                  onClick={() => navigate('/comprar-tokens')}
                  className="underline font-semibold hover:text-red-300 transition-colors"
                >
                  Comprar tokens
                </button>
              </p>
            </div>
          )}
        </div>

        {/* ── Error message ── */}
        {bookError && (
          <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
            {bookError}
          </p>
        )}

        {/* ── Book button ── */}
        <button
          onClick={handleBook}
          disabled={
            booking ||
            selectedTime === null ||
            insufficientBalance ||
            duration === 0
          }
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-violet-500 text-white font-semibold rounded-2xl px-6 py-3.5 disabled:opacity-50 transition-opacity"
        >
          {booking ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Check className="w-5 h-5" />
          )}
          {booking ? 'Agendando...' : 'Agendar videollamada'}
        </button>
      </div>
    </div>
  );
}

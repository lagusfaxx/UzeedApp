import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Video, Calendar, Clock, Star, RefreshCw } from 'lucide-react';

interface HistoryBooking {
  id: string;
  status: string;
  scheduledAt: string;
  durationMinutes: number;
  totalTokens: number;
  professional: { id: string; displayName: string; avatarUrl: string | null; username: string };
  client: { id: string; displayName: string; avatarUrl: string | null; username: string };
}

export function SessionHistoryScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<HistoryBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ bookings: HistoryBooking[] }>('/videocall/bookings');
      setBookings((data.bookings || []).filter((b) => b.status === 'COMPLETED'));
    } catch {
      // Endpoint may not exist
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const isPro = user?.profileType === 'PROFESSIONAL';

  return (
    <div className="min-h-screen bg-neutral-950 safe-top safe-bottom">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="text-neutral-400 p-1">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-semibold">Historial de sesiones</h1>
        <div className="flex-1" />
        <button onClick={fetchHistory} className="text-neutral-400 p-2" disabled={loading}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="px-5 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-surface rounded-2xl p-8 text-center">
            <Video size={36} className="text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-400 font-medium">Sin sesiones completadas</p>
            <p className="text-neutral-600 text-sm mt-1">
              Tus videollamadas completadas aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => {
              const other = isPro ? booking.client : booking.professional;

              return (
                <div key={booking.id} className="bg-surface rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    {other?.avatarUrl ? (
                      <img src={other.avatarUrl} alt="" className="w-11 h-11 rounded-full object-cover" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-surface-light flex items-center justify-center text-neutral-500">
                        <Video size={18} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">
                        {other?.displayName || 'Usuario'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Calendar size={12} className="text-neutral-500" />
                        <span className="text-xs text-neutral-400">
                          {new Date(booking.scheduledAt).toLocaleDateString('es-CL', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock size={12} className="text-neutral-500" />
                        <span className="text-xs text-neutral-400">{booking.durationMinutes} min</span>
                        <span className="text-xs text-neutral-500">|</span>
                        <span className="text-xs text-primary-light">{booking.totalTokens} tokens</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-neutral-800 text-neutral-400 shrink-0">
                      Completada
                    </span>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => navigate(`/valorar/${booking.id}`)}
                      className="flex-1 bg-warning/15 border border-warning/30 text-warning font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs"
                    >
                      <Star size={14} />
                      Valorar
                    </button>
                    <button
                      onClick={() => navigate(`/chat/${isPro ? booking.client.id : booking.professional.id}`)}
                      className="flex-1 bg-primary/15 border border-primary/30 text-primary-light font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs"
                    >
                      Enviar mensaje
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

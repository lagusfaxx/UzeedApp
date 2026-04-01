import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import {
  Video, DollarSign, Clock, ToggleLeft, ToggleRight,
  Save, ArrowLeft,
} from 'lucide-react';

type VideocallConfig = {
  pricePerMinute: number;
  minDurationMin: number;
  maxDurationMin: number;
  isActive: boolean;
};

export function VideocallConfigScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState<VideocallConfig>({
    pricePerMinute: 100,
    minDurationMin: 5,
    maxDurationMin: 60,
    isActive: false,
  });

  useEffect(() => {
    if (!user) return;

    api
      .get<{ config: VideocallConfig | null }>(`/videocall/config/${user.id}`)
      .then(({ config }) => {
        if (config) {
          setForm({
            pricePerMinute: config.pricePerMinute,
            minDurationMin: config.minDurationMin,
            maxDurationMin: config.maxDurationMin,
            isActive: config.isActive,
          });
        }
      })
      .catch(() => {
        // No config yet — keep defaults
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (form.pricePerMinute < 1 || form.pricePerMinute > 10000) {
      setError('El precio debe estar entre 1 y 10.000 tokens/min');
      return;
    }
    if (form.minDurationMin < 1 || form.minDurationMin > 120) {
      setError('La duración mínima debe estar entre 1 y 120 min');
      return;
    }
    if (form.maxDurationMin < 1 || form.maxDurationMin > 180) {
      setError('La duración máxima debe estar entre 1 y 180 min');
      return;
    }
    if (form.maxDurationMin <= form.minDurationMin) {
      setError('La duración máxima debe ser mayor que la mínima');
      return;
    }

    setSaving(true);
    try {
      await api.put('/videocall/config', form);
      setSuccess('Configuración guardada correctamente');
    } catch {
      setError('No se pudo guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof VideocallConfig>(key: K, value: VideocallConfig[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
    setSuccess('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-neutral-400 text-sm">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-neutral-950/80 backdrop-blur-lg border-b border-[#262626]">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate('/perfil')}
            className="p-2 rounded-xl hover:bg-[#141414] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-400" />
          </button>
          <Video className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold">Configurar videollamada</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-5 max-w-lg mx-auto">
        {/* Summary card */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
          <p className="text-sm text-neutral-400 mb-1">Resumen actual</p>
          <p className="text-base font-medium">
            {form.pricePerMinute} tokens/min &middot; {form.minDurationMin}-{form.maxDurationMin} min &middot;{' '}
            <span className={form.isActive ? 'text-emerald-400' : 'text-neutral-500'}>
              {form.isActive ? 'Activo' : 'Inactivo'}
            </span>
          </p>
        </div>

        {/* Price per minute */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 space-y-2">
          <label className="flex items-center gap-2 text-sm text-neutral-400">
            <DollarSign className="w-4 h-4" />
            Precio por minuto (tokens)
          </label>
          <input
            type="number"
            min={1}
            max={10000}
            value={form.pricePerMinute}
            onChange={(e) => updateField('pricePerMinute', Number(e.target.value))}
            className="w-full bg-neutral-950 border border-[#262626] rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-primary transition-colors"
            placeholder="100"
          />
          <p className="text-xs text-neutral-600">Entre 1 y 10.000 tokens</p>
        </div>

        {/* Min duration */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 space-y-2">
          <label className="flex items-center gap-2 text-sm text-neutral-400">
            <Clock className="w-4 h-4" />
            Duración mínima (minutos)
          </label>
          <input
            type="number"
            min={1}
            max={120}
            value={form.minDurationMin}
            onChange={(e) => updateField('minDurationMin', Number(e.target.value))}
            className="w-full bg-neutral-950 border border-[#262626] rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-primary transition-colors"
            placeholder="5"
          />
          <p className="text-xs text-neutral-600">Entre 1 y 120 minutos</p>
        </div>

        {/* Max duration */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 space-y-2">
          <label className="flex items-center gap-2 text-sm text-neutral-400">
            <Clock className="w-4 h-4" />
            Duración máxima (minutos)
          </label>
          <input
            type="number"
            min={1}
            max={180}
            value={form.maxDurationMin}
            onChange={(e) => updateField('maxDurationMin', Number(e.target.value))}
            className="w-full bg-neutral-950 border border-[#262626] rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-primary transition-colors"
            placeholder="60"
          />
          <p className="text-xs text-neutral-600">Entre 1 y 180 minutos</p>
        </div>

        {/* Active toggle */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
          <button
            type="button"
            onClick={() => updateField('isActive', !form.isActive)}
            className="flex items-center justify-between w-full"
          >
            <span className="flex items-center gap-2 text-sm text-neutral-400">
              {form.isActive ? (
                <ToggleRight className="w-4 h-4 text-emerald-400" />
              ) : (
                <ToggleLeft className="w-4 h-4" />
              )}
              Recibir videollamadas
            </span>
            <div
              className={`relative w-12 h-7 rounded-full transition-colors ${
                form.isActive ? 'bg-emerald-500' : 'bg-neutral-700'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  form.isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </button>
        </div>

        {/* Error / success messages */}
        {error && (
          <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-xl px-4 py-3">
            {success}
          </p>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-violet-500 text-white font-semibold rounded-2xl px-6 py-3.5 disabled:opacity-50 transition-opacity"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </div>
    </div>
  );
}

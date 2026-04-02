import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { ArrowLeft, Flag, Check } from 'lucide-react';

const REASONS = [
  'Contenido inapropiado',
  'Acoso o intimidación',
  'Suplantación de identidad',
  'Spam o publicidad engañosa',
  'Fraude o estafa',
  'Menor de edad',
  'Otro',
];

export function ReportScreen() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setLoading(true);
    try {
      await api.post('/contact', {
        email: 'reporte@uzeed.cl',
        category: 'user_report',
        name: `Reporte de usuario: ${userId}`,
        message: `Motivo: ${reason}\nDetalles: ${details.trim().slice(0, 1000) || 'Sin detalles adicionales'}`,
      });
      setDone(true);
    } catch {
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-6 safe-top">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-success" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Reporte enviado</h2>
          <p className="text-neutral-400 text-sm mb-6">
            Revisaremos tu reporte y tomaremos las medidas necesarias.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="bg-surface text-white font-medium py-3 px-8 rounded-xl"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 safe-top safe-bottom">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="text-neutral-400 p-1">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-semibold">Reportar usuario</h1>
      </div>

      <div className="px-5 py-6 space-y-5">
        <div className="flex items-start gap-3 bg-surface rounded-2xl p-4">
          <Flag size={18} className="text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-neutral-300">
            Selecciona el motivo del reporte. Tu identidad no será compartida
            con el usuario reportado.
          </p>
        </div>

        {/* Reasons */}
        <div className="space-y-2">
          {REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all text-sm ${
                reason === r
                  ? 'border-primary bg-primary/10 text-white'
                  : 'border-border bg-surface text-neutral-300'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Details */}
        <div>
          <label className="block text-xs text-neutral-400 mb-1.5">
            Detalles adicionales (opcional)
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Describe la situación..."
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-primary resize-none"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!reason || loading}
          className="w-full bg-gradient-to-r from-primary to-violet-500 disabled:from-neutral-800 disabled:to-neutral-800 disabled:text-neutral-500 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Flag size={16} />
              Enviar reporte
            </>
          )}
        </button>
      </div>
    </div>
  );
}

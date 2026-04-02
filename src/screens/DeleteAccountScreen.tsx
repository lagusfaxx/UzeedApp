import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { ArrowLeft, AlertTriangle, Trash2 } from 'lucide-react';

export function DeleteAccountScreen() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [confirmed, setConfirmed] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleDelete = async () => {
    if (!confirmed || !password.trim()) return;
    setError('');
    setLoading(true);
    try {
      // Verify password by attempting login first
      await api.post('/auth/login', {
        email: user?.email,
        password: password,
      });
      // Password verified - proceed with deletion request
      await api.post('/privacy/request-deletion', {
        type: 'account',
        email: user?.email || '',
        message: 'Solicitud verificada desde la app móvil',
      });
      setDone(true);
      setTimeout(() => {
        logout().catch(() => {});
      }, 3000);
    } catch (err: any) {
      const code = err?.code || err?.message || '';
      if (code === 'INVALID_CREDENTIALS') setError('Contraseña incorrecta');
      else setError('Error al procesar la solicitud. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={28} className="text-success" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Solicitud recibida</h2>
          <p className="text-neutral-400 text-sm">
            Tu solicitud de eliminación ha sido registrada. Procesaremos la eliminación
            de tu cuenta y datos en un máximo de 30 días.
          </p>
          <p className="text-neutral-500 text-xs mt-4">Cerrando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 safe-top safe-bottom">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="text-neutral-400 p-1">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-semibold">Eliminar cuenta</h1>
      </div>

      <div className="px-5 py-6 space-y-5">
        {/* Warning */}
        <div className="bg-danger/10 border border-danger/20 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={22} className="text-danger shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-danger mb-1">Acción irreversible</h3>
              <p className="text-sm text-neutral-300 leading-relaxed">
                Al eliminar tu cuenta se borrarán permanentemente:
              </p>
              <ul className="text-sm text-neutral-400 mt-2 space-y-1 list-disc list-inside">
                <li>Tu perfil y datos personales</li>
                <li>Historial de mensajes</li>
                <li>Galería de fotos</li>
                <li>Historial de transacciones</li>
                <li>Tokens restantes en tu billetera</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Confirm checkbox */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-border bg-surface accent-danger"
          />
          <span className="text-sm text-neutral-300">
            Entiendo que esta acción es permanente y deseo eliminar mi cuenta
            y todos mis datos de Uzeed.
          </span>
        </label>

        {/* Password */}
        <div>
          <label className="block text-xs text-neutral-400 mb-1.5">
            Confirma tu contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tu contraseña actual"
            autoComplete="current-password"
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-danger"
          />
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">
            <p className="text-danger text-sm">{error}</p>
          </div>
        )}

        {/* Delete button */}
        <button
          onClick={handleDelete}
          disabled={!confirmed || !password.trim() || loading}
          className="w-full bg-danger hover:bg-danger/90 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Trash2 size={16} />
              Eliminar mi cuenta permanentemente
            </>
          )}
        </button>

        <p className="text-neutral-600 text-xs text-center">
          También puedes solicitar la eliminación enviando un correo a contacto@uzeed.cl
        </p>
      </div>
    </div>
  );
}

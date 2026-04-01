import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';

export function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!displayName.trim()) {
          setError('Ingresa tu nombre');
          setLoading(false);
          return;
        }
        await register(email, password, displayName);
      }
    } catch (err: any) {
      const code = err?.code || err?.message || '';
      if (code === 'INVALID_CREDENTIALS') setError('Email o contraseña incorrectos');
      else if (code === 'EMAIL_IN_USE') setError('Este email ya está registrado');
      else setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center px-6 safe-top safe-bottom">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white tracking-tight">Uzeed</h1>
          <p className="text-neutral-500 text-sm mt-2">Herramienta para profesionales</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-surface rounded-xl p-1 mb-8">
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              mode === 'login' ? 'bg-primary text-white' : 'text-neutral-400'
            }`}
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              mode === 'register' ? 'bg-primary text-white' : 'text-neutral-400'
            }`}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs text-neutral-400 mb-1.5 ml-1">Nombre</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-neutral-400 mb-1.5 ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoCapitalize="off"
              autoComplete="email"
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1.5 ml-1">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 pr-12 text-white placeholder:text-neutral-600 focus:outline-none focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-danger text-sm text-center bg-danger/10 rounded-lg py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : mode === 'login' ? (
              <>
                <LogIn size={18} />
                Iniciar sesión
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Crear cuenta
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

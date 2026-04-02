import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, ArrowRight, User, Mail, Lock } from 'lucide-react';

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
        if (password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres');
          setLoading(false);
          return;
        }
        await register(email, password, displayName);
      }
    } catch (err: any) {
      const code = err?.code || err?.message || '';
      if (code === 'INVALID_CREDENTIALS') setError('Email o contraseña incorrectos');
      else if (code === 'EMAIL_IN_USE') setError('Este email ya está registrado');
      else if (code === 'BAD_REQUEST') setError('Revisa los datos ingresados');
      else setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  const isValid = mode === 'login'
    ? email.length > 0 && password.length > 0
    : email.length > 0 && password.length >= 6 && displayName.trim().length > 0;

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col safe-top safe-bottom">
      {/* Top decorative gradient */}
      <div className="absolute inset-x-0 top-0 h-80 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute -top-10 left-1/4 w-[300px] h-[300px] rounded-full bg-violet-600/5 blur-3xl" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-7 relative z-10">
        {/* Logo + Branding */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <img
              src="/Logo Uzeed Para fondo negro.png"
              alt="Uzeed"
              className="w-12 h-12 object-contain"
            />
          </div>
          <h2 className="text-3xl font-bold text-white leading-tight">
            {mode === 'login' ? 'Bienvenido\nde vuelta' : 'Crea tu\ncuenta'}
          </h2>
          <p className="text-neutral-500 text-sm mt-2">
            {mode === 'login'
              ? 'Inicia sesión para gestionar tu actividad'
              : 'Únete a la comunidad de profesionales'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                <User size={18} />
              </div>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Nombre completo"
                className="w-full bg-surface/80 backdrop-blur-sm border border-white/[0.06] rounded-2xl pl-12 pr-4 py-4 text-white text-[15px] placeholder:text-neutral-600 focus:outline-none focus:border-primary/50 focus:bg-surface transition-all"
              />
            </div>
          )}

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
              <Mail size={18} />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoCapitalize="off"
              autoComplete="email"
              className="w-full bg-surface/80 backdrop-blur-sm border border-white/[0.06] rounded-2xl pl-12 pr-4 py-4 text-white text-[15px] placeholder:text-neutral-600 focus:outline-none focus:border-primary/50 focus:bg-surface transition-all"
            />
          </div>

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
              <Lock size={18} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'Contraseña (mín. 6 caracteres)' : 'Contraseña'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="w-full bg-surface/80 backdrop-blur-sm border border-white/[0.06] rounded-2xl pl-12 pr-12 py-4 text-white text-[15px] placeholder:text-neutral-600 focus:outline-none focus:border-primary/50 focus:bg-surface transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600 active:text-neutral-400 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2.5 bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">
              <div className="w-1.5 h-1.5 rounded-full bg-danger shrink-0" />
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || !isValid}
            className="w-full bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90 disabled:from-neutral-800 disabled:to-neutral-800 disabled:text-neutral-500 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2.5 transition-all mt-2 shadow-lg shadow-primary/20 disabled:shadow-none"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Switch mode */}
        <div className="mt-8 text-center">
          <p className="text-neutral-500 text-sm">
            {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
            <button
              onClick={switchMode}
              className="text-primary-light font-semibold ml-1.5 active:text-primary transition-colors"
            >
              {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </div>
      </div>

      {/* Bottom indicator bar (iOS style) */}
      <div className="flex justify-center pb-2">
        <div className="w-32 h-1 rounded-full bg-white/10" />
      </div>
    </div>
  );
}

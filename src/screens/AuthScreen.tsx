import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  Eye, EyeOff, ArrowRight, ArrowLeft, User, Mail, Lock,
  Phone, MapPin, AtSign, Calendar, FileText, CheckCircle2,
} from 'lucide-react';
import { API_BASE } from '@/lib/api';

type ProfileType = 'CLIENT' | 'PROFESSIONAL';

type RegForm = {
  email: string;
  password: string;
  displayName: string;
  username: string;
  phone: string;
  profileType: ProfileType;
  gender: string;
  birthdate: string;
  bio: string;
  city: string;
  address: string;
};

const INITIAL_FORM: RegForm = {
  email: '',
  password: '',
  displayName: '',
  username: '',
  phone: '+56 9',
  profileType: 'CLIENT',
  gender: '',
  birthdate: '',
  bio: '',
  city: '',
  address: '',
};

export function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register multi-step
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<RegForm>(INITIAL_FORM);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Shared
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateForm = (updates: Partial<RegForm>) => {
    setForm((prev) => ({ ...prev, ...updates }));
    setError('');
  };

  // ── Login ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
    } catch (err: any) {
      const code = err?.code || err?.message || '';
      if (code === 'INVALID_CREDENTIALS') setError('Email o contraseña incorrectos');
      else if (code === 'ACCOUNT_SUSPENDED') setError('Tu cuenta ha sido suspendida');
      else setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // ── Register validation per step ──
  const isStep1Valid =
    form.displayName.trim().length >= 2 &&
    form.username.trim().length >= 3 &&
    /^[a-zA-Z0-9_]+$/.test(form.username.trim());

  const isStep2Valid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    form.password.length >= 8 &&
    /^\+56 9\d{4} ?\d{4}$/.test(form.phone.replace(/\s+/g, ' ').trim());

  const isStep3Valid = form.profileType === 'CLIENT'
    ? termsAccepted
    : termsAccepted &&
      form.gender !== '' &&
      form.birthdate !== '' &&
      form.bio.trim().length >= 20 &&
      form.city.trim().length >= 2;

  const totalSteps = form.profileType === 'PROFESSIONAL' ? 3 : 3;

  const handleNextStep = () => {
    setError('');
    if (step === 1 && !isStep1Valid) {
      if (form.displayName.trim().length < 2) setError('Nombre debe tener al menos 2 caracteres');
      else if (form.username.trim().length < 3) setError('Usuario debe tener al menos 3 caracteres');
      else setError('Usuario solo puede contener letras, números y guión bajo');
      return;
    }
    if (step === 2 && !isStep2Valid) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) setError('Ingresa un email válido');
      else if (form.password.length < 8) setError('La contraseña debe tener al menos 8 caracteres');
      else setError('Teléfono debe ser formato +56 9XXXX XXXX');
      return;
    }
    setStep((s) => Math.min(s + 1, totalSteps));
  };

  const handlePrevStep = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleRegister = async () => {
    if (!isStep3Valid) {
      if (!termsAccepted) setError('Debes aceptar los términos de servicio');
      else if (form.profileType === 'PROFESSIONAL') {
        if (!form.gender) setError('Selecciona tu género');
        else if (!form.birthdate) setError('Ingresa tu fecha de nacimiento');
        else if (form.bio.trim().length < 20) setError('La bio debe tener al menos 20 caracteres');
        else if (form.city.trim().length < 2) setError('Ingresa tu ciudad');
      }
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data: any = {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        displayName: form.displayName.trim(),
        username: form.username.trim().toLowerCase(),
        phone: form.phone.replace(/\s+/g, ' ').trim(),
        profileType: form.profileType,
        acceptTerms: true,
      };
      if (form.profileType === 'PROFESSIONAL') {
        data.gender = form.gender;
        data.birthdate = form.birthdate;
        data.bio = form.bio.trim();
        data.city = form.city.trim();
        if (form.address.trim()) data.address = form.address.trim();
      } else if (form.city.trim()) {
        data.city = form.city.trim();
      }
      await register(data);
    } catch (err: any) {
      const code = err?.code || err?.message || '';
      if (code === 'EMAIL_IN_USE') setError('Este email ya está registrado');
      else if (code === 'USERNAME_TAKEN') setError('Este nombre de usuario ya existe');
      else if (code === 'PHONE_IN_USE') setError('Este teléfono ya está registrado');
      else if (code === 'PROFILE_TYPE_INVALID') setError('Tipo de perfil no válido');
      else if (code === 'VALIDATION_ERROR' || code === 'BAD_REQUEST') setError('Revisa los datos ingresados');
      else setError(err?.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setStep(1);
    setForm(INITIAL_FORM);
    setTermsAccepted(false);
  };

  // ── Input component ──
  const Input = ({
    icon: Icon, type = 'text', value, onChange, placeholder, autoComplete, maxLength,
    right,
  }: {
    icon: any; type?: string; value: string; onChange: (v: string) => void;
    placeholder: string; autoComplete?: string; maxLength?: number;
    right?: React.ReactNode;
  }) => (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
        <Icon size={18} />
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoCapitalize={type === 'email' ? 'off' : 'sentences'}
        maxLength={maxLength}
        className="w-full bg-surface border border-border rounded-2xl pl-12 pr-12 py-4 text-white text-[15px] placeholder:text-neutral-600 focus:outline-none focus:border-primary/50 transition-all"
      />
      {right && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {right}
        </div>
      )}
    </div>
  );

  // ── Render LOGIN ──
  if (mode === 'login') {
    const isLoginValid = loginEmail.length > 0 && loginPassword.length > 0;

    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col safe-top safe-bottom">
        <div className="absolute inset-x-0 top-0 h-80 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute -top-10 left-1/4 w-[300px] h-[300px] rounded-full bg-violet-600/5 blur-3xl" />
        </div>

        <div className="flex-1 flex flex-col justify-center px-7 relative z-10">
          <div className="mb-10">
            <img
              src="/Logo Uzeed Para fondo negro.png"
              alt="Uzeed"
              className="w-14 h-14 object-contain mb-5"
            />
            <h2 className="text-3xl font-bold text-white leading-tight">
              Bienvenido{'\n'}de vuelta
            </h2>
            <p className="text-neutral-500 text-sm mt-2">
              Inicia sesión para continuar
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <Input
              icon={Mail}
              type="email"
              value={loginEmail}
              onChange={setLoginEmail}
              placeholder="Email"
              autoComplete="email"
            />
            <Input
              icon={Lock}
              type={showPassword ? 'text' : 'password'}
              value={loginPassword}
              onChange={setLoginPassword}
              placeholder="Contraseña"
              autoComplete="current-password"
              right={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-neutral-600 active:text-neutral-400 p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            {error && <ErrorBanner message={error} />}

            <button
              type="submit"
              disabled={loading || !isLoginValid}
              className="w-full bg-gradient-to-r from-primary to-violet-500 disabled:from-neutral-800 disabled:to-neutral-800 disabled:text-neutral-500 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2.5 transition-all mt-1 shadow-lg shadow-primary/20 disabled:shadow-none"
            >
              {loading ? <Spinner /> : (
                <>Iniciar sesión<ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-neutral-500 text-sm">
              ¿No tienes cuenta?
              <button onClick={switchMode} className="text-primary-light font-semibold ml-1.5">
                Regístrate
              </button>
            </p>
          </div>
        </div>

        <LegalFooter />
      </div>
    );
  }

  // ── Render REGISTER ──
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col safe-top safe-bottom">
      <div className="absolute inset-x-0 top-0 h-60 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-primary/6 blur-3xl" />
      </div>

      {/* Header with back + steps */}
      <div className="relative z-10 px-5 pt-4 pb-2 flex items-center gap-3">
        <button
          onClick={step === 1 ? switchMode : handlePrevStep}
          className="text-neutral-400 p-1"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1">
          <p className="text-[11px] text-neutral-500 font-medium uppercase tracking-wider">
            Paso {step} de {totalSteps}
          </p>
        </div>
        <img
          src="/Logo Uzeed Para fondo negro.png"
          alt="Uzeed"
          className="w-8 h-8 object-contain opacity-60"
        />
      </div>

      {/* Progress bar */}
      <div className="px-5 mb-6">
        <div className="h-1 bg-surface-light rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 px-7 relative z-10 overflow-y-auto">
        {/* ── STEP 1: Identity ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-white">¿Cómo te llamas?</h2>
              <p className="text-neutral-500 text-sm mt-1">
                Tu nombre real y un nombre de usuario único
              </p>
            </div>

            <div className="space-y-3">
              <Input
                icon={User}
                value={form.displayName}
                onChange={(v) => updateForm({ displayName: v })}
                placeholder="Nombre completo"
                autoComplete="name"
                maxLength={50}
              />
              <Input
                icon={AtSign}
                value={form.username}
                onChange={(v) => updateForm({ username: v.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() })}
                placeholder="Nombre de usuario"
                autoComplete="username"
                maxLength={30}
              />
              {form.username.length > 0 && (
                <p className="text-neutral-500 text-xs ml-1">
                  @{form.username.toLowerCase()}
                </p>
              )}
            </div>

            {/* Profile type selector */}
            <div className="space-y-2">
              <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">
                Tipo de cuenta
              </p>
              <div className="grid grid-cols-2 gap-3">
                <ProfileTypeCard
                  selected={form.profileType === 'CLIENT'}
                  onClick={() => updateForm({ profileType: 'CLIENT' })}
                  title="Cliente"
                  desc="Busca y contacta profesionales"
                />
                <ProfileTypeCard
                  selected={form.profileType === 'PROFESSIONAL'}
                  onClick={() => updateForm({ profileType: 'PROFESSIONAL' })}
                  title="Profesional"
                  desc="Ofrece tus servicios"
                />
              </div>
            </div>

            {error && <ErrorBanner message={error} />}

            <button
              onClick={handleNextStep}
              className="w-full bg-gradient-to-r from-primary to-violet-500 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-primary/20"
            >
              Siguiente
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* ── STEP 2: Credentials ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-white">Tus datos de acceso</h2>
              <p className="text-neutral-500 text-sm mt-1">
                Email, contraseña y número de contacto
              </p>
            </div>

            <div className="space-y-3">
              <Input
                icon={Mail}
                type="email"
                value={form.email}
                onChange={(v) => updateForm({ email: v })}
                placeholder="Email"
                autoComplete="email"
              />
              <Input
                icon={Lock}
                type={showRegPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(v) => updateForm({ password: v })}
                placeholder="Contraseña (mín. 8 caracteres)"
                autoComplete="new-password"
                right={
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="text-neutral-600 active:text-neutral-400 p-1"
                  >
                    {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
              <Input
                icon={Phone}
                type="tel"
                value={form.phone}
                onChange={(v) => updateForm({ phone: v })}
                placeholder="+56 9XXXX XXXX"
                autoComplete="tel"
              />
            </div>

            {/* Password strength indicator */}
            {form.password.length > 0 && (
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      form.password.length >= i * 3
                        ? i <= 2 ? 'bg-warning' : 'bg-success'
                        : 'bg-[#262626]'
                    }`}
                  />
                ))}
              </div>
            )}

            {error && <ErrorBanner message={error} />}

            <button
              onClick={handleNextStep}
              className="w-full bg-gradient-to-r from-primary to-violet-500 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-primary/20"
            >
              Siguiente
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* ── STEP 3: Profile details + Terms ── */}
        {step === 3 && (
          <div className="space-y-5 pb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {form.profileType === 'PROFESSIONAL' ? 'Tu perfil profesional' : 'Último paso'}
              </h2>
              <p className="text-neutral-500 text-sm mt-1">
                {form.profileType === 'PROFESSIONAL'
                  ? 'Estos datos son necesarios para tu perfil público'
                  : 'Revisa y acepta los términos para crear tu cuenta'}
              </p>
            </div>

            {form.profileType === 'PROFESSIONAL' && (
              <div className="space-y-3">
                {/* Gender */}
                <div className="space-y-1.5">
                  <p className="text-xs text-neutral-400 font-medium">Género</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'FEMALE', label: 'Femenino' },
                      { value: 'MALE', label: 'Masculino' },
                      { value: 'OTHER', label: 'Otro' },
                    ].map((g) => (
                      <button
                        key={g.value}
                        onClick={() => updateForm({ gender: g.value })}
                        className={`py-2.5 rounded-xl text-sm font-medium transition-all border ${
                          form.gender === g.value
                            ? 'bg-primary/15 border-primary text-white'
                            : 'bg-surface border-border text-neutral-400'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Birthdate */}
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                    <Calendar size={18} />
                  </div>
                  <input
                    type="date"
                    value={form.birthdate}
                    onChange={(e) => updateForm({ birthdate: e.target.value })}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    className="w-full bg-surface border border-border rounded-2xl pl-12 pr-4 py-4 text-white text-[15px] focus:outline-none focus:border-primary/50 transition-all [color-scheme:dark]"
                  />
                </div>

                {/* City */}
                <Input
                  icon={MapPin}
                  value={form.city}
                  onChange={(v) => updateForm({ city: v })}
                  placeholder="Ciudad"
                  maxLength={120}
                />

                {/* Bio */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <FileText size={14} className="text-neutral-500" />
                    <p className="text-xs text-neutral-400">Biografía profesional</p>
                  </div>
                  <textarea
                    value={form.bio}
                    onChange={(e) => updateForm({ bio: e.target.value })}
                    rows={3}
                    maxLength={1000}
                    placeholder="Describe tu perfil profesional (mín. 20 caracteres)"
                    className="w-full bg-surface border border-border rounded-2xl px-4 py-3.5 text-white text-[15px] placeholder:text-neutral-600 focus:outline-none focus:border-primary/50 resize-none transition-all"
                  />
                  <p className="text-[11px] text-neutral-600 mt-1 text-right">
                    {form.bio.length}/1000
                  </p>
                </div>
              </div>
            )}

            {/* Optional city for clients */}
            {form.profileType === 'CLIENT' && (
              <Input
                icon={MapPin}
                value={form.city}
                onChange={(v) => updateForm({ city: v })}
                placeholder="Ciudad (opcional)"
                maxLength={120}
              />
            )}

            {/* Terms acceptance */}
            <label className="flex items-start gap-3 cursor-pointer bg-surface border border-border rounded-2xl p-4">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => { setTermsAccepted(e.target.checked); setError(''); }}
                className="mt-0.5 w-5 h-5 rounded accent-primary bg-neutral-950 border-border"
              />
              <span className="text-sm text-neutral-300 leading-relaxed">
                Acepto los{' '}
                <a
                  href={`${API_BASE}/legal/terminos`}
                  target="_blank"
                  rel="noopener"
                  className="text-primary-light underline"
                >
                  Términos de Servicio
                </a>{' '}
                y la{' '}
                <a
                  href={`${API_BASE}/legal/privacidad`}
                  target="_blank"
                  rel="noopener"
                  className="text-primary-light underline"
                >
                  Política de Privacidad
                </a>
              </span>
            </label>

            {/* Account summary */}
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
              <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                Resumen de tu cuenta
              </p>
              <div className="grid grid-cols-2 gap-y-1.5 text-sm">
                <span className="text-neutral-500">Nombre</span>
                <span className="text-white truncate">{form.displayName || '—'}</span>
                <span className="text-neutral-500">Usuario</span>
                <span className="text-white">@{form.username || '—'}</span>
                <span className="text-neutral-500">Email</span>
                <span className="text-white truncate">{form.email || '—'}</span>
                <span className="text-neutral-500">Tipo</span>
                <span className="text-primary-light">
                  {form.profileType === 'PROFESSIONAL' ? 'Profesional' : 'Cliente'}
                </span>
              </div>
            </div>

            {error && <ErrorBanner message={error} />}

            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-violet-500 disabled:opacity-50 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-primary/20"
            >
              {loading ? <Spinner /> : (
                <>
                  <CheckCircle2 size={18} />
                  Crear mi cuenta
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Switch to login */}
      {step === 1 && (
        <div className="text-center py-4 relative z-10">
          <p className="text-neutral-500 text-sm">
            ¿Ya tienes cuenta?
            <button onClick={switchMode} className="text-primary-light font-semibold ml-1.5">
              Inicia sesión
            </button>
          </p>
        </div>
      )}
    </div>
  );
}

// ── Shared sub-components ──

function ProfileTypeCard({ selected, onClick, title, desc }: {
  selected: boolean; onClick: () => void; title: string; desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-4 rounded-2xl border-2 transition-all ${
        selected
          ? 'border-primary bg-primary/10'
          : 'border-border bg-surface'
      }`}
    >
      <p className={`font-semibold text-sm ${selected ? 'text-white' : 'text-neutral-300'}`}>
        {title}
      </p>
      <p className="text-[11px] text-neutral-500 mt-0.5">{desc}</p>
      {selected && (
        <div className="mt-2">
          <CheckCircle2 size={16} className="text-primary" />
        </div>
      )}
    </button>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2.5 bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">
      <div className="w-1.5 h-1.5 rounded-full bg-danger shrink-0" />
      <p className="text-danger text-sm">{message}</p>
    </div>
  );
}

function Spinner() {
  return <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />;
}

function LegalFooter() {
  return (
    <>
      <div className="text-center px-7 pb-1">
        <p className="text-neutral-600 text-[11px] leading-relaxed">
          Al continuar, aceptas nuestros{' '}
          <a href={`${API_BASE}/legal/terminos`} target="_blank" rel="noopener" className="text-neutral-400 underline">
            Términos de Servicio
          </a>{' '}
          y{' '}
          <a href={`${API_BASE}/legal/privacidad`} target="_blank" rel="noopener" className="text-neutral-400 underline">
            Política de Privacidad
          </a>
        </p>
      </div>
      <div className="flex justify-center pb-2">
        <div className="w-32 h-1 rounded-full bg-white/10" />
      </div>
    </>
  );
}

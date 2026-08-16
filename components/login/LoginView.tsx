// components/login/LoginView.tsx
// Migrado para componentes UI + tokens de design (identidade verde da app,
// já não a paleta azul-marinho independente do login antigo).

import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';

interface LoginViewProps {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  showPass: boolean;
  setShowPass: (updater: (s: boolean) => boolean) => void;
  error: string | null;
  loading: boolean;
  handleSubmit: (e: React.FormEvent) => void;
}

export function LoginView({
  email,
  setEmail,
  password,
  setPassword,
  showPass,
  setShowPass,
  error,
  loading,
  handleSubmit,
}: LoginViewProps) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden font-body">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/login-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/55 via-primary/35 to-primary/20" />

      <div className="login-card-in relative z-10 m-6 w-full max-w-[440px] rounded-panel bg-surface/92 p-11 pt-12 shadow-elevated ring-1 ring-inset ring-white/60 backdrop-blur-xl">
        <div className="mb-8 flex items-center justify-center gap-3">
          {/* Para usar o teu logo: <img src="/images/logo.png" alt="Innova" width={52} height={52} /> */}
          <svg
            width={52}
            height={52}
            viewBox="0 0 52 52"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="26"
              cy="26"
              r="24"
              className="stroke-primary"
              strokeWidth="3.5"
            />
            <path
              d="M16 32 C18 24, 24 20, 30 22 L27 18 L36 24 L28 28 L30 24 C25 22, 20 26, 18 32Z"
              className="fill-accent"
            />
            <path
              d="M26 14 L30 10 L34 14"
              className="stroke-primary"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          <span className="font-display text-3xl font-extrabold tracking-tight text-primary">
            Innova
          </span>
        </div>

        <div className="mx-auto mb-7 h-[3px] w-12 rounded-full bg-gradient-to-r from-primary to-accent" />

        <p className="mb-8 text-center text-[13px] text-ink-muted">
          Academia Digital — Aceda à sua conta
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <FormField label="E-mail" htmlFor="login-email">
              <Input
                id="login-email"
                type="email"
                placeholder="o.seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="pl-10"
              />
            </FormField>
            <Mail
              strokeWidth={1.8}
              size={16}
              className="pointer-events-none absolute left-3 top-9 text-ink-faint"
            />
          </div>

          <div className="relative">
            <FormField label="Senha" htmlFor="login-password">
              <Input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="current-password"
                className="pl-10 pr-10"
              />
            </FormField>
            <Lock
              strokeWidth={1.8}
              size={16}
              className="pointer-events-none absolute left-3 top-9 text-ink-faint"
            />
            <button
              type="button"
              onClick={() => setShowPass((s) => !s)}
              tabIndex={-1}
              aria-label={showPass ? 'Esconder senha' : 'Mostrar senha'}
              className="absolute right-3 top-9 text-ink-faint transition-colors hover:text-accent"
            >
              {showPass ? (
                <EyeOff strokeWidth={1.8} size={16} />
              ) : (
                <Eye strokeWidth={1.8} size={16} />
              )}
            </button>
          </div>

          {error && (
            <div className="rounded-control border border-danger bg-danger-subtle px-3.5 py-2.5 text-center text-[13px] text-danger-ink">
              {error}
            </div>
          )}

          <Button
            type="submit"
            intent="primary"
            loading={loading}
            className="mt-1 w-full uppercase tracking-wider"
          >
            {loading ? 'A entrar...' : 'Entrar'}
          </Button>
        </form>

        <div className="mt-7 text-center text-[11px] tracking-wide text-ink-faint">
          © {new Date().getFullYear()} Innova — Todos os direitos reservados
        </div>
      </div>
    </div>
  );
}

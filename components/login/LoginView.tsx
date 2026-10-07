// components/login/LoginView.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';

interface SsoLoginOptions {
  ssoEnabled: boolean;
  ssoProvider: 'GOOGLE' | 'MICROSOFT' | 'OIDC' | null;
  ldapEnabled: boolean;
  passwordLoginDisabled: boolean;
}

const SSO_PROVIDER_LABELS: Record<string, string> = {
  GOOGLE: 'Google',
  MICROSOFT: 'Microsoft',
  OIDC: 'SSO',
};

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
  sso?: SsoLoginOptions;
  startSsoLogin: () => void;
  ldapEmail: string;
  setLdapEmail: (value: string) => void;
  ldapPassword: string;
  setLdapPassword: (value: string) => void;
  ldapLoading: boolean;
  ldapError: string | null;
  handleLdapSubmit: (e: React.FormEvent) => void;
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
  sso,
  startSsoLogin,
  ldapEmail,
  setLdapEmail,
  ldapPassword,
  setLdapPassword,
  ldapLoading,
  ldapError,
  handleLdapSubmit,
}: LoginViewProps) {
  const [useLdap, setUseLdap] = useState(false);
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');

        .login-root,
        .login-root *,
        .login-root *::before,
        .login-root *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .login-root {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          font-family: 'Inter', sans-serif;
          color: #fff;
          overflow: hidden;
        }

        .login-bg {
          position: absolute;
          inset: 0;
          background-image: url('/images/login-bg.jpg');
          background-size: cover;
          background-position: center;
          z-index: 0;
        }

        .login-bg::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(10, 25, 60, 0.55) 0%,
            rgba(10, 25, 60, 0.35) 50%,
            rgba(10, 25, 60, 0.2) 100%
          );
        }

        /* ───────── Cartão em vidro (glassmorphism) ───────── */
        .login-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          margin: 24px;
          padding: 44px 40px 36px;
          color: #fff;
          background: linear-gradient(
            145deg,
            rgba(255, 255, 255, 0.22) 0%,
            rgba(255, 255, 255, 0.08) 100%
          );
          backdrop-filter: blur(22px) saturate(140%);
          -webkit-backdrop-filter: blur(22px) saturate(140%);
          border: 1.5px solid rgba(255, 255, 255, 0.4);
          border-radius: 28px;
          box-shadow:
            0 24px 64px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.35);
          animation: cardIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        /* Alternativa para navegadores sem suporte a backdrop-filter */
        @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
          .login-card {
            background: rgba(15, 31, 61, 0.7);
          }
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .login-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .login-logo-icon {
          width: 52px;
          height: 52px;
        }

        .login-logo-text {
          font-family: 'Montserrat', sans-serif;
          font-size: 32px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.5px;
          text-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
        }

        .login-divider {
          width: 48px;
          height: 3px;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.3));
          border-radius: 2px;
          margin: 0 auto 22px;
        }

        .login-subtitle {
          text-align: center;
          font-size: 14px;
          line-height: 1.5;
          color: #fff;
          font-weight: 400;
          margin-bottom: 30px;
          letter-spacing: 0.2px;
          text-shadow: 0 1px 8px rgba(0, 0, 0, 0.25);
        }

        .login-subtitle span {
          display: block;
        }

        .login-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #fff;
          margin-bottom: 8px;
        }

        .login-field {
          margin-bottom: 18px;
        }

        .login-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        /* Ícones à direita, como no modelo */
        .login-input-icon {
          position: absolute;
          right: 16px;
          color: rgba(255, 255, 255, 0.85);
          display: flex;
          align-items: center;
          pointer-events: none;
        }

        .login-input {
          width: 100%;
          padding: 15px 48px 15px 18px;
          border: 1.5px solid rgba(255, 255, 255, 0.45);
          border-radius: 16px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          color: #fff;
          caret-color: #fff;
          background: rgba(255, 255, 255, 0.06);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }

        .login-input::placeholder { color: rgba(255, 255, 255, 0.7); }

        .login-input:focus {
          border-color: #fff;
          background: rgba(255, 255, 255, 0.12);
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2);
        }

        /* Mantém o texto branco e o fundo translúcido quando o browser preenche automaticamente */
        .login-input:-webkit-autofill,
        .login-input:-webkit-autofill:hover,
        .login-input:-webkit-autofill:focus {
          -webkit-text-fill-color: #fff;
          caret-color: #fff;
          -webkit-box-shadow: 0 0 0 1000px rgba(15, 31, 61, 0.55) inset;
          transition: background-color 9999s ease-out 0s;
        }

        .login-eye {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.85);
          display: flex;
          align-items: center;
          padding: 2px;
          border-radius: 6px;
          transition: color 0.2s;
        }
        .login-eye:hover { color: #fff; }
        .login-eye:focus-visible {
          outline: 2px solid #fff;
          outline-offset: 2px;
        }

        .login-error {
          background: rgba(220, 38, 38, 0.28);
          border: 1px solid rgba(254, 202, 202, 0.7);
          color: #fff;
          font-size: 13px;
          padding: 10px 14px;
          border-radius: 12px;
          margin-bottom: 18px;
          text-align: center;
        }

        /* ───────── Botão Entrar (#0F1F3D) ───────── */
        .login-btn {
          width: 100%;
          padding: 15px;
          background: #0F1F3D;
          color: #fff;
          font-family: 'Montserrat', sans-serif;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 14px;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s, opacity 0.2s;
          box-shadow: 0 8px 24px rgba(15, 31, 61, 0.45);
          margin-top: 8px;
          position: relative;
          overflow: hidden;
        }

        .login-btn:hover:not(:disabled) {
          background: #172b52;
          transform: translateY(-1px);
          box-shadow: 0 12px 30px rgba(15, 31, 61, 0.55);
        }

        .login-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-btn:focus-visible {
          outline: 2px solid #fff;
          outline-offset: 3px;
        }

        .login-btn:disabled {
          opacity: 0.75;
          cursor: not-allowed;
        }

        .login-spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          vertical-align: middle;
          margin-right: 8px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .login-footer {
          margin-top: 26px;
          text-align: center;
          font-size: 11px;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.85);
          letter-spacing: 0.3px;
        }

        /* ───────── SSO / LDAP ───────── */
        .login-sso-btn {
          width: 100%;
          padding: 13px;
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 600;
          border: 1.5px solid rgba(255, 255, 255, 0.45);
          border-radius: 14px;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
        }
        .login-sso-btn:hover {
          border-color: #fff;
          background: rgba(255, 255, 255, 0.16);
        }
        .login-sso-btn:focus-visible {
          outline: 2px solid #fff;
          outline-offset: 3px;
        }

        .login-or {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 18px 0;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.9);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .login-or::before,
        .login-or::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255, 255, 255, 0.4);
        }

        .login-ldap-toggle {
          display: block;
          width: 100%;
          margin-top: 16px;
          background: none;
          border: none;
          color: #fff;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          text-align: center;
        }
        .login-ldap-toggle:hover {
          text-decoration: underline;
        }
        .login-ldap-toggle:focus-visible {
          outline: 2px solid #fff;
          outline-offset: 3px;
          border-radius: 6px;
        }

        @media (max-width: 480px) {
          .login-card {
            margin: 16px;
            padding: 36px 24px 28px;
            border-radius: 24px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .login-card,
          .login-spinner {
            animation: none;
          }
          .login-btn,
          .login-input,
          .login-sso-btn {
            transition: none;
          }
        }
      `}</style>

      <div className="login-root">
        <div className="login-bg" />

        <div className="login-card">
          <div className="login-logo">
            <Image
              className="login-logo-icon"
              src="/images/innova-logo.png"
              alt="Innova"
              width={52}
              height={52}
              style={{ objectFit: 'contain' }}
            />
            <span className="login-logo-text">Innova</span>
          </div>

          <div className="login-divider" />

          <p className="login-subtitle">
            <span>Academia Digital e Gestão de Recursos Humanos</span>
            <span>Aceda à sua conta</span>
          </p>

          {sso?.ssoEnabled && (
            <button
              type="button"
              className="login-sso-btn"
              onClick={startSsoLogin}
            >
              Entrar com {SSO_PROVIDER_LABELS[sso.ssoProvider ?? 'OIDC']}
            </button>
          )}
          {sso?.ssoEnabled && <div className="login-or">ou</div>}

          <form onSubmit={useLdap ? handleLdapSubmit : handleSubmit}>
            <div className="login-field">
              <label className="login-label" htmlFor="login-email">
                E-mail
              </label>
              <div className="login-input-wrap">
                <input
                  id="login-email"
                  type="email"
                  className="login-input"
                  placeholder="o.seu@email.com"
                  value={useLdap ? ldapEmail : email}
                  onChange={(e) => (useLdap ? setLdapEmail(e.target.value) : setEmail(e.target.value))}
                  required
                  autoComplete="email"
                />
                <span className="login-input-icon" aria-hidden="true">
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.6}
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
              </div>
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="login-password">
                Senha
              </label>
              <div className="login-input-wrap">
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  className="login-input"
                  placeholder="••••••••"
                  value={useLdap ? ldapPassword : password}
                  onChange={(e) =>
                    useLdap ? setLdapPassword(e.target.value) : setPassword(e.target.value)
                  }
                  required
                  minLength={useLdap ? undefined : 8}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-eye"
                  onClick={() => setShowPass((s) => !s)}
                  tabIndex={-1}
                  aria-label={showPass ? 'Esconder senha' : 'Mostrar senha'}
                >
                  {showPass ? (
                    <svg
                      width="18"
                      height="18"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.6}
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.6}
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {(useLdap ? ldapError : error) && (
              <div className="login-error" role="alert">
                {useLdap ? ldapError : error}
              </div>
            )}

            <button
              type="submit"
              className="login-btn"
              disabled={useLdap ? ldapLoading : loading}
              aria-busy={useLdap ? ldapLoading : loading}
            >
              {(useLdap ? ldapLoading : loading) && <span className="login-spinner" />}
              {useLdap ? (ldapLoading ? 'A entrar...' : 'Entrar (LDAP/AD)') : loading ? 'A entrar...' : 'Entrar'}
            </button>
          </form>

          {sso?.ldapEnabled && (
            <button type="button" className="login-ldap-toggle" onClick={() => setUseLdap((v) => !v)}>
              {useLdap ? 'Usar palavra-passe normal' : 'Entrar com conta corporativa (LDAP/AD)'}
            </button>
          )}

          <div className="login-footer">
            © {new Date().getFullYear()} Innova — Propriedade da EVOS, LDA.
            Todos os direitos reservados.
          </div>
        </div>
      </div>
    </>
  );
}
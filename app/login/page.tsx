"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function apiRequest(path: string, options: RequestInit = {}): Promise<unknown> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include', // recebe o cookie httpOnly definido pelo backend
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? 'Erro na API');
  }
  return res.json();
}

type ApiError = { message?: string };

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // O backend define o cookie httpOnly 'token'; o JS nunca toca no token.
      await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      // Navegação forçada para garantir que o middleware revê o cookie.
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Inter:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          font-family: 'Inter', sans-serif;
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

        .login-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          margin: 24px;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border-radius: 20px;
          padding: 48px 44px 44px;
          box-shadow:
            0 32px 80px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(255,255,255,0.6) inset;
          animation: cardIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
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
          margin-bottom: 32px;
        }

        .login-logo-icon {
          width: 52px;
          height: 52px;
        }

        .login-logo-text {
          font-family: 'Montserrat', sans-serif;
          font-size: 32px;
          font-weight: 800;
          color: #0a2560;
          letter-spacing: -0.5px;
        }

        .login-divider {
          width: 48px;
          height: 3px;
          background: linear-gradient(90deg, #1a4bb5, #22c55e);
          border-radius: 2px;
          margin: 0 auto 28px;
        }

        .login-subtitle {
          text-align: center;
          font-size: 13px;
          color: #64748b;
          font-weight: 400;
          margin-bottom: 32px;
          letter-spacing: 0.2px;
        }

        .login-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #0a2560;
          margin-bottom: 8px;
        }

        .login-field {
          margin-bottom: 20px;
        }

        .login-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .login-input-icon {
          position: absolute;
          left: 14px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          pointer-events: none;
        }

        .login-input {
          width: 100%;
          padding: 13px 44px 13px 42px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          color: #0f172a;
          background: #fff;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .login-input::placeholder { color: #94a3b8; }

        .login-input:focus {
          border-color: #1a4bb5;
          box-shadow: 0 0 0 3px rgba(26, 75, 181, 0.1);
        }

        .login-eye {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          display: flex;
          align-items: center;
          padding: 0;
          transition: color 0.2s;
        }
        .login-eye:hover { color: #1a4bb5; }

        .login-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          font-size: 13px;
          padding: 10px 14px;
          border-radius: 8px;
          margin-bottom: 20px;
          text-align: center;
        }

        .login-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #0a2560 0%, #1a4bb5 100%);
          color: #fff;
          font-family: 'Montserrat', sans-serif;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 20px rgba(26, 75, 181, 0.35);
          margin-top: 8px;
          position: relative;
          overflow: hidden;
        }

        .login-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.08) 100%);
        }

        .login-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(26, 75, 181, 0.45);
        }

        .login-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-btn:disabled {
          opacity: 0.75;
          cursor: not-allowed;
        }

        .login-spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          vertical-align: middle;
          margin-right: 8px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .login-footer {
          margin-top: 28px;
          text-align: center;
          font-size: 11px;
          color: #94a3b8;
          letter-spacing: 0.3px;
        }
      `}</style>

      <div className="login-root">
        <div className="login-bg" />

        <div className="login-card">
          <div className="login-logo">
            {/* Para usar o teu logo: <img src="/images/logo.png" alt="Innova" width={52} height={52} /> */}
            <svg className="login-logo-icon" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="26" cy="26" r="24" stroke="#0a2560" strokeWidth="3.5" />
              <path d="M16 32 C18 24, 24 20, 30 22 L27 18 L36 24 L28 28 L30 24 C25 22, 20 26, 18 32Z"
                fill="#22c55e" />
              <path d="M26 14 L30 10 L34 14" stroke="#0a2560" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
            <span className="login-logo-text">Innova</span>
          </div>

          <div className="login-divider" />

          <p className="login-subtitle">Academia Digital — Aceda à sua conta</p>

          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <label className="login-label">E-mail</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input
                  type="email"
                  className="login-input"
                  placeholder="o.seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="login-field">
              <label className="login-label">Senha</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  type={showPass ? "text" : "password"}
                  className="login-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-eye"
                  onClick={() => setShowPass(!showPass)}
                  tabIndex={-1}
                  aria-label={showPass ? "Esconder senha" : "Mostrar senha"}
                >
                  {showPass ? (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading && <span className="login-spinner" />}
              {loading ? "A entrar..." : "Entrar"}
            </button>
          </form>

          <div className="login-footer">
            © {new Date().getFullYear()} Innova — Todos os direitos reservados
          </div>
        </div>
      </div>
    </>
  );
}
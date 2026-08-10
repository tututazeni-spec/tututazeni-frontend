// components/settings/TabSeguranca.tsx
// Tab "Segurança": alteração de senha com medidor de força e dicas.
// Extraído de app/(platform)/settings/page.tsx.

'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useApiMutation } from '@/hooks/useApiQuery';
import { btnPrimary, card, inputStyle, labelStyle } from './styles';

interface TabSegurancaProps {
  onToast: (msg: string, type: 'success' | 'error') => void;
}

export function TabSeguranca({ onToast }: TabSegurancaProps) {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);

  // POST /auth/change-password — ChangePasswordDto: { currentPassword, newPassword }
  const changePassword = useApiMutation(
    (payload: { currentPassword: string; newPassword: string }) =>
      api.post('/auth/change-password', payload),
    {
      onSuccess: () => {
        onToast('Senha alterada com sucesso!', 'success');
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      },
      onError: (e) => onToast(e.message ?? 'Erro ao alterar senha', 'error'),
    },
  );
  const saving = changePassword.isPending;

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      onToast('As senhas não coincidem.', 'error');
      return;
    }
    if (form.newPassword.length < 6) {
      onToast('A nova senha deve ter pelo menos 6 caracteres.', 'error');
      return;
    }
    changePassword.mutate({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    });
  }

  const strength = (p: string) => {
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };

  const pw = form.newPassword;
  const str = strength(pw);
  const strLabel = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'];
  const strColor = ['', '#dc2626', '#f59e0b', '#1e40af', '#16a34a'];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {/* Alterar senha */}
      <div style={card}>
        <h3
          style={{
            margin: '0 0 20px',
            fontSize: 15,
            fontWeight: 700,
            color: '#1e293b',
          }}
        >
          🔑 Alterar Senha
        </h3>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle} htmlFor="current-password">
              Senha Actual
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                id="current-password"
                value={form.currentPassword}
                onChange={(e) => set('currentPassword', e.target.value)}
                style={{ ...inputStyle, paddingRight: 44 }}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  fontSize: 16,
                }}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle} htmlFor="new-password">
              Nova Senha
            </label>
            <input
              id="new-password"
              type="password"
              value={form.newPassword}
              onChange={(e) => set('newPassword', e.target.value)}
              style={inputStyle}
              placeholder="••••••••"
              required
              minLength={6}
            />
            {pw && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: 4,
                        borderRadius: 2,
                        background: i <= str ? strColor[str] : '#e2e8f0',
                        transition: 'background 0.3s',
                      }}
                    />
                  ))}
                </div>
                <span
                  style={{
                    fontSize: 11,
                    color: strColor[str],
                    fontWeight: 600,
                  }}
                >
                  {strLabel[str]}
                </span>
              </div>
            )}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle} htmlFor="confirm-password">
              Confirmar Nova Senha
            </label>
            <input
              id="confirm-password"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => set('confirmPassword', e.target.value)}
              style={{
                ...inputStyle,
                borderColor:
                  form.confirmPassword &&
                  form.confirmPassword !== form.newPassword
                    ? '#dc2626'
                    : '#e2e8f0',
              }}
              placeholder="••••••••"
              required
            />
            {form.confirmPassword &&
              form.confirmPassword !== form.newPassword && (
                <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>
                  As senhas não coincidem
                </p>
              )}
          </div>

          <button
            type="submit"
            disabled={saving || form.newPassword !== form.confirmPassword}
            style={{ ...btnPrimary, width: '100%', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'A alterar...' : 'Alterar Senha'}
          </button>
        </form>
      </div>

      {/* Dicas de segurança */}
      <div style={card}>
        <h3
          style={{
            margin: '0 0 16px',
            fontSize: 15,
            fontWeight: 700,
            color: '#1e293b',
          }}
        >
          🛡️ Dicas de Segurança
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            {
              icon: '✅',
              text: 'Usa pelo menos 8 caracteres',
              ok: pw.length >= 8,
            },
            {
              icon: '✅',
              text: 'Inclui letras maiúsculas',
              ok: /[A-Z]/.test(pw),
            },
            { icon: '✅', text: 'Inclui números', ok: /[0-9]/.test(pw) },
            {
              icon: '✅',
              text: 'Inclui caracteres especiais',
              ok: /[^A-Za-z0-9]/.test(pw),
            },
          ].map((tip) => (
            <div
              key={tip.text}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 8,
                background: pw ? (tip.ok ? '#ecfdf5' : '#f8fafc') : '#f8fafc',
                border: `1px solid ${pw ? (tip.ok ? '#bbf7d0' : '#e2e8f0') : '#e2e8f0'}`,
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 14 }}>{pw && tip.ok ? '✅' : '⬜'}</span>
              <span
                style={{
                  fontSize: 13,
                  color: pw && tip.ok ? '#16a34a' : '#64748b',
                }}
              >
                {tip.text}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 20,
            padding: '12px 16px',
            background: '#fffbeb',
            borderRadius: 10,
            border: '1px solid #fde68a',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: '#92400e',
              fontWeight: 600,
            }}
          >
            ⚠️ O token de acesso expira em 15 minutos. Serás redirecionado para
            o login automaticamente.
          </p>
        </div>
      </div>
    </div>
  );
}

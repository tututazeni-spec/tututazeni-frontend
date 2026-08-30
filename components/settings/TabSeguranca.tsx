// components/settings/TabSeguranca.tsx
// Tab "Segurança": alteração de senha com medidor de força e dicas.
// Migrado para componentes UI + tokens de design.

'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useApiMutation } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Card, CardBody } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

interface TabSegurancaProps {
  onToast?: (msg: string, type: 'success' | 'error') => void;
}

export function TabSeguranca({ onToast }: TabSegurancaProps) {
  const toast = useToast();
  const toastFn = (msg: string, type: 'success' | 'error') => {
    if (onToast) {
      onToast(msg, type);
    } else {
      toast({ title: msg, intent: type === 'error' ? 'danger' : 'success' });
    }
  };

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);

  // POST /auth/change-password — ChangePasswordDto: { currentPassword, newPassword }
  const changePassword = useApiMutation(
    (payload: { currentPassword: string; newPassword: string }) =>
      apiClient.post('/auth/change-password', payload),
    {
      onSuccess: () => {
        toastFn('Senha alterada com sucesso!', 'success');
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      },
      onError: (e) => toastFn(e.message ?? 'Erro ao alterar senha', 'error'),
    },
  );
  const saving = changePassword.isPending;

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toastFn('As senhas não coincidem.', 'error');
      return;
    }
    if (form.newPassword.length < 6) {
      toastFn('A nova senha deve ter pelo menos 6 caracteres.', 'error');
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
  const strColorClass = [
    '',
    'text-danger',
    'text-warning',
    'text-primary',
    'text-success',
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Alterar senha */}
      <Card>
        <CardBody>
          <h3 className="mb-5 text-base font-bold text-ink">Alterar Senha</h3>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <div className="relative">
                <FormField label="Senha Actual" htmlFor="current-password">
                  <Input
                    id="current-password"
                    type={showPass ? 'text' : 'password'}
                    value={form.currentPassword}
                    onChange={(e) => set('currentPassword', e.target.value)}
                    placeholder="••••••••"
                    required
                    className="pr-10"
                  />
                </FormField>
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-9 text-ink-faint hover:text-ink"
                  aria-label={showPass ? 'Ocultar' : 'Mostrar'}
                >
                  {showPass ? (
                    <EyeOff strokeWidth={1.75} size={18} />
                  ) : (
                    <Eye strokeWidth={1.75} size={18} />
                  )}
                </button>
              </div>
            </div>

            <div>
              <FormField label="Nova Senha" htmlFor="new-password">
                <Input
                  id="new-password"
                  type="password"
                  value={form.newPassword}
                  onChange={(e) => set('newPassword', e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </FormField>
              {pw && (
                <div className="mt-2">
                  <div className="mb-1 flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          'flex-1 h-1 rounded-sm transition-colors',
                          i <= str
                            ? strColorClass[str] === 'text-danger'
                              ? 'bg-danger'
                              : strColorClass[str] === 'text-warning'
                                ? 'bg-warning'
                                : strColorClass[str] === 'text-primary'
                                  ? 'bg-primary'
                                  : 'bg-success'
                            : 'bg-border',
                        )}
                      />
                    ))}
                  </div>
                  <span
                    className={cn('text-xs font-semibold', strColorClass[str])}
                  >
                    {strLabel[str]}
                  </span>
                </div>
              )}
            </div>

            <FormField label="Confirmar Nova Senha" htmlFor="confirm-password">
              <Input
                id="confirm-password"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => set('confirmPassword', e.target.value)}
                placeholder="••••••••"
                required
                invalid={
                  form.confirmPassword.length > 0 &&
                  form.confirmPassword !== form.newPassword
                }
              />
              {form.confirmPassword &&
                form.confirmPassword !== form.newPassword && (
                  <p className="text-danger text-xs mt-1">
                    As senhas não coincidem
                  </p>
                )}
            </FormField>

            <Button
              type="submit"
              intent="primary"
              loading={saving}
              disabled={saving || form.newPassword !== form.confirmPassword}
              className="w-full"
            >
              {saving ? 'A alterar...' : 'Alterar Senha'}
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Dicas de segurança */}
      <Card>
        <CardBody>
          <h3 className="mb-4 text-base font-bold text-ink">
            Dicas de Segurança
          </h3>
          <div className="space-y-3">
            {[
              {
                text: 'Usa pelo menos 8 caracteres',
                ok: pw.length >= 8,
              },
              {
                text: 'Inclui letras maiúsculas',
                ok: /[A-Z]/.test(pw),
              },
              { text: 'Inclui números', ok: /[0-9]/.test(pw) },
              {
                text: 'Inclui caracteres especiais',
                ok: /[^A-Za-z0-9]/.test(pw),
              },
            ].map((tip) => (
              <div
                key={tip.text}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-all',
                  pw && tip.ok
                    ? 'bg-success-subtle border-success'
                    : 'bg-surface-sunken border-border',
                )}
              >
                <span
                  className={cn(
                    'text-sm',
                    pw && tip.ok ? 'text-success-ink' : 'text-ink-muted',
                  )}
                >
                  {tip.text}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 p-4 bg-warning-subtle border border-warning rounded-lg">
            <p className="m-0 text-xs text-warning-ink font-semibold">
              O token de acesso expira em 15 minutos. Serás redirecionado para o
              login automaticamente.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

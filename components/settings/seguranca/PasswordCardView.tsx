// components/settings/seguranca/PasswordCardView.tsx
// «Alterar senha» + dicas (apresentação). Estado e submissão: hooks/useChangePassword.ts.

import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/cn';
import type { ChangePasswordController } from '@/hooks/useChangePassword';
import { STRENGTH_STYLE } from './logic';

export function PasswordCardView({ ctl }: { ctl: ChangePasswordController }) {
  const {
    form,
    set,
    showPass,
    toggleShowPass,
    submit,
    saving,
    strength: str,
    tips,
  } = ctl;
  const pw = form.newPassword;

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
          Alterar Senha
        </div>
        <CardBody>
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
                  onClick={toggleShowPass}
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
                          i <= str ? STRENGTH_STYLE[str].bar : 'bg-border',
                        )}
                      />
                    ))}
                  </div>
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      STRENGTH_STYLE[str].text,
                    )}
                  >
                    {STRENGTH_STYLE[str].label}
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

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
          Dicas de Segurança
        </div>
        <CardBody>
          <div className="space-y-3">
            {tips.map((tip) => (
              <div
                key={tip.text}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-all',
                  pw && tip.ok
                    ? 'bg-success-subtle border-success'
                    : 'bg-surface-sunken border-border',
                )}
              >
                <span className="text-sm text-ink">{tip.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 p-4 bg-surface border border-ink rounded-lg">
            <p className="m-0 text-xs text-ink font-semibold">
              O token de acesso expira num curto período. Serás redirecionado
              para o login automaticamente.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

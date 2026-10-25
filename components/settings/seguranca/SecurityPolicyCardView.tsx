// components/settings/seguranca/SecurityPolicyCardView.tsx
// Política de segurança da organização (apresentação). Rascunho e gravação:
// hooks/useSecurityPolicy.ts.

import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { SecurityPolicyController } from '@/hooks/useSecurityPolicy';
import { TWO_FACTOR_LABELS } from './logic';

interface ToggleProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function Toggle({ id, label, checked, onChange }: ToggleProps) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-sm text-ink">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

export function SecurityPolicyCardView({
  ctl,
}: {
  ctl: SecurityPolicyController;
}) {
  const { ready, form, set, num, submit, twoFactorModes, saving } = ctl;

  if (!ready || !form) return null;

  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
        Política de Segurança (organização)
      </div>
      <CardBody>
        <form onSubmit={submit} className="grid grid-cols-3 gap-4">
          <FormField
            label="Tamanho mínimo da senha"
            htmlFor="passwordMinLength"
          >
            <Input
              id="passwordMinLength"
              type="number"
              min={10}
              max={64}
              value={num('passwordMinLength')}
              onChange={(e) => set('passwordMinLength', Number(e.target.value))}
            />
          </FormField>
          <FormField
            label="Expiração da senha (dias, 0 = nunca)"
            htmlFor="passwordExpiryDays"
          >
            <Input
              id="passwordExpiryDays"
              type="number"
              min={0}
              max={730}
              value={num('passwordExpiryDays')}
              onChange={(e) =>
                set('passwordExpiryDays', Number(e.target.value))
              }
            />
          </FormField>
          <FormField
            label="Tentativas falhadas até bloquear (0 = sem bloqueio)"
            htmlFor="maxFailedAttempts"
          >
            <Input
              id="maxFailedAttempts"
              type="number"
              min={0}
              max={20}
              value={num('maxFailedAttempts')}
              onChange={(e) => set('maxFailedAttempts', Number(e.target.value))}
            />
          </FormField>
          <FormField
            label="Duração do bloqueio (minutos)"
            htmlFor="lockoutMinutes"
          >
            <Input
              id="lockoutMinutes"
              type="number"
              min={1}
              max={1440}
              value={num('lockoutMinutes')}
              onChange={(e) => set('lockoutMinutes', Number(e.target.value))}
            />
          </FormField>
          <FormField
            label="Sessão inactiva expira após (minutos)"
            htmlFor="sessionIdleMinutes"
          >
            <Input
              id="sessionIdleMinutes"
              type="number"
              min={5}
              max={1440}
              value={num('sessionIdleMinutes')}
              onChange={(e) =>
                set('sessionIdleMinutes', Number(e.target.value))
              }
            />
          </FormField>
          <FormField
            label="Validade do token de acesso (minutos)"
            htmlFor="accessTokenMinutes"
          >
            <Input
              id="accessTokenMinutes"
              type="number"
              min={5}
              max={120}
              value={num('accessTokenMinutes')}
              onChange={(e) =>
                set('accessTokenMinutes', Number(e.target.value))
              }
            />
          </FormField>
          <FormField
            label="Validade do refresh token (dias)"
            htmlFor="refreshTokenDays"
          >
            <Input
              id="refreshTokenDays"
              type="number"
              min={1}
              max={7}
              value={num('refreshTokenDays')}
              onChange={(e) => set('refreshTokenDays', Number(e.target.value))}
            />
          </FormField>
          <FormField label="Exigência de 2FA" htmlFor="twoFactorMode">
            <Select
              className="w-full"
              items={twoFactorModes.map((m) => ({
                value: m,
                label: TWO_FACTOR_LABELS[m],
              }))}
              value={form.twoFactorMode}
              onValueChange={(v) => set('twoFactorMode', v)}
            />
          </FormField>
          <div className="col-span-3 flex items-center justify-between">
            <Toggle
              id="passwordRequireSymbol"
              label="Exigir pelo menos um símbolo na senha"
              checked={form.passwordRequireSymbol}
              onChange={(v) => set('passwordRequireSymbol', v)}
            />
            <Button type="submit" disabled={saving}>
              {saving ? 'A guardar…' : 'Guardar política'}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

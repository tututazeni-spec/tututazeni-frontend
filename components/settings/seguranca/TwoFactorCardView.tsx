// components/settings/seguranca/TwoFactorCardView.tsx
// 2FA pessoal (apresentação). Estado e mutações: hooks/useTwoFactor.ts.

import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import type { TwoFactorController } from '@/hooks/useTwoFactor';
import { TWO_FACTOR_LABELS } from './logic';

export function TwoFactorCardView({ ctl }: { ctl: TwoFactorController }) {
  const {
    isLoading,
    enabled,
    mode,
    setup,
    code,
    setCode,
    codeComplete,
    startSetup,
    cancelSetup,
    enable,
    disable,
    pending,
  } = ctl;

  if (isLoading) return null;

  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-brand via-[#0B3A75] to-[#0A2A57] text-white shadow-[0_8px_24px_rgba(15,31,61,0.25)]">
      {/* Mesmas cores do card "ROI Total" (roi-impact/RoiTotalCard) */}
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-base font-bold text-white">
            Autenticação de dois factores (2FA)
          </h3>
          <span
            className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold"
            style={{ color: enabled ? '#34D399' : '#FBBF24' }}
          >
            {enabled ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        {mode && (
          <p className="mt-1 text-sm text-white/70">
            Política da organização: {TWO_FACTOR_LABELS[mode]}
          </p>
        )}
      </div>
      <CardBody>
        {enabled ? (
          <div className="max-w-sm space-y-3">
            <FormField
              label="Código da app de autenticação"
              htmlFor="disable-2fa-code"
            >
              <Input
                id="disable-2fa-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
              />
            </FormField>
            <Button
              intent="danger"
              disabled={pending.disable || !codeComplete}
              onClick={disable}
            >
              Desactivar 2FA
            </Button>
          </div>
        ) : setup ? (
          <div className="max-w-sm space-y-3">
            <p className="text-sm text-white/80">
              Adiciona esta chave numa app de autenticação (Google
              Authenticator, Authy…) e confirma com o código gerado.
            </p>
            <FormField label="Chave secreta" htmlFor="totp-secret">
              <Input id="totp-secret" readOnly value={setup.secret} />
            </FormField>
            <FormField label="URL de configuração (otpauth)" htmlFor="totp-url">
              <Input
                id="totp-url"
                readOnly
                value={setup.otpauthUrl}
                className="text-xs"
              />
            </FormField>
            <FormField label="Código de confirmação" htmlFor="enable-2fa-code">
              <Input
                id="enable-2fa-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
              />
            </FormField>
            <div className="flex gap-2">
              <Button
                intent="primary"
                className="border-white bg-white text-brand hover:bg-white/90"
                disabled={pending.enable || !codeComplete}
                onClick={enable}
              >
                Confirmar e activar
              </Button>
              <Button
                intent="ghost"
                className="text-white hover:bg-white/10"
                onClick={cancelSetup}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button
            intent="primary"
            className="border-white bg-white text-brand hover:bg-white/90"
            disabled={pending.setup}
            onClick={startSetup}
          >
            Activar 2FA
          </Button>
        )}
      </CardBody>
    </Card>
  );
}

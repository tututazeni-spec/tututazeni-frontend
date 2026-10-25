// components/settings/TabIntegracoes.tsx
// Tab "Integrações" (ADMIN): SMTP, WhatsApp (só envio) e Ísis (IA) — GET/PUT
// /settings/integrations (docs/modulo_settings.md §6). Chaves de API e
// webhooks continuam geridos em API & Integrações; aqui só se resume o total.

'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useServerDraft } from '@/hooks/useServerDraft';
import { useToast } from '@/providers/ToastProvider';
import { KeyRound, MailCheck, Webhook } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import type {
  IntegrationSettings,
  IntegrationsOverview,
  WhatsAppStatus,
} from './types';

// Símbolo oficial do WhatsApp (o lucide-react não tem ícones de marcas).
function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={80}
      height={80}
      fill="#25D366"
      aria-hidden
      className="shrink-0 transition-transform duration-200 ease-out hover:scale-110 motion-reduce:hover:scale-100"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

type SmtpForm = IntegrationSettings['smtp'];
type WhatsAppForm = IntegrationSettings['whatsapp'];
type IsisForm = IntegrationSettings['isis'];

const ISIS_MODULE_LABELS: Record<string, string> = {
  LEARNING: 'Academia / Cursos',
  CAREER: 'Carreira',
  PDI: 'PDI',
  PERFORMANCE: 'Avaliação de desempenho',
  ONBOARDING: 'Onboarding',
  HR: 'RH',
};

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

export function TabIntegracoes() {
  const toast = useToast();
  const { data, isLoading, error } = useApiQuery<
    IntegrationSettings & { isisModuleOptions: string[] }
  >(queryKeys.settings.integrations(), '/settings/integrations');
  const overview = useApiQuery<IntegrationsOverview>(
    queryKeys.settings.integrationsOverview(),
    '/settings/integrations/overview',
  );

  const [smtp, setSmtp] = useServerDraft<SmtpForm>(data?.smtp);
  const [smtpPassword, setSmtpPassword] = useState('');
  const [whatsapp, setWhatsapp] = useServerDraft<WhatsAppForm>(data?.whatsapp);
  const [waToken, setWaToken] = useState('');
  const [isis, setIsis] = useServerDraft<IsisForm>(data?.isis);

  const save = useApiMutation(
    (payload: {
      smtp: Omit<SmtpForm, 'hasPassword'> & { password?: string };
      whatsapp: Omit<WhatsAppForm, 'hasAuthToken'> & { authToken?: string };
      isis: IsisForm;
    }) => apiClient.put('/settings/integrations', payload),
    {
      invalidateKeys: [
        queryKeys.settings.integrations(),
        queryKeys.settings.integrationsOverview(),
      ],
      onSuccess: () => {
        setSmtpPassword('');
        setWaToken('');
        toast({
          title: 'Definições de integrações guardadas',
          intent: 'success',
        });
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const [testTo, setTestTo] = useState('');
  const testSmtp = useApiMutation(
    () =>
      apiClient.post<{ ok: boolean; to?: string; error?: string }>(
        '/settings/integrations/smtp/test',
        testTo ? { to: testTo } : {},
      ),
    {
      onSuccess: (r) =>
        toast(
          r.ok
            ? {
                title: `Email de teste enviado para ${r.to}`,
                intent: 'success',
              }
            : { title: r.error ?? 'Falha no envio', intent: 'danger' },
        ),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const waStatus = useApiQuery<WhatsAppStatus>(
    queryKeys.settings.whatsappStatus(),
    '/settings/integrations/whatsapp/status',
    { enabled: !!whatsapp?.enabled },
  );

  if (isLoading || !smtp || !whatsapp || !isis)
    return (
      <p className="py-10 text-center text-sm text-ink-faint">A carregar…</p>
    );
  if (error)
    return (
      <p className="py-10 text-center text-sm text-danger">{error.message}</p>
    );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!smtp || !whatsapp || !isis) return;
    const { hasPassword: _hp, ...smtpRest } = smtp;
    const { hasAuthToken: _hat, ...waRest } = whatsapp;
    save.mutate({
      smtp: { ...smtpRest, ...(smtpPassword && { password: smtpPassword }) },
      whatsapp: { ...waRest, ...(waToken && { authToken: waToken }) },
      isis,
    });
  }

  const o = overview.data;

  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-4">
      {o && (
        <Card className="col-span-2 overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
            Resumo
          </div>
          <CardBody>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="m-0 flex flex-col items-start gap-1.5 text-xs uppercase tracking-wider text-ink-faint">
                  <MailCheck
                    size={80}
                    strokeWidth={1.5}
                    className="shrink-0 text-[#1877F2] transition-transform duration-200 ease-out hover:scale-110 motion-reduce:hover:scale-100"
                    aria-hidden
                  />
                  SMTP
                </p>
                <Badge
                  intent={o.smtp.configured ? 'success' : 'neutral'}
                  className="mt-1"
                >
                  {o.smtp.configured
                    ? `Configurado (${o.smtp.source})`
                    : 'Não configurado'}
                </Badge>
              </div>
              <div>
                <p className="m-0 flex flex-col items-start gap-1.5 text-xs uppercase tracking-wider text-ink-faint">
                  <WhatsAppIcon />
                  WhatsApp
                </p>
                <Badge
                  intent={o.whatsapp.enabled ? 'success' : 'neutral'}
                  className="mt-1"
                >
                  {o.whatsapp.enabled ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <NavyStatCard
                tab="api-keys"
                icon={KeyRound}
                label="Chaves de API activas"
                value={o.activeApiKeys}
                tone="blue"
              />
              <NavyStatCard
                tab="webhooks"
                icon={Webhook}
                label="Webhooks activos"
                value={o.activeWebhooks}
                tone="green"
              />
            </div>
          </CardBody>
        </Card>
      )}

      {/* SMTP */}
      <Card className="col-span-2 overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
          Email (SMTP)
        </div>
        <CardBody>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Servidor" htmlFor="smtp-host">
              <Input
                id="smtp-host"
                className="w-full"
                value={smtp.host}
                onChange={(e) =>
                  setSmtp((s) => (s ? { ...s, host: e.target.value } : s))
                }
                placeholder="smtp.empresa.ao"
              />
            </FormField>
            <FormField label="Porta" htmlFor="smtp-port">
              <Input
                id="smtp-port"
                type="number"
                min={1}
                max={65535}
                className="w-full"
                value={smtp.port}
                onChange={(e) =>
                  setSmtp((s) =>
                    s ? { ...s, port: Number(e.target.value) } : s,
                  )
                }
              />
            </FormField>
            <FormField label="Utilizador" htmlFor="smtp-user">
              <Input
                id="smtp-user"
                className="w-full"
                value={smtp.user}
                onChange={(e) =>
                  setSmtp((s) => (s ? { ...s, user: e.target.value } : s))
                }
              />
            </FormField>
            <FormField
              label="Palavra-passe"
              htmlFor="smtp-password"
              hint={
                smtp.hasPassword
                  ? 'Já configurada — deixe em branco para manter'
                  : undefined
              }
            >
              <Input
                id="smtp-password"
                type="password"
                className="w-full"
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
                placeholder="••••••••"
              />
            </FormField>
            <FormField
              label="Remetente"
              htmlFor="smtp-from"
              hint="ex.: INNOVA <noreply@empresa.ao>"
            >
              <Input
                id="smtp-from"
                className="w-full"
                value={smtp.from}
                onChange={(e) =>
                  setSmtp((s) => (s ? { ...s, from: e.target.value } : s))
                }
              />
            </FormField>
            <div className="flex items-end">
              <Toggle
                id="smtp-secure"
                label="Ligação segura (SSL/TLS)"
                checked={smtp.secure}
                onChange={(v) => setSmtp((s) => (s ? { ...s, secure: v } : s))}
              />
            </div>
          </div>
          <div className="mt-4 flex items-end gap-2">
            <div className="flex-1">
              <FormField
                label="Enviar email de teste para"
                htmlFor="smtp-test-to"
              >
                <Input
                  id="smtp-test-to"
                  type="email"
                  className="w-full"
                  value={testTo}
                  onChange={(e) => setTestTo(e.target.value)}
                  placeholder="(por omissão, o meu email)"
                />
              </FormField>
            </div>
            <Button
              type="button"
              intent="secondary"
              disabled={testSmtp.isPending}
              onClick={() => testSmtp.mutate(undefined)}
            >
              {testSmtp.isPending ? 'A enviar…' : 'Testar SMTP'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* WhatsApp */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-[#0F1F3D]/60 px-4 py-3 text-xs font-medium uppercase tracking-wide text-white">
          <span className="flex items-center gap-2">
            <WhatsAppIcon />
            WhatsApp (só envio)
          </span>
          {whatsapp.enabled && waStatus.data && (
            <Badge intent={waStatus.data.connected ? 'success' : 'danger'}>
              {waStatus.data.connected ? 'Ligado' : 'Desligado'}
            </Badge>
          )}
        </div>
        <CardBody>
          <div className="space-y-4">
            <Toggle
              id="wa-enabled"
              label="Activar envio por WhatsApp"
              checked={whatsapp.enabled}
              onChange={(v) =>
                setWhatsapp((w) => (w ? { ...w, enabled: v } : w))
              }
            />
            <FormField label="Número (E.164)" htmlFor="wa-number">
              <Input
                id="wa-number"
                className="w-full"
                value={whatsapp.number}
                onChange={(e) =>
                  setWhatsapp((w) => (w ? { ...w, number: e.target.value } : w))
                }
                placeholder="+244923000000"
              />
            </FormField>
            <FormField label="Account SID" htmlFor="wa-sid">
              <Input
                id="wa-sid"
                className="w-full"
                value={whatsapp.accountSid}
                onChange={(e) =>
                  setWhatsapp((w) =>
                    w ? { ...w, accountSid: e.target.value } : w,
                  )
                }
              />
            </FormField>
            <FormField
              label="Token de autenticaÃ§Ã£o"
              htmlFor="wa-token"
              hint={
                whatsapp.hasAuthToken
                  ? 'Já configurado — deixe em branco para manter'
                  : undefined
              }
            >
              <Input
                id="wa-token"
                type="password"
                className="w-full"
                value={waToken}
                onChange={(e) => setWaToken(e.target.value)}
                placeholder="••••••••"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Limite por hora (0 = sem limite)"
                htmlFor="wa-hourly"
              >
                <Input
                  id="wa-hourly"
                  type="number"
                  min={0}
                  className="w-full"
                  value={whatsapp.hourlyLimit}
                  onChange={(e) =>
                    setWhatsapp((w) =>
                      w ? { ...w, hourlyLimit: Number(e.target.value) } : w,
                    )
                  }
                />
              </FormField>
              <FormField
                label="Limite por dia (0 = sem limite)"
                htmlFor="wa-daily"
              >
                <Input
                  id="wa-daily"
                  type="number"
                  min={0}
                  className="w-full"
                  value={whatsapp.dailyLimit}
                  onChange={(e) =>
                    setWhatsapp((w) =>
                      w ? { ...w, dailyLimit: Number(e.target.value) } : w,
                    )
                  }
                />
              </FormField>
            </div>
            {whatsapp.enabled && waStatus.data && (
              <p className="text-xs text-ink-faint">
                Consumo: {waStatus.data.usage.lastHour}/
                {waStatus.data.usage.hourlyLimit || '∞'} na última hora ·{' '}
                {waStatus.data.usage.lastDay}/
                {waStatus.data.usage.dailyLimit || '∞'} no último dia
                {waStatus.data.error && (
                  <span className="text-danger"> · {waStatus.data.error}</span>
                )}
              </p>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Ísis (IA) */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
          Ísis (IA)
        </div>
        <CardBody>
          <div className="space-y-4">
            <Toggle
              id="isis-enabled"
              label="Ísis activa"
              checked={isis.enabled}
              onChange={(v) => setIsis((i) => (i ? { ...i, enabled: v } : i))}
            />
            <FormField
              label="Limite diário de perguntas por utilizador (0 = usa o do AI Tutor)"
              htmlFor="isis-limit"
            >
              <Input
                id="isis-limit"
                type="number"
                min={0}
                className="w-full"
                value={isis.dailyLimitPerUser}
                onChange={(e) =>
                  setIsis((i) =>
                    i ? { ...i, dailyLimitPerUser: Number(e.target.value) } : i,
                  )
                }
              />
            </FormField>
            <div>
              <p className="mb-2 text-sm font-medium text-ink">
                Módulos activos (vazio = todos)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(data?.isisModuleOptions ?? []).map((m) => (
                  <Toggle
                    key={m}
                    id={`isis-mod-${m}`}
                    label={ISIS_MODULE_LABELS[m] ?? m}
                    checked={isis.enabledModules.includes(m)}
                    onChange={(v) =>
                      setIsis((i) =>
                        i
                          ? {
                              ...i,
                              enabledModules: v
                                ? [...i.enabledModules, m]
                                : i.enabledModules.filter((x) => x !== m),
                            }
                          : i,
                      )
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="col-span-2 flex justify-end">
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? 'A guardar…' : 'Guardar alterações'}
        </Button>
      </div>
    </form>
  );
}

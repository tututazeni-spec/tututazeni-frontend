// components/settings/TabIntegracoes.tsx
// Tab "Integrações" (ADMIN): SMTP, WhatsApp (só envio) e Ísis (IA) — GET/PUT
// /settings/integrations (docs/modulo_settings.md §6). Chaves de API e
// webhooks continuam geridos em API & Integrações; aqui só se resume o total.

'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import type { IntegrationSettings, IntegrationsOverview, WhatsAppStatus } from './types';

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

function Toggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
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
  const { data, isLoading, error } = useApiQuery<IntegrationSettings & { isisModuleOptions: string[] }>(
    queryKeys.settings.integrations(),
    '/settings/integrations',
  );
  const overview = useApiQuery<IntegrationsOverview>(
    queryKeys.settings.integrationsOverview(),
    '/settings/integrations/overview',
  );

  const [smtp, setSmtp] = useState<SmtpForm | null>(null);
  const [smtpPassword, setSmtpPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState<WhatsAppForm | null>(null);
  const [waToken, setWaToken] = useState('');
  const [isis, setIsis] = useState<IsisForm | null>(null);

  useEffect(() => {
    if (data) {
      setSmtp(data.smtp);
      setWhatsapp(data.whatsapp);
      setIsis(data.isis);
    }
  }, [data]);

  const save = useApiMutation(
    (payload: {
      smtp: Omit<SmtpForm, 'hasPassword'> & { password?: string };
      whatsapp: Omit<WhatsAppForm, 'hasAuthToken'> & { authToken?: string };
      isis: IsisForm;
    }) => apiClient.put('/settings/integrations', payload),
    {
      invalidateKeys: [queryKeys.settings.integrations(), queryKeys.settings.integrationsOverview()],
      onSuccess: () => {
        setSmtpPassword('');
        setWaToken('');
        toast({ title: 'Definições de integrações guardadas', intent: 'success' });
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const [testTo, setTestTo] = useState('');
  const testSmtp = useApiMutation(
    () => apiClient.post<{ ok: boolean; to?: string; error?: string }>(
      '/settings/integrations/smtp/test',
      testTo ? { to: testTo } : {},
    ),
    {
      onSuccess: (r) =>
        toast(
          r.ok
            ? { title: `Email de teste enviado para ${r.to}`, intent: 'success' }
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
    return <p className="py-10 text-center text-sm text-ink-faint">A carregar…</p>;
  if (error) return <p className="py-10 text-center text-sm text-danger">{error.message}</p>;

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
        <Card className="col-span-2">
          <CardBody>
            <h3 className="mb-4 text-base font-bold text-ink">Resumo</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="m-0 text-xs uppercase tracking-wider text-ink-faint">SMTP</p>
                <Badge intent={o.smtp.configured ? 'success' : 'neutral'} className="mt-1">
                  {o.smtp.configured ? `Configurado (${o.smtp.source})` : 'Não configurado'}
                </Badge>
              </div>
              <div>
                <p className="m-0 text-xs uppercase tracking-wider text-ink-faint">WhatsApp</p>
                <Badge intent={o.whatsapp.enabled ? 'success' : 'neutral'} className="mt-1">
                  {o.whatsapp.enabled ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <div>
                <p className="m-0 text-xs uppercase tracking-wider text-ink-faint">Chaves de API activas</p>
                <p className="mt-1 text-2xl font-bold text-ink">{o.activeApiKeys}</p>
              </div>
              <div>
                <p className="m-0 text-xs uppercase tracking-wider text-ink-faint">Webhooks activos</p>
                <p className="mt-1 text-2xl font-bold text-ink">{o.activeWebhooks}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* SMTP */}
      <Card className="col-span-2">
        <CardBody>
          <h3 className="mb-4 text-base font-bold text-ink">Email (SMTP)</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Servidor" htmlFor="smtp-host">
              <Input
                id="smtp-host"
                className="w-full"
                value={smtp.host}
                onChange={(e) => setSmtp((s) => (s ? { ...s, host: e.target.value } : s))}
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
                onChange={(e) => setSmtp((s) => (s ? { ...s, port: Number(e.target.value) } : s))}
              />
            </FormField>
            <FormField label="Utilizador" htmlFor="smtp-user">
              <Input
                id="smtp-user"
                className="w-full"
                value={smtp.user}
                onChange={(e) => setSmtp((s) => (s ? { ...s, user: e.target.value } : s))}
              />
            </FormField>
            <FormField
              label="Palavra-passe"
              htmlFor="smtp-password"
              hint={smtp.hasPassword ? 'Já configurada — deixe em branco para manter' : undefined}
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
            <FormField label="Remetente" htmlFor="smtp-from" hint="ex.: INNOVA <noreply@empresa.ao>">
              <Input
                id="smtp-from"
                className="w-full"
                value={smtp.from}
                onChange={(e) => setSmtp((s) => (s ? { ...s, from: e.target.value } : s))}
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
              <FormField label="Enviar email de teste para" htmlFor="smtp-test-to">
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
      <Card>
        <CardBody>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-ink">WhatsApp (só envio)</h3>
            {whatsapp.enabled && waStatus.data && (
              <Badge intent={waStatus.data.connected ? 'success' : 'danger'}>
                {waStatus.data.connected ? 'Ligado' : 'Desligado'}
              </Badge>
            )}
          </div>
          <div className="space-y-4">
            <Toggle
              id="wa-enabled"
              label="Activar envio por WhatsApp"
              checked={whatsapp.enabled}
              onChange={(v) => setWhatsapp((w) => (w ? { ...w, enabled: v } : w))}
            />
            <FormField label="Número (E.164)" htmlFor="wa-number">
              <Input
                id="wa-number"
                className="w-full"
                value={whatsapp.number}
                onChange={(e) => setWhatsapp((w) => (w ? { ...w, number: e.target.value } : w))}
                placeholder="+244923000000"
              />
            </FormField>
            <FormField label="Account SID" htmlFor="wa-sid">
              <Input
                id="wa-sid"
                className="w-full"
                value={whatsapp.accountSid}
                onChange={(e) => setWhatsapp((w) => (w ? { ...w, accountSid: e.target.value } : w))}
              />
            </FormField>
            <FormField
              label="Auth Token"
              htmlFor="wa-token"
              hint={whatsapp.hasAuthToken ? 'Já configurado — deixe em branco para manter' : undefined}
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
              <FormField label="Limite por hora (0 = sem limite)" htmlFor="wa-hourly">
                <Input
                  id="wa-hourly"
                  type="number"
                  min={0}
                  className="w-full"
                  value={whatsapp.hourlyLimit}
                  onChange={(e) =>
                    setWhatsapp((w) => (w ? { ...w, hourlyLimit: Number(e.target.value) } : w))
                  }
                />
              </FormField>
              <FormField label="Limite por dia (0 = sem limite)" htmlFor="wa-daily">
                <Input
                  id="wa-daily"
                  type="number"
                  min={0}
                  className="w-full"
                  value={whatsapp.dailyLimit}
                  onChange={(e) =>
                    setWhatsapp((w) => (w ? { ...w, dailyLimit: Number(e.target.value) } : w))
                  }
                />
              </FormField>
            </div>
            {whatsapp.enabled && waStatus.data && (
              <p className="text-xs text-ink-faint">
                Consumo: {waStatus.data.usage.lastHour}/{waStatus.data.usage.hourlyLimit || '∞'} na
                última hora · {waStatus.data.usage.lastDay}/{waStatus.data.usage.dailyLimit || '∞'}{' '}
                no último dia
                {waStatus.data.error && <span className="text-danger"> · {waStatus.data.error}</span>}
              </p>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Ísis (IA) */}
      <Card>
        <CardBody>
          <h3 className="mb-4 text-base font-bold text-ink">Ísis (IA)</h3>
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
                  setIsis((i) => (i ? { ...i, dailyLimitPerUser: Number(e.target.value) } : i))
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

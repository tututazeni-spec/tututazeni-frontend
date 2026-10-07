// components/settings/TabWhatsApp.tsx
// Tab "WhatsApp" (ADMIN): fornecedor (Twilio ou Meta Cloud API), número,
// Business Account, templates por evento, eventos autorizados, limites e estado
// — GET/PUT /settings/whatsapp (docs/modulo_settings.md §13).

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
import { Select } from '@/components/ui/Select';
import type {
  WhatsAppEventKey,
  WhatsAppMetaTemplate,
  WhatsAppProvider,
  WhatsAppSettingsView,
} from './types';

const EVENT_LABELS: Record<WhatsAppEventKey, string> = {
  NOTIFICATION: 'Notificações do sistema',
  AUTOMATION: 'Regras de automação',
  CORPORATE_EVENT: 'Eventos corporativos',
};

const PROVIDER_ITEMS = [
  { value: 'TWILIO', label: 'Twilio' },
  { value: 'META', label: 'Meta Cloud API (WhatsApp Business)' },
];

interface Form {
  enabled: boolean;
  provider: WhatsAppProvider;
  number: string;
  accountSid: string;
  hourlyLimit: number;
  dailyLimit: number;
  metaPhoneNumberId: string;
  metaBusinessAccountId: string;
  metaApiVersion: string;
  authorizedEvents: WhatsAppEventKey[];
  templates: WhatsAppSettingsView['templates'];
}

function toForm(d: WhatsAppSettingsView): Form {
  return {
    enabled: d.enabled,
    provider: d.provider,
    number: d.number,
    accountSid: d.accountSid,
    hourlyLimit: d.hourlyLimit,
    dailyLimit: d.dailyLimit,
    metaPhoneNumberId: d.meta.phoneNumberId,
    metaBusinessAccountId: d.meta.businessAccountId,
    metaApiVersion: d.meta.apiVersion,
    authorizedEvents: d.authorizedEvents,
    templates: d.templates,
  };
}

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
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function TabWhatsApp() {
  const toast = useToast();
  const { data, isLoading, error } = useApiQuery<WhatsAppSettingsView>(
    queryKeys.settings.whatsappSettings(),
    '/settings/whatsapp',
  );
  const [form, setForm] = useState<Form | null>(null);
  const [authToken, setAuthToken] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [testTo, setTestTo] = useState('');

  useEffect(() => {
    if (data) setForm(toForm(data));
  }, [data]);

  const metaTemplates = useApiQuery<WhatsAppMetaTemplate[]>(
    queryKeys.settings.whatsappMetaTemplates(),
    '/settings/whatsapp/templates',
    { enabled: false },
  );

  const save = useApiMutation(
    (payload: Record<string, unknown>) => apiClient.put('/settings/whatsapp', payload),
    {
      invalidateKeys: [queryKeys.settings.whatsappSettings(), queryKeys.settings.all],
      onSuccess: () => {
        setAuthToken('');
        setAccessToken('');
        toast({ title: 'Definições de WhatsApp guardadas', intent: 'success' });
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const test = useApiMutation(
    () => apiClient.post<{ ok: boolean; error?: string }>('/settings/whatsapp/test', { to: testTo }),
    {
      onSuccess: (r) =>
        toast(
          r.ok
            ? { title: 'Mensagem de teste enviada', intent: 'success' }
            : { title: r.error ?? 'Falha no envio', intent: 'danger' },
        ),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  if (error) return <p className="py-10 text-center text-sm text-danger">{error.message}</p>;
  if (isLoading || !form || !data)
    return <p className="py-10 text-center text-sm text-ink-faint">A carregar…</p>;

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const isMeta = form.provider === 'META';
  const st = data.status;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    save.mutate({
      enabled: form.enabled,
      provider: form.provider,
      number: form.number,
      hourlyLimit: form.hourlyLimit,
      dailyLimit: form.dailyLimit,
      authorizedEvents: form.authorizedEvents,
      templates: form.templates,
      ...(isMeta
        ? {
            meta: {
              phoneNumberId: form.metaPhoneNumberId,
              businessAccountId: form.metaBusinessAccountId,
              apiVersion: form.metaApiVersion,
              ...(accessToken && { accessToken }),
            },
          }
        : { accountSid: form.accountSid, ...(authToken && { authToken }) }),
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Card>
        <CardBody>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-ink">Estado da integração</h3>
            <Badge intent={!st.enabled ? 'neutral' : st.connected ? 'success' : 'danger'}>
              {!st.enabled ? 'Desactivada' : st.connected ? 'Ligada' : 'Sem ligação'}
            </Badge>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm text-ink md:grid-cols-4">
            {st.displayPhoneNumber && (
              <div>
                <dt className="text-xs text-ink-faint">Número</dt>
                <dd>{st.displayPhoneNumber}</dd>
              </div>
            )}
            {st.verifiedName && (
              <div>
                <dt className="text-xs text-ink-faint">Nome verificado</dt>
                <dd>{st.verifiedName}</dd>
              </div>
            )}
            {st.qualityRating && (
              <div>
                <dt className="text-xs text-ink-faint">Qualidade</dt>
                <dd>{st.qualityRating}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-ink-faint">Última hora</dt>
              <dd>
                {st.usage.lastHour}
                {st.usage.hourlyLimit > 0 && ` / ${st.usage.hourlyLimit}`}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-faint">Últimas 24 h</dt>
              <dd>
                {st.usage.lastDay}
                {st.usage.dailyLimit > 0 && ` / ${st.usage.dailyLimit}`}
              </dd>
            </div>
          </dl>
          {st.error && <p className="mt-3 text-sm text-danger">{st.error}</p>}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="mb-4 text-base font-bold text-ink">Ligação (só envio)</h3>
          <div className="space-y-4">
            <Toggle
              id="wa-enabled"
              label="Activar envio por WhatsApp"
              checked={form.enabled}
              onChange={(v) => set('enabled', v)}
            />
            <FormField label="Fornecedor" htmlFor="wa-provider">
              <Select
                className="w-full"
                items={PROVIDER_ITEMS}
                value={form.provider}
                onValueChange={(v) => set('provider', v as WhatsAppProvider)}
              />
            </FormField>
            <FormField label="Número remetente (E.164)" htmlFor="wa-number">
              <Input
                id="wa-number"
                className="w-full"
                value={form.number}
                onChange={(e) => set('number', e.target.value)}
                placeholder="+244923000000"
              />
            </FormField>

            {isMeta ? (
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Phone Number ID" htmlFor="wa-meta-phone">
                  <Input
                    id="wa-meta-phone"
                    className="w-full"
                    value={form.metaPhoneNumberId}
                    onChange={(e) => set('metaPhoneNumberId', e.target.value)}
                  />
                </FormField>
                <FormField label="Business Account ID" htmlFor="wa-meta-waba">
                  <Input
                    id="wa-meta-waba"
                    className="w-full"
                    value={form.metaBusinessAccountId}
                    onChange={(e) => set('metaBusinessAccountId', e.target.value)}
                  />
                </FormField>
                <FormField
                  label="Token de acesso"
                  htmlFor="wa-meta-token"
                  hint={data.meta.hasAccessToken ? 'Já configurado — deixe em branco para manter' : undefined}
                >
                  <Input
                    id="wa-meta-token"
                    type="password"
                    className="w-full"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="••••••••"
                  />
                </FormField>
                <FormField label="Versão da Graph API" htmlFor="wa-meta-version" hint="ex.: v21.0">
                  <Input
                    id="wa-meta-version"
                    className="w-full"
                    value={form.metaApiVersion}
                    onChange={(e) => set('metaApiVersion', e.target.value)}
                  />
                </FormField>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Account SID" htmlFor="wa-sid">
                  <Input
                    id="wa-sid"
                    className="w-full"
                    value={form.accountSid}
                    onChange={(e) => set('accountSid', e.target.value)}
                  />
                </FormField>
                <FormField
                  label="Auth Token"
                  htmlFor="wa-token"
                  hint={data.hasAuthToken ? 'Já configurado — deixe em branco para manter' : undefined}
                >
                  <Input
                    id="wa-token"
                    type="password"
                    className="w-full"
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                    placeholder="••••••••"
                  />
                </FormField>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Limite por hora (0 = sem limite)" htmlFor="wa-hourly">
                <Input
                  id="wa-hourly"
                  type="number"
                  min={0}
                  className="w-full"
                  value={form.hourlyLimit}
                  onChange={(e) => set('hourlyLimit', Number(e.target.value))}
                />
              </FormField>
              <FormField label="Limite por dia (0 = sem limite)" htmlFor="wa-daily">
                <Input
                  id="wa-daily"
                  type="number"
                  min={0}
                  className="w-full"
                  value={form.dailyLimit}
                  onChange={(e) => set('dailyLimit', Number(e.target.value))}
                />
              </FormField>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="mb-1 text-base font-bold text-ink">Eventos autorizados</h3>
          <p className="mb-4 text-xs text-ink-faint">
            Só estes eventos enviam WhatsApp. Cada utilizador continua a precisar de ter o canal activo
            nas suas preferências.
          </p>
          <div className="space-y-4">
            {data.eventOptions.map((ev) => (
              <div key={ev} className="grid grid-cols-[1fr_1fr_120px] items-end gap-3">
                <Toggle
                  id={`wa-ev-${ev}`}
                  label={EVENT_LABELS[ev]}
                  checked={form.authorizedEvents.includes(ev)}
                  onChange={(v) =>
                    set(
                      'authorizedEvents',
                      v
                        ? [...form.authorizedEvents, ev]
                        : form.authorizedEvents.filter((x) => x !== ev),
                    )
                  }
                />
                {isMeta && (
                  <>
                    <FormField label="Template Meta (vazio = texto livre)" htmlFor={`wa-tpl-${ev}`}>
                      <Input
                        id={`wa-tpl-${ev}`}
                        className="w-full"
                        list="wa-meta-templates"
                        value={form.templates[ev].name}
                        onChange={(e) =>
                          set('templates', {
                            ...form.templates,
                            [ev]: { ...form.templates[ev], name: e.target.value },
                          })
                        }
                        placeholder="nome_do_template"
                      />
                    </FormField>
                    <FormField label="Idioma" htmlFor={`wa-lang-${ev}`}>
                      <Input
                        id={`wa-lang-${ev}`}
                        className="w-full"
                        value={form.templates[ev].language}
                        onChange={(e) =>
                          set('templates', {
                            ...form.templates,
                            [ev]: { ...form.templates[ev], language: e.target.value },
                          })
                        }
                      />
                    </FormField>
                  </>
                )}
              </div>
            ))}
          </div>
          {isMeta && (
            <div className="mt-4 space-y-2">
              <datalist id="wa-meta-templates">
                {(metaTemplates.data ?? []).map((t) => (
                  <option key={`${t.name}-${t.language}`} value={t.name}>
                    {t.language} · {t.status}
                  </option>
                ))}
              </datalist>
              <Button
                type="button"
                intent="secondary"
                disabled={metaTemplates.isFetching}
                onClick={() => void metaTemplates.refetch()}
              >
                {metaTemplates.isFetching ? 'A carregar…' : 'Carregar templates aprovados da Meta'}
              </Button>
              {metaTemplates.error && (
                <p className="text-sm text-danger">{metaTemplates.error.message}</p>
              )}
              {metaTemplates.data && (
                <p className="text-xs text-ink-faint">
                  {metaTemplates.data.length} templates — o corpo do template recebe a mensagem como
                  variável {'{{1}}'}.
                </p>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="mb-4 text-base font-bold text-ink">Enviar mensagem de teste</h3>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <FormField label="Número de destino (E.164)" htmlFor="wa-test-to">
                <Input
                  id="wa-test-to"
                  className="w-full"
                  value={testTo}
                  onChange={(e) => setTestTo(e.target.value)}
                  placeholder="+244923000000"
                />
              </FormField>
            </div>
            <Button
              type="button"
              intent="secondary"
              disabled={test.isPending || !testTo}
              onClick={() => test.mutate(undefined)}
            >
              {test.isPending ? 'A enviar…' : 'Testar'}
            </Button>
          </div>
          <p className="mt-2 text-xs text-ink-faint">Grave as alterações antes de testar.</p>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? 'A guardar…' : 'Guardar alterações'}
        </Button>
      </div>
    </form>
  );
}

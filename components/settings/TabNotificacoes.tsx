// components/settings/TabNotificacoes.tsx
// Tab "Notificações" (ADMIN): canais, eventos que geram notificação e horário
// permitido de envio — GET/PUT /settings/notifications (docs/modulo_settings.md §5).
// Os templates das mensagens continuam geridos em Notificações > Templates.

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
import { Select } from '@/components/ui/Select';
import type { NotificationSettings } from './types';

type Form = Omit<
  NotificationSettings,
  'eventKeys' | 'activeTemplates' | 'timeZone'
>;

const EVENT_LABELS: Record<string, string> = {
  ENROLLMENT: 'Matrícula em curso',
  COURSE_REMINDER: 'Lembrete de curso',
  CORPORATE_EVENT: 'Evento corporativo',
  PENDING_EVALUATION: 'Avaliação pendente',
};

const HOURS = Array.from({ length: 24 }, (_, h) => ({
  value: String(h),
  label: `${String(h).padStart(2, '0')}:00`,
}));

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

export function TabNotificacoes() {
  const toast = useToast();
  const { data, isLoading, error } = useApiQuery<NotificationSettings>(
    queryKeys.settings.notifications(),
    '/settings/notifications',
  );
  const [form, setForm] = useState<Form | null>(null);

  useEffect(() => {
    if (data) {
      const {
        eventKeys: _k,
        activeTemplates: _t,
        timeZone: _tz,
        ...rest
      } = data;
      setForm(rest);
    }
  }, [data]);

  const save = useApiMutation(
    (payload: Form) => apiClient.put('/settings/notifications', payload),
    {
      invalidateKeys: [queryKeys.settings.notifications()],
      onSuccess: () =>
        toast({
          title: 'Definições de notificações guardadas',
          intent: 'success',
        }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  if (isLoading || !form)
    return (
      <p className="py-10 text-center text-sm text-ink-faint">A carregar…</p>
    );
  if (error)
    return (
      <p className="py-10 text-center text-sm text-danger">{error.message}</p>
    );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form) save.mutate(form);
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-4">
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
          Canais
        </div>
        <CardBody>
          <p className="mb-4 text-xs text-ink-faint">
            O WhatsApp é só de envio — não há recepção.
          </p>
          <div className="space-y-2">
            <Toggle
              id="ch-inApp"
              label="Notificações na aplicação (in-app)"
              checked={form.channels.inApp}
              onChange={(v) =>
                setForm((f) =>
                  f ? { ...f, channels: { ...f.channels, inApp: v } } : f,
                )
              }
            />
            <Toggle
              id="ch-email"
              label="Email"
              checked={form.channels.email}
              onChange={(v) =>
                setForm((f) =>
                  f ? { ...f, channels: { ...f.channels, email: v } } : f,
                )
              }
            />
            <Toggle
              id="ch-whatsapp"
              label="WhatsApp"
              checked={form.channels.whatsapp}
              onChange={(v) =>
                setForm((f) =>
                  f ? { ...f, channels: { ...f.channels, whatsapp: v } } : f,
                )
              }
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-ink">
              Templates das mensagens
            </h3>
            {data && (
              <Badge intent="info">{data.activeTemplates} activos</Badge>
            )}
          </div>
          <p className="text-sm text-ink-muted">
            A edição dos templates continua em Notificações &gt; Templates. Aqui
            controlas só que eventos os disparam e em que canais/horário.
          </p>
        </CardBody>
      </Card>

      <Card className="col-span-2 overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
          Eventos que geram notificação
        </div>
        <CardBody>
          <p className="mb-4 text-xs text-ink-faint">
            Desligar um evento aqui impede a notificação em todos os canais, não
            só o externo.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(form.events).map(([key, on]) => (
              <Toggle
                key={key}
                id={`ev-${key}`}
                label={EVENT_LABELS[key] ?? key}
                checked={on}
                onChange={(v) =>
                  setForm((f) =>
                    f ? { ...f, events: { ...f.events, [key]: v } } : f,
                  )
                }
              />
            ))}
          </div>
        </CardBody>
      </Card>

      <Card className="col-span-2 overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
          Horário permitido de envio
        </div>
        <CardBody>
          <p className="mb-4 text-xs text-ink-faint">
            Aplica-se aos canais externos (email/WhatsApp). O in-app nunca é
            adiado.
          </p>
          <div className="space-y-4">
            <Toggle
              id="window-enabled"
              label="Restringir o envio a um horário"
              checked={form.sendWindow.enabled}
              onChange={(v) =>
                setForm((f) =>
                  f ? { ...f, sendWindow: { ...f.sendWindow, enabled: v } } : f,
                )
              }
            />
            {form.sendWindow.enabled && (
              <div className="grid grid-cols-3 gap-4">
                <FormField label="Início" htmlFor="startHour">
                  <Select
                    className="w-full"
                    items={HOURS}
                    value={String(form.sendWindow.startHour)}
                    onValueChange={(v) =>
                      setForm((f) =>
                        f
                          ? {
                              ...f,
                              sendWindow: {
                                ...f.sendWindow,
                                startHour: Number(v),
                              },
                            }
                          : f,
                      )
                    }
                  />
                </FormField>
                <FormField label="Fim" htmlFor="endHour">
                  <Select
                    className="w-full"
                    items={HOURS}
                    value={String(form.sendWindow.endHour)}
                    onValueChange={(v) =>
                      setForm((f) =>
                        f
                          ? {
                              ...f,
                              sendWindow: {
                                ...f.sendWindow,
                                endHour: Number(v),
                              },
                            }
                          : f,
                      )
                    }
                  />
                </FormField>
                <div className="flex items-end">
                  <Toggle
                    id="weekdaysOnly"
                    label="Só dias úteis"
                    checked={form.sendWindow.weekdaysOnly}
                    onChange={(v) =>
                      setForm((f) =>
                        f
                          ? {
                              ...f,
                              sendWindow: { ...f.sendWindow, weekdaysOnly: v },
                            }
                          : f,
                      )
                    }
                  />
                </div>
              </div>
            )}
            <Toggle
              id="criticalBypassWindow"
              label="Notificações críticas ignoram o horário"
              checked={form.criticalBypassWindow}
              onChange={(v) =>
                setForm((f) => (f ? { ...f, criticalBypassWindow: v } : f))
              }
            />
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

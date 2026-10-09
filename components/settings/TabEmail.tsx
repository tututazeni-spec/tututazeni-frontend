// components/settings/TabEmail.tsx
// Tab "Email" (ADMIN): servidor/porta/SSL-TLS/remetente (mesmo SMTP do §6,
// editado aqui por conveniência) + assinatura e templates dos emails do
// sistema — GET/PUT /settings/email, POST /settings/email/test
// (docs/modulo_settings.md §12).

'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import type {
  EmailSettingsView,
  EmailTemplateKey,
  EmailTestResult,
} from './types';

const TEMPLATE_LABELS: Record<EmailTemplateKey, string> = {
  PASSWORD_RESET: 'Recuperação de password',
  USER_INVITE: 'Convite de utilizador',
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

export function TabEmail() {
  const toast = useToast();
  const { data, isLoading, error } = useApiQuery<EmailSettingsView>(
    queryKeys.settings.emailSettings(),
    '/settings/email',
  );

  const [smtp, setSmtp] = useState<EmailSettingsView['smtp'] | null>(null);
  const [smtpPassword, setSmtpPassword] = useState('');
  const [signature, setSignature] = useState('');
  const [templates, setTemplates] = useState<
    EmailSettingsView['templates'] | null
  >(null);
  const [activeKey, setActiveKey] =
    useState<EmailTemplateKey>('PASSWORD_RESET');
  const [testTo, setTestTo] = useState('');

  useEffect(() => {
    if (data) {
      setSmtp(data.smtp);
      setSignature(data.signature);
      setTemplates(data.templates);
    }
  }, [data]);

  const save = useApiMutation(
    (payload: Record<string, unknown>) =>
      apiClient.put('/settings/email', payload),
    {
      invalidateKeys: [queryKeys.settings.emailSettings()],
      onSuccess: () => {
        setSmtpPassword('');
        toast({ title: 'Definições de email guardadas', intent: 'success' });
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const test = useApiMutation(
    () =>
      apiClient.post<EmailTestResult>('/settings/email/test', {
        key: activeKey,
        ...(testTo && { to: testTo }),
      }),
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

  if (isLoading || !smtp || !templates)
    return (
      <p className="py-10 text-center text-sm text-ink-faint">A carregar…</p>
    );
  if (error)
    return (
      <p className="py-10 text-center text-sm text-danger">{error.message}</p>
    );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!smtp || !templates) return;
    const { hasPassword: _hp, ...smtpRest } = smtp;
    save.mutate({
      signature,
      templates,
      smtp: { ...smtpRest, ...(smtpPassword && { password: smtpPassword }) },
    });
  }

  const draft = templates[activeKey];
  const placeholders = data?.placeholders[activeKey] ?? [];

  return (
    <form onSubmit={submit} className="space-y-4">
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
          Servidor (SMTP)
        </div>
        <CardBody>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Servidor" htmlFor="email-smtp-host">
              <Input
                id="email-smtp-host"
                className="w-full"
                value={smtp.host}
                onChange={(e) =>
                  setSmtp((s) => (s ? { ...s, host: e.target.value } : s))
                }
                placeholder="smtp.empresa.ao"
              />
            </FormField>
            <FormField label="Porta" htmlFor="email-smtp-port">
              <Input
                id="email-smtp-port"
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
            <FormField label="Utilizador" htmlFor="email-smtp-user">
              <Input
                id="email-smtp-user"
                className="w-full"
                value={smtp.user}
                onChange={(e) =>
                  setSmtp((s) => (s ? { ...s, user: e.target.value } : s))
                }
              />
            </FormField>
            <FormField
              label="Palavra-passe"
              htmlFor="email-smtp-password"
              hint={
                smtp.hasPassword
                  ? 'Já configurada — deixe em branco para manter'
                  : undefined
              }
            >
              <Input
                id="email-smtp-password"
                type="password"
                className="w-full"
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
                placeholder="••••••••"
              />
            </FormField>
            <FormField
              label="Remetente"
              htmlFor="email-smtp-from"
              hint="ex.: INNOVA <noreply@empresa.ao>"
            >
              <Input
                id="email-smtp-from"
                className="w-full"
                value={smtp.from}
                onChange={(e) =>
                  setSmtp((s) => (s ? { ...s, from: e.target.value } : s))
                }
              />
            </FormField>
            <div className="flex items-end">
              <Toggle
                id="email-smtp-secure"
                label="Ligação segura (SSL/TLS)"
                checked={smtp.secure}
                onChange={(v) => setSmtp((s) => (s ? { ...s, secure: v } : s))}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
          Assinatura
        </div>
        <CardBody>
          <FormField
            label="Acrescentada ao fim de todos os emails transaccionais"
            htmlFor="email-signature"
          >
            <Textarea
              id="email-signature"
              className="w-full"
              rows={2}
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
            />
          </FormField>
        </CardBody>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
          Templates
        </div>
        <CardBody>
          <FormField label="Template" htmlFor="email-template-key">
            <Select
              className="w-full"
              items={(data?.templateKeys ?? []).map((k) => ({
                value: k,
                label: TEMPLATE_LABELS[k],
              }))}
              value={activeKey}
              onValueChange={(v) => setActiveKey(v as EmailTemplateKey)}
            />
          </FormField>
          {placeholders.length > 0 && (
            <p className="mt-2 text-xs text-ink-faint">
              Placeholders disponíveis:{' '}
              {placeholders.map((p) => `{{${p}}}`).join(', ')}
            </p>
          )}
          <div className="mt-4 space-y-4">
            <FormField label="Assunto" htmlFor="email-template-subject">
              <Input
                id="email-template-subject"
                className="w-full"
                value={draft.subject}
                onChange={(e) =>
                  setTemplates((t) =>
                    t
                      ? {
                          ...t,
                          [activeKey]: {
                            ...t[activeKey],
                            subject: e.target.value,
                          },
                        }
                      : t,
                  )
                }
              />
            </FormField>
            <FormField label="Corpo" htmlFor="email-template-body">
              <Textarea
                id="email-template-body"
                className="w-full"
                rows={8}
                value={draft.body}
                onChange={(e) =>
                  setTemplates((t) =>
                    t
                      ? {
                          ...t,
                          [activeKey]: {
                            ...t[activeKey],
                            body: e.target.value,
                          },
                        }
                      : t,
                  )
                }
              />
            </FormField>
          </div>
          <div className="mt-4 flex items-end gap-2">
            <div className="flex-1">
              <FormField
                label="Enviar teste para"
                htmlFor="email-template-test-to"
              >
                <Input
                  id="email-template-test-to"
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
              disabled={test.isPending}
              onClick={() => test.mutate(undefined)}
            >
              {test.isPending ? 'A enviar…' : 'Testar este template'}
            </Button>
          </div>
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

// components/automation/SettingsTab.tsx
// Configurações (docs/modulo_automation.md §10): limites de execução, alertas,
// retenção, permissões por perfil, repetição/falhas e segurança. O backend só
// deixa ADMIN consultar e alterar (GET/PUT /automation/settings).

'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Settings } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { PermissionsPanel } from './SettingsPermissions';
import { DeadLettersPanel, SecurityPanel } from './SettingsSecurity';
import type { AutomationSettings } from './types';

type Section = 'limits' | 'permissions' | 'retries' | 'security';

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'limits', label: 'Limites, alertas e retenção' },
  { id: 'permissions', label: 'Permissões' },
  { id: 'retries', label: 'Repetição e falhas' },
  { id: 'security', label: 'Segurança' },
];

type NumericKey = Exclude<
  keyof AutomationSettings,
  'requireApprovalCritical' | 'updatedAt' | 'updatedBy'
>;

const NUMERIC_FIELDS: {
  key: NumericKey;
  label: string;
  hint: string;
  min: number;
  max: number;
  group: 'limits' | 'alerts' | 'retention';
}[] = [
  {
    key: 'maxExecutionsPerMinute',
    label: 'Execuções por minuto (por automação)',
    hint: 'Limite de frequência. Acima disto as execuções são recusadas.',
    min: 1,
    max: 10000,
    group: 'limits',
  },
  {
    key: 'maxConcurrentPerRule',
    label: 'Execuções em simultâneo (por automação)',
    hint: 'Limite de concorrência.',
    min: 1,
    max: 200,
    group: 'limits',
  },
  {
    key: 'maxEventDepth',
    label: 'Profundidade máxima de cadeias',
    hint: 'Protecção contra ciclos infinitos entre automações que se desencadeiam umas às outras.',
    min: 1,
    max: 20,
    group: 'limits',
  },
  {
    key: 'failureAlertThreshold',
    label: 'Falhas definitivas que disparam alerta',
    hint: 'Número de falhas na janela abaixo.',
    min: 1,
    max: 1000,
    group: 'alerts',
  },
  {
    key: 'failureAlertWindowMinutes',
    label: 'Janela do alerta (minutos)',
    hint: 'O responsável e os administradores são avisados no máximo uma vez por janela.',
    min: 1,
    max: 10080,
    group: 'alerts',
  },
  {
    key: 'archiveAfterDays',
    label: 'Remover dados pessoais do registo após (dias)',
    hint: 'Protecção de dados pessoais nos registos de execução.',
    min: 1,
    max: 3650,
    group: 'retention',
  },
  {
    key: 'retentionDays',
    label: 'Apagar execuções após (dias)',
    hint: 'Tem de ser igual ou superior ao prazo anterior.',
    min: 1,
    max: 3650,
    group: 'retention',
  },
  {
    key: 'deadLetterRetentionDays',
    label: 'Apagar falhas definitivas após (dias)',
    hint: '',
    min: 1,
    max: 3650,
    group: 'retention',
  },
  {
    key: 'auditRetentionDays',
    label: 'Manter a auditoria durante (dias)',
    hint: 'Mínimo 30.',
    min: 30,
    max: 3650,
    group: 'retention',
  },
];

const GROUP_TITLE = {
  limits: 'Limites de execução',
  alerts: 'Alertas de falhas persistentes',
  retention: 'Retenção e arquivo do histórico',
} as const;

export function SettingsTab() {
  const { data: me, isLoading } = useCurrentUser();
  const [section, setSection] = useState<Section>('limits');

  if (isLoading) return <Skeleton rows={4} />;
  if (me?.role?.name !== 'ADMIN') {
    return (
      <EmptyState
        icon={Settings}
        title="Apenas para administradores"
        description="Os limites, permissões e definições de segurança das automações só podem ser consultados e alterados por administradores."
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2" role="tablist">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={section === s.id}
            onClick={() => setSection(s.id)}
            className={cn(
              'rounded-pill border-[1.5px] px-3.5 py-1.5 font-body text-sm font-semibold transition-colors',
              section === s.id
                ? 'border-[#0F1F3D] bg-[#0F1F3D] text-white'
                : 'border-border-strong bg-surface text-ink-muted hover:bg-surface-sunken',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === 'limits' && <LimitsPanel />}
      {section === 'permissions' && <PermissionsPanel />}
      {section === 'retries' && <DeadLettersPanel />}
      {section === 'security' && <SecurityPanel />}
    </div>
  );
}

function LimitsPanel() {
  const notify = useToast();
  const confirm = useConfirm();
  const { data, isLoading } = useApiQuery<AutomationSettings>(
    queryKeys.automation.govSettings(),
    '/automation/settings',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const [form, setForm] = useState<Record<NumericKey, string> | null>(null);
  const [requireApproval, setRequireApproval] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!data) return;
    setForm(
      Object.fromEntries(
        NUMERIC_FIELDS.map((f) => [f.key, String(data[f.key])]),
      ) as Record<NumericKey, string>,
    );
    setRequireApproval(data.requireApprovalCritical);
  }, [data]);

  const save = useApiMutation(
    () =>
      apiClient.put('/automation/settings', {
        ...Object.fromEntries(
          NUMERIC_FIELDS.map((f) => [f.key, Number(form?.[f.key])]),
        ),
        requireApprovalCritical: requireApproval,
      }),
    {
      invalidateKeys: [queryKeys.automation.govSettings()],
      onSuccess: () => {
        setError('');
        notify({ title: 'Definições guardadas', intent: 'success' });
      },
      onError: (e: Error) => setError(e.message || 'Erro ao guardar.'),
    },
  );

  const retention = useApiMutation(
    (dryRun: boolean) =>
      apiClient.post<Record<string, number>>('/automation/retention/run', {
        dryRun,
      }),
    {
      invalidateKeys: [queryKeys.automation.govSettings()],
      onSuccess: (r: Record<string, number>, dryRun: boolean) =>
        notify({
          title: dryRun ? 'Simulação concluída' : 'Retenção aplicada',
          description: Object.entries(r)
            .filter(([, v]) => typeof v === 'number')
            .map(([k, v]) => `${k}: ${v}`)
            .join(' · '),
          intent: 'success',
        }),
      onError: (e: Error) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const applyRetention = async () => {
    const ok = await confirm({
      title: 'Aplicar retenção agora',
      message:
        'Remove os dados pessoais e apaga as execuções que ultrapassaram os prazos definidos. Esta acção não se pode desfazer. Use primeiro a simulação para ver o impacto.',
      confirmLabel: 'Aplicar',
      destructive: true,
    });
    if (ok) retention.mutate(false);
  };

  if (isLoading || !form) return <Skeleton rows={4} />;

  const invalid = NUMERIC_FIELDS.some((f) => {
    const n = Number(form[f.key]);
    return !Number.isInteger(n) || n < f.min || n > f.max;
  });

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink"
        >
          <AlertCircle size={16} strokeWidth={1.75} />
          {error}
        </div>
      )}

      {(Object.keys(GROUP_TITLE) as (keyof typeof GROUP_TITLE)[]).map((g) => (
        <section
          key={g}
          className="rounded-card border border-border bg-surface p-4 shadow-resting"
        >
          <h3 className="mb-3 font-display text-sm font-bold text-[#0F1F3D]">
            {GROUP_TITLE[g]}
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {NUMERIC_FIELDS.filter((f) => f.group === g).map((f) => (
              <FormField
                key={f.key}
                label={f.label}
                htmlFor={`st-${f.key}`}
                hint={f.hint || undefined}
              >
                <Input
                  id={`st-${f.key}`}
                  type="number"
                  min={f.min}
                  max={f.max}
                  value={form[f.key]}
                  onChange={(e) =>
                    setForm({ ...form, [f.key]: e.target.value })
                  }
                  className="max-w-[160px]"
                />
              </FormField>
            ))}
          </div>
          {g === 'limits' && (
            <label className="mt-4 flex items-start gap-2 font-body text-sm text-ink">
              <input
                type="checkbox"
                className="mt-1"
                checked={requireApproval}
                onChange={(e) => setRequireApproval(e.target.checked)}
              />
              <span>
                Exigir aprovação de publicação para automações críticas
                <span className="block text-xs text-ink-muted">
                  Quem pediu a publicação não a pode aprovar.
                </span>
              </span>
            </label>
          )}
          {g === 'retention' && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                intent="secondary"
                onClick={() => retention.mutate(true)}
                loading={retention.isPending}
              >
                Simular retenção
              </Button>
              <Button
                size="sm"
                intent="secondary"
                onClick={() => void applyRetention()}
                disabled={retention.isPending}
              >
                Aplicar agora
              </Button>
            </div>
          )}
        </section>
      ))}

      <div className="flex items-center justify-between gap-3">
        <p className="font-body text-xs text-ink-muted">
          {data?.updatedAt
            ? `Última alteração: ${new Date(data.updatedAt).toLocaleString('pt')}`
            : 'A usar os valores por omissão.'}
          {' · '}A política de tentativas (intervalo e número) define-se em cada
          automação, no Construtor de Fluxos.
        </p>
        <Button
          onClick={() => {
            setError('');
            save.mutate(undefined);
          }}
          disabled={invalid}
          loading={save.isPending}
        >
          Guardar definições
        </Button>
      </div>
    </div>
  );
}

// components/audit/PoliciesView.tsx
// Aba 09 «Políticas e Retenção» (docs/modulo_audit.md §12). Só ADMIN altera;
// toda a alteração fica registada no próprio registo de auditoria. A política
// governa limites de alerta, permissões de consulta/exportação e retenção das
// exportações; os prazos do registo de auditoria são apenas calculados aqui
// (nada é apagado automaticamente) e devem ser validados com o jurídico/DPO.

'use client';

import { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Bell,
  CalendarClock,
  Clock,
  Database,
  FileEdit,
  Lock,
  Save,
  ServerCog,
  ShieldAlert,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { useToast } from '@/providers/ToastProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { KpiCard } from '@/components/ui/KpiCard';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import {
  Table,
  TableBody,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { ACTION_LABELS, SEVERITY_CFG, actionLabel } from './constants';
import { fmtTs } from './utils';
import type {
  AuditPolicy,
  AuditServiceStatus,
  RetentionPreview,
} from './types';

const RETENTION_LABELS: Record<string, string> = {
  ACCESS: 'Acessos e sessões',
  DATA_CHANGES: 'Alterações de dados',
  SECURITY: 'Segurança e eventos críticos',
  PAYROLL: 'Payroll e recibos',
  EXPORTS: 'Exportações e evidências',
  GENERAL: 'Restantes registos',
};
const ALERT_LABELS: Record<string, string> = {
  failedLoginsPerHour: 'Logins falhados por hora (mesmo utilizador)',
  exportsPerHour: 'Exportações por hora (mesmo utilizador)',
  deletesPerDay: 'Eliminações por dia (mesmo utilizador)',
  permissionChangesPerDay: 'Alterações de permissões por dia',
};
const ROLE_OPTIONS = ['ADMIN', 'RH', 'GESTOR', 'DIRECTOR', 'LIDER', 'AUDITOR'];
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const SEVERITY_ITEMS = SEVERITIES.map((v) => ({
  value: v,
  label: SEVERITY_CFG[v as keyof typeof SEVERITY_CFG].label,
}));
const BASE_EVENTS = [
  'LOGIN',
  'LOGOUT',
  'FAILED',
  'DENIED',
  'CREATE',
  'UPDATE',
  'DELETE',
  'EXPORT',
  'DOWNLOAD',
  'APPROVE',
  'REJECT',
  'PUBLISH',
  'RESTORE',
];
const FREQ_ITEMS = [
  { value: 'NONE', label: 'Não definida' },
  { value: 'DAILY', label: 'Diária' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'MONTHLY', label: 'Mensal' },
];
const HEALTH: Record<
  AuditServiceStatus['health'],
  { label: string; intent: 'success' | 'warning' | 'neutral' }
> = {
  OK: { label: 'Operacional', intent: 'success' },
  WARNING: { label: 'Atenção', intent: 'warning' },
  DISABLED: { label: 'Desativado', intent: 'neutral' },
};

interface Form {
  serviceEnabled: boolean;
  retentionDays: Record<string, string>;
  alertRules: Record<string, string>;
  viewRoles: string[];
  exportRoles: string[];
  maskSensitive: boolean;
  maskedFields: string;
  requiredEvents: string;
  coveredModules: string;
  severityRules: string;
  archivePolicy: string;
  backupDestination: string;
  backupFrequency: string;
  failureAlertEmails: string;
  reason: string;
}

const list = (s: string) =>
  s
    .split(/[,\n]/)
    .map((x) => x.trim())
    .filter(Boolean);

function toForm(p: AuditPolicy): Form {
  return {
    serviceEnabled: p.serviceEnabled,
    retentionDays: Object.fromEntries(
      Object.entries(p.retentionDays).map(([k, v]) => [k, String(v)]),
    ),
    alertRules: Object.fromEntries(
      Object.entries(p.alertRules).map(([k, v]) => [k, String(v)]),
    ),
    viewRoles: p.viewRoles,
    exportRoles: p.exportRoles,
    maskSensitive: p.maskSensitive,
    maskedFields: p.maskedFields.join(', '),
    requiredEvents: p.requiredEvents.join(', '),
    coveredModules: p.coveredModules.join(', '),
    severityRules: Object.entries(p.severityRules)
      .map(([a, s]) => `${a}=${s}`)
      .join('\n'),
    archivePolicy: p.archivePolicy ?? '',
    backupDestination: p.backupDestination ?? '',
    backupFrequency: p.backupFrequency ?? 'NONE',
    failureAlertEmails: p.failureAlertEmails.join(', '),
    reason: '',
  };
}

function parseSeverityRules(text: string): Record<string, string> | string {
  const out: Record<string, string> = {};
  for (const line of text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)) {
    const [action, sev] = line.split('=').map((x) => x.trim().toUpperCase());
    if (!action || !SEVERITIES.includes(sev ?? '')) {
      return `Regra de gravidade inválida: «${line}» (use AÇÃO=LOW|MEDIUM|HIGH|CRITICAL)`;
    }
    out[action] = sev;
  }
  return out;
}

// Mesmo desenho do contentor «Gerar relatório» (ReportsView): cartão azul-marinho,
// cabeçalho com ícone circular e rótulos/dicas claros sobre o fundo escuro.
const NAVY_CARD =
  'overflow-hidden border-[#0F1F3D] bg-[#0F1F3D] text-white [&_label]:text-white [&_[id$=-hint]]:text-white';

function Section({
  title,
  icon: Icon,
  children,
  footer,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card className={NAVY_CARD}>
      <div className="flex items-center gap-3 px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
          <Icon size={16} strokeWidth={1.75} />
        </span>
        <h2 className="font-display text-base font-semibold">{title}</h2>
      </div>
      <div className="px-5 py-5">{children}</div>
      {footer && <div className="bg-black/15 px-5 py-4">{footer}</div>}
    </Card>
  );
}

function RoleChips({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ROLE_OPTIONS.map((r) => {
        const on = value.includes(r);
        return (
          <button
            key={r}
            type="button"
            // ADMIN tem de manter sempre acesso (o backend recusa o contrário).
            disabled={disabled || r === 'ADMIN'}
            onClick={() =>
              onChange(on ? value.filter((x) => x !== r) : [...value, r])
            }
            className={`rounded-full border px-2.5 py-1 text-xs transition-colors disabled:opacity-70 ${
              on
                ? 'border-white bg-white text-[#0F1F3D]'
                : 'border-white/25 bg-white/5 text-white hover:border-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            {r}
          </button>
        );
      })}
    </div>
  );
}

export function PoliciesView() {
  const notify = useToast();
  const role = useCurrentRole();
  const canEdit = role === 'ADMIN';
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState('');

  const { data: policy } = useApiQuery<AuditPolicy>(
    queryKeys.audit.policy(),
    '/audit/policy',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const { data: status } = useApiQuery<AuditServiceStatus>(
    queryKeys.audit.policyStatus(),
    '/audit/policy/status',
    { staleTime: STALE_TIME.REALTIME },
  );
  const { data: preview } = useApiQuery<RetentionPreview>(
    queryKeys.audit.retentionPreview(),
    '/audit/policy/retention-preview',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  useEffect(() => {
    if (policy) setForm(toForm(policy));
  }, [policy]);

  const save = useApiMutation(
    (body: Record<string, unknown>) => apiClient.put('/audit/policy', body),
    {
      invalidateKeys: [queryKeys.audit.all],
      onSuccess: () =>
        notify({
          title: 'Política guardada',
          description: 'A alteração ficou registada na auditoria.',
          intent: 'success',
        }),
      onError: (e) => setError(e.message),
    },
  );

  if (!form || !policy) return <Skeleton rows={8} />;
  const set = (patch: Partial<Form>) =>
    setForm((f) => (f ? { ...f, ...patch } : f));

  const submit = () => {
    const severityRules = parseSeverityRules(form.severityRules);
    if (typeof severityRules === 'string') return setError(severityRules);
    const num = (r: Record<string, string>) =>
      Object.fromEntries(Object.entries(r).map(([k, v]) => [k, Number(v)]));
    setError('');
    save.mutate({
      serviceEnabled: form.serviceEnabled,
      retentionDays: num(form.retentionDays),
      alertRules: num(form.alertRules),
      viewRoles: form.viewRoles,
      exportRoles: form.exportRoles,
      maskSensitive: form.maskSensitive,
      maskedFields: list(form.maskedFields),
      requiredEvents: list(form.requiredEvents),
      coveredModules: list(form.coveredModules),
      severityRules,
      archivePolicy: form.archivePolicy.trim() || undefined,
      backupDestination: form.backupDestination.trim() || undefined,
      backupFrequency:
        form.backupFrequency === 'NONE' ? undefined : form.backupFrequency,
      failureAlertEmails: list(form.failureAlertEmails),
      reason: form.reason.trim() || undefined,
    });
  };

  const events = list(form.requiredEvents).map((e) => e.toUpperCase());
  const eventOptions = [...new Set([...BASE_EVENTS, ...events])];
  const sevMap: Record<string, string> = {};
  for (const line of form.severityRules.split('\n')) {
    const [a, v] = line.split('=').map((x) => x.trim().toUpperCase());
    if (a && v) sevMap[a] = v;
  }
  const sevRows = Object.entries(sevMap);
  const freeActions = [
    ...new Set([...BASE_EVENTS, ...Object.keys(ACTION_LABELS)]),
  ]
    .filter((a) => !(a in sevMap))
    .sort((x, y) => actionLabel(x).localeCompare(actionLabel(y), 'pt'));
  const setSev = (action: string, sev: string | null) => {
    const next = { ...sevMap };
    if (sev === null) delete next[action];
    else next[action] = sev;
    set({
      severityRules: Object.entries(next)
        .map(([k, v]) => `${k}=${v}`)
        .join('\n'),
    });
  };

  return (
    <div className="space-y-5">
      {status && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard
              icon={Activity}
              label="Estado do serviço"
              value={HEALTH[status.health].label}
              intent={status.health === 'OK' ? 'success' : 'warning'}
              sub={
                status.lastEventAt
                  ? `Último evento ${fmtTs(status.lastEventAt)}`
                  : 'Sem eventos'
              }
            />
            <KpiCard
              icon={Clock}
              label="Eventos (24h)"
              value={status.events24h}
              sub={`${status.silentHours24h} h sem eventos`}
            />
            <KpiCard
              icon={ShieldAlert}
              label="Falhadas / negadas (24h)"
              value={`${status.failedOperations24h} / ${status.deniedOperations24h}`}
              intent="danger"
            />
            <KpiCard
              icon={Save}
              label="Cópia de segurança"
              value={status.backup.configured ? 'Configurada' : 'Por definir'}
              intent={status.backup.configured ? 'primary' : 'warning'}
              sub={status.backup.destination ?? undefined}
            />
          </div>
          {status.health === 'WARNING' && (
            <div className="rounded-card border border-warning bg-warning-subtle p-3 font-body text-xs text-warning-ink">
              Sem eventos recentes: confirme que os módulos estão a enviar
              eventos para a auditoria.
            </div>
          )}
        </>
      )}

      {!canEdit && (
        <div className="rounded-card bg-info-subtle p-3 font-body text-xs text-info-ink">
          Só os administradores podem alterar a política de auditoria.
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
          <AlertCircle size={16} strokeWidth={1.75} />
          {error}
        </div>
      )}

      <Section title="Serviço e eventos registados" icon={ServerCog}>
        <div className="space-y-4">
          <label className="flex items-center gap-2 font-body text-sm text-white">
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={form.serviceEnabled}
              onChange={(e) => set({ serviceEnabled: e.target.checked })}
            />
            Serviço de auditoria ativo
          </label>
          <div>
            <div className="mb-1.5 font-body text-xs text-white">
              Eventos de registo obrigatório
            </div>
            <div className="flex flex-wrap gap-1.5">
              {eventOptions.map((ev) => {
                const on = events.includes(ev);
                return (
                  <button
                    key={ev}
                    type="button"
                    disabled={!canEdit}
                    aria-pressed={on}
                    onClick={() =>
                      set({
                        requiredEvents: (on
                          ? events.filter((x) => x !== ev)
                          : [...events, ev]
                        ).join(', '),
                      })
                    }
                    className={`rounded-full border px-2.5 py-1 text-xs transition-colors disabled:opacity-70 ${
                      on
                        ? 'border-white bg-white text-[#0F1F3D]'
                        : 'border-white/25 bg-white/5 text-white hover:border-white/50 hover:bg-white/10'
                    }`}
                  >
                    {actionLabel(ev)}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 font-body text-xs text-white">
              Escolha as ações que têm sempre de ficar registadas.
            </p>
          </div>
          <FormField
            label="Módulos e entidades abrangidos"
            htmlFor="pol-mods"
            hint="Vazio = todos."
          >
            <Input
              id="pol-mods"
              disabled={!canEdit}
              value={form.coveredModules}
              onChange={(e) => set({ coveredModules: e.target.value })}
            />
          </FormField>
          <div>
            <div className="mb-1.5 font-body text-xs text-white">
              Níveis de gravidade por ação
            </div>
            <div className="space-y-2">
              {sevRows.map(([action, sev]) => (
                <div
                  key={action}
                  className="grid grid-cols-[1fr_9rem_auto] items-center gap-2"
                >
                  <span className="font-body text-sm text-white">
                    {actionLabel(action)}
                  </span>
                  <Select
                    items={SEVERITY_ITEMS}
                    value={sev}
                    disabled={!canEdit}
                    onValueChange={(v) => setSev(action, v)}
                  />
                  <button
                    type="button"
                    disabled={!canEdit}
                    aria-label={`Remover regra de ${actionLabel(action)}`}
                    onClick={() => setSev(action, null)}
                    className="rounded-full p-1.5 text-white hover:bg-white/10 disabled:opacity-50"
                  >
                    <X size={14} strokeWidth={1.75} />
                  </button>
                </div>
              ))}
              {sevRows.length === 0 && (
                <p className="font-body text-xs text-white">
                  Sem regras: aplica-se a gravidade predefinida.
                </p>
              )}
            </div>
            {canEdit && freeActions.length > 0 && (
              <div className="mt-3 max-w-xs">
                <Select
                  items={[
                    { value: '', label: 'Adicionar regra para uma ação…' },
                    ...freeActions.map((a) => ({
                      value: a,
                      label: actionLabel(a),
                    })),
                  ]}
                  value=""
                  onValueChange={(v) => v && setSev(v, 'MEDIUM')}
                />
              </div>
            )}
            <p className="mt-1.5 font-body text-xs text-white">
              Define a gravidade com que cada ação é registada.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Regras de alerta e limites de deteção" icon={Bell}>
        <div className="grid gap-3 md:grid-cols-2">
          {Object.keys(ALERT_LABELS).map((k) => (
            <FormField key={k} label={ALERT_LABELS[k]} htmlFor={`pol-${k}`}>
              <Input
                id={`pol-${k}`}
                type="number"
                min={1}
                disabled={!canEdit}
                value={form.alertRules[k] ?? ''}
                onChange={(e) =>
                  set({
                    alertRules: { ...form.alertRules, [k]: e.target.value },
                  })
                }
              />
            </FormField>
          ))}
        </div>
        <p className="mt-2 font-body text-xs text-white">
          Um alerta é um indício para análise por pessoas autorizadas, não prova
          de fraude.
        </p>
      </Section>

      <Section
        title="Prazos de retenção (dias, 90 a 3650)"
        icon={CalendarClock}
      >
        <div className="grid gap-3 md:grid-cols-3">
          {Object.keys(RETENTION_LABELS).map((k) => (
            <FormField key={k} label={RETENTION_LABELS[k]} htmlFor={`ret-${k}`}>
              <Input
                id={`ret-${k}`}
                type="number"
                min={90}
                max={3650}
                disabled={!canEdit}
                value={form.retentionDays[k] ?? ''}
                onChange={(e) =>
                  set({
                    retentionDays: {
                      ...form.retentionDays,
                      [k]: e.target.value,
                    },
                  })
                }
              />
            </FormField>
          ))}
        </div>
        <div className="mt-3">
          <FormField label="Política de arquivo" htmlFor="pol-archive">
            <Textarea
              id="pol-archive"
              rows={3}
              className="w-full"
              disabled={!canEdit}
              value={form.archivePolicy}
              onChange={(e) => set({ archivePolicy: e.target.value })}
            />
          </FormField>
        </div>
        <p className="mt-2 font-body text-xs text-white">
          Os prazos devem respeitar os requisitos legais aplicáveis, as
          necessidades de investigação e a política de proteção de dados da
          organização.
        </p>
        {preview && (
          <div className="mt-4">
            <div className="mb-2 font-body text-xs font-medium text-white">
              Registos fora do prazo (pré-visualização)
            </div>
            <div className="overflow-x-auto rounded-card text-white">
              <Table>
                <TableHead className="bg-[#0F1F3D]/60">
                  <TableRow className="hover:bg-transparent">
                    {['Categoria', 'Retenção', 'Total', 'Fora do prazo'].map(
                      (h) => (
                        <TableHeaderCell key={h} className="text-white">
                          {h}
                        </TableHeaderCell>
                      ),
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.categories.map((c) => (
                    <TableRow key={c.category}>
                      <td className="px-3 py-2 font-body text-xs text-white">
                        {RETENTION_LABELS[c.category] ?? c.category}
                      </td>
                      <td className="px-3 py-2 font-body text-xs text-white">
                        {c.retentionDays} dias
                      </td>
                      <td className="px-3 py-2 font-body text-xs text-white">
                        {c.total}
                      </td>
                      <td className="px-3 py-2 font-body text-xs">
                        {c.pastRetention > 0 ? (
                          <Badge intent="warning">{c.pastRetention}</Badge>
                        ) : (
                          <span className="text-white">0</span>
                        )}
                      </td>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="mt-2 font-body text-xs text-white">{preview.note}</p>
          </div>
        )}
      </Section>

      <Section title="Permissões e ocultação de dados sensíveis" icon={Lock}>
        <div className="space-y-4">
          <div>
            <div className="mb-1.5 font-body text-xs text-white">
              Perfis que podem consultar
            </div>
            <RoleChips
              value={form.viewRoles}
              disabled={!canEdit}
              onChange={(v) => set({ viewRoles: v })}
            />
          </div>
          <div>
            <div className="mb-1.5 font-body text-xs text-white">
              Perfis que podem exportar e descarregar
            </div>
            <RoleChips
              value={form.exportRoles}
              disabled={!canEdit}
              onChange={(v) => set({ exportRoles: v })}
            />
          </div>
          <label className="flex items-center gap-2 font-body text-sm text-white">
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={form.maskSensitive}
              onChange={(e) => set({ maskSensitive: e.target.checked })}
            />
            Ocultar dados pessoais e salariais a quem não é administrador
          </label>
          <FormField
            label="Campos ocultados"
            htmlFor="pol-masked"
            hint="Separados por vírgula."
          >
            <Input
              id="pol-masked"
              disabled={!canEdit}
              value={form.maskedFields}
              onChange={(e) => set({ maskedFields: e.target.value })}
            />
          </FormField>
        </div>
      </Section>

      <Section title="Armazenamento e cópias de segurança" icon={Database}>
        <div className="grid gap-3 md:grid-cols-2">
          <FormField label="Destino das cópias" htmlFor="pol-bk">
            <Input
              id="pol-bk"
              disabled={!canEdit}
              value={form.backupDestination}
              onChange={(e) => set({ backupDestination: e.target.value })}
            />
          </FormField>
          <FormField label="Frequência" htmlFor="pol-freq">
            <Select
              items={FREQ_ITEMS}
              value={form.backupFrequency}
              disabled={!canEdit}
              onValueChange={(v) => set({ backupFrequency: v })}
            />
          </FormField>
          <div className="md:col-span-2">
            <FormField
              label="E-mails a alertar em falhas de recolha"
              htmlFor="pol-mail"
              hint="Separados por vírgula."
            >
              <Input
                id="pol-mail"
                disabled={!canEdit}
                value={form.failureAlertEmails}
                onChange={(e) => set({ failureAlertEmails: e.target.value })}
              />
            </FormField>
          </div>
        </div>
      </Section>

      {canEdit && (
        <Section
          title="Justificação da alteração"
          icon={FileEdit}
          footer={
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                intent="ghost"
                className="text-white hover:bg-white/10 hover:text-white"
                onClick={() => setForm(toForm(policy))}
              >
                Repor valores guardados
              </Button>
              <Button
                className="bg-white text-[#0F1F3D] hover:bg-white/90"
                loading={save.isPending}
                onClick={submit}
              >
                <Save size={14} strokeWidth={1.75} className="mr-1.5" />
                Guardar política
              </Button>
            </div>
          }
        >
          <FormField
            label="Justificação da alteração"
            htmlFor="pol-reason"
            hint="Fica no registo de auditoria da alteração."
          >
            <Input
              id="pol-reason"
              value={form.reason}
              onChange={(e) => set({ reason: e.target.value })}
            />
          </FormField>
        </Section>
      )}
    </div>
  );
}

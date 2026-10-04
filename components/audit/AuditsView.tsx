// components/audit/AuditsView.tsx
// Aba 06 «Auditorias e Inspeções» (docs/modulo_audit.md §9): auditorias
// internas formais — verificações, evidências, constatações, ações corretivas
// e aprovação final do relatório (registada como evento de auditoria).

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { AlertCircle, ClipboardCheck, Download, Plus, X } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { KpiCard } from '@/components/ui/KpiCard';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
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
import { DepartmentUserPicker } from '@/components/departments/DepartmentUserPicker';
import type { DirectoryUser } from '@/components/users/types';
import { SEVERITY_CFG } from './constants';
import { fmtTs } from './utils';
import type {
  InternalAuditDetail,
  InternalAuditList,
  InternalAuditStatus,
  InternalAuditType,
  Severity,
} from './types';

type BadgeIntent = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const STATUS: Record<
  InternalAuditStatus,
  { label: string; intent: BadgeIntent }
> = {
  PLANNED: { label: 'Planeada', intent: 'neutral' },
  PREPARING: { label: 'Em preparação', intent: 'info' },
  IN_PROGRESS: { label: 'Em execução', intent: 'warning' },
  IN_REVIEW: { label: 'Em revisão', intent: 'info' },
  AWAITING_CORRECTIVE_ACTIONS: {
    label: 'A aguardar ações corretivas',
    intent: 'warning',
  },
  COMPLETED: { label: 'Concluída', intent: 'success' },
  CANCELLED: { label: 'Cancelada', intent: 'danger' },
};

const TYPES: Array<{ value: InternalAuditType; label: string }> = [
  { value: 'INTERNAL', label: 'Interna' },
  { value: 'OPERATIONAL', label: 'Operacional' },
  { value: 'COMPLIANCE', label: 'Conformidade' },
  { value: 'SECURITY', label: 'Segurança' },
];
const typeLabel = (t: string) => TYPES.find((x) => x.value === t)?.label ?? t;

const RESULTS = [
  { value: 'CONFORME', label: 'Conforme' },
  { value: 'CONFORME_COM_RESERVAS', label: 'Conforme com reservas' },
  { value: 'NAO_CONFORME', label: 'Não conforme' },
];
const resultLabel = (r: string | null) =>
  RESULTS.find((x) => x.value === r)?.label ?? '—';

const CHECK_STATUS = [
  { value: 'PENDING', label: 'Por verificar' },
  { value: 'PASSED', label: 'Conforme' },
  { value: 'FAILED', label: 'Não conforme' },
  { value: 'NOT_APPLICABLE', label: 'Não aplicável' },
];
const ACTION_STATUS = [
  { value: 'OPEN', label: 'Aberta' },
  { value: 'IN_PROGRESS', label: 'Em curso' },
  { value: 'DONE', label: 'Concluída' },
];
const RISK_ITEMS = (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as Severity[]).map(
  (s) => ({ value: s, label: SEVERITY_CFG[s].label }),
);

const fmtDay = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('pt-AO') : '—';
const toIso = (d: string) =>
  d ? new Date(`${d}T00:00:00`).toISOString() : undefined;

function StatusPill({ status }: { status: InternalAuditStatus }) {
  const c = STATUS[status];
  return <Badge intent={c.intent}>{c.label}</Badge>;
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between border-b border-border pb-1">
        <span className="font-semibold uppercase tracking-wide text-ink-muted">
          {title}
        </span>
        {action}
      </div>
      {children}
    </div>
  );
}

// ── Nova auditoria ──────────────────────────────────────────────────────────

function NewAuditModal({ onClose }: { onClose: () => void }) {
  const notify = useToast();
  const [form, setForm] = useState({
    title: '',
    type: 'INTERNAL' as InternalAuditType,
    objective: '',
    scope: '',
    modules: '',
    criteria: '',
    periodFrom: '',
    periodTo: '',
    startDate: '',
    dueDate: '',
  });
  const [lead, setLead] = useState<DirectoryUser | null>(null);
  const [team, setTeam] = useState<DirectoryUser[]>([]);
  const [member, setMember] = useState<DirectoryUser | null>(null);
  const [error, setError] = useState('');
  const set = (patch: Partial<typeof form>) =>
    setForm((f) => ({ ...f, ...patch }));

  const create = useApiMutation(
    () =>
      apiClient.post('/audit/audits', {
        title: form.title.trim(),
        type: form.type,
        objective: form.objective.trim() || undefined,
        scope: form.scope.trim() || undefined,
        modules: form.modules
          .split(',')
          .map((m) => m.trim())
          .filter(Boolean),
        criteria: form.criteria.trim() || undefined,
        periodFrom: toIso(form.periodFrom),
        periodTo: toIso(form.periodTo),
        startDate: toIso(form.startDate),
        dueDate: toIso(form.dueDate),
        leadAuditorId: lead?.id,
        teamIds: team.map((t) => t.id),
      }),
    {
      invalidateKeys: [queryKeys.audit.all],
      onSuccess: () => {
        notify({ title: 'Auditoria criada', intent: 'success' });
        onClose();
      },
      onError: (e) => setError(e.message),
    },
  );

  const submit = () => {
    if (!form.title.trim()) {
      setError('Indique o título da auditoria');
      return;
    }
    setError('');
    create.mutate(undefined);
  };

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title="Nova auditoria"
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        <div className="mt-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {error}
            </div>
          )}
          <div className="grid grid-cols-[1fr_180px] gap-3">
            <FormField label="Título *" htmlFor="aud-title">
              <Input
                id="aud-title"
                value={form.title}
                onChange={(e) => set({ title: e.target.value })}
              />
            </FormField>
            <FormField label="Tipo *" htmlFor="aud-type">
              <Select
                items={TYPES}
                value={form.type}
                onValueChange={(v) => set({ type: v as InternalAuditType })}
              />
            </FormField>
          </div>
          <FormField label="Objetivo" htmlFor="aud-obj">
            <Textarea
              id="aud-obj"
              rows={2}
              className="w-full"
              value={form.objective}
              onChange={(e) => set({ objective: e.target.value })}
            />
          </FormField>
          <FormField label="Âmbito" htmlFor="aud-scope">
            <Textarea
              id="aud-scope"
              rows={2}
              className="w-full"
              value={form.scope}
              onChange={(e) => set({ scope: e.target.value })}
            />
          </FormField>
          <FormField
            label="Módulos abrangidos"
            htmlFor="aud-mods"
            hint="Separados por vírgula (ex.: Payroll, Assiduidade)"
          >
            <Input
              id="aud-mods"
              value={form.modules}
              onChange={(e) => set({ modules: e.target.value })}
            />
          </FormField>
          <FormField
            label="Critérios e políticas aplicáveis"
            htmlFor="aud-crit"
          >
            <Textarea
              id="aud-crit"
              rows={2}
              className="w-full"
              value={form.criteria}
              onChange={(e) => set({ criteria: e.target.value })}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <FormField label="Período de" htmlFor="aud-pf">
              <Input
                id="aud-pf"
                type="date"
                value={form.periodFrom}
                onChange={(e) => set({ periodFrom: e.target.value })}
              />
            </FormField>
            <FormField label="Período até" htmlFor="aud-pt">
              <Input
                id="aud-pt"
                type="date"
                value={form.periodTo}
                onChange={(e) => set({ periodTo: e.target.value })}
              />
            </FormField>
            <FormField label="Data de início" htmlFor="aud-sd">
              <Input
                id="aud-sd"
                type="date"
                value={form.startDate}
                onChange={(e) => set({ startDate: e.target.value })}
              />
            </FormField>
            <FormField label="Prazo" htmlFor="aud-dd">
              <Input
                id="aud-dd"
                type="date"
                value={form.dueDate}
                onChange={(e) => set({ dueDate: e.target.value })}
              />
            </FormField>
          </div>
          <DepartmentUserPicker
            label="Auditor responsável"
            htmlFor="aud-lead"
            value={lead}
            onChange={setLead}
          />
          <div>
            <DepartmentUserPicker
              label="Equipa de auditoria"
              htmlFor="aud-team"
              value={member}
              onChange={(u) => {
                if (u && !team.some((t) => t.id === u.id)) {
                  setTeam((t) => [...t, u]);
                }
                setMember(null);
              }}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {team.map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1 rounded-pill bg-surface-sunken px-2.5 py-0.5 font-body text-xs text-ink"
                >
                  {t.fullName}
                  <button
                    aria-label={`Remover ${t.fullName}`}
                    onClick={() =>
                      setTeam((l) => l.filter((x) => x.id !== t.id))
                    }
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button intent="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button loading={create.isPending} onClick={submit}>
              Criar auditoria
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}

// ── Detalhe ─────────────────────────────────────────────────────────────────

type FormKind =
  'check' | 'evidence' | 'finding' | 'action' | 'approve' | 'cancel' | null;

function AuditModal({
  auditId,
  onClose,
}: {
  auditId: number;
  onClose: () => void;
}) {
  const notify = useToast();
  const { data: a } = useApiQuery<InternalAuditDetail>(
    queryKeys.audit.auditDetail(auditId),
    `/audit/audits/${auditId}`,
    { staleTime: STALE_TIME.REALTIME },
  );
  const [form, setForm] = useState<FormKind>(null);
  const [f, setF] = useState({
    title: '',
    description: '',
    url: '',
    auditLogId: '',
    nonConformity: 'true',
    risk: 'MEDIUM' as Severity,
    recommendation: '',
    findingId: '',
    dueDate: '',
    result: 'CONFORME',
    closingReport: '',
    reason: '',
  });
  const [responsible, setResponsible] = useState<DirectoryUser | null>(null);
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));

  const done = () => {
    setForm(null);
    setResponsible(null);
    setF((x) => ({
      ...x,
      title: '',
      description: '',
      url: '',
      auditLogId: '',
      recommendation: '',
      findingId: '',
      dueDate: '',
      closingReport: '',
      reason: '',
    }));
  };
  const opts = {
    invalidateKeys: [queryKeys.audit.all],
    onSuccess: () => {
      done();
      notify({ title: 'Guardado', intent: 'success' });
    },
    onError: (e: Error) =>
      notify({
        title: 'Não foi possível concluir',
        description: e.message,
        intent: 'danger',
      }),
  };
  const base = `/audit/audits/${auditId}`;

  const addCheck = useApiMutation(
    () => apiClient.post(`${base}/checks`, { title: f.title.trim() }),
    opts,
  );
  const updateCheck = useApiMutation(
    (v: { id: number; status: string }) =>
      apiClient.patch(`${base}/checks/${v.id}`, { status: v.status }),
    { ...opts, onSuccess: () => undefined },
  );
  const addEvidence = useApiMutation(
    () =>
      apiClient.post(`${base}/evidences`, {
        title: f.title.trim(),
        description: f.description.trim() || undefined,
        url: f.url.trim() || undefined,
        auditLogId: f.auditLogId ? Number(f.auditLogId) : undefined,
      }),
    opts,
  );
  const addFinding = useApiMutation(
    () =>
      apiClient.post(`${base}/findings`, {
        title: f.title.trim(),
        description: f.description.trim() || undefined,
        nonConformity: f.nonConformity === 'true',
        risk: f.risk,
        recommendation: f.recommendation.trim() || undefined,
      }),
    opts,
  );
  const addAction = useApiMutation(
    () =>
      apiClient.post(`${base}/actions`, {
        description: f.description.trim(),
        findingId: f.findingId ? Number(f.findingId) : undefined,
        responsibleId: responsible?.id,
        dueDate: toIso(f.dueDate),
      }),
    opts,
  );
  const updateAction = useApiMutation(
    (v: { id: number; status: string }) =>
      apiClient.patch(`${base}/actions/${v.id}`, { status: v.status }),
    { ...opts, onSuccess: () => undefined },
  );
  const changeStatus = useApiMutation(
    (v: { status: InternalAuditStatus; reason?: string }) =>
      apiClient.post(`${base}/status`, v),
    opts,
  );
  const approve = useApiMutation(
    () =>
      apiClient.post(`${base}/approve`, {
        result: f.result,
        closingReport: f.closingReport.trim(),
      }),
    opts,
  );
  const exportReport = useApiMutation(
    () =>
      apiClient.get<{ filename: string; content: string }>(`${base}/export`),
    {
      invalidateKeys: [queryKeys.audit.all],
      onSuccess: ({ filename, content }) => {
        const url = URL.createObjectURL(
          new Blob([content], { type: 'text/markdown;charset=utf-8' }),
        );
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      },
      onError: opts.onError,
    },
  );

  const status = a?.status;
  const collecting =
    status === 'PLANNED' || status === 'PREPARING' || status === 'IN_PROGRESS';
  const actionable =
    status === 'IN_PROGRESS' ||
    status === 'IN_REVIEW' ||
    status === 'AWAITING_CORRECTIVE_ACTIONS';
  const reviewable =
    status === 'IN_REVIEW' || status === 'AWAITING_CORRECTIVE_ACTIONS';
  const terminal = status === 'COMPLETED' || status === 'CANCELLED';

  const toggle = (k: Exclude<FormKind, null>) =>
    setForm((cur) => (cur === k ? null : k));
  const addBtn = (k: Exclude<FormKind, null>, label: string) => (
    <Button size="sm" intent="secondary" onClick={() => toggle(k)}>
      <Plus size={12} /> {label}
    </Button>
  );
  const submitRow = ({
    onClick,
    pending,
    disabled,
    label = 'Guardar',
  }: {
    onClick: () => void;
    pending: boolean;
    disabled?: boolean;
    label?: string;
  }) => (
    <div className="flex gap-2 pt-1">
      <Button size="sm" loading={pending} disabled={disabled} onClick={onClick}>
        {label}
      </Button>
      <Button size="sm" intent="ghost" onClick={() => setForm(null)}>
        Cancelar
      </Button>
    </div>
  );

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title={a ? `${a.code} — ${a.title}` : 'Auditoria'}
        className="max-h-[92vh] max-w-3xl overflow-y-auto"
      >
        {!a ? (
          <Skeleton rows={6} />
        ) : (
          <div className="mt-4 space-y-5 font-body text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill status={a.status} />
              <span className="text-ink-muted">{typeLabel(a.type)}</span>
              {a.result && (
                <Badge intent={a.result === 'CONFORME' ? 'success' : 'warning'}>
                  {resultLabel(a.result)}
                </Badge>
              )}
            </div>

            <dl className="grid grid-cols-[160px_1fr] gap-y-1 text-ink">
              <dt className="text-ink-faint">Auditor responsável</dt>
              <dd>{a.leadAuditor?.fullName ?? 'Por definir'}</dd>
              <dt className="text-ink-faint">Equipa</dt>
              <dd>{a.team.map((t) => t.fullName).join(', ') || '—'}</dd>
              <dt className="text-ink-faint">Módulos</dt>
              <dd>{a.modules.join(', ') || '—'}</dd>
              <dt className="text-ink-faint">Período analisado</dt>
              <dd>
                {fmtDay(a.periodFrom)} a {fmtDay(a.periodTo)}
              </dd>
              <dt className="text-ink-faint">Início / prazo</dt>
              <dd>
                {fmtDay(a.startDate)} / {fmtDay(a.dueDate)}
              </dd>
              {a.objective && (
                <>
                  <dt className="text-ink-faint">Objetivo</dt>
                  <dd className="whitespace-pre-wrap">{a.objective}</dd>
                </>
              )}
              {a.scope && (
                <>
                  <dt className="text-ink-faint">Âmbito</dt>
                  <dd className="whitespace-pre-wrap">{a.scope}</dd>
                </>
              )}
              {a.criteria && (
                <>
                  <dt className="text-ink-faint">Critérios</dt>
                  <dd className="whitespace-pre-wrap">{a.criteria}</dd>
                </>
              )}
              {a.approvedBy && (
                <>
                  <dt className="text-ink-faint">Relatório aprovado</dt>
                  <dd>
                    {a.approvedBy.fullName}
                    {a.approvedAt ? ` · ${fmtTs(a.approvedAt)}` : ''}
                  </dd>
                </>
              )}
              {a.cancelReason && (
                <>
                  <dt className="text-ink-faint">Motivo do cancelamento</dt>
                  <dd className="whitespace-pre-wrap">{a.cancelReason}</dd>
                </>
              )}
            </dl>

            {/* Fluxo */}
            {!terminal && (
              <div className="flex flex-wrap gap-2 rounded-card border border-border p-3">
                {status === 'PLANNED' && (
                  <Button
                    size="sm"
                    intent="secondary"
                    onClick={() => changeStatus.mutate({ status: 'PREPARING' })}
                  >
                    Iniciar preparação
                  </Button>
                )}
                {(status === 'PLANNED' || status === 'PREPARING') && (
                  <Button
                    size="sm"
                    loading={changeStatus.isPending}
                    onClick={() =>
                      changeStatus.mutate({ status: 'IN_PROGRESS' })
                    }
                  >
                    Iniciar execução
                  </Button>
                )}
                {status === 'IN_PROGRESS' && (
                  <Button
                    size="sm"
                    loading={changeStatus.isPending}
                    onClick={() => changeStatus.mutate({ status: 'IN_REVIEW' })}
                  >
                    Submeter para revisão
                  </Button>
                )}
                {status === 'IN_REVIEW' && (
                  <Button
                    size="sm"
                    intent="secondary"
                    onClick={() =>
                      changeStatus.mutate({ status: 'IN_PROGRESS' })
                    }
                  >
                    Devolver à execução
                  </Button>
                )}
                {reviewable && (
                  <Button size="sm" onClick={() => toggle('approve')}>
                    Aprovar relatório
                  </Button>
                )}
                <Button
                  size="sm"
                  intent="danger"
                  className="ml-auto"
                  onClick={() => toggle('cancel')}
                >
                  Cancelar auditoria
                </Button>
              </div>
            )}
            {form === 'approve' && (
              <div className="space-y-2 rounded-card border border-border p-3">
                <FormField label="Resultado *" htmlFor="aud-result">
                  <Select
                    items={RESULTS}
                    value={f.result}
                    onValueChange={(v) => set({ result: v })}
                  />
                </FormField>
                <FormField
                  label="Relatório de encerramento *"
                  htmlFor="aud-report"
                >
                  <Textarea
                    id="aud-report"
                    rows={5}
                    className="w-full"
                    value={f.closingReport}
                    onChange={(e) => set({ closingReport: e.target.value })}
                  />
                </FormField>
                <p className="text-ink-faint">
                  A aprovação fica registada com o seu nome e data. Não pode
                  aprovar um relatório de que é o auditor responsável.
                </p>
                {submitRow({
                  label: 'Aprovar',
                  pending: approve.isPending,
                  disabled: !f.closingReport.trim(),
                  onClick: () => approve.mutate(undefined),
                })}
              </div>
            )}
            {form === 'cancel' && (
              <div className="space-y-2 rounded-card border border-border p-3">
                <FormField
                  label="Justificação do cancelamento *"
                  htmlFor="aud-cancel"
                >
                  <Textarea
                    id="aud-cancel"
                    rows={2}
                    className="w-full"
                    value={f.reason}
                    onChange={(e) => set({ reason: e.target.value })}
                  />
                </FormField>
                {submitRow({
                  label: 'Confirmar cancelamento',
                  pending: changeStatus.isPending,
                  disabled: !f.reason.trim(),
                  onClick: () =>
                    changeStatus.mutate({
                      status: 'CANCELLED',
                      reason: f.reason,
                    }),
                })}
              </div>
            )}

            {/* Verificações */}
            <Section
              title={`Verificações (${a.checks.length})`}
              action={collecting && addBtn('check', 'Adicionar verificação')}
            >
              {form === 'check' && (
                <div className="space-y-2 py-2">
                  <Input
                    placeholder="Verificação a efetuar"
                    value={f.title}
                    onChange={(e) => set({ title: e.target.value })}
                  />
                  {submitRow({
                    pending: addCheck.isPending,
                    disabled: !f.title.trim(),
                    onClick: () => addCheck.mutate(undefined),
                  })}
                </div>
              )}
              {a.checks.length === 0 && (
                <p className="py-1 text-ink-faint">Sem verificações.</p>
              )}
              {a.checks.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 border-b border-border py-1.5 last:border-0"
                >
                  <span className="min-w-0 flex-1 text-ink">{c.title}</span>
                  {collecting ? (
                    <Select
                      items={CHECK_STATUS}
                      value={c.status}
                      onValueChange={(v) =>
                        updateCheck.mutate({ id: c.id, status: v })
                      }
                      className="w-44"
                    />
                  ) : (
                    <span className="text-ink-muted">
                      {CHECK_STATUS.find((s) => s.value === c.status)?.label}
                    </span>
                  )}
                </div>
              ))}
            </Section>

            {/* Evidências */}
            <Section
              title={`Evidências (${a.evidences.length})`}
              action={collecting && addBtn('evidence', 'Anexar evidência')}
            >
              {form === 'evidence' && (
                <div className="space-y-2 py-2">
                  <Input
                    placeholder="Título da evidência *"
                    value={f.title}
                    onChange={(e) => set({ title: e.target.value })}
                  />
                  <Textarea
                    rows={2}
                    className="w-full"
                    placeholder="Descrição"
                    value={f.description}
                    onChange={(e) => set({ description: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Ligação (URL)"
                      value={f.url}
                      onChange={(e) => set({ url: e.target.value })}
                    />
                    <Input
                      type="number"
                      min={1}
                      placeholder="ID de evento de auditoria"
                      value={f.auditLogId}
                      onChange={(e) => set({ auditLogId: e.target.value })}
                    />
                  </div>
                  {submitRow({
                    pending: addEvidence.isPending,
                    disabled: !f.title.trim(),
                    onClick: () => addEvidence.mutate(undefined),
                  })}
                </div>
              )}
              {a.evidences.length === 0 && (
                <p className="py-1 text-ink-faint">Sem evidências.</p>
              )}
              {a.evidences.map((e) => (
                <div
                  key={e.id}
                  className="border-b border-border py-1.5 last:border-0"
                >
                  <div className="text-ink">
                    {e.title}
                    {e.auditLogId != null && (
                      <span className="text-ink-faint">
                        {' '}
                        · evento #{e.auditLogId}
                      </span>
                    )}
                  </div>
                  {e.description && (
                    <div className="text-ink-muted">{e.description}</div>
                  )}
                  {e.url && (
                    <a
                      href={e.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      {e.url}
                    </a>
                  )}
                  <div className="text-ink-faint">
                    {e.addedBy?.fullName ?? '—'} · {fmtTs(e.createdAt)}
                  </div>
                </div>
              ))}
            </Section>

            {/* Constatações */}
            <Section
              title={`Constatações e riscos (${a.findings.length})`}
              action={collecting && addBtn('finding', 'Registar constatação')}
            >
              {form === 'finding' && (
                <div className="space-y-2 py-2">
                  <Input
                    placeholder="Constatação *"
                    value={f.title}
                    onChange={(e) => set({ title: e.target.value })}
                  />
                  <Textarea
                    rows={2}
                    className="w-full"
                    placeholder="Descrição"
                    value={f.description}
                    onChange={(e) => set({ description: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      items={[
                        { value: 'true', label: 'Não conformidade' },
                        { value: 'false', label: 'Observação' },
                      ]}
                      value={f.nonConformity}
                      onValueChange={(v) => set({ nonConformity: v })}
                    />
                    <Select
                      items={RISK_ITEMS}
                      value={f.risk}
                      onValueChange={(v) => set({ risk: v as Severity })}
                    />
                  </div>
                  <Textarea
                    rows={2}
                    className="w-full"
                    placeholder="Recomendação"
                    value={f.recommendation}
                    onChange={(e) => set({ recommendation: e.target.value })}
                  />
                  {submitRow({
                    pending: addFinding.isPending,
                    disabled: !f.title.trim(),
                    onClick: () => addFinding.mutate(undefined),
                  })}
                </div>
              )}
              {a.findings.length === 0 && (
                <p className="py-1 text-ink-faint">Sem constatações.</p>
              )}
              {a.findings.map((x) => (
                <div
                  key={x.id}
                  className="border-b border-border py-1.5 last:border-0"
                >
                  <div className="flex items-center gap-2 text-ink">
                    <span className="font-medium">{x.title}</span>
                    <Badge
                      intent={x.nonConformity ? 'danger' : 'neutral'}
                      dot={false}
                    >
                      {x.nonConformity ? 'Não conformidade' : 'Observação'}
                    </Badge>
                    <span className={SEVERITY_CFG[x.risk].cls}>
                      Risco {SEVERITY_CFG[x.risk].label.toLowerCase()}
                    </span>
                  </div>
                  {x.description && (
                    <div className="text-ink-muted">{x.description}</div>
                  )}
                  {x.recommendation && (
                    <div className="text-ink-muted">
                      Recomendação: {x.recommendation}
                    </div>
                  )}
                </div>
              ))}
            </Section>

            {/* Ações corretivas */}
            <Section
              title={`Plano de ações corretivas (${a.actions.length})`}
              action={actionable && addBtn('action', 'Criar ação corretiva')}
            >
              {form === 'action' && (
                <div className="space-y-2 py-2">
                  <Textarea
                    rows={2}
                    className="w-full"
                    placeholder="Ação a executar *"
                    value={f.description}
                    onChange={(e) => set({ description: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      items={[
                        { value: 'NONE', label: 'Sem constatação associada' },
                        ...a.findings.map((x) => ({
                          value: String(x.id),
                          label: x.title,
                        })),
                      ]}
                      value={f.findingId || 'NONE'}
                      onValueChange={(v) =>
                        set({ findingId: v === 'NONE' ? '' : v })
                      }
                    />
                    <Input
                      type="date"
                      value={f.dueDate}
                      onChange={(e) => set({ dueDate: e.target.value })}
                    />
                  </div>
                  <DepartmentUserPicker
                    label="Responsável"
                    htmlFor="aud-act-resp"
                    value={responsible}
                    onChange={setResponsible}
                  />
                  {submitRow({
                    pending: addAction.isPending,
                    disabled: !f.description.trim(),
                    onClick: () => addAction.mutate(undefined),
                  })}
                </div>
              )}
              {a.actions.length === 0 && (
                <p className="py-1 text-ink-faint">Sem ações corretivas.</p>
              )}
              {a.actions.map((x) => (
                <div
                  key={x.id}
                  className="flex items-center gap-3 border-b border-border py-1.5 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-ink">{x.description}</div>
                    <div className="text-ink-faint">
                      {x.responsible?.fullName ?? 'Sem responsável'} · prazo{' '}
                      {fmtDay(x.dueDate)}
                    </div>
                  </div>
                  {actionable ? (
                    <Select
                      items={ACTION_STATUS}
                      value={x.status}
                      onValueChange={(v) =>
                        updateAction.mutate({ id: x.id, status: v })
                      }
                      className="w-36"
                    />
                  ) : (
                    <span className="text-ink-muted">
                      {ACTION_STATUS.find((s) => s.value === x.status)?.label}
                    </span>
                  )}
                </div>
              ))}
            </Section>

            {a.closingReport && (
              <Section title="Relatório de encerramento">
                <p className="whitespace-pre-wrap py-1 text-ink">
                  {a.closingReport}
                </p>
              </Section>
            )}

            {(a.status === 'COMPLETED' ||
              a.status === 'AWAITING_CORRECTIVE_ACTIONS') && (
              <Button
                size="sm"
                intent="secondary"
                loading={exportReport.isPending}
                onClick={() => exportReport.mutate(undefined)}
              >
                <Download size={14} /> Exportar relatório final
              </Button>
            )}

            <Section title="Histórico">
              {a.history.map((h) => (
                <div key={h.id} className="py-1 text-ink-muted">
                  {fmtTs(h.timestamp)} · {h.user?.fullName ?? 'Sistema'} ·{' '}
                  {h.action
                    .replace(/^AUDIT_/, '')
                    .toLowerCase()
                    .replace(/_/g, ' ')}
                </div>
              ))}
            </Section>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}

// ── Vista ───────────────────────────────────────────────────────────────────

export function AuditsView() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: '', type: '', search: '' });
  const [openId, setOpenId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const set = (patch: Partial<typeof filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const { data, isLoading } = useApiQuery<InternalAuditList>(
    queryKeys.audit.audits({ ...filters, page }),
    '/audit/audits',
    {
      params: { ...filters, page, limit: 15 },
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );

  const statusItems = [
    { value: 'ALL', label: 'Todos os estados' },
    ...(Object.keys(STATUS) as InternalAuditStatus[]).map((s) => ({
      value: s,
      label: STATUS[s].label,
    })),
  ];
  const typeItems = [{ value: 'ALL', label: 'Todos os tipos' }, ...TYPES];
  const by = data?.counts.byStatus ?? {};

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={ClipboardCheck}
          label="Em execução"
          value={by.IN_PROGRESS ?? 0}
        />
        <KpiCard
          icon={ClipboardCheck}
          label="Em revisão"
          value={by.IN_REVIEW ?? 0}
        />
        <KpiCard
          icon={ClipboardCheck}
          label="A aguardar ações corretivas"
          value={by.AWAITING_CORRECTIVE_ACTIONS ?? 0}
          intent={
            (by.AWAITING_CORRECTIVE_ACTIONS ?? 0) > 0 ? 'warning' : 'primary'
          }
        />
        <KpiCard
          icon={ClipboardCheck}
          label="Concluídas"
          value={by.COMPLETED ?? 0}
        />
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Select
            items={statusItems}
            value={filters.status || 'ALL'}
            onValueChange={(v) => set({ status: v === 'ALL' ? '' : v })}
            className="w-56"
          />
          <Select
            items={typeItems}
            value={filters.type || 'ALL'}
            onValueChange={(v) => set({ type: v === 'ALL' ? '' : v })}
            className="w-44"
          />
          <Input
            type="text"
            placeholder="Código ou título"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            className="w-48"
          />
          <Button
            className="ml-auto"
            size="sm"
            onClick={() => setCreating(true)}
          >
            <Plus size={14} /> Nova auditoria
          </Button>
        </div>

        {isLoading || !data ? (
          <Skeleton rows={6} />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  {[
                    'Código',
                    'Título',
                    'Tipo',
                    'Auditor',
                    'Prazo',
                    'Verif.',
                    'Constat.',
                    'Ações',
                    'Estado',
                  ].map((h) => (
                    <TableHeaderCell key={h}>{h}</TableHeaderCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.data.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => setOpenId(a.id)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-surface-sunken"
                  >
                    <td className="whitespace-nowrap px-3 py-2.5 font-data text-xs text-ink">
                      {a.code}
                    </td>
                    <td className="max-w-[240px] truncate px-3 py-2.5 font-body text-xs font-medium text-ink">
                      {a.title}
                    </td>
                    <td className="px-3 py-2.5 font-body text-xs text-ink-muted">
                      {typeLabel(a.type)}
                    </td>
                    <td className="px-3 py-2.5 font-body text-xs text-ink">
                      {a.leadAuditor?.fullName ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-body text-xs text-ink-muted">
                      {fmtDay(a.dueDate)}
                    </td>
                    <td className="px-3 py-2.5 font-body text-xs text-ink-muted">
                      {a.counts.checks}
                    </td>
                    <td className="px-3 py-2.5 font-body text-xs text-ink-muted">
                      {a.counts.findings}
                    </td>
                    <td className="px-3 py-2.5 font-body text-xs text-ink-muted">
                      {a.counts.actions}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusPill status={a.status} />
                    </td>
                  </tr>
                ))}
                {data.data.length === 0 && (
                  <TableRow>
                    <td
                      colSpan={9}
                      className="px-4 py-10 text-center font-body text-sm text-ink-faint"
                    >
                      Sem auditorias registadas
                    </td>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <Pagination
              page={page}
              totalPages={data.totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {creating && <NewAuditModal onClose={() => setCreating(false)} />}
      {openId != null && (
        <AuditModal auditId={openId} onClose={() => setOpenId(null)} />
      )}
    </div>
  );
}

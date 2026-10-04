// components/audit/SecurityView.tsx
// Aba 05 «Segurança e Incidentes» (docs/modulo_audit.md §8). Fluxo: deteção →
// classificação → atribuição → investigação/evidências → resolução. Um alerta
// automático é um indício, não prova de fraude: só pessoas autorizadas
// classificam e encerram incidentes.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { AlertCircle, Plus, ShieldAlert } from 'lucide-react';
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
import { AnomaliesView } from './AnomaliesView';
import { SEVERITY_CFG, actionLabel } from './constants';
import { fmtTs } from './utils';
import type {
  Incident,
  IncidentDetail,
  IncidentList,
  IncidentStatus,
  Severity,
} from './types';

export const INCIDENT_STATUS: Record<
  IncidentStatus,
  { label: string; intent: 'danger' | 'warning' | 'info' | 'success' }
> = {
  OPEN: { label: 'Aberto', intent: 'danger' },
  IN_ANALYSIS: { label: 'Em análise', intent: 'warning' },
  MITIGATED: { label: 'Mitigado', intent: 'info' },
  CLOSED: { label: 'Encerrado', intent: 'success' },
};

const CATEGORIES = [
  { value: 'SECURITY', label: 'Segurança' },
  { value: 'ACCESS', label: 'Acesso' },
  { value: 'DATA', label: 'Dados' },
  { value: 'INTEGRATION', label: 'Integração' },
  { value: 'OTHER', label: 'Outra' },
];
const TYPES = [
  { value: 'UNAUTHORIZED_ACCESS', label: 'Tentativa de acesso não autorizado' },
  { value: 'PERMISSION_CHANGE', label: 'Alteração suspeita de permissões' },
  { value: 'ABNORMAL_EXPORT', label: 'Exportação anormal de informação' },
  {
    value: 'SENSITIVE_DOCUMENT_ACCESS',
    label: 'Acesso indevido a documentos sensíveis',
  },
  {
    value: 'REPEATED_FAILURES',
    label: 'Falhas repetidas de operações críticas',
  },
  {
    value: 'SALARY_DATA_CHANGE',
    label: 'Alteração inesperada de dados salariais',
  },
  {
    value: 'AUDIT_TAMPERING',
    label: 'Tentativa de alterar/apagar registos de auditoria',
  },
  {
    value: 'INTEGRATION_FAILURE',
    label: 'Falha de integração com impacto na integridade',
  },
  { value: 'OTHER', label: 'Outro' },
];
const SEVERITIES: Severity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const SEVERITY_ITEMS = SEVERITIES.map((s) => ({
  value: s,
  label: SEVERITY_CFG[s].label,
}));
const categoryLabel = (c: string) =>
  CATEGORIES.find((x) => x.value === c)?.label ?? c;
const typeLabel = (t: string | null) =>
  TYPES.find((x) => x.value === t)?.label ?? t ?? '—';

const NEXT_STATUS: Record<IncidentStatus, IncidentStatus[]> = {
  OPEN: ['IN_ANALYSIS'],
  IN_ANALYSIS: ['MITIGATED', 'CLOSED'],
  MITIGATED: ['IN_ANALYSIS', 'CLOSED'],
  CLOSED: ['IN_ANALYSIS'],
};
const STATUS_ACTION: Record<IncidentStatus, string> = {
  OPEN: 'Reabrir',
  IN_ANALYSIS: 'Iniciar análise',
  MITIGATED: 'Marcar como mitigado',
  CLOSED: 'Encerrar',
};

function SeverityText({ value }: { value: Severity }) {
  const c = SEVERITY_CFG[value];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${c.cls}`}>
      <span className={`h-2 w-2 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function StatusPill({ status }: { status: IncidentStatus }) {
  const c = INCIDENT_STATUS[status];
  return <Badge intent={c.intent}>{c.label}</Badge>;
}

// ── Novo incidente ──────────────────────────────────────────────────────────

export interface IncidentPrefill {
  title?: string;
  description?: string;
  category?: string;
  type?: string;
  severity?: Severity;
  source?: 'USER' | 'SYSTEM' | 'RULE';
  sourceLabel?: string;
}

function NewIncidentModal({
  prefill,
  onClose,
}: {
  prefill?: IncidentPrefill;
  onClose: () => void;
}) {
  const notify = useToast();
  const [form, setForm] = useState({
    title: prefill?.title ?? '',
    description: prefill?.description ?? '',
    category: prefill?.category ?? 'SECURITY',
    type: prefill?.type ?? '',
    severity: (prefill?.severity ?? 'MEDIUM') as Severity,
    auditLogId: '',
  });
  const [assignee, setAssignee] = useState<DirectoryUser | null>(null);
  const [error, setError] = useState('');

  const create = useApiMutation(
    () =>
      apiClient.post('/audit/incidents', {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        category: form.category,
        type: form.type || undefined,
        severity: form.severity,
        source: prefill?.source ?? 'USER',
        sourceLabel: prefill?.sourceLabel,
        assigneeId: assignee?.id,
        auditLogId: form.auditLogId ? Number(form.auditLogId) : undefined,
      }),
    {
      invalidateKeys: [queryKeys.audit.all],
      onSuccess: () => {
        notify({ title: 'Incidente registado', intent: 'success' });
        onClose();
      },
      onError: (e) => setError(e.message),
    },
  );

  const submit = () => {
    if (!form.title.trim()) {
      setError('Indique o título do incidente');
      return;
    }
    setError('');
    create.mutate(undefined);
  };

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title="Registar incidente"
        className="max-h-[90vh] max-w-lg overflow-y-auto"
      >
        <div className="mt-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {error}
            </div>
          )}
          <FormField label="Título *" htmlFor="inc-title">
            <Input
              id="inc-title"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Descrição" htmlFor="inc-desc">
            <Textarea
              id="inc-desc"
              rows={3}
              className="w-full"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Categoria *" htmlFor="inc-cat">
              <Select
                items={CATEGORIES}
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
              />
            </FormField>
            <FormField label="Gravidade *" htmlFor="inc-sev">
              <Select
                items={SEVERITY_ITEMS}
                value={form.severity}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, severity: v as Severity }))
                }
              />
            </FormField>
          </div>
          <FormField label="Tipo de incidente" htmlFor="inc-type">
            <Select
              items={TYPES}
              value={form.type || undefined}
              onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}
            />
          </FormField>
          <DepartmentUserPicker
            label="Responsável pela análise"
            htmlFor="inc-assignee"
            value={assignee}
            onChange={setAssignee}
          />
          <FormField
            label="Evento de auditoria relacionado (ID)"
            htmlFor="inc-log"
            hint="Fica logo anexado como evidência."
          >
            <Input
              id="inc-log"
              type="number"
              min={1}
              value={form.auditLogId}
              onChange={(e) =>
                setForm((f) => ({ ...f, auditLogId: e.target.value }))
              }
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button intent="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button loading={create.isPending} onClick={submit}>
              Registar
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}

// ── Detalhe / tratamento ────────────────────────────────────────────────────

function IncidentModal({
  incidentId,
  onClose,
}: {
  incidentId: number;
  onClose: () => void;
}) {
  const notify = useToast();
  const { data: inc } = useApiQuery<IncidentDetail>(
    queryKeys.audit.incident(incidentId),
    `/audit/incidents/${incidentId}`,
    { staleTime: STALE_TIME.REALTIME },
  );
  const [assignee, setAssignee] = useState<DirectoryUser | null>(null);
  const [target, setTarget] = useState<IncidentStatus | null>(null);
  const [resolution, setResolution] = useState('');
  const [evLog, setEvLog] = useState('');
  const [evNote, setEvNote] = useState('');

  const opts = {
    invalidateKeys: [queryKeys.audit.all],
    onError: (e: Error) =>
      notify({
        title: 'Não foi possível concluir',
        description: e.message,
        intent: 'danger',
      }),
  };

  const assign = useApiMutation(
    () =>
      apiClient.post(`/audit/incidents/${incidentId}/assign`, {
        assigneeId: assignee?.id,
      }),
    {
      ...opts,
      onSuccess: () => {
        setAssignee(null);
        notify({ title: 'Responsável atribuído', intent: 'success' });
      },
    },
  );
  const changeStatus = useApiMutation(
    (status: IncidentStatus) =>
      apiClient.post(`/audit/incidents/${incidentId}/status`, {
        status,
        resolution: resolution.trim() || undefined,
      }),
    {
      ...opts,
      onSuccess: () => {
        setTarget(null);
        setResolution('');
        notify({ title: 'Estado actualizado', intent: 'success' });
      },
    },
  );
  const addEvidence = useApiMutation(
    () =>
      apiClient.post(`/audit/incidents/${incidentId}/evidences`, {
        auditLogId: evLog ? Number(evLog) : undefined,
        note: evNote.trim() || undefined,
      }),
    {
      ...opts,
      onSuccess: () => {
        setEvLog('');
        setEvNote('');
        notify({ title: 'Evidência anexada', intent: 'success' });
      },
    },
  );

  const needsResolution = target === 'MITIGATED' || target === 'CLOSED';
  const closed = inc?.status === 'CLOSED';

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title={inc ? `${inc.code} — ${inc.title}` : 'Incidente'}
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        {!inc ? (
          <Skeleton rows={5} />
        ) : (
          <div className="mt-4 space-y-5 font-body text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill status={inc.status} />
              <SeverityText value={inc.severity} />
              <span className="text-ink-muted">
                {categoryLabel(inc.category)} · {typeLabel(inc.type)}
              </span>
            </div>

            <dl className="grid grid-cols-[150px_1fr] gap-y-1 text-ink">
              <dt className="text-ink-faint">Detectado em</dt>
              <dd>{fmtTs(inc.detectedAt)}</dd>
              <dt className="text-ink-faint">Origem</dt>
              <dd>
                {inc.source === 'USER'
                  ? 'Registo manual'
                  : inc.source === 'RULE'
                    ? 'Regra de deteção'
                    : 'Sistema'}
                {inc.sourceLabel ? ` — ${inc.sourceLabel}` : ''}
              </dd>
              <dt className="text-ink-faint">Responsável</dt>
              <dd>{inc.assignee?.fullName ?? 'Por atribuir'}</dd>
              <dt className="text-ink-faint">Registado por</dt>
              <dd>{inc.createdBy?.fullName ?? '—'}</dd>
              {inc.description && (
                <>
                  <dt className="text-ink-faint">Descrição</dt>
                  <dd className="whitespace-pre-wrap">{inc.description}</dd>
                </>
              )}
              {inc.resolution && (
                <>
                  <dt className="text-ink-faint">Resolução</dt>
                  <dd className="whitespace-pre-wrap">{inc.resolution}</dd>
                </>
              )}
            </dl>

            {!closed && (
              <div className="rounded-card border border-border p-3">
                <div className="mb-2 font-semibold uppercase tracking-wide text-ink-muted">
                  Atribuição
                </div>
                <DepartmentUserPicker
                  label="Responsável pela análise"
                  htmlFor="inc-reassign"
                  value={assignee}
                  onChange={setAssignee}
                />
                <Button
                  size="sm"
                  className="mt-2"
                  disabled={!assignee}
                  loading={assign.isPending}
                  onClick={() => assign.mutate(undefined)}
                >
                  Atribuir
                </Button>
              </div>
            )}

            <div className="rounded-card border border-border p-3">
              <div className="mb-2 font-semibold uppercase tracking-wide text-ink-muted">
                Estado
              </div>
              <div className="flex flex-wrap gap-2">
                {NEXT_STATUS[inc.status].map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    intent={target === s ? 'primary' : 'secondary'}
                    onClick={() => setTarget(s)}
                  >
                    {inc.status === 'CLOSED' ? 'Reabrir' : STATUS_ACTION[s]}
                  </Button>
                ))}
              </div>
              {target && (
                <div className="mt-3 space-y-2">
                  {needsResolution && (
                    <FormField
                      label="Resolução / medidas tomadas *"
                      htmlFor="inc-resolution"
                    >
                      <Textarea
                        id="inc-resolution"
                        rows={3}
                        className="w-full"
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                      />
                    </FormField>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      loading={changeStatus.isPending}
                      disabled={needsResolution && !resolution.trim()}
                      onClick={() => changeStatus.mutate(target)}
                    >
                      Confirmar: {INCIDENT_STATUS[target].label}
                    </Button>
                    <Button
                      size="sm"
                      intent="secondary"
                      onClick={() => setTarget(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="mb-1 border-b border-border pb-1 font-semibold uppercase tracking-wide text-ink-muted">
                Evidências ({inc.evidences.length})
              </div>
              {inc.evidences.length === 0 && (
                <p className="text-ink-faint">Sem evidências anexadas.</p>
              )}
              {inc.evidences.map((e) => (
                <div
                  key={e.id}
                  className="border-b border-border py-1.5 last:border-0"
                >
                  {e.auditLog && (
                    <div className="text-ink">
                      Evento #{e.auditLog.id} · {actionLabel(e.auditLog.action)}{' '}
                      · {e.auditLog.entity}
                      {e.auditLog.entityId != null
                        ? ` #${e.auditLog.entityId}`
                        : ''}{' '}
                      · {fmtTs(e.auditLog.timestamp)}
                    </div>
                  )}
                  {e.note && <div className="text-ink">{e.note}</div>}
                  <div className="text-ink-faint">
                    {e.addedBy?.fullName ?? '—'} · {fmtTs(e.createdAt)}
                  </div>
                </div>
              ))}
              {!closed && (
                <div className="mt-2 flex flex-wrap items-end gap-2">
                  <Input
                    type="number"
                    min={1}
                    placeholder="ID do evento"
                    value={evLog}
                    onChange={(e) => setEvLog(e.target.value)}
                    className="w-32"
                  />
                  <Input
                    type="text"
                    placeholder="Nota"
                    value={evNote}
                    onChange={(e) => setEvNote(e.target.value)}
                    className="min-w-[200px] flex-1"
                  />
                  <Button
                    size="sm"
                    disabled={!evLog && !evNote.trim()}
                    loading={addEvidence.isPending}
                    onClick={() => addEvidence.mutate(undefined)}
                  >
                    Anexar
                  </Button>
                </div>
              )}
            </div>

            <div>
              <div className="mb-1 border-b border-border pb-1 font-semibold uppercase tracking-wide text-ink-muted">
                Histórico
              </div>
              {inc.history.map((h) => (
                <div key={h.id} className="py-1 text-ink-muted">
                  {fmtTs(h.timestamp)} · {h.user?.fullName ?? 'Sistema'} ·{' '}
                  {actionLabel(h.action.replace(/^INCIDENT_/, ''))}
                </div>
              ))}
            </div>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}

// ── Vista ───────────────────────────────────────────────────────────────────

export function SecurityView() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    category: '',
    search: '',
  });
  const [openId, setOpenId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const set = (patch: Partial<typeof filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const { data, isLoading } = useApiQuery<IncidentList>(
    queryKeys.audit.incidents({ ...filters, page }),
    '/audit/incidents',
    {
      params: { ...filters, page, limit: 15 },
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );

  const statusItems = [
    { value: 'ALL', label: 'Todos os estados' },
    ...(Object.keys(INCIDENT_STATUS) as IncidentStatus[]).map((s) => ({
      value: s,
      label: INCIDENT_STATUS[s].label,
    })),
  ];
  const sevItems = [
    { value: 'ALL', label: 'Todas as gravidades' },
    ...SEVERITY_ITEMS,
  ];
  const catItems = [
    { value: 'ALL', label: 'Todas as categorias' },
    ...CATEGORIES,
  ];
  const byStatus = data?.counts.byStatus ?? {};
  const openSev = data?.counts.openBySeverity ?? {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={ShieldAlert}
          label="Abertos"
          value={byStatus.OPEN ?? 0}
          intent={(byStatus.OPEN ?? 0) > 0 ? 'warning' : 'primary'}
        />
        <KpiCard
          icon={ShieldAlert}
          label="Em análise"
          value={byStatus.IN_ANALYSIS ?? 0}
        />
        <KpiCard
          icon={ShieldAlert}
          label="Críticos por resolver"
          value={openSev.CRITICAL ?? 0}
          intent={(openSev.CRITICAL ?? 0) > 0 ? 'warning' : 'primary'}
        />
        <KpiCard
          icon={ShieldAlert}
          label="Encerrados"
          value={byStatus.CLOSED ?? 0}
        />
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Select
            items={statusItems}
            value={filters.status || 'ALL'}
            onValueChange={(v) => set({ status: v === 'ALL' ? '' : v })}
            className="w-44"
          />
          <Select
            items={sevItems}
            value={filters.severity || 'ALL'}
            onValueChange={(v) => set({ severity: v === 'ALL' ? '' : v })}
            className="w-48"
          />
          <Select
            items={catItems}
            value={filters.category || 'ALL'}
            onValueChange={(v) => set({ category: v === 'ALL' ? '' : v })}
            className="w-48"
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
            <Plus size={14} /> Registar incidente
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
                    'Categoria',
                    'Gravidade',
                    'Detectado em',
                    'Responsável',
                    'Estado',
                    'Evid.',
                  ].map((h) => (
                    <TableHeaderCell key={h}>{h}</TableHeaderCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.data.map((i: Incident) => (
                  <tr
                    key={i.id}
                    onClick={() => setOpenId(i.id)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-surface-sunken"
                  >
                    <td className="whitespace-nowrap px-3 py-2.5 font-data text-xs text-ink">
                      {i.code}
                    </td>
                    <td className="max-w-[260px] truncate px-3 py-2.5 font-body text-xs font-medium text-ink">
                      {i.title}
                    </td>
                    <td className="px-3 py-2.5 font-body text-xs text-ink-muted">
                      {categoryLabel(i.category)}
                    </td>
                    <td className="px-3 py-2.5">
                      <SeverityText value={i.severity} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-body text-xs text-ink-muted">
                      {fmtTs(i.detectedAt)}
                    </td>
                    <td className="px-3 py-2.5 font-body text-xs text-ink">
                      {i.assignee?.fullName ?? (
                        <span className="italic text-ink-faint">
                          Por atribuir
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusPill status={i.status} />
                    </td>
                    <td className="px-3 py-2.5 font-body text-xs text-ink-muted">
                      {i.evidenceCount ?? 0}
                    </td>
                  </tr>
                ))}
                {data.data.length === 0 && (
                  <TableRow>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center font-body text-sm text-ink-faint"
                    >
                      Sem incidentes registados
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

      <div>
        <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
          Alertas automáticos e integridade
        </div>
        <p className="mb-3 font-body text-xs text-ink-muted">
          Os alertas abaixo são indícios para análise, não prova de fraude. Se
          justificarem investigação, registe um incidente.
        </p>
        <AnomaliesView />
      </div>

      {creating && <NewIncidentModal onClose={() => setCreating(false)} />}
      {openId != null && (
        <IncidentModal incidentId={openId} onClose={() => setOpenId(null)} />
      )}
    </div>
  );
}

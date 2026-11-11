// components/leave/ApprovalsTab.tsx
// Separador "Aprovações" (docs/Modulo_Leave.md §7) — fila e histórico de
// decisões por etapa (gestor → RH), com prazo, estado de espera, justificação
// obrigatória na recusa e histórico de reatribuições. O backend decide o que
// cada perfil vê e pode fazer (canAct / canReassign); aqui só se apresenta.

'use client';

import { useState } from 'react';
import {
  AlarmClock,
  Check,
  ChevronDown,
  ChevronRight,
  Filter,
  Hourglass,
  Layers,
  Repeat2,
  X,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useApiMutation } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { useApprovals, type ApprovalFilters } from '@/hooks/useLeave';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/providers/ToastProvider';
import { ApprovalDecisionModal } from './ApprovalDecisionModal';
import { ApprovalReassignModal } from './ApprovalReassignModal';
import { APPROVAL_STATE_CFG, APPROVAL_STAGE_LABELS } from './constants';
import type { ApprovalListStatus, ApprovalRow, LeaveType } from './types';

const ALL = 'ALL';

const VIEWS: Array<{ value: ApprovalListStatus; label: string }> = [
  { value: 'PENDING', label: 'Por decidir' },
  { value: 'OVERDUE', label: 'Em atraso' },
  { value: 'DECIDED', label: 'Decididas' },
  { value: 'ALL', label: 'Todas' },
];

const DECISION_LABELS: Record<string, string> = {
  APPROVE: 'Aprovado',
  REJECT: 'Recusado',
  ESCALATE: 'Escalado',
  DELEGATE: 'Delegado',
  CANCELLED: 'Cancelado',
};

export interface ApprovalsTabProps {
  leaveTypes: LeaveType[];
}

export function ApprovalsTab({ leaveTypes }: ApprovalsTabProps) {
  const notify = useToast();
  const [filters, setFilters] = useState<ApprovalFilters>({
    status: 'PENDING',
    stage: '',
    leaveTypeCode: '',
    search: '',
    page: 1,
  });
  const [expanded, setExpanded] = useState<number | null>(null);
  const [deciding, setDeciding] = useState<{
    row: ApprovalRow;
    action: 'APPROVE' | 'REJECT';
  } | null>(null);
  const [reassigning, setReassigning] = useState<ApprovalRow | null>(null);

  const debouncedSearch = useDebounce(filters.search, 300);
  const { data, loading } = useApprovals({
    ...filters,
    search: debouncedSearch,
  });
  const set = (patch: Partial<ApprovalFilters>) =>
    setFilters((f) => ({ ...f, page: 1, ...patch }));
  const pick = (v: string) => (v === ALL ? '' : v);

  const actionable = (data?.data ?? []).filter(
    (r) => r.canAct && (r.state === 'PENDING' || r.state === 'OVERDUE'),
  );

  const bulkApprove = useApiMutation(
    (ids: number[]) =>
      apiClient.post<{ success: number; failed: number }>(
        '/leave/bulk-approve',
        { requestIds: ids, action: 'APPROVE' },
      ),
    {
      invalidateKeys: [queryKeys.leave.all],
      onSuccess: (r) =>
        notify({
          title: `${r.success} aprovado(s)${r.failed ? `, ${r.failed} falhou(aram)` : ''}.`,
          intent: r.failed ? 'info' : 'success',
        }),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:max-w-xl">
        <NavyStatCard
          icon={Hourglass}
          tone="blue"
          label="Por decidir"
          value={data?.summary.pending ?? 0}
        />
        <NavyStatCard
          icon={AlarmClock}
          tone={data?.summary.overdue ? 'red' : 'green'}
          label="Em atraso"
          value={data?.summary.overdue ?? 0}
        />
      </div>

      <Card className="overflow-hidden p-4">
        <h3 className="-mx-4 -mt-4 mb-3 bg-brand/60 px-4 py-3 text-sm font-semibold text-white">
          Filtros
        </h3>
        <div className="flex flex-wrap gap-1 mb-3">
          {VIEWS.map((v) => (
            <Button
              key={v.value}
              size="sm"
              intent={filters.status === v.value ? 'primary' : 'ghost'}
              onClick={() => set({ status: v.value })}
            >
              {v.label}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Input
            variant="underline"
            placeholder="Procurar colaborador"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            className="w-full"
          />
          <Select
            variant="underline"
            icon={Filter}
            className="w-full"
            value={filters.leaveTypeCode || ALL}
            onValueChange={(v) => set({ leaveTypeCode: pick(v) })}
            items={[
              { value: ALL, label: 'Todos os tipos' },
              ...leaveTypes.map((t) => ({ value: t.code, label: t.name })),
            ]}
          />
          <Select
            variant="underline"
            icon={Layers}
            className="w-full"
            value={filters.stage || ALL}
            onValueChange={(v) => set({ stage: pick(v) })}
            items={[
              { value: ALL, label: 'Todas as etapas' },
              { value: 'MANAGER', label: APPROVAL_STAGE_LABELS.MANAGER },
              { value: 'HR', label: APPROVAL_STAGE_LABELS.HR },
            ]}
          />
          {actionable.length > 1 && (
            <Button
              intent="success"
              loading={bulkApprove.isPending}
              onClick={() =>
                bulkApprove.mutate(actionable.map((r) => r.requestId))
              }
            >
              {!bulkApprove.isPending && <Check size={14} strokeWidth={1.75} />}
              Aprovar visíveis ({actionable.length})
            </Button>
          )}
        </div>
      </Card>

      {loading && !data ? (
        <Skeleton
          rows={5}
          wrapperClassName="space-y-2"
          itemClassName="h-12 bg-surface-sunken rounded-control"
        />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title="Sem aprovações para os filtros seleccionados"
          description="Quando houver pedidos a aguardar a sua decisão, aparecem aqui."
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-[24px] border border-brand-line bg-surface shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
            {data.data.map((a) => {
              const open = expanded === a.id;
              const hasDetail = a.reassignments.length > 0 || !!a.notes;
              return (
                <ApprovalRowView
                  key={a.id}
                  row={a}
                  open={open}
                  hasDetail={hasDetail}
                  onToggle={() => setExpanded(open ? null : a.id)}
                  onApprove={() => setDeciding({ row: a, action: 'APPROVE' })}
                  onReject={() => setDeciding({ row: a, action: 'REJECT' })}
                  onReassign={() => setReassigning(a)}
                />
              );
            })}
          </div>
          <p className="text-xs text-ink-faint">
            {data.meta.total} etapa(s). O RH só decide depois do gestor; uma
            recusa exige justificação.
          </p>
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
          />
        </>
      )}

      {deciding && (
        <ApprovalDecisionModal
          row={deciding.row}
          action={deciding.action}
          onClose={() => setDeciding(null)}
        />
      )}
      {reassigning && (
        <ApprovalReassignModal
          row={reassigning}
          onClose={() => setReassigning(null)}
        />
      )}
    </div>
  );
}

interface ApprovalRowViewProps {
  row: ApprovalRow;
  open: boolean;
  hasDetail: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onReject: () => void;
  onReassign: () => void;
}

function ApprovalRowView({
  row: a,
  open,
  hasDetail,
  onToggle,
  onApprove,
  onReject,
  onReassign,
}: ApprovalRowViewProps) {
  return (
    <div className="border-b border-brand-line last:border-0">
      <div className="relative flex w-full flex-wrap items-center gap-3 bg-surface px-5 py-3">
        {hasDetail ? (
          <button
            type="button"
            aria-label={open ? 'Ocultar histórico' : 'Ver histórico'}
            onClick={onToggle}
            className="shrink-0 text-brand-muted hover:text-brand"
          >
            {open ? (
              <ChevronDown size={14} strokeWidth={1.75} />
            ) : (
              <ChevronRight size={14} strokeWidth={1.75} />
            )}
          </button>
        ) : (
          <span className="w-3.5 shrink-0" aria-hidden />
        )}
        <Avatar
          name={a.request.user.fullName}
          url={a.request.user.avatarUrl ?? undefined}
          size="sm"
        />
        <div className="min-w-0 flex-1 basis-40">
          <div className="truncate font-body text-sm font-semibold text-brand">
            {a.request.user.fullName}
          </div>
          <div className="truncate font-body text-xs text-brand-muted">
            {a.request.user.department?.name ?? '—'}
          </div>
        </div>

        <RowField label="Pedido" className="w-56 shrink-0">
          <span className="flex items-center gap-1.5 text-brand">
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: a.request.type.color ?? '#3B82F6' }}
            />
            <span className="truncate">{a.request.type.name}</span>
          </span>
          <span className="block truncate text-brand-muted">
            {formatDate(a.request.startDate)} → {formatDate(a.request.endDate)}{' '}
            · {a.request.workDays} dia(s)
          </span>
        </RowField>
        <RowField label="Etapa" className="hidden w-32 shrink-0 md:block">
          {APPROVAL_STAGE_LABELS[a.stage]} (nível {a.level})
        </RowField>
        <RowField label="Aprovador" className="hidden w-36 shrink-0 lg:block">
          <span className="block truncate">{a.approver.fullName}</span>
        </RowField>
        <RowField label="Atribuída" className="hidden w-24 shrink-0 lg:block">
          {formatDate(a.assignedAt)}
        </RowField>
        <RowField label="Prazo" className="hidden w-24 shrink-0 lg:block">
          {a.dueAt ? formatDate(a.dueAt) : '—'}
        </RowField>
        <RowField label="Estado" className="w-32 shrink-0">
          <StatusBadge value={a.state} map={APPROVAL_STATE_CFG} variant="dot" />
          {a.decidedAt && (
            <span className="mt-0.5 block text-brand-muted">
              {a.decision ? (DECISION_LABELS[a.decision] ?? a.decision) : ''} em{' '}
              {formatDate(a.decidedAt)}
            </span>
          )}
        </RowField>

        <div className="flex shrink-0 items-center justify-end gap-1">
          {a.canAct && (
            <>
              <Button size="sm" intent="success" onClick={onApprove}>
                <Check size={12} strokeWidth={1.75} /> Aprovar
              </Button>
              <Button size="sm" intent="danger" onClick={onReject}>
                <X size={12} strokeWidth={1.75} /> Recusar
              </Button>
            </>
          )}
          {a.canReassign && (
            <Button size="sm" intent="ghost" onClick={onReassign}>
              <Repeat2 size={12} strokeWidth={1.75} /> Reatribuir
            </Button>
          )}
        </div>
      </div>
      {open && hasDetail && (
        <div className="space-y-2 bg-surface-sunken px-5 py-3 pl-14 font-body text-xs text-brand-muted">
          {a.notes && (
            <p>
              <span className="font-semibold text-brand">Comentário: </span>
              {a.notes}
            </p>
          )}
          {a.reassignments.length > 0 && (
            <div>
              <p className="mb-1 font-semibold text-brand">
                Histórico de reatribuições
              </p>
              <ul className="space-y-1">
                {a.reassignments.map((h) => (
                  <li key={h.id}>
                    {formatDate(h.createdAt)} —{' '}
                    {h.kind === 'DELEGATE' ? 'delegado' : 'reatribuído'} de{' '}
                    {h.from.fullName ?? `#${h.from.id}`} para{' '}
                    {h.to.fullName ?? `#${h.to.id}`} por{' '}
                    {h.by.fullName ?? `#${h.by.id}`}
                    {h.reason ? ` — ${h.reason}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface RowFieldProps {
  label: string;
  className?: string;
  children: React.ReactNode;
}

/** Coluna de uma linha: rótulo pequeno por cima do valor (substitui o cabeçalho da tabela). */
function RowField({ label, className, children }: RowFieldProps) {
  return (
    <div className={cn('min-w-0 font-body text-xs text-brand', className)}>
      <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

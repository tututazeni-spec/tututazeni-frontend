// components/processes/InstanceTabs.tsx
// Separadores Tarefas, Aprovações, Documentos e Histórico da página de detalhe
// de um processo (docs/Modulo_Processes.md §21). Listas compactas, já filtradas
// pela instância e pelo âmbito do utilizador no backend.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate, formatDateTime } from '@/lib/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { QueryError } from '@/components/ui/QueryError';
import { FileText, History, ListChecks, ShieldCheck } from 'lucide-react';
import { Skeleton } from './Skeleton';
import { APPROVAL_STATUS_MAP, DOC_STATUS_MAP, TASK_STATE_MAP } from './constants';
import type { PaginatedApprovals } from './approval-types';
import type { PaginatedProcessDocuments, PaginatedTasks } from './types';

interface HistoryRow {
  id: number;
  action: string;
  createdAt: string;
  user: { id: number; fullName: string } | null;
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 last:border-0">
      {children}
    </li>
  );
}

function List({ children }: { children: React.ReactNode }) {
  return (
    <ul className="overflow-hidden rounded-card border border-border bg-surface">
      {children}
    </ul>
  );
}

export function InstanceTasksTab({ instanceId }: { instanceId: number }) {
  const params = { instanceId, limit: 100 };
  const { data, isLoading, error, refetch } = useApiQuery<PaginatedTasks>(
    queryKeys.processes.tasks(params),
    '/processes/tasks',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );
  if (isLoading) return <Skeleton rows={3} />;
  if (error) return <QueryError error={error} onRetry={refetch} />;
  if (!data?.data.length)
    return (
      <EmptyState
        icon={ListChecks}
        title="Sem tarefas visíveis"
        description="Não há tarefas deste processo atribuídas ao seu âmbito."
      />
    );
  return (
    <List>
      {data.data.map((t) => (
        <Row key={t.stepId}>
          <div className="min-w-0">
            <div className="truncate font-body text-sm font-medium text-ink">
              {t.stage}. {t.name}
            </div>
            <div className="font-body text-xs text-ink-faint">
              {t.assignee?.fullName ?? 'Sem responsável'}
              {t.dueAt && ` · prazo ${formatDate(t.dueAt)}`}
              {t.isOverdue && ' · em atraso'}
            </div>
          </div>
          <StatusBadge value={t.status} map={TASK_STATE_MAP} />
        </Row>
      ))}
    </List>
  );
}

export function InstanceApprovalsTab({
  instanceId,
  canViewAll,
}: {
  instanceId: number;
  canViewAll: boolean;
}) {
  const params = { instanceId, scope: canViewAll ? 'all' : 'mine', limit: 100 };
  const { data, isLoading, error, refetch } = useApiQuery<PaginatedApprovals>(
    queryKeys.processes.approvals(params),
    '/processes/approvals',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );
  if (isLoading) return <Skeleton rows={3} />;
  if (error) return <QueryError error={error} onRetry={refetch} />;
  if (!data?.data.length)
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Sem aprovações"
        description="Este processo não tem pedidos de aprovação visíveis para si."
      />
    );
  return (
    <List>
      {data.data.map((a) => (
        <Row key={a.id}>
          <div className="min-w-0">
            <div className="truncate font-body text-sm font-medium text-ink">
              {a.step.title}
            </div>
            <div className="font-body text-xs text-ink-faint">
              {a.code} · Aprovador: {a.approver?.fullName ?? a.approverRole ?? '—'}
              {a.dueAt && ` · prazo ${formatDate(a.dueAt)}`}
              {a.decidedAt && ` · decidido em ${formatDate(a.decidedAt)}`}
            </div>
            {a.justification && (
              <div className="mt-1 font-body text-xs text-ink-muted">
                {a.justification}
              </div>
            )}
          </div>
          <StatusBadge value={a.status} map={APPROVAL_STATUS_MAP} />
        </Row>
      ))}
    </List>
  );
}

export function InstanceDocumentsTab({ instanceId }: { instanceId: number }) {
  const params = { instanceId, limit: 100 };
  const { data, isLoading, error, refetch } =
    useApiQuery<PaginatedProcessDocuments>(
      queryKeys.processes.documents(params),
      '/processes/documents',
      { params, staleTime: STALE_TIME.DYNAMIC },
    );
  if (isLoading) return <Skeleton rows={3} />;
  if (error) return <QueryError error={error} onRetry={refetch} />;
  if (!data?.data.length)
    return (
      <EmptyState
        icon={FileText}
        title="Sem documentos"
        description="Ainda não há documentos ou evidências visíveis neste processo."
      />
    );
  return (
    <List>
      {data.data.map((d) => (
        <Row key={d.id}>
          <div className="min-w-0">
            <div className="truncate font-body text-sm font-medium text-ink">
              {d.name}
            </div>
            <div className="font-body text-xs text-ink-faint">
              {d.docType} · v{d.version}
              {d.validUntil && ` · válido até ${formatDate(d.validUntil)}`}
            </div>
          </div>
          <StatusBadge value={d.effectiveStatus} map={DOC_STATUS_MAP} />
        </Row>
      ))}
    </List>
  );
}

export function InstanceHistoryTab({ instanceId }: { instanceId: number }) {
  const { data, isLoading, error, refetch } = useApiQuery<{
    data: HistoryRow[];
  }>(
    queryKeys.processes.instanceHistory(instanceId),
    `/processes/instances/${instanceId}/history`,
    { staleTime: STALE_TIME.DYNAMIC },
  );
  if (isLoading) return <Skeleton rows={4} />;
  if (error) return <QueryError error={error} onRetry={refetch} />;
  if (!data?.data.length)
    return (
      <EmptyState
        icon={History}
        title="Sem histórico"
        description="Ainda não há eventos registados neste processo."
      />
    );
  return (
    <List>
      {data.data.map((e) => (
        <Row key={e.id}>
          <div className="font-body text-sm text-ink">
            {e.action.replace(/_/g, ' ').toLowerCase()}
          </div>
          <div className="font-body text-xs text-ink-faint">
            {e.user?.fullName ?? 'Sistema'} · {formatDateTime(e.createdAt)}
          </div>
        </Row>
      ))}
    </List>
  );
}

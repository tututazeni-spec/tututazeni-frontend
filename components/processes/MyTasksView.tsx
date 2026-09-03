// components/processes/MyTasksView.tsx
// Separador "Minhas tarefas" — lista de etapas pendentes atribuídas ao
// utilizador. Dados próprios (useApiQuery) + apresentação. Extraído de
// app/(platform)/processes/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { isOverdue, STEP_TYPE_MAP } from './constants';
import { Skeleton } from './Skeleton';
import type { MyTask } from './types';

export interface MyTasksViewProps {
  onOpenInstance: (id: number) => void;
}

export function MyTasksView({ onOpenInstance }: MyTasksViewProps) {
  const {
    data: tasks = [],
    isLoading,
    error,
  } = useApiQuery<MyTask[]>(
    queryKeys.processes.myTasks(),
    '/processes/my-tasks',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading) return <Skeleton rows={4} />;
  if (error)
    return <div className="font-body text-sm text-danger">{error.message}</div>;

  if (tasks.length === 0)
    return (
      <EmptyState
        title="Sem tarefas pendentes"
        description="Não há etapas atribuídas a si de momento."
      />
    );

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface">
      <div className="grid grid-cols-[1fr_160px_100px_120px] gap-3 border-b border-border px-4 py-2.5 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
        <div>Tarefa / Processo</div>
        <div>Colaborador</div>
        <div>Tipo</div>
        <div>SLA</div>
      </div>
      {tasks.map((t) => (
        <div
          key={t.id}
          className="grid cursor-pointer grid-cols-[1fr_160px_100px_120px] items-center gap-3 border-b border-border px-4 py-3.5 last:border-0 hover:bg-surface-sunken"
          onClick={() => onOpenInstance(t.instance.id)}
        >
          <div>
            <div className="font-body text-sm font-medium text-ink">
              {t.step.title}
            </div>
            <div className="mt-0.5 font-body text-xs text-ink-faint">
              {t.instance.process.code} — {t.instance.process.title}
            </div>
          </div>
          <div className="font-body text-sm text-ink-muted">
            {t.instance.targetUser.fullName}
          </div>
          <div>
            <StatusBadge value={t.step.type} map={STEP_TYPE_MAP} />
          </div>
          <div>
            {t.slaDeadline ? (
              <span
                className={`font-body text-xs font-medium ${isOverdue(t.slaDeadline) ? 'text-danger' : 'text-warning-ink'}`}
              >
                {isOverdue(t.slaDeadline) ? 'Expirado' : fmtDate(t.slaDeadline)}
              </span>
            ) : (
              <span className="font-body text-xs text-ink-faint">—</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

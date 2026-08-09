// components/processes/MyTasksView.tsx
// Separador "Minhas tarefas" — lista de etapas pendentes atribuídas ao
// utilizador. Dados próprios (useApiQuery) + apresentação. Extraído de
// app/(platform)/processes/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
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
  if (error) return <div className="text-sm text-red-500">{error.message}</div>;

  if (tasks.length === 0)
    return (
      <div className="py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
        Sem tarefas pendentes 🎉
      </div>
    );

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="grid grid-cols-[1fr_160px_100px_120px] gap-3 px-4 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
        <div>Tarefa / Processo</div>
        <div>Colaborador</div>
        <div>Tipo</div>
        <div>SLA</div>
      </div>
      {tasks.map((t) => (
        <div
          key={t.id}
          className="grid grid-cols-[1fr_160px_100px_120px] gap-3 items-center px-4 py-3.5 border-b border-gray-100 hover:bg-gray-50 cursor-pointer last:border-0"
          onClick={() => onOpenInstance(t.instance.id)}
        >
          <div>
            <div className="text-sm font-medium text-gray-900">
              {t.step.title}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {t.instance.process.code} — {t.instance.process.title}
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {t.instance.targetUser.fullName}
          </div>
          <div>
            <StatusBadge value={t.step.type} map={STEP_TYPE_MAP} />
          </div>
          <div>
            {t.slaDeadline ? (
              <span
                className={`text-xs font-medium ${isOverdue(t.slaDeadline) ? 'text-red-600' : 'text-amber-700'}`}
              >
                {isOverdue(t.slaDeadline)
                  ? '⚠ Expirado'
                  : fmtDate(t.slaDeadline)}
              </span>
            ) : (
              <span className="text-xs text-gray-400">—</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

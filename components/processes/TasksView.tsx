// components/processes/TasksView.tsx
// Aba «Tarefas e Etapas» (docs/Modulo_Processes.md §6): lista de tarefas com
// filtros (minhas/todas, estado, em atraso, pesquisa) e abertura do detalhe
// de execução (TaskPanel).

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate } from '@/lib/format';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PRIORITY_MAP, STEP_TYPE_MAP, TASK_STATE_MAP } from './constants';
import { Skeleton } from './Skeleton';
import { TaskPanel } from './TaskPanel';
import type { PaginatedTasks, TaskState } from './types';

export interface TasksViewProps {
  canManage: boolean;
}

const ALL = 'ALL';
const STATE_ITEMS = [
  { value: ALL, label: 'Todos os estados' },
  ...(Object.keys(TASK_STATE_MAP) as TaskState[]).map((s) => ({
    value: s,
    label: TASK_STATE_MAP[s].label,
  })),
];

export function TasksView({ canManage }: TasksViewProps) {
  const [scope, setScope] = useState<'mine' | 'all'>(canManage ? 'all' : 'mine');
  const [status, setStatus] = useState('');
  const [overdue, setOverdue] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<{ instanceId: number; stepId: number } | null>(null);

  const debounced = useDebounce(search, 300);
  const params = {
    scope,
    page,
    limit: 15,
    ...(status ? { status } : {}),
    ...(overdue ? { overdue: true } : {}),
    ...(debounced ? { search: debounced } : {}),
  };
  const { data, isLoading, error } = useApiQuery<PaginatedTasks>(
    queryKeys.processes.tasks(params),
    '/processes/tasks',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );

  const reset = () => setPage(1);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          type="text"
          placeholder="Pesquisar por tarefa, processo ou código…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            reset();
          }}
          className="min-w-[160px] flex-1"
        />
        {canManage && (
          <Select
            items={[
              { value: 'all', label: 'Todas as tarefas' },
              { value: 'mine', label: 'Minhas tarefas' },
            ]}
            value={scope}
            onValueChange={(v) => {
              setScope(v as 'mine' | 'all');
              reset();
            }}
            className="w-48"
          />
        )}
        <Select
          items={STATE_ITEMS}
          value={status || ALL}
          onValueChange={(v) => {
            setStatus(v === ALL ? '' : v);
            reset();
          }}
          className="w-44"
        />
        <label className="flex items-center gap-2 font-body text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={overdue}
            onChange={(e) => {
              setOverdue(e.target.checked);
              reset();
            }}
          />
          Em atraso
        </label>
        <span className="font-body text-sm text-ink-faint">{data?.total ?? 0} tarefas</span>
      </div>

      <div className="overflow-x-auto rounded-card border border-border bg-surface">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[1.9fr_1.4fr_1.2fr_110px_100px_120px] gap-3 border-b border-border px-4 py-2.5 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            <div>Tarefa</div>
            <div>Processo</div>
            <div>Responsável / Revisor</div>
            <div>Prazo</div>
            <div>Tipo</div>
            <div>Estado</div>
          </div>

          {isLoading && (
            <div className="p-4">
              <Skeleton rows={4} />
            </div>
          )}
          {error && (
            <div className="px-4 py-8 text-center font-body text-sm text-danger">
              {error.message}
            </div>
          )}
          {!isLoading && data?.data.length === 0 && (
            <EmptyState
              title="Sem tarefas"
              description={
                scope === 'mine'
                  ? 'Não há tarefas atribuídas a si com estes filtros.'
                  : 'Nenhuma tarefa corresponde aos filtros.'
              }
            />
          )}

          {data?.data.map((t) => (
            <div
              key={`${t.instanceId}-${t.stepId}`}
              className="grid cursor-pointer grid-cols-[1.9fr_1.4fr_1.2fr_110px_100px_120px] items-center gap-3 border-b border-border px-4 py-3.5 last:border-0 hover:bg-surface-sunken"
              onClick={() => setOpen({ instanceId: t.instanceId, stepId: t.stepId })}
            >
              <div className="min-w-0">
                <div className="truncate font-body text-sm font-medium text-ink">{t.name}</div>
                <div className="font-mono text-xs text-ink-faint">{t.code}</div>
                {t.dependencies.some((d) => !d.done) && (
                  <div className="font-body text-xs text-warning-ink">
                    Aguarda: {t.dependencies.filter((d) => !d.done).map((d) => d.title).join(', ')}
                  </div>
                )}
              </div>
              <div className="min-w-0 font-body text-xs text-ink-muted">
                <div className="truncate">{t.process.instanceTitle}</div>
                <div className="flex items-center gap-1.5 text-ink-faint">
                  Etapa {t.stage}
                  <StatusBadge value={t.process.priority} map={PRIORITY_MAP} />
                </div>
              </div>
              <div className="font-body text-xs text-ink-muted">
                <div>{t.assignee?.fullName ?? 'Por atribuir'}</div>
                <div className="text-ink-faint">{t.reviewer ? `Rev.: ${t.reviewer.fullName}` : ''}</div>
              </div>
              <div className={`font-body text-xs ${t.isOverdue ? 'font-medium text-danger' : 'text-ink-muted'}`}>
                {formatDate(t.dueAt)}
                {t.isOverdue && <div>Em atraso</div>}
              </div>
              <div>
                <StatusBadge value={t.type} map={STEP_TYPE_MAP} />
              </div>
              <div>
                <StatusBadge value={t.status} map={TASK_STATE_MAP} variant="dot" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {data && <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />}

      {open && (
        <TaskPanel
          instanceId={open.instanceId}
          stepId={open.stepId}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}

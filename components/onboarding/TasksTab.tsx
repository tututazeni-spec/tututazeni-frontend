// components/onboarding/TasksTab.tsx
// Separador "Tarefas" (docs/onboarding.md ponto 5) — todas as tarefas de
// todos os onboardings, com filtros. "Prioridade" vem já derivada do
// backend (GET /onboarding/tasks). Clicar numa linha abre o
// PlanDetailModal do plano dono da tarefa — é lá que vivem aprovar/
// rejeitar/saltar (evita duplicar essa lógica aqui).

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { CATEGORY_CFG, PHASE_LABELS, TASK_STATUS_CFG } from './constants';
import { PlanDetailModal } from './PlanDetailModal';
import type { OnboardingTaskListItem, TaskPriority } from './types';

interface Paginated {
  data: OnboardingTaskListItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const STATUS_ITEMS = [
  { value: 'ALL', label: 'Todos os estados' },
  ...Object.entries(TASK_STATUS_CFG).map(([value]) => ({ value, label: value })),
];

const CATEGORY_ITEMS = [
  { value: 'ALL', label: 'Todas as categorias' },
  ...Object.entries(CATEGORY_CFG).map(([value, cfg]) => ({ value, label: cfg.label })),
];

const PRIORITY_BADGE: Record<TaskPriority, 'danger' | 'warning' | 'neutral'> = {
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'neutral',
};
const PRIORITY_LABEL: Record<TaskPriority, string> = {
  HIGH: 'Alta',
  MEDIUM: 'Média',
  LOW: 'Baixa',
};

export interface TasksTabProps {
  /** ADMIN/RH: passa para o detalhe a acção "Remover plano". */
  canManagePlan?: boolean;
  /** ADMIN/RH/GESTOR: passa para o detalhe aprovar / rejeitar / saltar tarefas. */
  canManageTasks?: boolean;
}

export function TasksTab({ canManagePlan = false, canManageTasks = false }: TasksTabProps) {
  const [filters, setFilters] = useState({
    status: 'ALL',
    category: 'ALL',
    overdue: false,
    page: 1,
  });
  const [detailId, setDetailId] = useState<number | null>(null);

  function updateFilters(patch: Partial<Omit<typeof filters, 'page'>>) {
    setFilters((f) => ({ ...f, ...patch, page: 1 }));
  }

  const params = {
    page: filters.page,
    limit: 20,
    status: filters.overdue || filters.status === 'ALL' ? undefined : filters.status,
    category: filters.category === 'ALL' ? undefined : filters.category,
    overdue: filters.overdue || undefined,
  };

  const { data, isLoading } = useApiQuery<Paginated>(
    queryKeys.onboarding.tasks(params),
    '/onboarding/tasks',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Select items={STATUS_ITEMS} value={filters.status} onValueChange={(v) => updateFilters({ status: v })} />
        <Select items={CATEGORY_ITEMS} value={filters.category} onValueChange={(v) => updateFilters({ category: v })} />
        <button
          type="button"
          onClick={() => updateFilters({ overdue: !filters.overdue })}
          className={`rounded-control border px-3 py-2 font-body text-sm ${
            filters.overdue ? 'border-danger bg-danger-subtle text-danger-ink' : 'border-border text-ink-muted'
          }`}
        >
          Só em atraso
        </button>
        <span className="ml-auto font-body text-sm text-ink-faint">{data?.meta.total ?? 0} tarefas</span>
      </div>

      {isLoading ? (
        <Skeleton rows={5} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState title="Sem tarefas" description="Nenhuma tarefa corresponde aos filtros." />
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          {data.data.map((t) => {
            const catCfg = CATEGORY_CFG[t.templateTask.category];
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setDetailId(t.plan.id)}
                className="flex w-full items-center gap-4 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-surface-sunken"
              >
                <Avatar name={t.plan.user.fullName} url={t.plan.user.avatarUrl ?? undefined} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-body text-sm font-medium text-ink">{t.templateTask.title}</div>
                  <div className="truncate font-body text-xs text-ink-faint">
                    {t.plan.user.fullName} · {PHASE_LABELS[t.templateTask.phase]}
                    {catCfg ? ` · ${catCfg.label}` : ''}
                  </div>
                </div>
                <Badge dot={false} intent={PRIORITY_BADGE[t.priority]}>
                  {PRIORITY_LABEL[t.priority]}
                </Badge>
                <div className="hidden shrink-0 font-body text-xs text-ink-faint sm:block">
                  {t.dueDate ? fmtDate(t.dueDate) : '—'}
                </div>
                <div className="shrink-0 font-body text-xs text-ink-faint">{t.status}</div>
              </button>
            );
          })}
        </div>
      )}

      {data && data.meta.totalPages > 1 && (
        <Pagination
          page={data.meta.page}
          totalPages={data.meta.totalPages}
          onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
        />
      )}

      {detailId !== null && (
        <PlanDetailModal
          planId={detailId}
          canManagePlan={canManagePlan}
          canManageTasks={canManageTasks}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  );
}

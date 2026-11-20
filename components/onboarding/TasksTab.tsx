// components/onboarding/TasksTab.tsx
// Separador "Tarefas" (docs/onboarding.md ponto 5) — todas as tarefas de
// todos os onboardings, com filtros. "Prioridade" vem já derivada do
// backend (GET /onboarding/tasks). Clicar numa linha abre o
// PlanDetailModal do plano dono da tarefa — é lá que vivem aprovar/
// rejeitar/saltar (evita duplicar essa lógica aqui). ADMIN/RH (`canManagePlan`)
// veem ainda "+ Nova tarefa" (POST /onboarding/:id/tasks) e "Atribuir" por
// linha (PATCH /onboarding/tasks/:id/assignee).

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { CATEGORY_CFG, PHASE_LABELS, TASK_STATUS_CFG } from './constants';
import { PlanDetailModal } from './PlanDetailModal';
import { AssignTaskModal } from './AssignTaskModal';
import { PlanTaskFormModal } from './PlanTaskFormModal';
import type { OnboardingTaskListItem, TaskPriority } from './types';
import {
  ChevronRight,
  ClipboardCheck,
  Clock,
  LayoutGrid,
  MapPin,
} from 'lucide-react';

interface Paginated {
  data: OnboardingTaskListItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em curso',
  COMPLETED: 'Concluída',
  BLOCKED: 'Bloqueada',
  SKIPPED: 'Saltada',
};

const STATUS_ITEMS = [
  { value: 'ALL', label: 'Todos os estados' },
  ...Object.keys(TASK_STATUS_CFG).map((value) => ({
    value,
    label: STATUS_LABEL[value] ?? value,
  })),
];

const CATEGORY_ITEMS = [
  { value: 'ALL', label: 'Todas as categorias' },
  ...Object.entries(CATEGORY_CFG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
  })),
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

export function TasksTab({
  canManagePlan = false,
  canManageTasks = false,
}: TasksTabProps) {
  const [filters, setFilters] = useState({
    status: 'ALL',
    category: 'ALL',
    overdue: false,
    page: 1,
  });
  const [detailId, setDetailId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [assigning, setAssigning] = useState<OnboardingTaskListItem | null>(
    null,
  );

  function updateFilters(patch: Partial<Omit<typeof filters, 'page'>>) {
    setFilters((f) => ({ ...f, ...patch, page: 1 }));
  }

  const params = {
    page: filters.page,
    limit: 20,
    status:
      filters.overdue || filters.status === 'ALL' ? undefined : filters.status,
    category: filters.category === 'ALL' ? undefined : filters.category,
    overdue: filters.overdue || undefined,
  };

  const { data, isLoading } = useApiQuery<Paginated>(
    queryKeys.onboarding.tasks(params),
    '/onboarding/tasks',
    {
      params,
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Select
          variant="underline"
          icon={MapPin}
          items={STATUS_ITEMS}
          value={filters.status}
          onValueChange={(v) => updateFilters({ status: v })}
        />
        <Select
          variant="underline"
          icon={LayoutGrid}
          items={CATEGORY_ITEMS}
          value={filters.category}
          onValueChange={(v) => updateFilters({ category: v })}
        />
        <button
          type="button"
          onClick={() => updateFilters({ overdue: !filters.overdue })}
          aria-pressed={filters.overdue}
          className={`rounded-control border px-3 py-2 font-body text-sm transition-colors hover:border-[#0F1F3D] hover:bg-[#0F1F3D] hover:text-white ${
            filters.overdue
              ? 'border-[#0F1F3D] bg-[#0F1F3D] text-white'
              : 'border-border text-ink-muted'
          }`}
        >
          Só em atraso
        </button>
        {canManagePlan && (
          <Button size="sm" className="ml-auto" onClick={() => setCreating(true)}>
            + Nova tarefa
          </Button>
        )}
      </div>

      {isLoading ? (
        <Skeleton rows={5} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title="Sem tarefas"
          description="Nenhuma tarefa corresponde aos filtros."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {data.data.map((t) => {
            const catCfg = CATEGORY_CFG[t.templateTask.category];
            return (
              <div
                key={t.id}
                className="relative flex items-stretch overflow-hidden rounded-card border border-border bg-gradient-to-r from-[#E8EFFC] via-[#F4F7FD] to-[#F8FAFE]"
              >
                <button
                  type="button"
                  onClick={() => setDetailId(t.plan.id)}
                  className="group flex min-w-0 flex-1 items-center gap-4 bg-transparent px-4 py-2.5 text-left"
                  title={t.templateTask.description || undefined}
                >
                  <div
                    aria-hidden="true"
                    className="relative hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/70 text-[#1E4FB5] shadow-sm sm:flex"
                  >
                    <ClipboardCheck size={26} strokeWidth={1.5} />
                    <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#1E4FB5] text-white">
                      <Clock size={12} strokeWidth={2} />
                    </span>
                  </div>
                  <div
                    aria-hidden="true"
                    className="hidden h-9 w-px bg-border sm:block"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <h3 className="m-0 truncate text-base font-bold text-[#0F1F3D]">
                        {t.templateTask.title}
                      </h3>
                      {t.priority !== 'MEDIUM' && (
                        <Badge dot={false} intent={PRIORITY_BADGE[t.priority]}>
                          {PRIORITY_LABEL[t.priority]}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex min-w-0 items-center gap-2">
                      <Avatar
                        name={t.plan.user.fullName}
                        url={t.plan.user.avatarUrl ?? undefined}
                        size="sm"
                        className="shrink-0"
                      />
                      <div className="truncate text-xs text-ink-muted">
                        <span className="font-bold text-[#0F1F3D]">
                          {t.plan.user.fullName}
                        </span>
                        {` · ${PHASE_LABELS[t.templateTask.phase]}`}
                        {catCfg ? ` · ${catCfg.label}` : ''}
                        {t.assignee
                          ? ` · Responsável: ${t.assignee.fullName}`
                          : ''}
                        <span className="font-semibold">
                          {` · ${STATUS_LABEL[t.status] ?? t.status}`}
                        </span>
                        {` · ${t.startDate ? `${fmtDate(t.startDate)} → ` : ''}${t.dueDate ? fmtDate(t.dueDate) : '—'}`}
                      </div>
                    </div>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0F1F3D] text-white transition-transform group-hover:translate-x-0.5">
                    <ChevronRight size={18} strokeWidth={2} />
                  </span>
                </button>
                {canManagePlan && (
                  <div className="flex w-28 shrink-0 items-center pr-3">
                    <Button
                      size="sm"
                      intent="ghost"
                      className="w-full justify-center"
                      onClick={() => setAssigning(t)}
                    >
                      {t.assignee ? 'Reatribuir' : 'Atribuir'}
                    </Button>
                  </div>
                )}
              </div>
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

      {creating && <PlanTaskFormModal onClose={() => setCreating(false)} />}
      {assigning && (
        <AssignTaskModal
          taskId={assigning.id}
          planId={assigning.plan.id}
          taskTitle={assigning.templateTask.title}
          currentAssigneeId={assigning.assignee?.id ?? null}
          onClose={() => setAssigning(null)}
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

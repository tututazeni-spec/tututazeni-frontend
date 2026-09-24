// components/onboarding/OnboardingsTab.tsx
// Separador "Onboardings" (docs/onboarding.md ponto 2) — lista filtrável e
// paginada de todos os processos de integração. ADMIN/RH/GESTOR
// (GET /onboarding é @Roles(ADMIN, RH, GESTOR)). Sucessor de PlansView.tsx
// (Fase A do remodelo): acrescenta os filtros/colunas em falta face ao
// spec (Unidade, Cargo, Progresso, Período, nº de colaborador, data
// prevista de conclusão). Sem filtro de "Responsável" na UI por agora —
// o backend já aceita `responsibleId`, falta um picker de colaborador
// dedicado (fora do âmbito da Fase A).
//
// A linha abre o PlanDetailModal; a remoção do plano vive lá dentro e só
// para ADMIN/RH (prop `canManagePlan`, resolvida no page.tsx).

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { STATUS_CFG } from './constants';
import { PlanDetailModal } from './PlanDetailModal';
import { useDepartmentOptions, useTemplateOptions, useUnitOptions, usePositionOptions } from './planData';
import type { OnboardingPlanListItem } from './types';

interface Paginated {
  data: OnboardingPlanListItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const STATUS_ITEMS = [
  { value: 'ALL', label: 'Todos os estados' },
  ...Object.entries(STATUS_CFG).map(([value, cfg]) => ({ value, label: cfg.label })),
];

const PROGRESS_ITEMS = [
  { value: 'ALL', label: 'Qualquer progresso' },
  { value: '0-25', label: '0% – 25%' },
  { value: '25-50', label: '25% – 50%' },
  { value: '50-75', label: '50% – 75%' },
  { value: '75-100', label: '75% – 100%' },
];

export interface OnboardingsTabProps {
  /** ADMIN/RH: passa para o detalhe a acção "Remover plano". */
  canManagePlan?: boolean;
  /** ADMIN/RH/GESTOR: passa para o detalhe aprovar / rejeitar / saltar tarefas. */
  canManageTasks?: boolean;
}

export function OnboardingsTab({
  canManagePlan = false,
  canManageTasks = false,
}: OnboardingsTabProps) {
  const [filters, setFilters] = useState({
    status: 'ALL',
    templateId: 'ALL',
    departmentId: 'ALL',
    unitId: 'ALL',
    positionId: 'ALL',
    progress: 'ALL',
    from: '',
    to: '',
    page: 1,
  });
  const [detailId, setDetailId] = useState<number | null>(null);

  const { options: templateOptions } = useTemplateOptions();
  const { options: departmentOptions } = useDepartmentOptions();
  const { options: unitOptions } = useUnitOptions();
  const { options: positionOptions } = usePositionOptions();

  function updateFilters(patch: Partial<Omit<typeof filters, 'page'>>) {
    setFilters((f) => ({ ...f, ...patch, page: 1 }));
  }

  const [minProgress, maxProgress] =
    filters.progress === 'ALL' ? [undefined, undefined] : filters.progress.split('-').map(Number);

  const params = {
    page: filters.page,
    limit: 20,
    status: filters.status === 'ALL' ? undefined : filters.status,
    templateId: filters.templateId === 'ALL' ? undefined : filters.templateId,
    departmentId: filters.departmentId === 'ALL' ? undefined : filters.departmentId,
    unitId: filters.unitId === 'ALL' ? undefined : filters.unitId,
    positionId: filters.positionId === 'ALL' ? undefined : filters.positionId,
    minProgress,
    maxProgress,
    from: filters.from || undefined,
    to: filters.to || undefined,
  };

  const { data, isLoading } = useApiQuery<Paginated>(
    queryKeys.onboarding.plans(params),
    '/onboarding',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <Select items={STATUS_ITEMS} value={filters.status} onValueChange={(v) => updateFilters({ status: v })} />
        <Select
          items={[{ value: 'ALL', label: 'Todos os planos' }, ...templateOptions]}
          value={filters.templateId}
          onValueChange={(v) => updateFilters({ templateId: v })}
        />
        <Select
          items={[{ value: 'ALL', label: 'Todos os departamentos' }, ...departmentOptions]}
          value={filters.departmentId}
          onValueChange={(v) => updateFilters({ departmentId: v })}
        />
        <Select
          items={[{ value: 'ALL', label: 'Todas as unidades' }, ...unitOptions]}
          value={filters.unitId}
          onValueChange={(v) => updateFilters({ unitId: v })}
        />
        <Select
          items={[{ value: 'ALL', label: 'Todos os cargos' }, ...positionOptions]}
          value={filters.positionId}
          onValueChange={(v) => updateFilters({ positionId: v })}
        />
        <Select items={PROGRESS_ITEMS} value={filters.progress} onValueChange={(v) => updateFilters({ progress: v })} />
        <div className="flex items-end gap-2">
          <div>
            <label className="mb-1 block font-body text-xs text-ink-faint">De</label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => updateFilters({ from: e.target.value })}
              className="rounded-control border border-border px-2.5 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block font-body text-xs text-ink-faint">Até</label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => updateFilters({ to: e.target.value })}
              className="rounded-control border border-border px-2.5 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <span className="ml-auto font-body text-sm text-ink-faint">{data?.meta.total ?? 0} onboardings</span>
      </div>

      {isLoading ? (
        <Skeleton rows={5} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState title="Sem onboardings" description="Nenhum processo de integração corresponde aos filtros." />
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          {data.data.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => setDetailId(plan.id)}
              className="flex w-full items-center gap-4 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-surface-sunken"
            >
              <Avatar name={plan.user.fullName} url={plan.user.avatarUrl ?? undefined} size="md" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-body text-sm font-medium text-ink">
                  {plan.user.fullName}
                  {plan.user.employeeNumber && (
                    <span className="ml-1.5 font-mono text-xs text-ink-faint">#{plan.user.employeeNumber}</span>
                  )}
                </div>
                <div className="truncate font-body text-xs text-ink-faint">
                  {plan.user.position?.name ?? plan.user.email}
                  {plan.user.department && ` · ${plan.user.department.name}`} · {plan.template.name}
                </div>
              </div>
              <div className="hidden shrink-0 font-body text-xs text-ink-faint sm:block">
                {plan._count.taskInstances} tarefas · {plan._count.documents} docs
              </div>
              <div className="w-12 shrink-0 text-right font-mono text-xs text-ink-faint">{plan.progress}%</div>
              <div className="shrink-0 font-body text-xs text-ink-faint">
                {fmtDate(plan.startDate)}
                {plan.expectedEndDate && ` → ${fmtDate(plan.expectedEndDate)}`}
              </div>
              <StatusBadge value={plan.status} map={STATUS_CFG} />
            </button>
          ))}
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

// components/onboarding/PlansView.tsx
// Separador "Planos" — lista filtrável e paginada de todos os planos de
// integração. ADMIN/RH/GESTOR (GET /onboarding é @Roles(ADMIN, RH, GESTOR)).
// A linha abre o PlanDetailModal; a remoção do plano vive lá dentro e só
// para ADMIN/RH (prop `canDelete`, resolvida no page.tsx).

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
import { useDepartmentOptions, useTemplateOptions } from './planData';
import type { OnboardingPlanListItem } from './types';

interface Paginated {
  data: OnboardingPlanListItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const STATUS_ITEMS = [
  { value: 'ALL', label: 'Todos os estados' },
  ...Object.entries(STATUS_CFG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
  })),
];

export interface PlansViewProps {
  /** ADMIN/RH: passa para o detalhe a acção "Remover plano". */
  canDelete?: boolean;
}

export function PlansView({ canDelete = false }: PlansViewProps) {
  const [filters, setFilters] = useState({
    status: 'ALL',
    templateId: 'ALL',
    departmentId: 'ALL',
    page: 1,
  });
  const [detailId, setDetailId] = useState<number | null>(null);

  const { options: templateOptions } = useTemplateOptions();
  const { options: departmentOptions } = useDepartmentOptions();

  function updateFilters(patch: Partial<Omit<typeof filters, 'page'>>) {
    setFilters((f) => ({ ...f, ...patch, page: 1 }));
  }

  const params = {
    page: filters.page,
    limit: 20,
    status: filters.status === 'ALL' ? undefined : filters.status,
    templateId: filters.templateId === 'ALL' ? undefined : filters.templateId,
    departmentId:
      filters.departmentId === 'ALL' ? undefined : filters.departmentId,
  };

  const { data, isLoading } = useApiQuery<Paginated>(
    queryKeys.onboarding.plans(params),
    '/onboarding',
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
          items={STATUS_ITEMS}
          value={filters.status}
          onValueChange={(v) => updateFilters({ status: v })}
        />
        <Select
          items={[
            { value: 'ALL', label: 'Todos os templates' },
            ...templateOptions,
          ]}
          value={filters.templateId}
          onValueChange={(v) => updateFilters({ templateId: v })}
        />
        <Select
          items={[
            { value: 'ALL', label: 'Todos os departamentos' },
            ...departmentOptions,
          ]}
          value={filters.departmentId}
          onValueChange={(v) => updateFilters({ departmentId: v })}
        />
        <span className="ml-auto font-body text-sm text-ink-faint">
          {data?.meta.total ?? 0} planos
        </span>
      </div>

      {isLoading ? (
        <Skeleton rows={5} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title="Sem planos"
          description="Nenhum plano de integração corresponde aos filtros."
        />
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          {data.data.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => setDetailId(plan.id)}
              className="flex w-full items-center gap-4 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-surface-sunken"
            >
              <Avatar
                name={plan.user.fullName}
                url={plan.user.avatarUrl ?? undefined}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-body text-sm font-medium text-ink">
                  {plan.user.fullName}
                </div>
                <div className="truncate font-body text-xs text-ink-faint">
                  {plan.user.position?.name ?? plan.user.email} ·{' '}
                  {plan.template.name}
                </div>
              </div>
              <div className="hidden shrink-0 font-body text-xs text-ink-faint sm:block">
                {plan._count.taskInstances} tarefas · {plan._count.documents}{' '}
                docs
              </div>
              <div className="shrink-0 font-body text-xs text-ink-faint">
                {fmtDate(plan.startDate)}
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
          canDelete={canDelete}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  );
}

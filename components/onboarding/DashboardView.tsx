// components/onboarding/DashboardView.tsx
// Separador "Dashboard" — KPIs, breakdown por estado e lista de
// onboardings activos. Dados próprios + apresentação. Extraído de
// app/(platform)/onboarding/page.tsx. Migrado para a fundação de
// design: KpiCard/Avatar/ProgressBar/EmptyState/Skeleton substituem
// os elementos bespoke. STATUS_CFG.cls já vem em pares
// bg-x-subtle/text-x-ink (constants.ts) — o breakdown por estado deixa
// de precisar da derivação frágil `.replace('text-', 'bg-')`.

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { STATUS_CFG } from './constants';
import { PlanDetailModal } from './PlanDetailModal';
import type { Dashboard } from './types';

export interface DashboardViewProps {
  /** ADMIN/RH: passa para o detalhe do plano a acção "Remover plano". */
  canManagePlan?: boolean;
  /** ADMIN/RH/GESTOR: aprovar / rejeitar / saltar tarefas no detalhe. */
  canManageTasks?: boolean;
}

export function DashboardView({
  canManagePlan = false,
  canManageTasks = false,
}: DashboardViewProps) {
  const [detailId, setDetailId] = useState<number | null>(null);
  const { data, isLoading } = useApiQuery<Dashboard>(
    queryKeys.onboarding.dashboard(),
    '/onboarding/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-4"
        itemClassName="h-24 bg-surface-sunken rounded-card animate-pulse"
      />
    );

  const { summary, active } = data;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Total planos" value={summary.total} />
        <KpiCard
          label="Em progresso"
          value={summary.byStatus['IN_PROGRESS'] ?? 0}
          intent="info"
        />
        <KpiCard
          label="Tarefas atrasadas"
          value={summary.overdueTasks}
          intent={summary.overdueTasks > 0 ? 'danger' : 'primary'}
        />
        <KpiCard
          label="Satisfação média"
          value={
            summary.avgSurveyScore > 0 ? `${summary.avgSurveyScore}/5` : '—'
          }
          intent="warning"
        />
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-5 gap-2">
        {Object.entries(STATUS_CFG).map(([status, cfg]) => (
          <div
            key={status}
            className={`rounded-card px-3 py-2 text-center ${cfg.cls}`}
          >
            <div className="text-lg font-bold font-mono">
              {summary.byStatus[status] ?? 0}
            </div>
            <div className="text-xs font-medium">{cfg.label}</div>
          </div>
        ))}
      </div>

      {/* Colaboradores activos */}
      <div className="bg-surface border border-border rounded-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-xs font-medium text-ink-faint uppercase tracking-wide">
          Processos de Integração activos
        </div>
        {active.map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => setDetailId(plan.id)}
            className="flex w-full items-center gap-4 px-4 py-4 border-b border-border last:border-0 text-left hover:bg-surface-sunken"
          >
            <Avatar
              name={plan.user.fullName}
              url={plan.user.avatarUrl ?? undefined}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-ink">
                {plan.user.fullName}
              </div>
              <div className="text-xs text-ink-faint">
                {plan.user.position?.name ?? '—'} · {plan.user.department?.name}
              </div>
              <div className="mt-1">
                <ProgressBar value={plan.progress ?? 0} />
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xs text-ink-faint">
                Dia {plan.daysIn ?? 0}
              </div>
              <div className="text-sm font-mono font-medium text-ink">
                {plan.progress}%
              </div>
              <StatusBadge value={plan.status} map={STATUS_CFG} />
            </div>
          </button>
        ))}
        {active.length === 0 && (
          <EmptyState
            title="Sem onboardings activos"
            description="Não há colaboradores em processo de integração no momento"
            className="border-0 rounded-none"
          />
        )}
      </div>

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

// components/onboarding/OverviewTab.tsx
// Separador "Visão Geral" (docs/onboarding.md ponto 1) — KPIs, breakdown
// por estado/departamento/unidade/responsável, próximas entradas e lista
// de onboardings activos. Sucessor de DashboardView.tsx (Fase A do
// remodelo), mesmos dados + apresentação, com os KPIs em falta face ao
// spec acrescentados (taxa de conclusão, documentos/formações pendentes,
// novos colaboradores, avaliações de integração pendentes, breakdowns).

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { STATUS_CFG } from './constants';
import { PlanDetailModal } from './PlanDetailModal';
import type { Dashboard } from './types';

function RankedList({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, number]>;
}) {
  const sorted = [...rows].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = Math.max(...sorted.map(([, n]) => n), 1);
  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
        {title}
      </div>
      {sorted.length === 0 ? (
        <p className="py-4 text-center font-body text-sm text-ink-faint">Sem dados</p>
      ) : (
        <div className="space-y-2">
          {sorted.map(([label, count]) => (
            <div key={label} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate font-body text-xs text-ink-muted" title={label}>
                {label}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.round((count / max) * 100)}%` }}
                />
              </div>
              <span className="w-6 text-right font-mono text-xs text-ink-faint">{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export interface OverviewTabProps {
  /** ADMIN/RH: passa para o detalhe do plano a acção "Remover plano". */
  canManagePlan?: boolean;
  /** ADMIN/RH/GESTOR: aprovar / rejeitar / saltar tarefas no detalhe. */
  canManageTasks?: boolean;
}

export function OverviewTab({
  canManagePlan = false,
  canManageTasks = false,
}: OverviewTabProps) {
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

  const { summary, active, upcomingStarts } = data;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Total de integrações" value={summary.total} />
        <KpiCard label="Novos colaboradores (30d)" value={summary.newHires} intent="info" />
        <KpiCard
          label="Taxa de conclusão"
          value={`${summary.completionRate}%`}
          intent={summary.completionRate >= 70 ? 'success' : 'warning'}
        />
        <KpiCard
          label="Tarefas atrasadas"
          value={summary.overdueTasks}
          intent={summary.overdueTasks > 0 ? 'danger' : 'primary'}
        />
        <KpiCard
          label="Documentos pendentes"
          value={summary.pendingDocuments}
          intent={summary.pendingDocuments > 0 ? 'warning' : 'primary'}
        />
        <KpiCard
          label="Formações pendentes"
          value={summary.pendingTrainings}
          intent={summary.pendingTrainings > 0 ? 'warning' : 'primary'}
        />
        <KpiCard
          label="Avaliações de integração pendentes"
          value={summary.pendingIntegrationEvals}
          intent={summary.pendingIntegrationEvals > 0 ? 'warning' : 'primary'}
        />
        <KpiCard
          label="Satisfação média"
          value={summary.avgSurveyScore > 0 ? `${summary.avgSurveyScore}/5` : '—'}
          intent="warning"
        />
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-5 gap-2">
        {Object.entries(STATUS_CFG).map(([status, cfg]) => (
          <div key={status} className={`rounded-card px-3 py-2 text-center ${cfg.cls}`}>
            <div className="text-lg font-bold font-mono">{summary.byStatus[status] ?? 0}</div>
            <div className="text-xs font-medium">{cfg.label}</div>
          </div>
        ))}
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-3 gap-3">
        <RankedList title="Onboardings por departamento" rows={Object.entries(summary.byDepartment)} />
        <RankedList title="Onboardings por unidade" rows={Object.entries(summary.byUnit)} />
        <RankedList title="Onboardings por responsável" rows={Object.entries(summary.byResponsible)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Próximas entradas */}
        <div className="bg-surface border border-border rounded-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border text-xs font-medium text-ink-faint uppercase tracking-wide">
            Próximas entradas
          </div>
          {upcomingStarts.length === 0 ? (
            <EmptyState
              title="Sem entradas agendadas"
              description="Não há colaboradores com data de início futura"
              className="border-0 rounded-none"
            />
          ) : (
            upcomingStarts.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
                <Avatar name={p.user.fullName} url={p.user.avatarUrl ?? undefined} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">{p.user.fullName}</div>
                  <div className="truncate text-xs text-ink-faint">{p.template.name}</div>
                </div>
                <div className="shrink-0 text-xs text-ink-faint">{fmtDate(p.startDate)}</div>
              </div>
            ))
          )}
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
              <Avatar name={plan.user.fullName} url={plan.user.avatarUrl ?? undefined} size="md" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink">{plan.user.fullName}</div>
                <div className="text-xs text-ink-faint">
                  {plan.user.position?.name ?? '—'} · {plan.user.department?.name}
                </div>
                <div className="mt-1">
                  <ProgressBar value={plan.progress ?? 0} />
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs text-ink-faint">Dia {plan.daysIn ?? 0}</div>
                <div className="text-sm font-mono font-medium text-ink">{plan.progress}%</div>
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

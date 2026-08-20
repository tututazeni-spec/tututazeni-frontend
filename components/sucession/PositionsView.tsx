// components/sucession/PositionsView.tsx
// Vista "Cargos Críticos": lista de cargos + chair view do pipeline de
// sucessão do cargo seleccionado. Extraído de
// app/(platform)/sucession/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { COVERAGE_CFG, READINESS_CFG, RISK_CFG } from './constants';
import { SuccessorCard } from './SuccessorCard';
import type {
  CoverageStatus,
  CriticalPosition,
  PositionSummary,
  ReadinessLevel,
  SuccessionPlan,
} from './types';

export function PositionsView() {
  const notify = useToast();
  const [selected, setSelected] = useState<number | null>(null);

  const { data: positions, isLoading: loading } = useApiQuery<{
    data: CriticalPosition[];
  }>(
    queryKeys.succession.criticalPositions(),
    '/succession/critical-positions',
    { params: { limit: 50 }, staleTime: STALE_TIME.SEMI_STATIC },
  );

  const summaryMutation = useApiMutation(
    (positionId: number) =>
      apiClient.get<PositionSummary>(
        `/succession/position/${positionId}/summary`,
      ),
    { onError: (e) => notify({ title: e.message, intent: 'danger' }) },
  );
  const summary = summaryMutation.data ?? null;
  const loadingSummary = summaryMutation.isPending;
  const loadSummary = (positionId: number) => {
    setSelected(positionId);
    summaryMutation.mutate(positionId);
  };

  if (loading) return <Skeleton rows={4} />;

  return (
    <div className="grid grid-cols-[280px_1fr] gap-5">
      {/* Position list */}
      <div className="space-y-2">
        <div className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
          Cargos críticos
        </div>
        {positions?.data.map((cp) => (
          <div
            key={cp.id}
            onClick={() => loadSummary(cp.positionId)}
            className={`cursor-pointer rounded-card border p-3 transition-colors ${
              selected === cp.positionId
                ? 'border-primary bg-primary-subtle'
                : 'border-border hover:bg-surface-sunken'
            }`}
          >
            <div className="truncate font-body text-xs font-medium text-ink">
              {cp.position.name}
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <StatusBadge value={cp.exitRisk} map={RISK_CFG} />
              <span
                className={`rounded px-1.5 font-body text-xs ${COVERAGE_CFG[cp.coverageStatus].cls}`}
              >
                {cp._count.successionPlans} suc.
              </span>
            </div>
            {cp.alert && (
              <div className="mt-1 truncate font-body text-xs text-danger-ink">
                {cp.alert}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chair view detail */}
      <div>
        {!selected && (
          <div className="flex h-48 items-center justify-center rounded-card border border-dashed border-border-strong font-body text-sm text-ink-faint">
            Seleccione um cargo para ver o pipeline de sucessão
          </div>
        )}

        {loadingSummary && <Skeleton rows={3} />}

        {summary && !loadingSummary && (
          <div className="space-y-4">
            {/* Position header */}
            <Card className="p-5">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <div className="font-display text-lg font-semibold text-ink">
                    {summary.criticalPosition.position.name}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusBadge
                      value={summary.criticalPosition.exitRisk}
                      map={RISK_CFG}
                    />
                    <StatusBadge
                      value={summary.coverageStatus as CoverageStatus}
                      map={COVERAGE_CFG}
                    />
                    {summary.criticalPosition.keyPersonRisk && (
                      <span className="rounded bg-accent-subtle px-1.5 py-0.5 font-body text-xs text-accent">
                        🔑 Key Person
                      </span>
                    )}
                  </div>
                </div>
                {summary.daysUntilExit !== null && (
                  <div
                    className={`text-center ${summary.daysUntilExit <= 90 ? 'text-danger-ink' : 'text-ink-muted'}`}
                  >
                    <div className="font-mono text-2xl font-bold">
                      {summary.daysUntilExit}
                    </div>
                    <div className="font-body text-xs">dias até saída</div>
                  </div>
                )}
              </div>

              {/* Titular */}
              {summary.criticalPosition.position.users[0] && (
                <div className="flex items-center gap-3 rounded-control bg-surface-sunken p-3">
                  <Avatar
                    name={summary.criticalPosition.position.users[0].fullName}
                    size="md"
                  />
                  <div>
                    <div className="font-body text-sm font-medium text-ink">
                      {summary.criticalPosition.position.users[0].fullName}
                    </div>
                    <div className="font-body text-xs text-ink-faint">
                      Titular actual
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Pipeline por readiness */}
            {(
              [
                'READY_NOW',
                'READY_SOON',
                'NEEDS_DEVELOPMENT',
              ] as ReadinessLevel[]
            ).map((level) => {
              const plans: SuccessionPlan[] = summary.byReadiness[level] ?? [];
              return (
                <div key={level}>
                  <div className="mb-2 flex items-center gap-2">
                    <StatusBadge
                      value={level}
                      map={READINESS_CFG}
                      variant="dot"
                    />
                    <span className="font-body text-xs text-ink-faint">
                      {plans.length} candidatos
                    </span>
                  </div>
                  {plans.length > 0 ? (
                    <div className="space-y-2">
                      {plans.map((plan: SuccessionPlan, idx: number) => (
                        <SuccessorCard
                          key={plan.id}
                          plan={plan}
                          rank={idx + 1}
                        />
                      ))}
                    </div>
                  ) : (
                    <div
                      className={`rounded-control px-3 py-2 font-body text-xs ${level === 'READY_NOW' ? 'bg-danger-subtle text-danger-ink' : 'bg-surface-sunken text-ink-faint'}`}
                    >
                      {level === 'READY_NOW'
                        ? '⚠ Nenhum candidato pronto imediatamente'
                        : 'Sem candidatos nesta fase'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

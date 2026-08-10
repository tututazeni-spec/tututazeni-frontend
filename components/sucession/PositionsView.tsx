// components/sucession/PositionsView.tsx
// Vista "Cargos Críticos": lista de cargos + chair view do pipeline de
// sucessão do cargo seleccionado. Extraído de
// app/(platform)/sucession/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar, ReadinessBadge, Skeleton } from './atoms';
import { COVERAGE_CFG, RISK_CFG } from './constants';
import { SuccessorCard } from './SuccessorCard';
import type {
  CoverageStatus,
  CriticalPosition,
  PositionSummary,
  ReadinessLevel,
  SuccessionPlan,
} from './types';

export function PositionsView() {
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
    { onError: (e) => alert(e.message) },
  );
  const summary = summaryMutation.data ?? null;
  const loadingSummary = summaryMutation.isPending;
  const loadSummary = (positionId: number) => {
    setSelected(positionId);
    summaryMutation.mutate(positionId);
  };

  if (loading) return <Skeleton />;

  return (
    <div className="grid grid-cols-[280px_1fr] gap-5">
      {/* Position list */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
          Cargos críticos
        </div>
        {positions?.data.map((cp) => (
          <div
            key={cp.id}
            onClick={() => loadSummary(cp.positionId)}
            className={`p-3 border rounded-xl cursor-pointer transition-colors ${
              selected === cp.positionId
                ? 'border-blue-300 bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="text-xs font-medium text-gray-900 truncate">
              {cp.position.name}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <StatusBadge value={cp.exitRisk} map={RISK_CFG} />
              <span
                className={`text-xs ${COVERAGE_CFG[cp.coverageStatus].cls} px-1.5 rounded`}
              >
                {cp._count.successionPlans} suc.
              </span>
            </div>
            {cp.alert && (
              <div className="text-xs text-red-600 mt-1 truncate">
                {cp.alert}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chair view detail */}
      <div>
        {!selected && (
          <div className="flex items-center justify-center h-48 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
            Seleccione um cargo para ver o pipeline de sucessão
          </div>
        )}

        {loadingSummary && <Skeleton rows={3} />}

        {summary && !loadingSummary && (
          <div className="space-y-4">
            {/* Position header */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {summary.criticalPosition.position.name}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge
                      value={summary.criticalPosition.exitRisk}
                      map={RISK_CFG}
                    />
                    <StatusBadge
                      value={summary.coverageStatus as CoverageStatus}
                      map={COVERAGE_CFG}
                    />
                    {summary.criticalPosition.keyPersonRisk && (
                      <span className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">
                        🔑 Key Person
                      </span>
                    )}
                  </div>
                </div>
                {summary.daysUntilExit !== null && (
                  <div
                    className={`text-center ${summary.daysUntilExit <= 90 ? 'text-red-600' : 'text-gray-500'}`}
                  >
                    <div className="text-2xl font-bold font-mono">
                      {summary.daysUntilExit}
                    </div>
                    <div className="text-xs">dias até saída</div>
                  </div>
                )}
              </div>

              {/* Titular */}
              {summary.criticalPosition.position.users[0] && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Avatar
                    name={summary.criticalPosition.position.users[0].fullName}
                    size="md"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {summary.criticalPosition.position.users[0].fullName}
                    </div>
                    <div className="text-xs text-gray-400">Titular actual</div>
                  </div>
                </div>
              )}
            </div>

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
                  <div className="flex items-center gap-2 mb-2">
                    <ReadinessBadge level={level} />
                    <span className="text-xs text-gray-400">
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
                      className={`text-xs py-2 px-3 rounded-lg ${level === 'READY_NOW' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}`}
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

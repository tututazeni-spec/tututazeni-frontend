// components/sucession/DashboardView.tsx
// Vista "Dashboard": KPIs de sucessão e alertas críticos. Extraído de
// app/(platform)/sucession/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from './atoms';
import { RISK_CFG } from './constants';
import type { Dashboard } from './types';

export function DashboardView() {
  const { data, isLoading: loading } = useApiQuery<Dashboard>(
    queryKeys.succession.dashboard(),
    '/succession/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading) return <Skeleton rows={3} />;
  if (!data) return null;

  const { kpis, criticalAlerts } = data;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {/* Readiness Index */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-xs text-gray-400 mb-2">Índice de Prontidão</div>
          <div className="flex items-end gap-2 mb-2">
            <div className="text-4xl font-bold font-mono text-blue-700">
              {kpis.readinessIndex}%
            </div>
            <div className="text-xs text-gray-400 mb-1">meta &gt;80%</div>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${kpis.readinessIndex}%` }}
            />
          </div>
        </div>

        {/* Coverage */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-xs text-gray-400 mb-2">
            Cobertura de Sucessão
          </div>
          <div className="flex items-end gap-2 mb-2">
            <div
              className={`text-4xl font-bold font-mono ${kpis.coverageRate >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}
            >
              {kpis.coverageRate}%
            </div>
            <div className="text-xs text-gray-400 mb-1">meta &gt;80%</div>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${kpis.coverageRate >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${kpis.coverageRate}%` }}
            />
          </div>
        </div>

        {/* Match score médio */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-xs text-gray-400 mb-2">Score de Match Médio</div>
          <div className="text-4xl font-bold font-mono text-gray-900 mb-2">
            {kpis.avgMatchScore}%
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full"
              style={{ width: `${kpis.avgMatchScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Métricas secundárias */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Cargos críticos', value: kpis.totalCriticalPositions },
          {
            label: 'Sem sucessores',
            value: kpis.withoutSuccessor,
            color: kpis.withoutSuccessor > 0 ? 'text-red-600' : 'text-gray-900',
          },
          {
            label: 'Risco alto/crítico',
            value: kpis.highRiskPositions,
            color:
              kpis.highRiskPositions > 0 ? 'text-amber-600' : 'text-gray-900',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div
              className={`text-2xl font-semibold font-mono ${color ?? 'text-gray-900'}`}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Alertas críticos */}
      {criticalAlerts.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Alertas críticos
          </div>
          {criticalAlerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-100 last:border-0"
            >
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  alert.exitRisk === 'CRITICAL'
                    ? 'bg-red-500'
                    : alert.exitRisk === 'HIGH'
                      ? 'bg-orange-500'
                      : 'bg-amber-400'
                }`}
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {alert.position}
                </div>
                {alert.alert && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    {alert.alert}
                  </div>
                )}
              </div>
              <StatusBadge value={alert.exitRisk} map={RISK_CFG} />
              {alert.daysUntilExit !== null && alert.daysUntilExit <= 180 && (
                <div
                  className={`text-xs font-mono ${alert.daysUntilExit <= 30 ? 'text-red-600 font-bold' : 'text-amber-600'}`}
                >
                  {alert.daysUntilExit}d
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

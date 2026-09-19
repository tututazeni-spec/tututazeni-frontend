// components/career/succession/SuccessionTab.tsx
// Separador "Sucessão" (RH/Gestor/Admin) — Módulo Career, secção 7.
// KPIs + alertas críticos (GET /succession/dashboard) e duas vistas:
// Cargos Críticos (pipeline por posição) e Matriz de Sucessão.

'use client';

import { useState } from 'react';
import { AlertTriangle, Target, TrendingUp, Users } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { CriticalPositionsView } from './CriticalPositionsView';
import { SuccessionMatrixView } from './SuccessionMatrixView';
import { RISK_INTENT, RISK_LABEL } from './constants';
import type { SuccessionDashboard } from './types';

type SubView = 'positions' | 'matrix';

const SUB_TABS: Array<{ id: SubView; label: string }> = [
  { id: 'positions', label: 'Cargos Críticos' },
  { id: 'matrix', label: 'Matriz de Sucessão' },
];

export function SuccessionTab() {
  const [subView, setSubView] = useState<SubView>('positions');

  const { data: dashboard, isLoading: loading } = useApiQuery<SuccessionDashboard>(
    queryKeys.succession.dashboard(),
    '/succession/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  return (
    <div className="space-y-5">
      {loading ? (
        <Skeleton rows={2} />
      ) : (
        dashboard && (
          <>
            <div className="flex flex-wrap gap-4">
              <KpiCard
                icon={Target}
                label="Posições críticas"
                value={dashboard.kpis.totalCriticalPositions}
                intent="primary"
              />
              <KpiCard
                icon={AlertTriangle}
                label="Sem sucessor"
                value={dashboard.kpis.withoutSuccessor}
                intent={dashboard.kpis.withoutSuccessor > 0 ? 'danger' : 'success'}
              />
              <KpiCard
                icon={Users}
                label="Cobertura de sucessão"
                value={`${dashboard.kpis.coverageRate}%`}
                intent="info"
              />
              <KpiCard
                icon={TrendingUp}
                label="Índice de prontidão"
                value={`${dashboard.kpis.readinessIndex}%`}
                sub={`${dashboard.kpis.avgMatchScore}% match médio`}
                intent="accent"
              />
              <KpiCard
                icon={AlertTriangle}
                label="Risco alto/crítico"
                value={dashboard.kpis.highRiskPositions}
                intent={dashboard.kpis.highRiskPositions > 0 ? 'warning' : 'success'}
              />
            </div>

            {dashboard.criticalAlerts.length > 0 && (
              <Card className="border-warning bg-warning-subtle p-4">
                <div className="mb-2 flex items-center gap-1.5 font-body text-sm font-semibold text-warning-ink">
                  <AlertTriangle size={16} strokeWidth={1.75} />
                  Alertas Críticos
                </div>
                <div className="space-y-1.5">
                  {dashboard.criticalAlerts.map((a) => (
                    <div key={a.id} className="flex items-center justify-between gap-2 font-body text-xs">
                      <span className="text-warning-ink">
                        {a.position}
                        {a.alert ? ` — ${a.alert}` : ''}
                      </span>
                      <Badge intent={RISK_INTENT[a.exitRisk]}>{RISK_LABEL[a.exitRisk]}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )
      )}

      <div className="flex gap-2 border-b border-border">
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubView(t.id)}
            className={cn(
              'border-b-2 px-3 py-2 font-body text-sm font-medium transition-colors duration-150',
              subView === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-muted hover:text-ink',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subView === 'positions' ? <CriticalPositionsView /> : <SuccessionMatrixView />}
    </div>
  );
}

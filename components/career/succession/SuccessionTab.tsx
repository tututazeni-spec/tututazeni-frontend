// components/career/succession/SuccessionTab.tsx
// Separador "Sucessão" (RH/Gestor/Admin) — Módulo Career, secção 7.
// KPIs + alertas críticos (GET /succession/dashboard) e duas vistas:
// Cargos Críticos (pipeline por posição) e Matriz de Sucessão.

'use client';

import { useState } from 'react';
import { AlertTriangle, Target } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
import { AlertCard } from '@/components/ui/AlertCard';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  RATE_BANDS,
  SpeedometerStatCard,
} from '@/components/ui/charts/SpeedometerStatCard';
import { CriticalPositionsView } from './CriticalPositionsView';
import { SuccessionMatrixView } from './SuccessionMatrixView';
import type { SuccessionDashboard } from './types';

type SubView = 'positions' | 'matrix';

const SUB_TABS: Array<{ id: SubView; label: string }> = [
  { id: 'positions', label: 'Cargos Críticos' },
  { id: 'matrix', label: 'Matriz de Sucessão' },
];

export function SuccessionTab() {
  const [subView, setSubView] = useState<SubView>('positions');

  const { data: dashboard, isLoading: loading } =
    useApiQuery<SuccessionDashboard>(
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
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
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
                intent="warning"
              />
              <SpeedometerStatCard
                label="Cobertura de sucessão"
                value={dashboard.kpis.coverageRate}
                bands={RATE_BANDS}
                display={`${dashboard.kpis.coverageRate}%`}
              />
              <SpeedometerStatCard
                label="Índice de prontidão"
                value={dashboard.kpis.readinessIndex}
                bands={RATE_BANDS}
                display={`${dashboard.kpis.readinessIndex}%`}
              />
              <KpiCard
                icon={AlertTriangle}
                label="Risco alto/crítico"
                value={dashboard.kpis.highRiskPositions}
                intent="danger"
              />
            </div>

            {dashboard.criticalAlerts.length > 0 && (
              <div className="grid grid-cols-1 items-start gap-2 md:grid-cols-2">
                {dashboard.criticalAlerts.map((a) => (
                  <AlertCard
                    key={a.id}
                    variant={a.exitRisk === 'CRITICAL' ? 'danger' : 'warning'}
                    title="Alertas Críticos"
                    message={`${a.position}${a.alert ? ` — ${a.alert}` : ''}`}
                  />
                ))}
              </div>
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

      {subView === 'positions' ? (
        <CriticalPositionsView />
      ) : (
        <SuccessionMatrixView />
      )}
    </div>
  );
}

// components/organization/DashboardView.tsx
// Vista "Dashboard": KPIs organizacionais e headcount por
// departamento. Extraído de app/(platform)/organization/page.tsx.

'use client';

import {
  Briefcase,
  Building2,
  GitBranch,
  Layers,
  Network,
  UserCog,
  Users,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import type { HeadcountRow, OrgStats } from './types';

export function DashboardView() {
  const statsQuery = useApiQuery<OrgStats>(
    queryKeys.organization.stats(),
    '/organization/stats',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const headcountQuery = useApiQuery<HeadcountRow[]>(
    queryKeys.organization.headcount(),
    '/organization/headcount',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const stats = statsQuery.data ?? null;
  const headcount = headcountQuery.data ?? [];

  if (statsQuery.isLoading || !stats) return <Skeleton rows={4} />;

  const { headcount: hc, kpis } = stats;

  return (
    <div className="space-y-6">
      {/* KPIs principais */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard
          label="Total colaboradores"
          value={hc.total}
          intent="primary"
        />
        <KpiCard
          label="Vagas abertas"
          value={hc.open}
          intent={hc.open > 0 ? 'warning' : 'primary'}
        />
        <KpiCard
          label="Departamentos"
          value={stats.departments}
          intent="accent"
        />
        <KpiCard
          label="Unidades"
          value={stats.units}
          intent="info"
        />
      </div>

      {/* KPIs org */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard
          label="Média de Subordinados por Gestor"
          value={kpis.spanOfControl}
          sub="liderados por gestor"
          intent="info"
        />
        <KpiCard
          label="Gestores activos"
          value={kpis.managerCount}
          intent="primary"
        />
        <KpiCard
          label="Profundidade hierárquica"
          value={kpis.maxHierarchyDepth}
          sub="níveis máximos"
          intent="primary"
        />
      </div>

      {/* Headcount por departamento */}
      <Card>
        <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-muted">
          Colaboradores por departamento
        </div>
        {headcount.slice(0, 10).map((dept) => {
          const pct = dept.occupancyPct ?? 0;
          const pctColor =
            pct >= 90
              ? 'text-danger'
              : pct >= 70
                ? 'text-success'
                : 'text-warning';
          return (
            <div
              key={dept.id}
              className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0"
            >
              <div className="flex w-48 items-center gap-2">
                {dept.color && (
                  <div
                    className="h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ background: dept.color }}
                  />
                )}
                <div className="truncate font-body text-sm font-medium text-ink">
                  {dept.name}
                </div>
              </div>
              <div className="flex-1">
                <div className="mb-1 flex justify-between font-body text-xs text-ink-muted">
                  <span>{dept.occupied} pessoas</span>
                  <span className={pctColor}>
                    {dept.planned > 0 ? `${pct}%` : '—'}
                  </span>
                </div>
                <ProgressBar value={pct} />
              </div>
              <div className="w-20 flex-shrink-0 text-right">
                {dept.open > 0 && (
                  <span className="font-body text-xs font-medium text-warning">
                    {dept.open} vagas
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

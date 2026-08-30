// components/analytics/ManagerView.tsx
// Separador "Equipa" — alertas, KPIs de gestor e tabs (equipa/9-box/
// gaps de competências). Dados próprios + apresentação. Extraído de
// app/(platform)/analytics/page.tsx. Migrado para a fundação de
// design: pills de separador manuais passam a
// components/ui/Tabs (Radix); a barra de gap de competências
// (sempre vermelha na versão anterior, sem variação de tom) passa a
// components/ui/ProgressBar mono-cor — a severidade continua
// comunicada pelo texto "Gap: N" adjacente, mesmo padrão de
// components/competencies/DashboardView.tsx.

'use client';

import { useState } from 'react';
import { CheckCircle2, Target, TrendingUp, Users } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Card, CardBody } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { NineBox } from './NineBox';
import type { ManagerDashboard } from './types';

export function ManagerView() {
  const [tab, setTab] = useState<'overview' | 'ninebox' | 'gaps'>('overview');
  const { data, isLoading } = useApiQuery<ManagerDashboard>(
    queryKeys.analyticsPage.manager(),
    '/analytics/manager',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading || !data) return <Skeleton rows={4} />;

  const { metrics, alerts, competencyGaps, nineBox } = data;

  return (
    <div className="space-y-5">
      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="rounded-card border border-warning/30 bg-warning-subtle p-4">
          <div className="text-sm font-semibold text-warning-ink mb-2">
            ⚠ Alertas da equipa
          </div>
          {alerts.map((a, i) => (
            <div key={i} className="text-xs text-warning-ink">
              • {a.message}
            </div>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard
          label="Equipa"
          value={metrics.headcount}
          intent="primary"
          className="w-full [&_p]:text-black"
        />
        <KpiCard
          label="PDIs activos"
          value={`${metrics.pdiAdoptionRate}%`}
          sub="adopção"
          intent="info"
          className="w-full [&_p]:text-black"
        />
        <KpiCard
          label="Conclusão cursos"
          value={`${metrics.completionRate}%`}
          intent="success"
          className="w-full [&_p]:text-black"
        />
        <KpiCard
          label="Desempenho Médio"
          value={metrics.avgPerformance}
          intent="warning"
          className="w-full [&_p]:text-black"
        />
      </div>
      {metrics.overdueActions > 0 && (
        <div className="rounded-control border border-danger/30 bg-danger-subtle px-4 py-2.5 text-sm text-black">
          {metrics.overdueActions} acções de PDI atrasadas na equipa
        </div>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="mb-6 w-fit gap-10">
          <TabsTrigger value="overview">Equipa</TabsTrigger>
          <TabsTrigger value="ninebox">
            Matriz de Desempenho e Potencial (9-Box)
          </TabsTrigger>
          <TabsTrigger value="Lacunas de Competências">
            Lacunas de Competências(Gaps)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-2">
            {data.team.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 rounded-card border border-border bg-surface px-4 py-3"
              >
                <Avatar
                  name={u.fullName}
                  url={u.avatarUrl ?? undefined}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-ink">
                    {u.fullName}
                  </div>
                  <div className="text-xs text-ink-faint">
                    {u.position?.name} · {u.department?.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ninebox">
          <Card>
            <CardBody>
              <div className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-4">
                Matriz 9-Box
              </div>
              <ErrorBoundary source="analytics.NineBox">
                <NineBox data={nineBox} />
              </ErrorBoundary>
              {nineBox.length === 0 && (
                <div className="text-center text-sm text-ink-faint py-6">
                  Sem dados de 9-box para a equipa
                </div>
              )}
            </CardBody>
          </Card>
        </TabsContent>

        <TabsContent value="Lacunas de Competências">
          <Card>
            <CardBody>
              <div className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-4">
                Top De Lacunas de Competências
              </div>
              <div className="space-y-3">
                {competencyGaps.map((g) => (
                  <div key={g.name} className="flex items-center gap-3">
                    <div className="text-xs text-ink-muted w-40 truncate">
                      {g.name}
                    </div>
                    <div className="flex-1">
                      <ProgressBar value={Math.min(g.avgGap * 20, 100)} />
                    </div>
                    <div className="text-xs font-data text-black flex-shrink-0 w-12 text-right">
                      Gap: {g.avgGap}
                    </div>
                    <div className="text-xs text-black flex-shrink-0">
                      {g.count} pessoas
                    </div>
                  </div>
                ))}
                {competencyGaps.length === 0 && (
                  <div className="text-center text-sm text-ink-faint py-4">
                    Sem Lacunas identificadas
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

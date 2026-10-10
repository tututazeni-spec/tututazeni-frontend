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
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Users,
  TrendingUp,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Card, CardBody } from '@/components/ui/Card';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { BarChart } from '@/components/ui/charts/BarChart';
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
            <AlertTriangle
              size={14}
              strokeWidth={1.75}
              className="inline align-[-2px]"
            />{' '}
            Alertas da equipa
          </div>
          {alerts.map((a, i) => (
            <div key={i} className="text-xs text-warning-ink">
              • {a.message}
            </div>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <NavyStatCard
          label="Equipa"
          value={metrics.headcount}
          tone="blue"
          icon={Users}
        />
        <NavyStatCard
          label="PDIs Activos"
          value={`${metrics.pdiAdoptionRate}%`}
          tone={
            metrics.pdiAdoptionRate < 25
              ? 'red'
              : metrics.pdiAdoptionRate < 50
                ? 'orange'
                : 'green'
          }
          icon={ClipboardList}
        />
        <NavyStatCard
          label="Conclusão Cursos"
          value={`${metrics.completionRate}%`}
          tone={
            metrics.completionRate < 25
              ? 'red'
              : metrics.completionRate < 50
                ? 'orange'
                : 'green'
          }
          icon={CheckCircle2}
        />
        <NavyStatCard
          label="Desempenho Médio"
          value={metrics.avgPerformance}
          tone="orange"
          icon={TrendingUp}
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
          <TabsTrigger value="gaps">Lacunas de Competências</TabsTrigger>
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
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
              Matriz 9-Box
            </div>
            <CardBody>
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

        <TabsContent value="gaps">
          <Card>
            <CardBody>
              <div className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-4">
                Top De Lacunas de Competências
              </div>
              {competencyGaps.length > 0 && (
                <BarChart
                  orientation="horizontal"
                  categories={competencyGaps.map((g) => g.name)}
                  series={[
                    {
                      label: 'Lacuna média',
                      values: competencyGaps.map((g) => g.avgGap),
                    },
                  ]}
                  yFormat={(v) => v.toFixed(1)}
                  className="mb-4"
                />
              )}
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
                      Lacuna: {g.avgGap}
                    </div>
                    <div className="text-xs text-black flex-shrink-0">
                      {g.count} pessoas
                    </div>
                  </div>
                ))}
                {competencyGaps.length === 0 && (
                  <div className="text-center text-sm text-ink-faint py-4">
                    Sem lacunas identificadas
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

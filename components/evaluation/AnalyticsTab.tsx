// components/evaluation/AnalyticsTab.tsx
// Separador "Analytics" — KPIs, distribuição de performance, top
// performers e score por departamento. Dados próprios (useApiQuery) +
// apresentação. Extraído de app/(platform)/evaluation/page.tsx.

'use client';

import { Activity, BarChart2, CheckCircle, Star, Users } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { SCORE_COLOR } from './constants';
import type { AnalyticsData } from './types';

const DISTRIBUTION_CONFIG = [
  {
    key: 'exceptional',
    label: 'Excepcional',
    bg: 'bg-success',
    textColor: 'text-success-ink',
  },
  {
    key: 'above',
    label: 'Acima',
    bg: 'bg-info',
    textColor: 'text-info-ink',
  },
  {
    key: 'expected',
    label: 'Esperado',
    bg: 'bg-warning',
    textColor: 'text-warning-ink',
  },
  {
    key: 'below',
    label: 'Abaixo',
    bg: 'bg-danger',
    textColor: 'text-danger-ink',
  },
] as const;

export function AnalyticsTab() {
  const { data, isLoading: loading } = useApiQuery<AnalyticsData>(
    queryKeys.evaluation.analytics(),
    '/evaluations/analytics/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-4"
        itemClassName="skeleton-shimmer h-24 rounded-card"
      />
    );
  if (!data?.hasData)
    return (
      <EmptyState
        icon={BarChart2}
        title="Sem dados disponíveis"
        description={
          data?.message ??
          'Ainda não existem avaliações suficientes para gerar analytics.'
        }
      />
    );

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={Users}
          label="Participantes"
          value={data.kpis.totalParticipants}
          intent="primary"
        />
        <KpiCard
          icon={Star}
          label="Score Médio"
          value={data.kpis.avgScore?.toFixed(1) ?? '–'}
          intent="warning"
        />
        <KpiCard
          icon={CheckCircle}
          label="Taxa Participação"
          value={`${data.kpis.participationRate}%`}
          intent="success"
        />
        <KpiCard
          icon={Activity}
          label="Total Avaliações"
          value={data.kpis.totalEvaluations}
          intent="info"
        />
      </div>

      {/* Distribution */}
      <Card>
        <CardBody>
          <h3 className="font-display font-semibold text-ink mb-4">
            Distribuição de Performance
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {DISTRIBUTION_CONFIG.map((d) => {
              const total = Object.values(data.distribution).reduce(
                (a, b) => a + b,
                0,
              );
              const pct =
                total > 0
                  ? Math.round((data.distribution[d.key] / total) * 100)
                  : 0;
              return (
                <Card key={d.key} className="p-3 text-center">
                  <div
                    className={`w-12 h-12 rounded-full ${d.bg} mx-auto mb-2
                    flex items-center justify-center`}
                  >
                    <span className="text-canvas font-bold text-sm">
                      {pct}%
                    </span>
                  </div>
                  <p className="text-xl font-bold text-ink">
                    {data.distribution[d.key]}
                  </p>
                  <p className={`text-[10px] font-medium ${d.textColor}`}>
                    {d.label}
                  </p>
                </Card>
              );
            })}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top performers */}
        <Card>
          <CardBody>
            <h3 className="font-display font-semibold text-ink mb-4">
              🏆 Top Performers
            </h3>
            <div className="space-y-2">
              {(data.topPerformers ?? []).slice(0, 8).map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-ink-faint w-5 text-right">
                    #{i + 1}
                  </span>
                  <Avatar
                    name={p.user?.fullName ?? '?'}
                    url={p.user?.avatarUrl}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-ink truncate">
                      {p.user?.fullName}
                    </p>
                    <p className="text-[10px] text-ink-faint">
                      {p.user?.department?.name}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-bold ${SCORE_COLOR(p.avgScore)}`}
                    >
                      {p.avgScore.toFixed(1)}
                    </p>
                    <p className="text-[10px] text-ink-faint">
                      P{p.percentile}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* By department */}
        <Card>
          <CardBody>
            <h3 className="font-display font-semibold text-ink mb-4">
              Score por Departamento
            </h3>
            <div className="space-y-2">
              {(data.byDepartment ?? []).map((d, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-ink-muted truncate">
                      {d.department}
                    </span>
                    <span className={`font-bold ${SCORE_COLOR(d.avgScore)}`}>
                      {d.avgScore.toFixed(1)}
                    </span>
                  </div>
                  <ProgressBar value={(d.avgScore / 5) * 100} />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

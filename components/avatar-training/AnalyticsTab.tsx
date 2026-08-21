// components/avatar-training/AnalyticsTab.tsx
// Separador "Analytics" — KPIs, top cenários, distribuição por categoria e
// conclusões recentes. Dados próprios (useApiQuery) + apresentação.
// Extraído de app/(platform)/avatar-training/page.tsx.

'use client';

import { Bot, CheckCircle, Play, Star } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card, CardBody } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { CATEGORY_CONFIG, SCORE_COLOR } from './constants';
import type { AnalyticsDashboard } from './types';

export function AnalyticsTab() {
  const { data, isLoading } = useApiQuery<AnalyticsDashboard>(
    queryKeys.avatarTraining.analytics(),
    '/avatar-training/analytics/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading)
    return (
      <Skeleton
        wrapperClassName="space-y-4 animate-pulse"
        itemClassName="bg-surface-sunken rounded-card h-28"
      />
    );

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={Bot}
          label="Cenários"
          value={data?.kpis.totalScenarios ?? 0}
          intent="primary"
        />
        <KpiCard
          icon={Play}
          label="Em Progresso"
          value={data?.kpis.activeSessions ?? 0}
          intent="info"
        />
        <KpiCard
          icon={CheckCircle}
          label="Concluídas"
          value={data?.kpis.completedSessions ?? 0}
          intent="success"
        />
        <KpiCard
          icon={Star}
          label="Pontuação Média"
          value={data?.kpis.avgScore ?? '–'}
          intent="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top scenarios */}
        <Card>
          <CardBody>
            <h3 className="font-display font-semibold text-ink mb-3">
              Top Cenários
            </h3>
            <div className="space-y-3">
              {(data?.topScenarios ?? []).map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-ink-faint font-bold w-4">
                    #{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-ink truncate">
                      {s.scenario?.title}
                    </p>
                    <p className="text-[10px] text-ink-faint">
                      {s.completions} sessões
                    </p>
                  </div>
                  <span
                    className={`text-sm font-bold ${SCORE_COLOR(s.avgScore ?? 0)}`}
                  >
                    {s.avgScore ?? '–'}
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* By category */}
        <Card>
          <CardBody>
            <h3 className="font-display font-semibold text-ink mb-3">
              Por Categoria
            </h3>
            <div className="space-y-2">
              {(data?.categoryBreakdown ?? []).map((c) => {
                const total = (data?.categoryBreakdown ?? []).reduce(
                  (a, x) => a + x.count,
                  0,
                );
                const pct = total > 0 ? Math.round((c.count / total) * 100) : 0;
                const cat =
                  CATEGORY_CONFIG[c.category] ?? CATEGORY_CONFIG.SOFT_SKILLS;
                return (
                  <div key={c.category}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-ink-muted">{cat.label}</span>
                      <span className="font-semibold text-ink">
                        {c.count} ({pct}%)
                      </span>
                    </div>
                    <ProgressBar value={pct} />
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent completions */}
      {(data?.recentCompletions?.length ?? 0) > 0 && (
        <Card>
          <CardBody>
            <h3 className="font-display font-semibold text-ink mb-3">
              Conclusões Recentes
            </h3>
            <div className="flex flex-wrap gap-2">
              {(data?.recentCompletions ?? []).map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-surface-sunken rounded-control px-3 py-2"
                >
                  <CheckCircle
                    size={14}
                    strokeWidth={1.75}
                    className="text-success"
                  />
                  <div>
                    <p className="text-xs font-medium text-ink">
                      {s.user?.fullName}
                    </p>
                    <p className="text-[10px] text-ink-faint truncate max-w-[120px]">
                      {s.scenario?.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

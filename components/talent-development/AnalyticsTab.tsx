// components/talent-development/AnalyticsTab.tsx
// Separador "Analytics" — KPIs, Talent Health Score, planos por status e
// top necessidades de formação. Dados próprios (useApiQuery) +
// apresentação. Extraído de app/(platform)/talent-development/page.tsx.
//
// Talent Health Score (grau A–D) e as barras de métricas: cor decorativa
// de estado (não série de dados) — mesmo tratamento do piloto engagement
// (GRADE_COLOR, ver components/engagement/constants.ts). A cor da barra
// de cada métrica cumpre a regra "ProgressBar é mono-cor" movendo o
// significado para o número percentual adjacente.

'use client';

import { CheckCircle } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card, CardBody } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { GRADE_COLOR, STATUS_CFG } from './constants';
import type { DashboardData, HealthScore } from './types';

const METRIC_LABELS: Record<string, string> = {
  pdpCoverage: 'Cobertura PDI',
  skillsAssessment: 'Habilidades Avaliadas',
  reviewedRate: 'Avaliados',
  mentoringRate: 'Mentoria',
  hiPoRatio: 'Proporção de Altos Potenciais',
};

function metricIntent(value: number): string {
  if (value >= 70) return 'text-success-ink';
  if (value >= 40) return 'text-warning-ink';
  return 'text-danger-ink';
}

export function AnalyticsTab() {
  const dashQuery = useApiQuery<DashboardData>(
    queryKeys.talentDevelopment.analytics(),
    '/talent/analytics/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const healthQuery = useApiQuery<HealthScore>(
    queryKeys.talentDevelopment.health(),
    '/talent/analytics/talent-health',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const dash = dashQuery.data ?? null;
  const health = healthQuery.data ?? null;

  if (dashQuery.isLoading || healthQuery.isLoading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-4"
        itemClassName="skeleton-shimmer h-24 rounded-card"
      />
    );

  const grade = GRADE_COLOR[health?.grade ?? 'C'];

  return (
    <div className="space-y-6">
      {/* Top KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          label="Colaboradores Activos"
          value={dash?.kpis.totalUsers ?? 0}
          intent="primary"
        />
        <KpiCard
          label="Com PDI Activo"
          value={`${dash?.kpis.pdpCoverage ?? 0}%`}
          sub={`${dash?.kpis.usersWithActivePlan} colaboradores`}
          intent="accent"
        />
        <KpiCard
          label="Taxa Conclusão Acções"
          value={`${dash?.kpis.actionCompletion ?? 0}%`}
          intent="success"
        />
        <KpiCard
          label="Acções em Atraso"
          value={dash?.kpis.overdueActions ?? 0}
          intent="danger"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Talent Health Score */}
        {health && (
          <Card>
            <CardBody className="flex flex-col items-center">
              <h3 className="mb-4 self-start font-display font-semibold text-ink">
                Pontuação de Saúde do Talento
              </h3>
              <div
                className={`mb-4 flex h-28 w-28 flex-col items-center justify-center rounded-full border-4 ${grade.border}`}
              >
                <span className={`font-display text-4xl font-black ${grade.text}`}>
                  {health.grade}
                </span>
                <span className="font-body text-xs text-ink-muted">
                  {health.healthScore}/100
                </span>
              </div>
              <div className="w-full space-y-2">
                {Object.entries(health.metrics).map(([k, v]) => {
                  const value = v as number;
                  return (
                    <div key={k}>
                      <div className="mb-0.5 flex justify-between font-body text-xs">
                        <span className="text-ink-muted">
                          {METRIC_LABELS[k] ?? k}
                        </span>
                        <span
                          className={`font-semibold ${metricIntent(value)}`}
                        >
                          {value}%
                        </span>
                      </div>
                      <ProgressBar value={value} />
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 font-body text-xs text-ink-faint">
                Base: {health.total} colaboradores
              </p>
            </CardBody>
          </Card>
        )}

        {/* Plans by status */}
        <Card>
          <CardBody>
            <h3 className="mb-4 font-display font-semibold text-ink">
              Planos por Status
            </h3>
            <div className="space-y-3">
              {dash?.plansByStatus.map((s) => {
                const total = dash.plansByStatus.reduce(
                  (sum, x) => sum + x.count,
                  0,
                );
                const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                return (
                  <div key={s.status}>
                    <div className="mb-1 flex justify-between font-body text-xs">
                      <StatusBadge value={s.status} map={STATUS_CFG} />
                      <span className="font-semibold text-ink">
                        {s.count} ({pct}%)
                      </span>
                    </div>
                    <ProgressBar value={pct} />
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        {/* Top training needs */}
        <Card>
          <CardBody>
            <h3 className="mb-4 font-display font-semibold text-ink">
              Top Necessidades de Formação
            </h3>
            <div className="space-y-3">
              {dash?.topTrainingNeeds.map((n, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-4 font-body text-xs font-bold text-ink-faint">
                    #{i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-xs font-medium text-ink">
                      {n.skill?.name}
                    </p>
                    <p className="font-body text-[10px] text-ink-faint">
                      {n.count} pessoas
                    </p>
                  </div>
                  <span className="shrink-0 font-display text-sm font-bold text-danger-ink">
                    -{n.avgGap}
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent completions */}
      {(dash?.recentCompletions.length ?? 0) > 0 && (
        <Card>
          <CardBody>
            <h3 className="mb-3 font-display font-semibold text-ink">
              Conclusões Recentes
            </h3>
            <div className="flex flex-wrap gap-2">
              {dash?.recentCompletions.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-control bg-success-subtle px-3 py-2"
                >
                  <CheckCircle
                    size={13}
                    strokeWidth={1.75}
                    className="shrink-0 text-success"
                  />
                  <div>
                    <p className="font-body text-xs font-medium text-ink">
                      {c.user.fullName}
                    </p>
                    <p className="max-w-[160px] truncate font-body text-[10px] text-ink-faint">
                      {c.name}
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

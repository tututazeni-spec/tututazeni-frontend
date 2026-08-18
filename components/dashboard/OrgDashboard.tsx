// components/dashboard/OrgDashboard.tsx
// Separador "Organização" — dados próprios (useApiQuery) + apresentação,
// mesmo padrão auto-contido usado em components/payslips/page.tsx (ListView/
// CompareView/AnnualView). Extraído de app/(platform)/dashboard/page.tsx.

'use client';

import { useState } from 'react';
import { Users, BookOpen, Target, TrendingUp, Brain } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import type { OrgDashboardData } from './types';

const PERIODS = [
  { id: 'WEEK', label: 'Semana' },
  { id: 'MONTH', label: 'Mês' },
  { id: 'QUARTER', label: 'Trimestre' },
  { id: 'YEAR', label: 'Ano' },
];

export function OrgDashboard() {
  const [period, setPeriod] = useState('MONTH');

  // A key inclui o período → cada período tem cache própria; voltar a um período
  // já visto é instantâneo. params enxutos via apiClient.
  const { data, isLoading } = useApiQuery<OrgDashboardData>(
    queryKeys.dashboard.organization(period),
    '/dashboard/organization',
    { params: { period }, staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading)
    return (
      <Skeleton
        rows={6}
        wrapperClassName="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse"
        itemClassName="h-24 rounded-card bg-surface-sunken"
      />
    );

  const k = data?.kpis ?? {};

  return (
    <div className="space-y-6">
      {/* Period filter */}
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <Button
            key={p.id}
            size="sm"
            intent={period === p.id ? 'primary' : 'ghost'}
            onClick={() => setPeriod(p.id)}
          >
            {p.label}
          </Button>
        ))}
        <span className="ml-auto self-center font-body text-xs text-ink-faint">
          {new Date().toLocaleDateString('pt')}
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          icon={Users}
          label="Colaboradores Activos"
          value={k.headcount?.active ?? 0}
          sub={`+${k.headcount?.new ?? 0} no período`}
          trend={k.headcount?.newTrend}
        />
        <KpiCard
          icon={BookOpen}
          label="Conclusões de Cursos"
          value={k.learning?.completions ?? 0}
          trend={k.learning?.completionsTrend}
          intent="info"
        />
        <KpiCard
          icon={Target}
          label="PDIs Activos"
          value={k.development?.activePlans ?? 0}
          sub={`Cobertura: ${k.development?.coverage ?? 0}%`}
        />
        <KpiCard
          icon={TrendingUp}
          label="Score Médio Geral"
          value={k.performance?.avgScore?.toFixed(1) ?? '–'}
          intent="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Talent metrics */}
        <div className="rounded-card border border-border bg-surface p-5">
          <h3 className="mb-4 font-body font-semibold text-ink-muted">
            Talentos
          </h3>
          <div className="space-y-3">
            {[
              {
                label: 'Colaboradores de Alto Potencial',
                value: k.talent?.hiPos ?? 0,
              },
              {
                label: 'Sucessão Coberta',
                value: `${k.talent?.successionCoverage ?? 0}%`,
              },
              {
                label: 'Horas de Treino',
                value: k.learning?.trainingHours ?? 0,
              },
              {
                label: 'Inquéritos Activos',
                value: k.engagement?.activeSurveys ?? 0,
              },
            ].map((m) => (
              <div key={m.label} className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-body text-sm text-ink-muted">
                  {m.icon} {m.label}
                </span>
                <span className="font-body font-bold text-ink">{m.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Departments */}
        <div className="rounded-card border border-border bg-surface p-5">
          <h3 className="mb-4 font-body font-semibold text-ink-muted">
            Departamentos
          </h3>
          <div className="space-y-2">
            {(data?.departments ?? []).slice(0, 6).map((d) => {
              const total = (data?.departments ?? []).reduce(
                (a, x) => a + x.headcount,
                0,
              );
              const pct =
                total > 0 ? Math.round((d.headcount / total) * 100) : 0;
              return (
                <div key={d.id}>
                  <div className="mb-0.5 flex justify-between font-body text-xs">
                    <span className="truncate text-ink-muted">{d.name}</span>
                    <span className="font-semibold text-ink">
                      {d.headcount}
                    </span>
                  </div>
                  <ProgressBar value={pct} />
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Insights */}
        <div className="rounded-card border border-border bg-surface p-5">
          <h3 className="mb-4 flex items-center gap-2 font-body font-semibold text-ink-muted">
            <Brain size={14} strokeWidth={1.75} className="text-accent" />
            Análises de IA
          </h3>
          {(data?.insights ?? []).length > 0 ? (
            <div className="space-y-2">
              {(data?.insights ?? []).map((ins, i) => (
                <p
                  key={i}
                  className="rounded-control bg-accent-subtle px-3 py-2 font-body text-xs text-ink-muted"
                >
                  {ins}
                </p>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center font-body text-sm text-ink-faint">
              Sem insights gerados
            </p>
          )}
        </div>
      </div>

      {/* Top content */}
      {(data?.topContent?.length ?? 0) > 0 && (
        <div className="rounded-card border border-border bg-surface p-5">
          <h3 className="mb-3 font-body font-semibold text-ink-muted">
            Conteúdos Mais Vistos
          </h3>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {(data?.topContent ?? []).map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-control p-2 hover:bg-surface-sunken"
              >
                <span className="w-4 font-body text-xs font-bold text-ink-faint">
                  #{i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-sm font-medium text-ink">
                    {c.content?.title}
                  </p>
                  <p className="font-body text-[10px] text-ink-faint">
                    {c.content?.type}
                  </p>
                </div>
                <span className="shrink-0 font-body text-xs font-bold text-primary">
                  {c.views} views
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// components/dashboard-rh/PerformancePanel.tsx
// Painel "Performance" — KPIs, distribuição, score por departamento e
// insights. Dados próprios (useApiQuery) + apresentação. Extraído de
// app/(platform)/dashboard-rh/page.tsx. Migrado para a fundação de design
// — a cor da distribuição já era comunicada pelo emoji do rótulo; a cor
// do score por departamento já era comunicada pelo texto do valor, por
// isso ambas as barras passam a mono-cor (ProgressBar da fundação não tem
// prop `color`), sem perda de informação.

'use client';

import { AlertTriangle, Star, Users, Zap } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import type { PerformanceData } from './types';

export function PerformancePanel() {
  const { data, isLoading: loading } = useApiQuery<PerformanceData>(
    queryKeys.dashboardRh.performance(),
    '/dashboard-rh/performance',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse"
        itemClassName="h-24 rounded-card bg-surface-sunken"
      />
    );
  const dist = data?.distribution ?? {};
  const total = Object.values(dist as Record<string, number>).reduce(
    (a, b) => a + b,
    0,
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          label="Pontuação Média"
          value={data?.avgScore?.toFixed(1) ?? '–'}
          sub={data?.status}
          intent="warning"
          className="w-full"
        />
        <KpiCard
          label="Avaliados"
          value={data?.total ?? 0}
          intent="primary"
          className="w-full"
        />
        <KpiCard
          label="Profissionais de Alto Potencial"
          value={data?.hiPos ?? 0}
          sub={`${data?.hiPoRatio ?? 0}% da equipa`}
          intent="success"
          className="w-full"
        />
        <KpiCard
          label="Em Risco"
          value={data?.atRisk ?? 0}
          intent="danger"
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Distribution */}
        <div className="rounded-card border border-border bg-surface p-5">
          <h4 className="mb-4 font-body font-semibold text-ink-muted">
            Distribuição de Performance
          </h4>
          {[
            { key: 'exceptional', label: ' Excepcional' },
            { key: 'above', label: ' Acima' },
            { key: 'expected', label: ' Esperado' },
            { key: 'below', label: ' Abaixo' },
            { key: 'critical', label: ' Crítico' },
          ].map((b) => {
            const val = dist[b.key] ?? 0;
            const pct = total > 0 ? Math.round((val / total) * 100) : 0;
            return (
              <div key={b.key} className="mb-2">
                <div className="mb-0.5 flex justify-between font-body text-xs">
                  <span className="text-ink-muted">{b.label}</span>
                  <span className="font-semibold text-ink">
                    {val} ({pct}%)
                  </span>
                </div>
                <ProgressBar value={pct} />
              </div>
            );
          })}
        </div>

        {/* By dept */}
        <div className="rounded-card border border-border bg-surface p-5">
          <h4 className="mb-4 font-body font-semibold text-ink-muted">
            Pontuação por Departamento
          </h4>
          {(data?.byDepartment ?? []).slice(0, 6).map((d, i) => (
            <div key={i} className="mb-2">
              <div className="mb-0.5 flex justify-between font-body text-xs">
                <span className="truncate text-ink-muted">{d.department}</span>
                <span
                  className={`text-xs font-bold ${
                    d.avgScore >= 4
                      ? 'text-success'
                      : d.avgScore >= 3
                        ? 'text-warning'
                        : 'text-danger'
                  }`}
                >
                  {d.avgScore.toFixed(1)}
                </span>
              </div>
              <ProgressBar value={(d.avgScore / 5) * 100} />
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      {(data?.insights?.length ?? 0) > 0 && (
        <div className="rounded-card border border-accent-subtle bg-accent-subtle p-4">
          {data?.insights?.map((ins, i) => (
            <p key={i} className="font-body text-xs text-accent">
              {ins}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

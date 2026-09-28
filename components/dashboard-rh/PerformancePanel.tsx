// components/dashboard-rh/PerformancePanel.tsx
// Painel "Performance" — KPIs, distribuição, score por departamento e
// insights. Dados próprios (useApiQuery) + apresentação. Extraído de
// app/(platform)/dashboard-rh/page.tsx. Migrado para a fundação de design
// — a cor da distribuição já era comunicada pelo emoji do rótulo; a cor
// do score por departamento já era comunicada pelo texto do valor, por
// isso ambas as barras passam a mono-cor (ProgressBar da fundação não tem
// prop `color`), sem perda de informação.

'use client';

import { AlertTriangle, Award, Star, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/Skeleton';
import { BarChart } from '@/components/ui/charts/BarChart';
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
        itemClassName="h-28 rounded-2xl bg-surface-sunken"
      />
    );
  const dist = data?.distribution ?? {};

  return (
    <div className="space-y-5">
      {/* KPIs — cartão estilo Udemy/MasterClass */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={Star}
          label="Pontuação Média"
          value={data?.avgScore?.toFixed(1) ?? '–'}
          sub={data?.status}
          intent="warning"
        />
        <StatCard
          icon={Users}
          label="Avaliados"
          value={data?.total ?? 0}
          intent="primary"
        />
        <StatCard
          icon={Award}
          label="Profissionais de Alto Potencial"
          value={data?.hiPos ?? 0}
          sub={`${data?.hiPoRatio ?? 0}% da equipa`}
          intent="success"
        />
        <StatCard
          icon={AlertTriangle}
          label="Em Risco"
          value={data?.atRisk ?? 0}
          intent="danger"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Distribution */}
        <div className="rounded-card border border-border bg-surface p-5">
          <h4 className="mb-4 font-body font-semibold text-ink-muted">
            Distribuição de Performance
          </h4>
          <BarChart
            categories={['Excepcional', 'Acima', 'Esperado', 'Abaixo', 'Crítico']}
            series={[
              {
                label: 'Colaboradores',
                values: ['exceptional', 'above', 'expected', 'below', 'critical'].map(
                  (key) => dist[key] ?? 0,
                ),
              },
            ]}
          />
        </div>

        {/* By dept */}
        <div className="rounded-card border border-border bg-surface p-5">
          <h4 className="mb-4 font-body font-semibold text-ink-muted">
            Pontuação por Departamento
          </h4>
          {(data?.byDepartment ?? []).length > 0 ? (
            <BarChart
              orientation="horizontal"
              categories={(data?.byDepartment ?? []).slice(0, 6).map((d) => d.department)}
              series={[
                { label: 'Pontuação média', values: (data?.byDepartment ?? []).slice(0, 6).map((d) => d.avgScore) },
              ]}
              yFormat={(v) => v.toFixed(1)}
            />
          ) : (
            <p className="font-body text-xs text-ink-faint">Sem dados suficientes.</p>
          )}
        </div>
      </div>

      {/* Insights */}
      {(data?.insights?.length ?? 0) > 0 && (
        <div className="rounded-card border border-accent-subtle bg-accent-subtle p-4">
          {data?.insights?.map((ins, i) => (
            <p key={i} className="font-body text-xs text-black">
              {ins.replace(/^⚠️\s*/, '')}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// Cartão estilo Udemy/MasterClass: badge de ícone colorido, número grande
// em destaque, etiqueta discreta por baixo, elevação subtil ao hover.
// Local a este painel — não substitui o KpiCard partilhado.
type StatIntent = 'primary' | 'success' | 'warning' | 'danger';

const STAT_INTENT_STYLES: Record<StatIntent, { badge: string }> = {
  primary: { badge: 'bg-primary/10 text-primary' },
  success: { badge: 'bg-success/10 text-success' },
  warning: { badge: 'bg-warning/10 text-warning' },
  danger: { badge: 'bg-danger/10 text-danger' },
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  intent = 'primary',
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  intent?: StatIntent;
}) {
  const styles = STAT_INTENT_STYLES[intent];
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div
        className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${styles.badge}`}
      >
        <Icon size={20} strokeWidth={1.75} />
      </div>
      <p className="font-display text-2xl font-bold text-ink">{value}</p>
      <p className="mt-1 font-body text-sm font-medium text-ink-muted">{label}</p>
      {sub && <p className="mt-0.5 font-body text-xs text-ink-faint">{sub}</p>}
    </div>
  );
}
// components/dashboard-rh/PerformancePanel.tsx
// Painel "Performance" — KPIs, distribuição, score por departamento e
// insights. Dados próprios (useApiQuery) + apresentação. Extraído de
// app/(platform)/dashboard-rh/page.tsx. Migrado para a fundação de design
// — a cor da distribuição já era comunicada pelo emoji do rótulo; a cor
// do score por departamento já era comunicada pelo texto do valor, por
// isso ambas as barras passam a mono-cor (ProgressBar da fundação não tem
// prop `color`), sem perda de informação.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { KpiCard } from '@/components/ui/KpiCard';
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
        itemClassName="h-24 rounded-card bg-surface-sunken"
      />
    );
  const dist = data?.distribution ?? {};

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
<<<<<<< Updated upstream
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
=======
        <TopBarKpiCard
          icon={Star}
          label="Pontuação Média"
          value={data?.avgScore?.toFixed(1) ?? '–'}
          sub={data?.status}
          tone="gold"
        />
        <TopBarKpiCard
          icon={Users}
          label="Avaliados"
          value={data?.total ?? 0}
          tone="blue"
        />
        <TopBarKpiCard
          icon={Award}
          label="Profissionais de Alto Potencial"
          value={data?.hiPos ?? 0}
          sub={`${data?.hiPoRatio ?? 0}% da equipa`}
          tone="green"
        />
        <TopBarKpiCard
          icon={AlertTriangle}
          label="Em Risco"
          value={data?.atRisk ?? 0}
          tone="red"
>>>>>>> Stashed changes
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Distribution */}
        <div className="rounded-card border border-border bg-surface p-5">
          <h4 className="mb-4 font-body font-semibold text-ink-muted">
            Distribuição de Performance
          </h4>
          <BarChart
            categories={[
              'Excepcional',
              'Acima',
              'Esperado',
              'Abaixo',
              'Crítico',
            ]}
            series={[
              {
                label: 'Colaboradores',
                values: [
                  'exceptional',
                  'above',
                  'expected',
                  'below',
                  'critical',
                ].map((key) => dist[key] ?? 0),
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
              categories={(data?.byDepartment ?? [])
                .slice(0, 6)
                .map((d) => d.department)}
              series={[
                {
                  label: 'Pontuação média',
                  values: (data?.byDepartment ?? [])
                    .slice(0, 6)
                    .map((d) => d.avgScore),
                },
              ]}
              yFormat={(v) => v.toFixed(1)}
            />
          ) : (
            <p className="font-body text-xs text-ink-faint">
              Sem dados suficientes.
            </p>
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
<<<<<<< Updated upstream
=======

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

type Tone = 'blue' | 'green' | 'gold' | 'red';

const TONES: Record<Tone, { bar: string; text: string }> = {
  blue: { bar: 'bg-[#2B6CC4]', text: 'text-[#2B6CC4]' },
  green: { bar: 'bg-[#2E8B3E]', text: 'text-[#2E8B3E]' },
  gold: { bar: 'bg-[#C9A227]', text: 'text-[#B8912A]' },
  red: { bar: 'bg-[#C0453F]', text: 'text-[#C0453F]' },
};

function TopBarKpiCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  tone: Tone;
}) {
  const t = TONES[tone];
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting transition-shadow hover:shadow-lg">
      <div className={`h-1.5 w-full ${t.bar}`} />
      <div className="p-5 pt-6">
        <Icon size={22} strokeWidth={1.75} className={t.text} />
        <p className={`mt-3 font-display text-3xl font-bold ${t.text}`}>
          {value}
        </p>
        <p className="mt-1 font-body text-sm font-medium text-ink-muted">
          {label}
        </p>
        {sub && <p className="mt-1 font-body text-xs text-ink-faint">{sub}</p>}
      </div>
    </div>
  );
}
>>>>>>> Stashed changes

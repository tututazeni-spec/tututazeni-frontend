// components/dashboard-rh/SkillsPanel.tsx
// Painel "Competências" — gaps críticos e forças da organização. Dados
// próprios (useApiQuery) + apresentação. Mesmo padrão de
// components/dashboard-rh/TrainingPanel.tsx.

'use client';

import { AlertTriangle, Layers, ListChecks } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/Skeleton';
import { BarChart } from '@/components/ui/charts/BarChart';
import type { SkillsData } from './types';

export function SkillsPanel() {
  const { data, isLoading: loading } = useApiQuery<SkillsData>(
    queryKeys.dashboardRh.skills(),
    '/dashboard-rh/skills',
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

  return (
    <div className="space-y-5">
      {/* KPIs — cartão estilo Udemy/MasterClass */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={ListChecks}
          label="Colaboradores Avaliados"
          value={`${data?.assessmentRate ?? 0}%`}
          sub={`${data?.assessed ?? 0} de ${data?.totalUsers ?? 0}`}
          intent="primary"
        />
        <StatCard
          icon={Layers}
          label="Competências Mapeadas"
          value={data?.totalCompetencies ?? 0}
          intent="info"
        />
        <StatCard
          icon={AlertTriangle}
          label="Gaps Críticos"
          value={data?.criticalGaps ?? 0}
          intent="danger"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-card border border-border bg-surface p-5">
          <h4 className="mb-3 font-body font-semibold text-ink-muted">
            Maiores Gaps de Competência
          </h4>
          {(data?.topGaps ?? []).length === 0 ? (
            <p className="font-body text-xs text-ink-faint">Sem gaps identificados.</p>
          ) : (
            <BarChart
              orientation="horizontal"
              categories={(data?.topGaps ?? []).map((s, i) => s.competency?.name ?? `Competência ${i + 1}`)}
              series={[{ label: 'Gap médio', values: (data?.topGaps ?? []).map((s) => s.avgGap) }]}
              className="mb-4"
              yFormat={(v) => v.toFixed(1)}
            />
          )}
          <div className="space-y-2">
            {(data?.topGaps ?? []).map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-border py-2 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-xs font-medium text-ink">
                    {s.competency?.name}
                  </p>
                  <p className="font-body text-[10px] text-ink-faint">
                    Nível médio {s.avgLevel} · {s.count} avaliações
                  </p>
                </div>
                <span className="font-body text-xs font-bold text-danger-ink">
                  gap {s.avgGap}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-card border border-border bg-surface p-5">
          <h4 className="mb-3 font-body font-semibold text-ink-muted">
            Maiores Forças
          </h4>
          {(data?.topStrengths ?? []).length === 0 ? (
            <p className="font-body text-xs text-ink-faint">Sem dados suficientes.</p>
          ) : (
            <BarChart
              orientation="horizontal"
              categories={(data?.topStrengths ?? []).map((s, i) => s.competency?.name ?? `Competência ${i + 1}`)}
              series={[{ label: 'Nível médio', values: (data?.topStrengths ?? []).map((s) => s.avgLevel) }]}
              className="mb-4"
              yFormat={(v) => v.toFixed(1)}
            />
          )}
          <div className="space-y-2">
            {(data?.topStrengths ?? []).map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-border py-2 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-xs font-medium text-ink">
                    {s.competency?.name}
                  </p>
                  <p className="font-body text-[10px] text-ink-faint">
                    {s.count} avaliações
                  </p>
                </div>
                <span className="font-body text-xs font-bold text-success-ink">
                  nível {s.avgLevel}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Cartão estilo Udemy/MasterClass: badge de ícone colorido, número grande
// em destaque, etiqueta discreta por baixo, elevação subtil ao hover.
// Local a este painel — não substitui o KpiCard partilhado.
type StatIntent = 'primary' | 'info' | 'success' | 'warning' | 'danger';

const STAT_INTENT_STYLES: Record<StatIntent, { badge: string }> = {
  primary: { badge: 'bg-primary/10 text-primary' },
  info: { badge: 'bg-info/10 text-info' },
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
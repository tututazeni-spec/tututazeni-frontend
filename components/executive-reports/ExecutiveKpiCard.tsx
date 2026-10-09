// components/executive-reports/ExecutiveKpiCard.tsx
// Cartão de KPI executivo (docs §3.1): valor actual, comparação, meta,
// variação, data de actualização e origem dos dados. Mesmo desenho dos
// cartões "tipo B" do dashboard-rh (barra de cor no topo, ícone, número
// grande, sparkline).

import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { AreaLineChart } from '@/components/ui/charts/AreaLineChart';
import type { TopBarTone } from '@/components/ui/TopBarCard';
import type { ExecutiveKpi } from './dashboardTypes';
import {
  STATE_BADGE,
  STATE_LABEL,
  STATE_TONE,
  changeIsGood,
  formatDateTime,
  formatKpiValue,
} from './kpiFormat';

const TONES: Record<TopBarTone, { bar: string; text: string }> = {
  blue: { bar: 'bg-[#2B6CC4]', text: 'text-[#2B6CC4]' },
  green: { bar: 'bg-[#2E8B3E]', text: 'text-[#2E8B3E]' },
  gold: { bar: 'bg-[#C9A227]', text: 'text-[#B8912A]' },
  red: { bar: 'bg-[#C0453F]', text: 'text-[#C0453F]' },
};

export interface ExecutiveKpiCardProps {
  kpi: ExecutiveKpi;
  icon: LucideIcon;
  showComparison: boolean;
}

export function ExecutiveKpiCard({
  kpi,
  icon: Icon,
  showComparison,
}: ExecutiveKpiCardProps) {
  const t = TONES[STATE_TONE[kpi.state]];
  const good = changeIsGood(kpi);
  const trendPoints = (kpi.trend ?? [])
    .map((p, i) => ({ x: i, y: p.value, xLabel: p.label }))
    .filter((p): p is { x: number; y: number; xLabel: string } => p.y !== null);

  const ChangeIcon =
    kpi.change === null || kpi.change === 0
      ? Minus
      : kpi.change > 0
        ? ArrowUpRight
        : ArrowDownRight;
  const changeColor =
    good === null
      ? 'text-ink-muted'
      : good
        ? 'text-success-ink'
        : 'text-danger-ink';

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting transition-all duration-200 hover:scale-105 hover:shadow-md motion-reduce:hover:scale-100">
      <div className={`h-1.5 w-full ${t.bar}`} />
      <div className="p-5 pt-6">
        <div className="flex items-start justify-between gap-2">
          <Icon size={22} strokeWidth={1.75} className={t.text} />
          <span
            className={`rounded-full px-2 py-0.5 font-body text-xs font-medium ${STATE_BADGE[kpi.state]}`}
          >
            {STATE_LABEL[kpi.state]}
          </span>
        </div>
        <p
          className={`mt-3 font-display font-bold ${t.text} ${
            kpi.value === null ? 'text-xl' : 'text-3xl'
          }`}
        >
          {formatKpiValue(kpi.value, kpi.unit)}
        </p>
        <p className="mt-1 font-body text-sm font-medium text-ink-muted">
          {kpi.shortLabel}
        </p>
        <p className="mt-1 font-body text-xs text-ink-faint">
          {kpi.unit === 'pessoas' ? 'colaboradores activos' : kpi.description}
        </p>

        {showComparison && (
          <div
            className={`mt-3 flex items-center gap-1 font-body text-xs ${changeColor}`}
          >
            <ChangeIcon size={14} strokeWidth={2} />
            {kpi.change === null ? (
              <span className="text-ink-muted">Sem dados para comparar</span>
            ) : (
              <span>
                {kpi.change > 0 ? '+' : ''}
                {kpi.change.toLocaleString('pt-PT')}
                {kpi.unit === '%' ? ' p.p.' : ''}
                {kpi.changePct !== null &&
                  ` (${kpi.changePct > 0 ? '+' : ''}${kpi.changePct}%)`}{' '}
                <span className="text-ink-muted">
                  vs {formatKpiValue(kpi.previousValue, kpi.unit)}
                </span>
              </span>
            )}
          </div>
        )}
        {kpi.target !== null && (
          <p className="mt-1 font-body text-xs text-ink-muted">
            Meta: {formatKpiValue(kpi.target, kpi.unit)}
            {kpi.deviation !== null &&
              ` · desvio ${kpi.deviation > 0 ? '+' : ''}${kpi.deviation.toLocaleString('pt-PT')}`}
          </p>
        )}

        {trendPoints.length >= 2 && (
          <div className="mt-3 h-14">
            <AreaLineChart
              series={[{ label: kpi.shortLabel, points: trendPoints }]}
            />
          </div>
        )}

        <p className="mt-3 border-t border-border pt-2 font-body text-[11px] text-ink-faint">
          Origem: {kpi.sourceModules.join(', ')} · actualizado{' '}
          {formatDateTime(kpi.lastUpdatedAt)}
        </p>
      </div>
    </div>
  );
}

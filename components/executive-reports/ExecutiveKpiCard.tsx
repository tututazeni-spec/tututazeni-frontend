// components/executive-reports/ExecutiveKpiCard.tsx
// Cartão de KPI executivo (docs §3.1): valor actual, estado, comparação e
// meta. Usa o NavyStatCard partilhado; a cor segue o semáforo do KPI.

import type { LucideIcon } from 'lucide-react';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import type { ExecutiveKpi } from './dashboardTypes';
import { STATE_LABEL, STATE_TONE, formatKpiValue } from './kpiFormat';

export interface ExecutiveKpiCardProps {
  kpi: ExecutiveKpi;
  icon: LucideIcon;
  showComparison: boolean;
}

export function ExecutiveKpiCard({
  kpi,
  icon,
  showComparison,
}: ExecutiveKpiCardProps) {
  const parts: string[] = [STATE_LABEL[kpi.state]];
  if (showComparison && kpi.change !== null) {
    parts.push(
      `${kpi.change > 0 ? '+' : ''}${kpi.change.toLocaleString('pt-PT')}${
        kpi.unit === '%' ? ' p.p.' : ''
      } vs ${formatKpiValue(kpi.previousValue, kpi.unit)}`,
    );
  }
  if (kpi.target !== null) {
    parts.push(`Meta ${formatKpiValue(kpi.target, kpi.unit)}`);
  }

  return (
    <NavyStatCard
      icon={icon}
      tone={STATE_TONE[kpi.state]}
      label={kpi.shortLabel}
      value={formatKpiValue(kpi.value, kpi.unit)}
      sub={parts.join(' · ')}
    />
  );
}

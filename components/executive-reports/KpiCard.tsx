// components/executive-reports/KpiCard.tsx
// Cartão de KPI com variação vs. período anterior e target. Extraído
// de app/(platform)/executive-reports/page.tsx. Usa o NavyStatCard partilhado.

'use client';

import { BarChart2 } from 'lucide-react';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import type { Metric } from './types';

interface KpiCardProps {
  metric: Metric;
}

export function KpiCard({ metric }: KpiCardProps) {
  const variation =
    metric.previousValue && metric.previousValue !== 0
      ? Math.round(
          ((metric.value - metric.previousValue) / metric.previousValue) * 100,
        )
      : null;

  const sub = [
    variation !== null &&
      `${variation >= 0 ? '↑' : '↓'} ${Math.abs(variation)}% vs anterior`,
    metric.target && `Target: ${metric.target}${metric.unit ?? ''}`,
    metric.comment,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <NavyStatCard
      icon={BarChart2}
      tone={variation !== null && variation < 0 ? 'orange' : 'blue'}
      label={metric.label}
      value={`${metric.value.toLocaleString('pt-PT')}${metric.unit ? ` ${metric.unit}` : ''}`}
      sub={sub || undefined}
    />
  );
}

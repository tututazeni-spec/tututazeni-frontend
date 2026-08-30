// components/executive-reports/KpiCard.tsx
// Cartão de KPI com variação vs. período anterior e target. Extraído
// de app/(platform)/executive-reports/page.tsx.

'use client';

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

  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="mb-1 flex items-start justify-between gap-2">
        <div className="font-body text-xs leading-tight text-ink">
          {metric.label}
        </div>
      </div>
      <div className="font-mono text-2xl font-bold text-ink">
        {metric.value.toLocaleString('pt-PT')}
        {metric.unit && (
          <span className="ml-1 font-body text-base font-normal text-ink-faint">
            {metric.unit}
          </span>
        )}
      </div>
      <div className="mt-1 flex items-center justify-between">
        {variation !== null && (
          <span className="font-body text-xs font-medium text-ink">
            {variation >= 0 ? '↑' : '↓'} {Math.abs(variation)}% vs anterior
          </span>
        )}
        {metric.target && (
          <span className="font-body text-xs text-ink-faint">
            Target: {metric.target}
            {metric.unit}
          </span>
        )}
      </div>
      {metric.comment && (
        <p className="mt-1 font-body text-xs italic text-ink-muted">
          {metric.comment}
        </p>
      )}
    </div>
  );
}

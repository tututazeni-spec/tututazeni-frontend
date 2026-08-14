// components/executive-reports/KpiCard.tsx
// Cartão de KPI com variação vs. período anterior e target. Extraído
// de app/(platform)/executive-reports/page.tsx.

'use client';

import { cn } from '@/lib/cn';
import { KPI_STATUS } from './constants';
import type { Metric } from './types';

interface KpiCardProps {
  metric: Metric;
}

export function KpiCard({ metric }: KpiCardProps) {
  const statusCfg = metric.status ? KPI_STATUS[metric.status] : null;
  const variation =
    metric.previousValue && metric.previousValue !== 0
      ? Math.round(
          ((metric.value - metric.previousValue) / metric.previousValue) * 100,
        )
      : null;

  return (
    <div
      className={cn(
        'rounded-card border p-4',
        statusCfg ? `${statusCfg.bg} border-transparent` : 'bg-surface-sunken border-border',
      )}
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <div className="font-body text-xs leading-tight text-ink-muted">
          {metric.label}
        </div>
        {statusCfg && (
          <span className="flex-shrink-0 text-sm">{statusCfg.icon}</span>
        )}
      </div>
      <div
        className={cn(
          'font-mono text-2xl font-bold',
          statusCfg?.color ?? 'text-ink',
        )}
      >
        {metric.value.toLocaleString('pt-PT')}
        {metric.unit && (
          <span className="ml-1 font-body text-base font-normal text-ink-faint">
            {metric.unit}
          </span>
        )}
      </div>
      <div className="mt-1 flex items-center justify-between">
        {variation !== null && (
          <span
            className={cn(
              'font-body text-xs font-medium',
              variation >= 0 ? 'text-success' : 'text-danger',
            )}
          >
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

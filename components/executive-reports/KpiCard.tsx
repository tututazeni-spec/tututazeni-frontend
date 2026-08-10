// components/executive-reports/KpiCard.tsx
// Cartão de KPI com variação vs. período anterior e target. Extraído
// de app/(platform)/executive-reports/page.tsx.

'use client';

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
      className={`rounded-xl p-4 border ${statusCfg ? statusCfg.bg + ' border-transparent' : 'bg-gray-50 border-gray-200'}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="text-xs text-gray-500 leading-tight">
          {metric.label}
        </div>
        {statusCfg && (
          <span className="text-sm flex-shrink-0">{statusCfg.icon}</span>
        )}
      </div>
      <div
        className={`text-2xl font-bold font-mono ${statusCfg?.color ?? 'text-gray-900'}`}
      >
        {metric.value.toLocaleString('pt-PT')}
        {metric.unit && (
          <span className="text-base ml-1 font-normal text-gray-400">
            {metric.unit}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between mt-1">
        {variation !== null && (
          <span
            className={`text-xs font-medium ${variation >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
          >
            {variation >= 0 ? '↑' : '↓'} {Math.abs(variation)}% vs anterior
          </span>
        )}
        {metric.target && (
          <span className="text-xs text-gray-400">
            Target: {metric.target}
            {metric.unit}
          </span>
        )}
      </div>
      {metric.comment && (
        <p className="text-xs text-gray-500 mt-1 italic">{metric.comment}</p>
      )}
    </div>
  );
}

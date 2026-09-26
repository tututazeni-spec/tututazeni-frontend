// components/ui/charts/GaugeChart.tsx
// Gauge semicircular para uma única taxa/percentagem (0–100). Cor por
// limiar (bom/aviso/grave) usando charts/palette.ts#STATUS, ou `accent`
// quando não há limiares — mesma ideia de "sequential = uma cor" da skill
// dataviz aplicada a uma única leitura em vez de uma escala.

'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/cn';
import { STATUS } from './palette';

export interface GaugeThresholds {
  /** valor a partir do qual passa a aviso */
  warning: number;
  /** valor a partir do qual passa a grave */
  danger: number;
}

export interface GaugeChartProps {
  /** 0–100 */
  value: number;
  label?: string;
  /** limiares — por omissão, mais alto é melhor (invert inverte a leitura) */
  thresholds?: GaugeThresholds;
  /** true = valores mais baixos são melhores (ex.: taxa de rotatividade) */
  invert?: boolean;
  size?: number;
  className?: string;
  /**
   * Rótulo central — por omissão o próprio valor arredondado em "%". Recebe
   * o valor original (não limitado a 100), útil para métricas que podem
   * ultrapassar 100% (ex.: ROI) — o arco continua a representar o valor
   * limitado a [0,100], só o texto mostra o número real.
   */
  format?: (value: number) => string;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end = polarToCartesian(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg <= 180 ? 0 : 1;
  return `M${start.x},${start.y} A${r},${r} 0 ${largeArc} 1 ${end.x},${end.y}`;
}

function resolveColor(value: number, thresholds?: GaugeThresholds, invert = false): string {
  if (!thresholds) return 'var(--color-accent)';
  const { warning, danger } = thresholds;
  if (invert) {
    if (value >= danger) return STATUS.serious;
    if (value >= warning) return STATUS.warning;
    return STATUS.good;
  }
  if (value <= danger) return STATUS.serious;
  if (value <= warning) return STATUS.warning;
  return STATUS.good;
}

export function GaugeChart({ value, label, thresholds, invert, size = 160, className, format }: GaugeChartProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 12;
  const color = useMemo(() => resolveColor(clamped, thresholds, invert), [clamped, thresholds, invert]);
  const sweep = 180 * (clamped / 100);
  const viewHeight = size / 2 + 16;
  const displayText = format ? format(value) : `${Math.round(clamped)}%`;

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <svg
        width={size}
        height={viewHeight}
        viewBox={`0 0 ${size} ${viewHeight}`}
        role="img"
        aria-label={`${label ?? 'Valor'}: ${Math.round(clamped)}%`}
      >
        <path d={arcPath(cx, cy, r, 180, 360)} className="stroke-surface-sunken" strokeWidth={12} fill="none" strokeLinecap="round" />
        <path d={arcPath(cx, cy, r, 180, 180 + sweep)} stroke={color} strokeWidth={12} fill="none" strokeLinecap="round" />
      </svg>
      <p className="-mt-7 font-display text-2xl font-bold text-ink">{displayText}</p>
      {label && <p className="mt-1 text-center font-body text-xs text-ink-muted">{label}</p>}
    </div>
  );
}

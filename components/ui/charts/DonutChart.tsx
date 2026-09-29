// components/ui/charts/DonutChart.tsx
// Composição de um total em partes — segmentos na ordem categórica fixa de
// charts/palette.ts. Acima de 4 categorias o resto agrupa-se em "Outros"
// (nunca gera uma 5ª cor — regra da skill dataviz).

'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { ChartTooltip } from './ChartTooltip';
import { ChartLegend } from './ChartLegend';
import {
  CATEGORICAL,
  CATEGORICAL_OTHER_COLOR,
  CATEGORICAL_OTHER_LABEL,
} from './palette';

export interface DonutChartDatum {
  label: string;
  value: number;
  color?: string;
}

export interface DonutChartProps {
  data: DonutChartDatum[];
  size?: number;
  centerLabel?: string;
  valueFormat?: (v: number) => string;
  className?: string;
}

const MAX_SLICES = 4;
const GAP_DEG = 2;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function donutSlicePath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startDeg: number,
  endDeg: number,
) {
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  const p1 = polarToCartesian(cx, cy, rOuter, startDeg);
  const p2 = polarToCartesian(cx, cy, rOuter, endDeg);
  const p3 = polarToCartesian(cx, cy, rInner, endDeg);
  const p4 = polarToCartesian(cx, cy, rInner, startDeg);
  return [
    `M${p1.x},${p1.y}`,
    `A${rOuter},${rOuter} 0 ${largeArc} 1 ${p2.x},${p2.y}`,
    `L${p3.x},${p3.y}`,
    `A${rInner},${rInner} 0 ${largeArc} 0 ${p4.x},${p4.y}`,
    'Z',
  ].join(' ');
}

export function DonutChart({
  data,
  size = 180,
  centerLabel,
  valueFormat = String,
  className,
}: DonutChartProps) {
  const [hover, setHover] = useState<number | null>(null);

  const slices = useMemo(() => {
    const withValues = data.filter((d) => d.value > 0);
    const sorted = [...withValues].sort((a, b) => b.value - a.value);
    const top = sorted.slice(0, MAX_SLICES);
    const rest = sorted.slice(MAX_SLICES);
    const restTotal = rest.reduce((sum, d) => sum + d.value, 0);
    const items = top.map((d, i) => ({
      ...d,
      color: d.color ?? CATEGORICAL[i % CATEGORICAL.length],
    }));
    if (restTotal > 0) {
      items.push({
        label: CATEGORICAL_OTHER_LABEL,
        value: restTotal,
        color: CATEGORICAL_OTHER_COLOR,
      });
    }
    return items;
  }, [data]);

  const total = slices.reduce((sum, d) => sum + d.value, 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - 4;
  const rInner = rOuter * 0.62;

  const withAngles = useMemo(
    () =>
      slices.reduce<
        ((typeof slices)[number] & { startDeg: number; endDeg: number })[]
      >((acc, d) => {
        const prevEnd = acc.length > 0 ? acc[acc.length - 1].endDeg : 0;
        const endDeg = prevEnd + (d.value / total) * 360;
        return [...acc, { ...d, startDeg: prevEnd, endDeg }];
      }, []),
    [slices, total],
  );

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className="relative">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={centerLabel ?? 'Distribuição'}
        >
          {withAngles.map((d, i) => {
            const hasGap = withAngles.length > 1;
            const start = hasGap ? d.startDeg + GAP_DEG / 2 : d.startDeg;
            const end = hasGap ? d.endDeg - GAP_DEG / 2 : d.endDeg;
            return (
              <path
                key={d.label}
                d={donutSlicePath(
                  cx,
                  cy,
                  rOuter,
                  rInner,
                  start,
                  Math.max(start, end),
                )}
                fill={d.color}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-display text-xl font-bold text-ink">
            {valueFormat(total)}
          </p>
          {centerLabel && (
            <p className="font-body text-[10px] text-ink-faint">
              {centerLabel}
            </p>
          )}
        </div>
        {hover != null && (
          <ChartTooltip xPct={50} yPct={0}>
            <p className="font-medium">{withAngles[hover].label}</p>
            <p>{valueFormat(withAngles[hover].value)}</p>
          </ChartTooltip>
        )}
      </div>
      <ChartLegend
        items={withAngles.map((d) => ({
          label: d.label,
          color: d.color,
          value: valueFormat(d.value),
        }))}
      />
    </div>
  );
}

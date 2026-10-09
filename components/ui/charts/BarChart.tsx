// components/ui/charts/BarChart.tsx
// Barras verticais ou horizontais, série única ou agrupada. Mesma convenção
// de construção dos restantes gráficos do design system: SVG à mão, sem
// libraria externa, cores de série vindas de charts/palette.ts.

'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { ChartTooltip } from './ChartTooltip';
import { ChartLegend } from './ChartLegend';
import { CATEGORICAL } from './palette';

export interface BarChartSeries {
  label: string;
  color?: string;
  /** valores alinhados com `categories`, por índice */
  values: number[];
  /** cor por categoria (por índice); tem precedência sobre `color` */
  barColors?: string[];
}

export interface BarChartProps {
  categories: string[];
  series: BarChartSeries[];
  orientation?: 'vertical' | 'horizontal';
  height?: number;
  yFormat?: (v: number) => string;
  className?: string;
}

const PADDING_V = { top: 16, right: 16, bottom: 32, left: 44 };
const PADDING_H = { top: 8, right: 40, bottom: 8, left: 120 };
const WIDTH = 640;
const BAR_RADIUS = 4;
const ROW_HEIGHT = 32;

// Marca "4px rounded data-ends anchored to the baseline": para barras
// verticais o topo arredonda, a base (0) fica quadrada.
function topRoundedRectPath(x: number, y: number, w: number, h: number) {
  if (h <= 0 || w <= 0) return '';
  const r = Math.min(BAR_RADIUS, w / 2, h);
  return `M${x},${y + h} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h} Z`;
}

// Para barras horizontais, o lado que arredonda é o extremo (direita), a
// base (esquerda, valor 0) fica quadrada.
function rightRoundedRectPath(x: number, y: number, w: number, h: number) {
  if (h <= 0 || w <= 0) return '';
  const r = Math.min(BAR_RADIUS, h / 2, w);
  return `M${x},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} L${x},${y + h} Z`;
}

export function BarChart({
  categories,
  series,
  orientation = 'vertical',
  height = 240,
  yFormat = String,
  className,
}: BarChartProps) {
  const [hover, setHover] = useState<{
    seriesIdx: number;
    catIdx: number;
    cx: number;
    cy: number;
  } | null>(null);

  const max = useMemo(
    () => Math.max(1, ...series.flatMap((s) => s.values)),
    [series],
  );
  const isHorizontal = orientation === 'horizontal';
  const padding = isHorizontal ? PADDING_H : PADDING_V;
  const resolvedHeight = isHorizontal
    ? categories.length * ROW_HEIGHT + padding.top + padding.bottom
    : height;
  const plotW = WIDTH - padding.left - padding.right;
  const plotH = resolvedHeight - padding.top - padding.bottom;
  const groupCount = Math.max(1, categories.length);
  const seriesCount = Math.max(1, series.length);

  return (
    <div className={cn('relative', className)}>
      <svg
        viewBox={`0 0 ${WIDTH} ${resolvedHeight}`}
        className="w-full"
        role="img"
        aria-label={series.map((s) => s.label).join(', ')}
      >
        {isHorizontal ? (
          <>
            {Array.from({ length: 4 }, (_, i) => {
              const v = (max * i) / 3;
              const x = padding.left + (v / max) * plotW;
              return (
                <line
                  key={i}
                  x1={x}
                  x2={x}
                  y1={padding.top}
                  y2={resolvedHeight - padding.bottom}
                  className="stroke-border"
                  strokeWidth={1}
                />
              );
            })}
            {categories.map((cat, ci) => {
              const groupH = plotH / groupCount;
              const barH = Math.min(20, (groupH * 0.7) / seriesCount);
              return (
                <g key={cat}>
                  <text
                    x={padding.left - 10}
                    y={padding.top + groupH * ci + groupH / 2 + 3}
                    textAnchor="end"
                    className="fill-ink-muted text-[10px]"
                  >
                    {cat}
                  </text>
                  {series.map((s, si) => {
                    const v = s.values[ci] ?? 0;
                    const w = (v / max) * plotW;
                    const y =
                      padding.top +
                      groupH * ci +
                      groupH / 2 -
                      (barH * seriesCount) / 2 +
                      barH * si;
                    const color =
                      s.barColors?.[ci] ??
                      s.color ??
                      CATEGORICAL[si % CATEGORICAL.length];
                    return (
                      <path
                        key={s.label}
                        d={rightRoundedRectPath(
                          padding.left,
                          y,
                          w,
                          barH * 0.82,
                        )}
                        fill={color}
                        stroke="var(--color-surface)"
                        strokeWidth={1}
                        onMouseEnter={() =>
                          setHover({
                            seriesIdx: si,
                            catIdx: ci,
                            cx: padding.left + w,
                            cy: y,
                          })
                        }
                        onMouseLeave={() => setHover(null)}
                      />
                    );
                  })}
                </g>
              );
            })}
          </>
        ) : (
          <>
            {Array.from({ length: 4 }, (_, i) => {
              const v = (max * i) / 3;
              const y = padding.top + plotH - (v / max) * plotH;
              return (
                <g key={i}>
                  <line
                    x1={padding.left}
                    x2={WIDTH - padding.right}
                    y1={y}
                    y2={y}
                    className="stroke-border"
                    strokeWidth={1}
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-ink-faint text-[9px]"
                  >
                    {yFormat(Math.round(v))}
                  </text>
                </g>
              );
            })}
            {categories.map((cat, ci) => {
              const groupW = plotW / groupCount;
              const barW = Math.min(28, (groupW * 0.6) / seriesCount);
              return (
                <g key={cat}>
                  <text
                    x={padding.left + groupW * ci + groupW / 2}
                    y={resolvedHeight - padding.bottom + 16}
                    textAnchor="middle"
                    className="fill-ink-faint text-[9px]"
                  >
                    {cat}
                  </text>
                  {series.map((s, si) => {
                    const v = s.values[ci] ?? 0;
                    const h = (v / max) * plotH;
                    const x =
                      padding.left +
                      groupW * ci +
                      groupW / 2 -
                      (barW * seriesCount) / 2 +
                      barW * si;
                    const y = padding.top + plotH - h;
                    const color =
                      s.barColors?.[ci] ??
                      s.color ??
                      CATEGORICAL[si % CATEGORICAL.length];
                    return (
                      <path
                        key={s.label}
                        d={topRoundedRectPath(x, y, barW * 0.82, h)}
                        fill={color}
                        stroke="var(--color-surface)"
                        strokeWidth={1}
                        onMouseEnter={() =>
                          setHover({ seriesIdx: si, catIdx: ci, cx: x, cy: y })
                        }
                        onMouseLeave={() => setHover(null)}
                      />
                    );
                  })}
                </g>
              );
            })}
          </>
        )}
      </svg>

      {hover && (
        <ChartTooltip
          xPct={(hover.cx / WIDTH) * 100}
          yPct={(hover.cy / resolvedHeight) * 100}
        >
          <p className="font-medium">{categories[hover.catIdx]}</p>
          <p>
            {series[hover.seriesIdx].label}:{' '}
            {yFormat(series[hover.seriesIdx].values[hover.catIdx])}
          </p>
        </ChartTooltip>
      )}

      {!series.every((s) => s.barColors) && (
        <ChartLegend
          className="mt-2"
          items={series.map((s, i) => ({
            label: s.label,
            color: s.color ?? CATEGORICAL[i % CATEGORICAL.length],
          }))}
        />
      )}
    </div>
  );
}

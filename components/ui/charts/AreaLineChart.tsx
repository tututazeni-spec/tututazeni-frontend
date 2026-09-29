// components/ui/charts/AreaLineChart.tsx
// Linha com área — evolução ao longo do tempo (uma ou mais séries). Mesmo
// padrão de construção que components/roi-impact/ScatterPlot.tsx: viewBox
// fixo, escalas manuais, sem libraria externa (convenção do projecto).

'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { ChartTooltip } from './ChartTooltip';
import { ChartLegend } from './ChartLegend';
import { CATEGORICAL } from './palette';

export interface AreaLinePoint {
  x: number;
  y: number;
  xLabel?: string;
}

export interface AreaLineSeries {
  label: string;
  color?: string;
  points: AreaLinePoint[];
}

export interface AreaLineChartProps {
  series: AreaLineSeries[];
  height?: number;
  yFormat?: (v: number) => string;
  className?: string;
}

const PADDING = { top: 16, right: 16, bottom: 28, left: 44 };
const WIDTH = 640;
const Y_TICKS = 4;

export function AreaLineChart({
  series,
  height = 220,
  yFormat = String,
  className,
}: AreaLineChartProps) {
  const [hover, setHover] = useState<{
    seriesIdx: number;
    pointIdx: number;
    cx: number;
    cy: number;
  } | null>(null);

  const { yMin, yMax, xMin, xMax } = useMemo(() => {
    const allPoints = series.flatMap((s) => s.points);
    const ys = allPoints.map((p) => p.y);
    const xs = allPoints.map((p) => p.x);
    return {
      yMin: Math.min(0, ...ys),
      yMax: Math.max(1, ...ys),
      xMin: Math.min(0, ...xs),
      xMax: Math.max(1, ...xs),
    };
  }, [series]);

  const plotW = WIDTH - PADDING.left - PADDING.right;
  const plotH = height - PADDING.top - PADDING.bottom;
  const scaleX = (x: number) =>
    PADDING.left + ((x - xMin) / (xMax - xMin || 1)) * plotW;
  const scaleY = (y: number) =>
    PADDING.top + plotH - ((y - yMin) / (yMax - yMin || 1)) * plotH;

  const xLabels = series[0]?.points ?? [];
  const labelStep = Math.max(1, Math.ceil(xLabels.length / 8));

  return (
    <div className={cn('relative', className)}>
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        className="w-full"
        role="img"
        aria-label={series.map((s) => s.label).join(', ')}
      >
        <defs>
          {series.map((s, i) => {
            const color = s.color ?? CATEGORICAL[i % CATEGORICAL.length];
            return (
              <linearGradient
                key={s.label}
                id={`area-fill-${i}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            );
          })}
        </defs>

        {/* grelha recessiva */}
        {Array.from({ length: Y_TICKS + 1 }, (_, i) => {
          const v = yMin + ((yMax - yMin) * i) / Y_TICKS;
          const y = scaleY(v);
          return (
            <g key={`y-${i}`}>
              <line
                x1={PADDING.left}
                x2={WIDTH - PADDING.right}
                y1={y}
                y2={y}
                className="stroke-border"
                strokeWidth={1}
              />
              <text
                x={PADDING.left - 8}
                y={y + 3}
                textAnchor="end"
                className="fill-ink-faint text-[9px]"
              >
                {yFormat(Math.round(v))}
              </text>
            </g>
          );
        })}

        {series.map((s, i) => {
          const color = s.color ?? CATEGORICAL[i % CATEGORICAL.length];
          if (s.points.length === 0) return null;
          const linePath = s.points
            .map(
              (p, pi) => `${pi === 0 ? 'M' : 'L'}${scaleX(p.x)},${scaleY(p.y)}`,
            )
            .join(' ');
          const areaPath =
            `${linePath} L${scaleX(s.points[s.points.length - 1].x)},${scaleY(yMin)} ` +
            `L${scaleX(s.points[0].x)},${scaleY(yMin)} Z`;
          return (
            <g key={s.label}>
              <path d={areaPath} fill={`url(#area-fill-${i})`} />
              <path
                d={linePath}
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {s.points.map((p, pi) => (
                <circle
                  key={pi}
                  cx={scaleX(p.x)}
                  cy={scaleY(p.y)}
                  r={3.5}
                  fill={color}
                  stroke="var(--color-surface)"
                  strokeWidth={1.5}
                  onMouseEnter={() =>
                    setHover({
                      seriesIdx: i,
                      pointIdx: pi,
                      cx: scaleX(p.x),
                      cy: scaleY(p.y),
                    })
                  }
                  onMouseLeave={() => setHover(null)}
                />
              ))}
            </g>
          );
        })}

        {/* eixo X — rótulos partilhados entre séries (1ª série como referência) */}
        {xLabels.map((p, i) =>
          i % labelStep === 0 ? (
            <text
              key={i}
              x={scaleX(p.x)}
              y={height - PADDING.bottom + 16}
              textAnchor="middle"
              className="fill-ink-faint text-[9px]"
            >
              {p.xLabel ?? p.x}
            </text>
          ) : null,
        )}
      </svg>

      {hover && (
        <ChartTooltip
          xPct={(hover.cx / WIDTH) * 100}
          yPct={(hover.cy / height) * 100}
        >
          <p className="font-medium">{series[hover.seriesIdx].label}</p>
          <p>
            {series[hover.seriesIdx].points[hover.pointIdx].xLabel ??
              series[hover.seriesIdx].points[hover.pointIdx].x}
            {' · '}
            {yFormat(series[hover.seriesIdx].points[hover.pointIdx].y)}
          </p>
        </ChartTooltip>
      )}

      <ChartLegend
        className="mt-2"
        items={series.map((s, i) => ({
          label: s.label,
          color: s.color ?? CATEGORICAL[i % CATEGORICAL.length],
        }))}
      />
    </div>
  );
}

// components/roi-impact/ScatterPlot.tsx
// Gráfico de dispersão minimalista para "Correlações" (docs/roi-impact.md
// §7) — uma única série (um ponto por colaborador/departamento), por isso
// sem legenda (o título do gráfico já nomeia a série). Eixos recessivos,
// marcadores finos com anel de contraste na superfície, tooltip por ponto
// ao passar o rato.

'use client';

import { useMemo, useState } from 'react';

export interface ScatterPlotPoint {
  x: number;
  y: number;
  label?: string;
}

export interface ScatterPlotProps {
  points: ScatterPlotPoint[];
  xLabel: string;
  yLabel: string;
  height?: number;
}

const PADDING = { top: 16, right: 20, bottom: 40, left: 56 };

export function ScatterPlot({ points, xLabel, yLabel, height = 280 }: ScatterPlotProps) {
  const [hover, setHover] = useState<{ point: ScatterPlotPoint; cx: number; cy: number } | null>(null);
  const width = 640;

  const { xMin, xMax, yMin, yMax } = useMemo(() => {
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const xMinRaw = Math.min(...xs);
    const xMaxRaw = Math.max(...xs);
    const yMinRaw = Math.min(...ys);
    const yMaxRaw = Math.max(...ys);
    const xPad = (xMaxRaw - xMinRaw || 1) * 0.08;
    const yPad = (yMaxRaw - yMinRaw || 1) * 0.08;
    return {
      xMin: xMinRaw - xPad,
      xMax: xMaxRaw + xPad,
      yMin: yMinRaw - yPad,
      yMax: yMaxRaw + yPad,
    };
  }, [points]);

  const plotW = width - PADDING.left - PADDING.right;
  const plotH = height - PADDING.top - PADDING.bottom;

  const scaleX = (x: number) => PADDING.left + ((x - xMin) / (xMax - xMin || 1)) * plotW;
  const scaleY = (y: number) => PADDING.top + plotH - ((y - yMin) / (yMax - yMin || 1)) * plotH;

  const xTicks = 4;
  const yTicks = 4;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={`${xLabel} vs ${yLabel}`}>
        {/* Grelha recessiva */}
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const v = yMin + ((yMax - yMin) * i) / yTicks;
          const y = scaleY(v);
          return (
            <g key={`y-${i}`}>
              <line x1={PADDING.left} x2={width - PADDING.right} y1={y} y2={y} className="stroke-border" strokeWidth={1} />
              <text x={PADDING.left - 8} y={y + 3} textAnchor="end" className="fill-ink-faint text-[9px]">
                {Number.isInteger(v) ? v : v.toFixed(1)}
              </text>
            </g>
          );
        })}
        {Array.from({ length: xTicks + 1 }, (_, i) => {
          const v = xMin + ((xMax - xMin) * i) / xTicks;
          const x = scaleX(v);
          return (
            <g key={`x-${i}`}>
              <text x={x} y={height - PADDING.bottom + 16} textAnchor="middle" className="fill-ink-faint text-[9px]">
                {Number.isInteger(v) ? v : v.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Eixos */}
        <line
          x1={PADDING.left}
          x2={PADDING.left}
          y1={PADDING.top}
          y2={height - PADDING.bottom}
          className="stroke-border"
          strokeWidth={1.5}
        />
        <line
          x1={PADDING.left}
          x2={width - PADDING.right}
          y1={height - PADDING.bottom}
          y2={height - PADDING.bottom}
          className="stroke-border"
          strokeWidth={1.5}
        />

        {/* Pontos */}
        {points.map((p, i) => {
          const cx = scaleX(p.x);
          const cy = scaleY(p.y);
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={4}
              className="fill-accent stroke-surface"
              strokeWidth={1.5}
              fillOpacity={0.75}
              onMouseEnter={() => setHover({ point: p, cx, cy })}
              onMouseLeave={() => setHover(null)}
            />
          );
        })}

        {/* Labels dos eixos */}
        <text x={(width + PADDING.left - PADDING.right) / 2} y={height - 6} textAnchor="middle" className="fill-ink-muted text-[10px] font-medium">
          {xLabel}
        </text>
        <text
          x={-(height / 2)}
          y={14}
          textAnchor="middle"
          transform="rotate(-90)"
          className="fill-ink-muted text-[10px] font-medium"
        >
          {yLabel}
        </text>
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute rounded-card border border-border bg-surface px-2 py-1 text-[10px] text-ink shadow-md"
          style={{
            left: `${(hover.cx / width) * 100}%`,
            top: `${(hover.cy / height) * 100}%`,
            transform: 'translate(-50%, -130%)',
          }}
        >
          {hover.point.label && <p className="font-medium">{hover.point.label}</p>}
          <p>
            {xLabel}: {hover.point.x} · {yLabel}: {hover.point.y}
          </p>
        </div>
      )}
    </div>
  );
}

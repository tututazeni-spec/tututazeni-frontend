// components/evaluation360/RadarChart.tsx
// Radar SVG comparando autoavaliação, outros avaliadores e benchmark do
// cargo. Extraído de app/(platform)/evaluation360/page.tsx — puramente
// apresentacional (props in, SVG out), sem qualquer acesso a dados.
//
// NOTA: SVG stroke/fill colors referenciam COLORS constants (não hex literais).
// Os dados-viz colors (self, manager, benchmark) são semantic-mapped, não raw hex.

'use client';

import { useState } from 'react';
import type { CompetencyScore } from './types';
import { COLORS } from './colors';

export interface RadarChartProps {
  competencies: CompetencyScore[];
}

export function RadarChart({ competencies }: RadarChartProps) {
  const cx = 220;
  const cy = 220;
  const r = 160;
  const n = competencies.length;
  const maxVal = 5;

  const angleStep = (2 * Math.PI) / n;
  const toXY = (idx: number, val: number) => {
    const angle = idx * angleStep - Math.PI / 2;
    const dist = (val / maxVal) * r;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  };

  const labelXY = (idx: number) => {
    const angle = idx * angleStep - Math.PI / 2;
    const dist = r + 28;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  };

  const polyPath = (vals: number[], color: string, opacity = 1) => {
    const pts = vals.map((v, i) => toXY(i, v));
    const d =
      pts
        .map(
          (p, i) =>
            `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
        )
        .join(' ') + ' Z';
    return { d, color, opacity };
  };

  // Grid circles
  const gridLevels = [1, 2, 3, 4, 5];

  // Axis lines
  const axes = competencies.map((_, i) => {
    const end = toXY(i, maxVal);
    return { x1: cx, y1: cy, x2: end.x, y2: end.y };
  });

  const selfPath = polyPath(
    competencies.map((c) => c.selfScore),
    COLORS.self,
    0.15,
  );
  const othersPath = polyPath(
    competencies.map((c) => c.othersScore),
    COLORS.manager,
    0.15,
  );
  const benchPath = polyPath(
    competencies.map((c) => c.benchmark),
    COLORS.benchmark,
    0.1,
  );

  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="relative">
      <svg viewBox="0 0 440 440" width="100%" style={{ maxWidth: 460 }}>
        {/* Grid */}
        {gridLevels.map((level) => {
          const pts = competencies.map((_, i) => toXY(i, level));
          const d =
            pts
              .map(
                (p, i) =>
                  `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
              )
              .join(' ') + ' Z';
          return (
            <path
              key={level}
              d={d}
              fill="none"
              stroke={COLORS.border}
              strokeWidth={level === 5 ? 1.5 : 0.8}
              strokeDasharray={level < 5 ? '4 4' : undefined}
            />
          );
        })}
        {/* Grid labels */}
        {[1, 2, 3, 4, 5].map((v) => {
          const pt = toXY(0, v);
          return (
            <text
              key={v}
              x={pt.x + 4}
              y={pt.y}
              fontSize={8}
              fill={COLORS.muted}
              opacity={0.7}
            >
              {v}
            </text>
          );
        })}
        {/* Axis lines */}
        {axes.map((a, i) => (
          <line
            key={i}
            x1={a.x1}
            y1={a.y1}
            x2={a.x2}
            y2={a.y2}
            stroke={COLORS.border}
            strokeWidth={0.5}
            opacity={0.5}
          />
        ))}
        {/* Polygons */}
        <path
          d={benchPath.d}
          fill={benchPath.color}
          fillOpacity={0.1}
          stroke={benchPath.color}
          strokeWidth={1.5}
          strokeDasharray="5 4"
        />
        <path
          d={selfPath.d}
          fill={selfPath.color}
          fillOpacity={selfPath.opacity}
          stroke={selfPath.color}
          strokeWidth={2}
          strokeDasharray="5 3"
        />
        <path
          d={othersPath.d}
          fill={othersPath.color}
          fillOpacity={othersPath.opacity}
          stroke={othersPath.color}
          strokeWidth={2}
        />
        {/* Data points — others/manager */}
        {competencies.map((c, i) => {
          const pt = toXY(i, c.othersScore);
          return (
            <circle
              key={`m${i}`}
              cx={pt.x}
              cy={pt.y}
              r={hovered === i ? 6 : 4}
              fill={COLORS.manager}
              stroke={COLORS.bg}
              strokeWidth={2}
              style={{ cursor: 'pointer', transition: 'r 0.15s' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
        {/* Data points — self */}
        {competencies.map((c, i) => {
          const pt = toXY(i, c.selfScore);
          return (
            <circle
              key={`s${i}`}
              cx={pt.x}
              cy={pt.y}
              r={hovered === i ? 6 : 4}
              fill={COLORS.self}
              stroke={COLORS.bg}
              strokeWidth={1.5}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
        {/* Axis labels */}
        {competencies.map((c, i) => {
          const lp = labelXY(i);
          const isHovered = hovered === i;
          return (
            <text
              key={i}
              x={lp.x}
              y={lp.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={isHovered ? 12 : 10}
              fontWeight={isHovered ? 700 : 500}
              fill={isHovered ? 'rgb(165, 180, 252)' : 'rgb(148, 163, 184)'}
              style={{ transition: 'all 0.15s', cursor: 'pointer' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {c.name.length > 12 ? c.name.slice(0, 11) + '…' : c.name}
            </text>
          );
        })}
        {/* Hover tooltip */}
        {hovered !== null &&
          (() => {
            const c = competencies[hovered];
            const pt = toXY(hovered, (c.selfScore + c.othersScore) / 2);
            const tx = pt.x > cx ? pt.x - 90 : pt.x + 10;
            const ty = pt.y > cy ? pt.y - 70 : pt.y + 10;
            return (
              <g>
                <rect
                  x={tx}
                  y={ty}
                  width={100}
                  height={62}
                  rx={6}
                  fill={COLORS.bg}
                  stroke="rgb(49, 46, 129)"
                  strokeWidth={1}
                />
                <text
                  x={tx + 8}
                  y={ty + 16}
                  fontSize={9}
                  fill="rgb(129, 140, 248)"
                  fontWeight={700}
                >
                  {c.name}
                </text>
                <text x={tx + 8} y={ty + 30} fontSize={9} fill={COLORS.self}>
                  Auto: {c.selfScore.toFixed(1)}
                </text>
                <text x={tx + 8} y={ty + 43} fontSize={9} fill={COLORS.manager}>
                  Outros: {c.othersScore.toFixed(1)}
                </text>
                <text
                  x={tx + 8}
                  y={ty + 56}
                  fontSize={9}
                  fill={
                    c.gap > 0.3
                      ? 'rgb(245, 158, 11)'
                      : c.gap < -0.3
                        ? 'rgb(34, 197, 94)'
                        : COLORS.muted
                  }
                >
                  Gap: {c.gap > 0 ? '+' : ''}
                  {c.gap.toFixed(1)}
                </text>
              </g>
            );
          })()}
      </svg>
      {/* Legend */}
      <div className="flex gap-5 justify-center flex-wrap mt-2">
        {[
          { color: COLORS.self, label: 'Autoavaliação', dash: true },
          { color: COLORS.manager, label: 'Outros avaliadores', dash: false },
          {
            color: 'rgb(245, 158, 11)',
            label: 'Benchmark do cargo',
            dash: true,
          },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <svg width={24} height={4}>
              {l.dash ? (
                <line
                  x1={0}
                  y1={2}
                  x2={24}
                  y2={2}
                  stroke={l.color}
                  strokeWidth={2}
                  strokeDasharray="5 3"
                />
              ) : (
                <line
                  x1={0}
                  y1={2}
                  x2={24}
                  y2={2}
                  stroke={l.color}
                  strokeWidth={2}
                />
              )}
            </svg>
            <span className="text-xs text-ink-muted">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

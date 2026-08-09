// components/evaluation360/RadarChart.tsx
// Radar SVG comparando autoavaliação, outros avaliadores e benchmark do
// cargo. Extraído de app/(platform)/evaluation360/page.tsx — puramente
// apresentacional (props in, SVG out), sem qualquer acesso a dados.

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
    <div style={{ position: 'relative' }}>
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
              stroke="#1e2a3a"
              strokeWidth={level === 5 ? 1.5 : 0.8}
              strokeDasharray={level < 5 ? '4 4' : undefined}
            />
          );
        })}
        {/* Grid labels */}
        {[1, 2, 3, 4, 5].map((v) => (
          <text
            key={v}
            x={cx + 6}
            y={cy - (v / maxVal) * r + 4}
            fontSize={9}
            fill="#374151"
          >
            {v}
          </text>
        ))}
        {/* Axis lines */}
        {axes.map((ax, i) => (
          <line
            key={i}
            x1={ax.x1}
            y1={ax.y1}
            x2={ax.x2}
            y2={ax.y2}
            stroke="#1e2a3a"
            strokeWidth={1}
          />
        ))}
        {/* Benchmark area */}
        <path
          d={benchPath.d}
          fill="#f59e0b"
          fillOpacity={0.06}
          stroke="#f59e0b"
          strokeWidth={1}
          strokeDasharray="5 3"
        />
        {/* Others area */}
        <path
          d={othersPath.d}
          fill={COLORS.manager}
          fillOpacity={0.12}
          stroke={COLORS.manager}
          strokeWidth={2}
        />
        {/* Self area */}
        <path
          d={selfPath.d}
          fill={COLORS.self}
          fillOpacity={0.18}
          stroke={COLORS.self}
          strokeWidth={2}
          strokeDasharray="6 3"
        />
        {/* Data points — others */}
        {competencies.map((c, i) => {
          const pt = toXY(i, c.othersScore);
          return (
            <circle
              key={`o${i}`}
              cx={pt.x}
              cy={pt.y}
              r={hovered === i ? 7 : 5}
              fill={COLORS.manager}
              stroke="#0f1c30"
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
              stroke="#0f1c30"
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
              fill={isHovered ? '#a5b4fc' : '#94a3b8'}
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
                  fill="#0f172a"
                  stroke="#312e81"
                  strokeWidth={1}
                />
                <text
                  x={tx + 8}
                  y={ty + 16}
                  fontSize={9}
                  fill="#818cf8"
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
                      ? '#f59e0b'
                      : c.gap < -0.3
                        ? '#22c55e'
                        : '#64748b'
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
      <div
        style={{
          display: 'flex',
          gap: 20,
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginTop: 8,
        }}
      >
        {[
          { color: COLORS.self, label: 'Autoavaliação', dash: true },
          { color: COLORS.manager, label: 'Outros avaliadores', dash: false },
          { color: '#f59e0b', label: 'Benchmark do cargo', dash: true },
        ].map((l) => (
          <div
            key={l.label}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
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
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

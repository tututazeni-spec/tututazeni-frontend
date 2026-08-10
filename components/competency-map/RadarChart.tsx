// components/competency-map/RadarChart.tsx
// Radar SVG actual × exigido por tipo de competência. Extraído de
// app/(platform)/competency-map/page.tsx.

'use client';

import { TYPE_CONFIG } from './constants';
import type { RadarData, SkillType } from './types';

interface RadarChartProps {
  data: RadarData;
}

export function RadarChart({ data }: RadarChartProps) {
  const points = data.radarByType;
  if (!points.length) return null;

  const size = 200;
  const center = size / 2;
  const maxR = 80;
  const n = points.length;

  const toXY = (val: number, idx: number, max: number) => {
    const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
    const r = (val / 5) * maxR;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const currentPts = points.map((p, i) => toXY(p.avgCurrent, i, 5));
  const requiredPts = points.map((p, i) => toXY(p.avgRequired, i, 5));
  const axisPts = points.map((_, i) => toXY(5, i, 5));

  const toPath = (pts: Array<{ x: number; y: number }>) =>
    pts
      .map(
        (p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`,
      )
      .join(' ') + 'Z';

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        {/* Grid circles */}
        {[1, 2, 3, 4, 5].map((l) => (
          <circle
            key={l}
            cx={center}
            cy={center}
            r={(l / 5) * maxR}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}
        {/* Axis lines */}
        {axisPts.map((p, i) => (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={p.x}
            y2={p.y}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}
        {/* Required area */}
        <path
          d={toPath(requiredPts)}
          fill="rgba(239,68,68,0.1)"
          stroke="#ef4444"
          strokeWidth="1.5"
          strokeDasharray="4,2"
        />
        {/* Current area */}
        <path
          d={toPath(currentPts)}
          fill="rgba(59,130,246,0.2)"
          stroke="#3b82f6"
          strokeWidth="2"
        />
        {/* Labels */}
        {points.map((p, i) => {
          const ap = toXY(5.5, i, 5);
          return (
            <text
              key={i}
              x={ap.x}
              y={ap.y}
              fontSize="8"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#6b7280"
              fontWeight="600"
            >
              {TYPE_CONFIG[p.type as SkillType]?.label?.split(' ')[0]}
            </text>
          );
        })}
      </svg>
      <div className="flex items-center gap-4 text-xs mt-2">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-blue-500 rounded" />
          <span className="text-gray-500">Actual</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-3 h-0.5 bg-red-400 rounded"
            style={{ borderStyle: 'dashed' }}
          />
          <span className="text-gray-500">Exigido</span>
        </div>
      </div>
    </div>
  );
}

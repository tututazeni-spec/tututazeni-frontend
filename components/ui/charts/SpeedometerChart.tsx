// components/ui/charts/SpeedometerChart.tsx
// Velocímetro: arco semicircular dividido em faixas de cor (vermelho →
// verde) com ponteiro apontado ao valor. Escala arbitrária [min, max].

'use client';

import { cn } from '@/lib/cn';

export interface SpeedometerBand {
  /** fim da faixa (valor na escala min–max) */
  to: number;
  color: string;
}

export interface SpeedometerChartProps {
  value: number;
  min?: number;
  max?: number;
  /** faixas ordenadas, do valor mais baixo para o mais alto */
  bands: SpeedometerBand[];
  /** texto central por baixo do ponteiro */
  display?: string;
  label?: string;
  size?: number;
  className?: string;
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const s = polar(cx, cy, r, a0);
  const e = polar(cx, cy, r, a1);
  return `M${s.x},${s.y} A${r},${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${e.x},${e.y}`;
}

export function SpeedometerChart({
  value,
  min = 0,
  max = 100,
  bands,
  display,
  label,
  size = 200,
  className,
}: SpeedometerChartProps) {
  const span = max - min;
  const clamped = Math.min(max, Math.max(min, value));
  const toAngle = (v: number) => 180 + ((v - min) / span) * 180;
  const cx = size / 2;
  const cy = size / 2;
  const stroke = Math.max(10, size * 0.1);
  const r = size / 2 - stroke / 2 - 4;
  const needleAngle = toAngle(clamped);
  const tip = polar(cx, cy, r - stroke / 2 - 2, needleAngle);
  const viewHeight = cy + 14;

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <svg
        width={size}
        height={viewHeight}
        viewBox={`0 0 ${size} ${viewHeight}`}
        role="img"
        aria-label={`${label ?? 'Valor'}: ${display ?? clamped}`}
      >
        {bands.map((b, i) => {
          const from = i === 0 ? min : bands[i - 1].to;
          const gap = 1.2; // pequeno intervalo entre faixas
          return (
            <path
              key={i}
              d={arc(
                cx,
                cy,
                r,
                toAngle(from) + (i === 0 ? 0 : gap),
                toAngle(b.to) - (i === bands.length - 1 ? 0 : gap),
              )}
              stroke={b.color}
              strokeWidth={stroke}
              fill="none"
            />
          );
        })}
        <line
          x1={cx}
          y1={cy}
          x2={tip.x}
          y2={tip.y}
          stroke="#152F59"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={6} fill="#152F59" />
        <circle cx={cx} cy={cy} r={2.5} fill="white" />
      </svg>
      {display && (
        <p className="font-display text-2xl font-bold leading-none text-ink">
          {display}
        </p>
      )}
      {label && (
        <p className="mt-1 text-center font-body text-xs text-ink-muted">
          {label}
        </p>
      )}
    </div>
  );
}

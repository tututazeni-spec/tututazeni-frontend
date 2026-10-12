// components/ui/charts/ThermometerStatCard.tsx
// Card independente (fora do estilo NavyStatCard) com termómetro vertical:
// o mercúrio sobe com o valor (escala 0–100) e muda de cor pelas faixas.

'use client';

import { Card } from '@/components/ui/Card';
import { RATE_BANDS } from './SpeedometerStatCard';

export function ThermometerStatCard({
  label,
  value,
  bands = RATE_BANDS,
  display,
  caption,
}: {
  label: string;
  value: number;
  bands?: { to: number; color: string }[];
  display: string;
  caption?: string;
}) {
  const pct = Math.min(100, Math.max(0, value));
  const color = (bands.find((b) => pct <= b.to) ?? bands[bands.length - 1]).color;
  const w = 100;
  const h = 130;
  const tubeW = 20;
  const bulbR = 17;
  const cx = w / 2;
  const top = 8;
  const bottom = h - bulbR * 2 + 2; // base do tubo, onde começa o bulbo
  const tubeH = bottom - top;
  const fillH = (pct / 100) * tubeH;
  return (
    <Card className="flex min-h-[155px] flex-col items-center justify-center gap-2 p-4 transition-all duration-200 ease-out hover:scale-[1.06] hover:shadow-[0_10px_24px_rgba(21,47,89,0.16)] motion-reduce:hover:scale-100">
      <h3 className="font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
        {label}
      </h3>
      <div className="flex items-center gap-4">
        <svg
          width={w * 0.6}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          role="img"
          aria-label={`${label}: ${display}`}
        >
          <rect
            x={cx - tubeW / 2}
            y={top}
            width={tubeW}
            height={tubeH + 6}
            rx={tubeW / 2}
            fill="#E6EAF0"
          />
          <circle cx={cx} cy={h - bulbR - 2} r={bulbR} fill={color} />
          <rect
            x={cx - 6}
            y={bottom - fillH}
            width={12}
            height={fillH + 8}
            rx={6}
            fill={color}
          />
          {[0, 25, 50, 75, 100].map((t) => (
            <line
              key={t}
              x1={cx + tubeW / 2 + 4}
              x2={cx + tubeW / 2 + (t % 50 === 0 ? 14 : 9)}
              y1={bottom - (t / 100) * tubeH}
              y2={bottom - (t / 100) * tubeH}
              stroke="#9AA5B5"
              strokeWidth={2}
            />
          ))}
        </svg>
        <div className="flex flex-col">
          <p className="font-display text-2xl font-bold leading-none text-ink">
            {display}
          </p>
          {caption && (
            <p className="mt-1 font-body text-xs text-ink-muted">{caption}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

// components/ui/charts/SpeedometerStatCard.tsx
// Card independente (fora do estilo NavyStatCard) com velocímetro multicolor.

'use client';

import { Card } from '@/components/ui/Card';
import { SpeedometerChart } from './SpeedometerChart';

// Faixas do velocímetro das taxas (escala 0–100).
export const RATE_BANDS = [
  { to: 20, color: '#c0392b' },
  { to: 40, color: '#e67e22' },
  { to: 60, color: '#f1c40f' },
  { to: 80, color: '#8fc23f' },
  { to: 100, color: '#2f9e63' },
];

// Rotatividade (escala 0–30%): mais baixo é melhor, por isso verde → vermelho.
export const TURNOVER_MAX = 30;
export const TURNOVER_BANDS = [
  { to: 5, color: '#2f9e63' },
  { to: 10, color: '#8fc23f' },
  { to: 15, color: '#f1c40f' },
  { to: 25, color: '#e67e22' },
  { to: 30, color: '#c0392b' },
];

export function SpeedometerStatCard({
  label,
  value,
  max = 100,
  bands,
  display,
  caption,
}: {
  label: string;
  value: number;
  max?: number;
  bands: { to: number; color: string }[];
  display: string;
  caption?: string;
}) {
  return (
    <Card className="flex min-h-[155px] flex-col items-center justify-center gap-2 p-4 transition-all duration-200 ease-out hover:scale-[1.06] hover:shadow-[0_10px_24px_rgba(21,47,89,0.16)] motion-reduce:hover:scale-100">
      <h3 className="font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
        {label}
      </h3>
      <SpeedometerChart
        value={value}
        min={0}
        max={max}
        bands={bands}
        size={150}
        display={display}
        label={caption}
      />
    </Card>
  );
}

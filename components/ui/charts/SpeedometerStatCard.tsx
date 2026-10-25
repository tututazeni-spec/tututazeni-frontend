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

// Taxas em que mais baixo é melhor (ex.: abandono, escala 0–100).
export const INVERSE_RATE_BANDS = [...RATE_BANDS]
  .reverse()
  .map((b, i) => ({ to: (i + 1) * 20, color: b.color }));

// Rotatividade (escala 0–30%): mais baixo é melhor, por isso verde → vermelho.
export const TURNOVER_MAX = 30;
export const TURNOVER_BANDS = [
  { to: 5, color: '#2f9e63' },
  { to: 10, color: '#8fc23f' },
  { to: 15, color: '#f1c40f' },
  { to: 25, color: '#e67e22' },
  { to: 30, color: '#c0392b' },
];

export interface SpeedometerStatCardProps {
  label: string;
  value: number;
  max?: number;
  bands: { to: number; color: string }[];
  display: string;
  caption?: string;
}

export function SpeedometerStatCard({
  label,
  value,
  max = 100,
  bands,
  display,
  caption,
}: SpeedometerStatCardProps) {
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

export interface ShareGaugeCardProps {
  label: string;
  value: number;
  total: number;
  display?: string;
  caption?: string;
  lowerIsBetter?: boolean;
  /** mostra a % no centro (útil para montantes longos, que vão na legenda) */
  showPercent?: boolean;
}

// Velocímetro para contagens/montantes: o ponteiro mostra a parte `value` do
// `total` (0–100%) e o número real aparece no centro. `lowerIsBetter` inverte
// as cores (ex.: pendentes, atrasos, suspensos). Sem total → ponteiro a 0.
export function ShareGaugeCard({
  label,
  value,
  total,
  display,
  caption,
  lowerIsBetter,
  showPercent,
}: ShareGaugeCardProps) {
  const pct = total > 0 ? Math.min(100, Math.max(0, (value / total) * 100)) : 0;
  return (
    <SpeedometerStatCard
      label={label}
      value={pct}
      bands={lowerIsBetter ? INVERSE_RATE_BANDS : RATE_BANDS}
      display={showPercent ? `${Math.round(pct)}%` : (display ?? String(value))}
      caption={caption}
    />
  );
}

// Faixas para pontuações 0–5 (ex.: avaliação 360°) e 0–10 (ex.: anos).
export const SCORE5_BANDS = RATE_BANDS.map((b) => ({ ...b, to: b.to / 20 }));
export const SCORE10_BANDS = RATE_BANDS.map((b) => ({ ...b, to: b.to / 10 }));

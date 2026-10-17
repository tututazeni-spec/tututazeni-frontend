// components/executive-reports/SpeedometerRateCard.tsx
// Velocímetro de uma taxa, sem moldura (mesmo desenho do DonutStatCard): título
// por cima e ponteiro por baixo. Sem valor, o ponteiro fica a 0 e o centro em branco.

import { SpeedometerChart } from '@/components/ui/charts/SpeedometerChart';
import { RATE_BANDS } from '@/components/ui/charts/SpeedometerStatCard';

export interface SpeedometerRateCardProps {
  label: string;
  /** Percentagem 0-100; null = sem dados. */
  percent: number | null;
  sub?: string;
}

export function SpeedometerRateCard({
  label,
  percent,
  sub,
}: SpeedometerRateCardProps) {
  return (
    <div className="flex flex-col items-center gap-2 transition-transform duration-200 ease-out hover:scale-[1.06] motion-reduce:hover:scale-100">
      <h3 className="text-center font-body text-sm font-semibold text-ink-muted">
        {label}
      </h3>
      <SpeedometerChart
        value={percent ?? 0}
        min={0}
        max={100}
        bands={RATE_BANDS}
        size={200}
        display={percent === null ? '' : `${percent.toLocaleString('pt-PT')}%`}
        label={sub}
      />
    </div>
  );
}

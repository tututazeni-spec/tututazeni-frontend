// components/executive-reports/DonutStatCard.tsx
// Percentagem com donut, sem moldura nem cabeçalho: título por cima e anel com o
// valor ao centro. Sem valor, o anel fica vazio e o centro em branco.

import { DonutChart } from '@/components/ui/charts/DonutChart';

export interface DonutStatCardProps {
  label: string;
  /** Percentagem 0-100; null = sem dados (anel vazio, centro em branco). */
  percent: number | null;
  /** Texto no centro do anel (omisso: `${percent}%`). */
  display?: string;
  color: string;
  sub?: string;
}

export function DonutStatCard({
  label,
  percent,
  display,
  color,
  sub,
}: DonutStatCardProps) {
  const p = percent === null ? 0 : Math.min(100, Math.max(0, percent));
  return (
    <div className="flex flex-col items-center gap-2 transition-transform duration-200 ease-out hover:scale-[1.06] motion-reduce:hover:scale-100">
      <h3 className="text-center font-body text-sm font-semibold text-ink-muted">
        {label}
      </h3>
      <DonutChart
        size={173}
        hideLegend
        centerValue={
          percent === null
            ? ''
            : (display ?? `${percent.toLocaleString('pt-PT')}%`)
        }
        data={[
          { label, value: p, color },
          { label: 'Restante', value: 100 - p, color: 'var(--color-donut-track, #E3E8F0)' },
        ]}
      />
      {sub && (
        <p className="text-center font-body text-xs text-ink-faint">{sub}</p>
      )}
    </div>
  );
}

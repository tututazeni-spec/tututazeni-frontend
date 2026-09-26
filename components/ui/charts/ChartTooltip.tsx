// components/ui/charts/ChartTooltip.tsx
// Tooltip de hover partilhado por todos os gráficos SVG do design system —
// mesmo markup já usado em components/roi-impact/ScatterPlot.tsx, extraído
// para não repetir em cada gráfico novo (dataviz skill, camada de hover).
import type { ReactNode } from 'react';

export interface ChartTooltipProps {
  /** posição em percentagem do contentor (0–100) */
  xPct: number;
  yPct: number;
  children: ReactNode;
}

export function ChartTooltip({ xPct, yPct, children }: ChartTooltipProps) {
  return (
    <div
      className="pointer-events-none absolute z-10 whitespace-nowrap rounded-card border border-border bg-surface px-2.5 py-1.5 font-body text-[10px] text-ink shadow-md"
      style={{
        left: `${xPct}%`,
        top: `${yPct}%`,
        transform: 'translate(-50%, -130%)',
      }}
    >
      {children}
    </div>
  );
}

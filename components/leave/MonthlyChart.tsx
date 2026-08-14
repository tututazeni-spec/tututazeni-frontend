// components/leave/MonthlyChart.tsx
// Gráfico de barras simples de dias de ausência por mês. Extraído de
// app/(platform)/leave/page.tsx. Migrado para a fundação de design:
// wrapper bespoke passa a Card, barra mono-série passa a tokens `accent`
// (série única, sem necessidade de paleta categórica).

import { Card } from '@/components/ui/Card';
import { MONTH_NAMES } from './constants';

export interface MonthlyChartProps {
  data: Array<{ month: number; count: number; days: number }>;
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  const max = Math.max(...data.map((d) => d.days), 1);
  return (
    <Card className="p-5">
      <h3 className="font-body text-sm font-semibold text-ink mb-4">
        Dias de Ausência por Mês
      </h3>
      <div className="flex items-end gap-1.5 h-24">
        {data.map((d) => (
          <div
            key={d.month}
            className="flex-1 flex flex-col items-center gap-1"
          >
            <div
              className="w-full bg-accent-subtle rounded-t-md transition-all hover:bg-accent/40"
              style={{
                height: `${(d.days / max) * 100}%`,
                minHeight: d.days > 0 ? '4px' : '0',
              }}
            />
            <span className="font-body text-xs text-ink-faint">
              {MONTH_NAMES[d.month - 1]}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

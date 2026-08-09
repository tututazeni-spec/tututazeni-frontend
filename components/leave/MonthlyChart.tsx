// components/leave/MonthlyChart.tsx
// Gráfico de barras simples de dias de ausência por mês. Extraído de
// app/(platform)/leave/page.tsx.

import { MONTH_NAMES } from './constants';

export interface MonthlyChartProps {
  data: Array<{ month: number; count: number; days: number }>;
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  const max = Math.max(...data.map((d) => d.days), 1);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 text-sm mb-4">
        Dias de Ausência por Mês
      </h3>
      <div className="flex items-end gap-1.5 h-24">
        {data.map((d) => (
          <div
            key={d.month}
            className="flex-1 flex flex-col items-center gap-1"
          >
            <div
              className="w-full bg-blue-100 rounded-t-md transition-all hover:bg-blue-200"
              style={{
                height: `${(d.days / max) * 100}%`,
                minHeight: d.days > 0 ? '4px' : '0',
              }}
            />
            <span className="text-xs text-gray-400">
              {MONTH_NAMES[d.month - 1]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

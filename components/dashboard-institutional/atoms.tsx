// components/dashboard-institutional/atoms.tsx

import type { TrendPoint } from './types';

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

export function KpiCard({ label, value, sub, color }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color || 'text-gray-900'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

// Gráfico de barras simples (SVG/flex nativo — sem libraria externa)
interface MiniBarChartProps {
  data: TrendPoint[];
}

export function MiniBarChart({ data }: MiniBarChartProps) {
  const max = Math.max(...data.map((d) => d.users), 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-blue-500 rounded-t"
            style={{ height: `${(d.users / max) * 100}%`, minHeight: '4px' }}
            title={`${d.month}: ${d.users}`}
          />
          <span className="text-[10px] text-gray-400">
            {d.month.split(' ')[0]}
          </span>
        </div>
      ))}
    </div>
  );
}

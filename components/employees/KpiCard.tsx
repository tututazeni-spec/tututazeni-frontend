// components/employees/KpiCard.tsx
// Cartão de KPI do cabeçalho (Total Ativos, Afastados, Departamentos, ...).
// Extraído de app/(platform)/employees/page.tsx.

import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight } from 'lucide-react';

export interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: string;
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  trend,
  color = 'blue',
}: KpiCardProps) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
          {label}
        </p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {trend && (
          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
            <ArrowUpRight size={12} />
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}

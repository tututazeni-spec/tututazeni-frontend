// components/career-plans/atoms.tsx
// Átomos partilhados: barra de readiness e cartão de KPI. Extraído de
// app/(platform)/career-plans/page.tsx.

'use client';

import type { LucideIcon } from 'lucide-react';
import { READINESS_CONFIG } from './constants';
import type { ReadinessLevel } from './types';

interface ReadinessBarProps {
  score: number;
  level: ReadinessLevel;
}

export function ReadinessBar({ score, level }: ReadinessBarProps) {
  const cfg = READINESS_CONFIG[level];
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className={`text-xs font-semibold ${cfg.color}`}>
          {cfg.label}
        </span>
        <span className="text-sm font-bold text-gray-900">{score}%</span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${cfg.bar}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  sub?: string;
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  color = 'blue',
  sub,
}: KpiCardProps) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl ${colors[color]}`}>
          <Icon size={18} />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

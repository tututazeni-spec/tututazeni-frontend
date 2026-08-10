// components/roi-impact/atoms.tsx
// Átomos partilhados: barra de progresso, skeleton, cartão de KPI e
// badge de confiança. Extraído de app/(platform)/roi-impact/page.tsx.

'use client';

import type { LucideIcon } from 'lucide-react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Skeleton as SharedSkeleton } from '@/components/ui/Skeleton';

// Componente genérico não usado por nenhuma tab actualmente (o original
// já não o referenciava) — mantido por ter valor de reutilização caso
// alguma vista futura precise de uma barra de progresso simples.
interface ProgressBarProps {
  value: number;
  color?: string;
  height?: string;
}

export function ProgressBar({
  value,
  color = 'bg-indigo-500',
  height = 'h-1.5',
}: ProgressBarProps) {
  return (
    <div className={`w-full ${height} bg-slate-100 rounded-full`}>
      <div
        className={`${height} ${color} rounded-full transition-all`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

interface SkeletonProps {
  count?: number;
}

export function Skeleton({ count = 4 }: SkeletonProps) {
  return (
    <SharedSkeleton
      rows={count}
      wrapperClassName="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse"
      itemClassName="bg-slate-100 rounded-xl h-24"
    />
  );
}

interface KPICardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  bg?: string;
  status?: string;
  trend?: number;
}

export function KPICard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'text-indigo-600',
  bg = 'bg-indigo-50',
  status,
  trend,
}: KPICardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon size={18} className={color} />
        </div>
        <div className="flex items-center gap-1">
          {status && <span className="text-xl">{status}</span>}
          {trend !== undefined && (
            <span
              className={`text-xs font-medium flex items-center gap-0.5 ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}
            >
              {trend >= 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

interface ConfidenceBadgeProps {
  level?: string;
}

export function ConfidenceBadge({ level }: ConfidenceBadgeProps) {
  const cfg: Record<string, { color: string; label: string }> = {
    HIGH: { color: 'bg-emerald-100 text-emerald-700', label: 'Alta Confiança' },
    MEDIUM: { color: 'bg-amber-100 text-amber-700', label: 'Média Confiança' },
    LOW: { color: 'bg-red-100 text-red-600', label: 'Baixa Confiança ⚠️' },
  };
  if (!level || !cfg[level]) return null;
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg[level].color}`}
    >
      {cfg[level].label}
    </span>
  );
}

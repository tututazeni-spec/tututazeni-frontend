// components/evaluation/atoms.tsx
// Primitivos de UI partilhados pelos separadores do módulo — puramente
// apresentacionais. Extraídos de app/(platform)/evaluation/page.tsx.

import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Skeleton as SharedSkeleton } from '@/components/ui/Skeleton';
import { getInitials } from '@/lib/format';

export interface AvatarProps {
  name: string;
  url?: string;
  size?: number;
}

export function Avatar({ name, url, size = 8 }: AvatarProps) {
  const initials = getInitials(name);
  return url ? (
    <div
      className={`w-${size} h-${size} rounded-full overflow-hidden relative`}
    >
      <Image src={url} alt={name} fill className="object-cover" />
    </div>
  ) : (
    <div
      className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600
        flex items-center justify-center text-white font-semibold text-xs shrink-0`}
    >
      {initials}
    </div>
  );
}

export interface ProgressBarProps {
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

export interface SkeletonProps {
  count?: number;
}

export function Skeleton({ count = 3 }: SkeletonProps) {
  return (
    <SharedSkeleton
      rows={count}
      wrapperClassName="space-y-4 animate-pulse"
      itemClassName="bg-slate-100 rounded-xl h-24"
    />
  );
}

export interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  bg?: string;
  trend?: number;
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'text-indigo-600',
  bg = 'bg-indigo-50',
  trend,
}: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon size={18} className={color} />
        </div>
        {trend !== undefined && (
          <span
            className={`text-xs font-medium flex items-center gap-0.5 ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}
          >
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

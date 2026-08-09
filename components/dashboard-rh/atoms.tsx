// components/dashboard-rh/atoms.tsx
// Primitivos de UI partilhados pelos painéis do módulo — puramente
// apresentacionais. Extraídos de app/(platform)/dashboard-rh/page.tsx.

import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Skeleton as SharedSkeleton } from '@/components/ui/Skeleton';

export interface SkeletonProps {
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

export interface AvatarProps {
  name: string;
  url?: string;
  size?: number;
}

export function Avatar({ name, url, size = 8 }: AvatarProps) {
  const i = name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
  return url ? (
    <div
      className={`w-${size} h-${size} rounded-full overflow-hidden relative`}
    >
      <Image src={url} alt={name} fill className="object-cover" />
    </div>
  ) : (
    <div
      className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-indigo-500 to-violet-600
        flex items-center justify-center text-white text-xs font-bold shrink-0`}
    >
      {i}
    </div>
  );
}

export interface KPICardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  trend?: number;
  color?: string;
  bg?: string;
  status?: string;
}

export function KPICard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  color = 'text-indigo-600',
  bg = 'bg-indigo-50',
  status,
}: KPICardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon size={18} className={color} />
        </div>
        <div className="flex items-center gap-1">
          {status && <span className="text-base">{status}</span>}
          {trend !== undefined && (
            <span
              className={`text-xs font-medium flex items-center gap-0.5 ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}
            >
              {trend >= 0 ? (
                <TrendingUp size={11} />
              ) : (
                <TrendingDown size={11} />
              )}
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

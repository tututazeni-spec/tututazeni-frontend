// components/talent-development/atoms.tsx
// Primitivos de UI partilhados pelos separadores do módulo — puramente
// apresentacionais. Extraídos de
// app/(platform)/talent-development/page.tsx.

import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';
import { ArrowUp } from 'lucide-react';
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
        flex items-center justify-center text-white font-semibold text-xs`}
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
    <div
      className={`w-full ${height} bg-slate-100 rounded-full overflow-hidden`}
    >
      <div
        className={`${height} ${color} rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

export interface ScoreBadgeProps {
  score: number;
}

export function ScoreBadge({ score }: ScoreBadgeProps) {
  const color =
    score >= 4
      ? 'text-emerald-600'
      : score >= 2.5
        ? 'text-amber-600'
        : 'text-slate-500';
  return (
    <span className={`font-bold text-sm ${color}`}>{score.toFixed(1)}</span>
  );
}

export interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  trend?: number;
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'text-indigo-600',
  trend,
}: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex items-start gap-4">
      <div className={`p-3 rounded-xl bg-slate-50 ${color}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      {trend !== undefined && (
        <span
          className={`text-xs font-medium flex items-center gap-0.5 ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
        >
          <ArrowUp size={12} className={trend < 0 ? 'rotate-180' : ''} />
          {Math.abs(trend)}%
        </span>
      )}
    </div>
  );
}

export interface SkeletonProps {
  rows?: number;
}

export function Skeleton({ rows = 3 }: SkeletonProps) {
  return (
    <SharedSkeleton
      rows={rows}
      wrapperClassName="space-y-4 animate-pulse"
      itemClassName="bg-slate-100 rounded-xl h-24"
    />
  );
}

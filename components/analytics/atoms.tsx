// components/analytics/atoms.tsx
// Átomos partilhados: avatar, skeleton, cartão de KPI e barra de
// progresso. Extraído de app/(platform)/analytics/page.tsx.

'use client';

import Image from 'next/image';
import { Skeleton as SharedSkeleton } from '@/components/ui/Skeleton';
import { getInitials as initials } from '@/lib/format';

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md';
}

export function Avatar({ name, avatarUrl, size = 'sm' }: AvatarProps) {
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return avatarUrl ? (
    <div
      className={`${dim} rounded-full overflow-hidden relative flex-shrink-0`}
    >
      <Image src={avatarUrl} alt={name} fill className="object-cover" />
    </div>
  ) : (
    <div
      className={`${dim} rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold flex-shrink-0`}
    >
      {initials(name)}
    </div>
  );
}

interface SkeletonProps {
  rows?: number;
}

export function Skeleton({ rows = 3 }: SkeletonProps) {
  return (
    <SharedSkeleton
      rows={rows}
      wrapperClassName="space-y-3 animate-pulse"
      itemClassName="h-16 bg-gray-100 rounded-xl"
    />
  );
}

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  bg?: string;
}

export function KpiCard({
  label,
  value,
  sub,
  color = 'text-gray-900',
  bg = 'bg-gray-50',
}: KpiCardProps) {
  return (
    <div className={`${bg} rounded-xl p-4`}>
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

interface ProgressBarProps {
  pct: number;
  color?: string;
  h?: string;
}

export function ProgressBar({
  pct,
  color = 'bg-blue-500',
  h = 'h-2',
}: ProgressBarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 ${h} bg-gray-100 rounded-full overflow-hidden`}>
        <div
          className={`h-full ${color} rounded-full`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-xs font-mono text-gray-500 w-8 flex-shrink-0">
        {pct}%
      </span>
    </div>
  );
}

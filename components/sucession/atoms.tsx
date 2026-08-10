// components/sucession/atoms.tsx
// Átomos partilhados: skeleton, avatar, badge de prontidão e score de
// match. Extraído de app/(platform)/sucession/page.tsx.

'use client';

import Image from 'next/image';
import { Skeleton as SharedSkeleton } from '@/components/ui/Skeleton';
import { getInitials as initials } from '@/lib/format';
import { READINESS_CFG } from './constants';
import type { ReadinessLevel } from './types';

interface SkeletonProps {
  rows?: number;
}

export function Skeleton({ rows = 4 }: SkeletonProps) {
  return (
    <SharedSkeleton
      rows={rows}
      wrapperClassName="space-y-3 animate-pulse"
      itemClassName="h-16 bg-gray-100 rounded-xl"
    />
  );
}

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ name, avatarUrl, size = 'sm' }: AvatarProps) {
  const dim = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  }[size];
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

interface ReadinessBadgeProps {
  level: ReadinessLevel;
}

export function ReadinessBadge({ level }: ReadinessBadgeProps) {
  const { label, cls, dot } = READINESS_CFG[level];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 border rounded-full text-xs font-medium ${cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

interface MatchScoreProps {
  score: number | null;
}

export function MatchScore({ score }: MatchScoreProps) {
  if (score === null) return <span className="text-xs text-gray-300">—</span>;
  const color =
    score >= 70
      ? 'text-emerald-600'
      : score >= 45
        ? 'text-amber-600'
        : 'text-red-600';
  const bg =
    score >= 70
      ? 'bg-emerald-500'
      : score >= 45
        ? 'bg-amber-500'
        : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${bg} rounded-full`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-xs font-mono font-bold ${color}`}>{score}%</span>
    </div>
  );
}

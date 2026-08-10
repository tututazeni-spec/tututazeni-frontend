// components/instructor/atoms.tsx
// Átomos partilhados: avatar, skeleton, barra de progresso e
// estrelas de avaliação. Extraído de
// app/(platform)/instructor/page.tsx.

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
      className={`${dim} rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0`}
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

interface ProgressBarProps {
  pct: number;
  color?: string;
}

export function ProgressBar({ pct, color = 'bg-blue-500' }: ProgressBarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-xs font-mono text-gray-500 w-8">{pct}%</span>
    </div>
  );
}

interface StarsProps {
  rating: number;
}

export function Stars({ rating }: StarsProps) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`text-sm ${n <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

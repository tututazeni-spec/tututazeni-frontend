// components/knowledge/atoms.tsx
// Átomos partilhados: skeleton, avatar e avaliação por estrelas.
// Extraído de app/(platform)/knowledge/page.tsx.

'use client';

import Image from 'next/image';
import { Skeleton as SharedSkeleton } from '@/components/ui/Skeleton';
import { getInitials as initials } from '@/lib/format';

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
  size?: 'sm' | 'md';
}

export function Avatar({ name, avatarUrl, size = 'sm' }: AvatarProps) {
  const dim = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
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

interface StarRatingProps {
  value: number | null;
  max?: number;
}

export function StarRating({ value, max = 5 }: StarRatingProps) {
  if (!value)
    return <span className="text-xs text-gray-300">Sem avaliação</span>;
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => i + 1).map((s) => (
        <span
          key={s}
          className={`text-sm ${s <= Math.round(value) ? 'text-amber-400' : 'text-gray-200'}`}
        >
          ★
        </span>
      ))}
      <span className="text-xs text-gray-400 ml-1">{value.toFixed(1)}</span>
    </div>
  );
}

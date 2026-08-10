// components/career/atoms.tsx
// Átomos partilhados: avatar, skeleton e badge genérico. Extraído de
// app/(platform)/career/page.tsx.

'use client';

import Image from 'next/image';
import { Skeleton as SharedSkeleton } from '@/components/ui/Skeleton';
import { getInitials as initials } from '@/lib/format';

interface AvatarProps {
  name: string;
  url?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ name, url, size = 'sm' }: AvatarProps) {
  const dim =
    size === 'sm'
      ? 'w-8 h-8 text-xs'
      : size === 'md'
        ? 'w-10 h-10 text-sm'
        : 'w-14 h-14 text-base';
  return url ? (
    <div
      className={`${dim} rounded-full overflow-hidden relative flex-shrink-0`}
    >
      <Image src={url} alt={name} fill className="object-cover" />
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
      itemClassName="h-14 bg-gray-100 rounded-xl"
    />
  );
}

interface BadgeProps {
  label: string;
  cls: string;
}

export function Badge({ label, cls }: BadgeProps) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-medium ${cls}`}>
      {label}
    </span>
  );
}

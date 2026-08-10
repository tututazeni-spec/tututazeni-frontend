// components/organization/atoms.tsx
// Átomos partilhados: skeleton e avatar. Extraído de
// app/(platform)/organization/page.tsx.

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
      itemClassName="h-14 bg-gray-100 rounded-xl"
    />
  );
}

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

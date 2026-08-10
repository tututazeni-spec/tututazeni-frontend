// components/audit/atoms.tsx
// Átomos partilhados: avatar e skeleton. Extraído de
// app/(platform)/audit/page.tsx.

'use client';

import Image from 'next/image';
import { Skeleton as SharedSkeleton } from '@/components/ui/Skeleton';
import { getInitials as initials } from '@/lib/format';

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
}

export function Avatar({ name, avatarUrl }: AvatarProps) {
  return avatarUrl ? (
    <Image
      src={avatarUrl}
      alt={name}
      width={24}
      height={24}
      className="w-6 h-6 rounded-full object-cover flex-shrink-0"
    />
  ) : (
    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
      {initials(name)}
    </div>
  );
}

interface SkeletonProps {
  rows?: number;
}

export function Skeleton({ rows = 5 }: SkeletonProps) {
  return (
    <SharedSkeleton
      rows={rows}
      wrapperClassName="space-y-1 animate-pulse"
      itemClassName="h-12 bg-gray-100 rounded-lg"
    />
  );
}

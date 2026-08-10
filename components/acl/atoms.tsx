// components/acl/atoms.tsx

import { Skeleton as SharedSkeleton } from '@/components/ui/Skeleton';

interface SkeletonProps {
  count?: number;
}

export function Skeleton({ count = 3 }: SkeletonProps) {
  return (
    <SharedSkeleton
      rows={count}
      wrapperClassName="space-y-3 animate-pulse"
      itemClassName="bg-slate-100 rounded-xl h-16"
    />
  );
}

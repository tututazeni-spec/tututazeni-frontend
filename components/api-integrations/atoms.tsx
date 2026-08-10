// components/api-integrations/atoms.tsx

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

export const HEALTH_CONFIG: Record<
  string,
  { color: string; bg: string; dot: string }
> = {
  OK: {
    color: 'text-emerald-700',
    bg: 'bg-emerald-100',
    dot: 'bg-emerald-500',
  },
  ERROR: { color: 'text-red-700', bg: 'bg-red-100', dot: 'bg-red-500' },
  DEGRADED: {
    color: 'text-amber-700',
    bg: 'bg-amber-100',
    dot: 'bg-amber-500',
  },
  STALE: { color: 'text-slate-600', bg: 'bg-slate-100', dot: 'bg-slate-400' },
  INACTIVE: {
    color: 'text-slate-500',
    bg: 'bg-slate-100',
    dot: 'bg-slate-300',
  },
  UNKNOWN: { color: 'text-slate-400', bg: 'bg-slate-100', dot: 'bg-slate-300' },
};

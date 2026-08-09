// components/avatar-training/atoms.tsx
// Primitivos de UI partilhados pelas vistas do módulo — puramente
// apresentacionais. Extraídos de app/(platform)/avatar-training/page.tsx.

import { Skeleton as SharedSkeleton } from '@/components/ui/Skeleton';

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
    <div className={`w-full ${height} bg-slate-100 rounded-full`}>
      <div
        className={`${height} ${color} rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

export interface SkeletonProps {
  count?: number;
}

export function Skeleton({ count = 3 }: SkeletonProps) {
  return (
    <SharedSkeleton
      rows={count}
      wrapperClassName="space-y-4 animate-pulse"
      itemClassName="bg-slate-100 rounded-xl h-28"
    />
  );
}

// components/content-library/atoms.tsx
// Primitivos de UI partilhados pelos separadores do módulo — puramente
// apresentacionais. Extraídos de
// app/(platform)/content-library/page.tsx.

import { Skeleton as SharedSkeleton } from '@/components/ui/Skeleton';

export interface ProgressBarProps {
  value: number;
  color?: string;
  height?: string;
}

export function ProgressBar({
  value,
  color = 'bg-indigo-500',
  height = 'h-1',
}: ProgressBarProps) {
  return (
    <div
      className={`w-full ${height} bg-slate-200 rounded-full overflow-hidden`}
    >
      <div
        className={`${height} ${color} rounded-full transition-all`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

export interface SkeletonProps {
  count?: number;
}

export function Skeleton({ count = 4 }: SkeletonProps) {
  return (
    <SharedSkeleton
      rows={count}
      wrapperClassName="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse"
      itemClassName="bg-slate-100 rounded-xl h-52"
    />
  );
}

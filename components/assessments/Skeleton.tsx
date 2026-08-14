// components/assessments/Skeleton.tsx
// Placeholder de carregamento partilhado pelas vistas do módulo. Extraído
// de app/(platform)/assessments/page.tsx.

import { Skeleton as SharedSkeleton } from '@/components/ui/Skeleton';

export interface SkeletonProps {
  rows?: number;
}

export function Skeleton({ rows = 3 }: SkeletonProps) {
  return (
    <SharedSkeleton
      rows={rows}
      wrapperClassName="space-y-3 animate-pulse"
      itemClassName="skeleton-shimmer h-16 rounded-card"
    />
  );
}

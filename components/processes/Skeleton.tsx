// components/processes/Skeleton.tsx
// Placeholder de carregamento partilhado pelas 5 vistas do módulo de
// processos. Extraído de app/(platform)/processes/page.tsx.

import { Skeleton as SharedSkeleton } from '@/components/ui/Skeleton';

export interface SkeletonProps {
  rows?: number;
}

export function Skeleton({ rows = 5 }: SkeletonProps) {
  return (
    <SharedSkeleton
      rows={rows}
      wrapperClassName="space-y-2 animate-pulse"
      itemClassName="h-14 bg-gray-100 rounded-xl"
    />
  );
}

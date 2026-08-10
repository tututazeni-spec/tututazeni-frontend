// components/learning-paths/atoms.tsx
// Átomos partilhados: badge de tipo, ícone de estado da etapa e
// skeleton. Extraído de app/(platform)/learning-paths/page.tsx.

'use client';

import { Skeleton as SharedSkeleton } from '@/components/ui/Skeleton';
import type { LPType, StepStatus } from './types';

interface TypeBadgeProps {
  type: LPType;
}

export function TypeBadge({ type }: TypeBadgeProps) {
  const labels: Record<LPType, string> = {
    ONBOARDING: 'Onboarding',
    UPSKILLING: 'Upskilling',
    RESKILLING: 'Reskilling',
    COMPLIANCE: 'Compliance',
    LEADERSHIP: 'Liderança',
    CERTIFICATION: 'Certificação',
    CUSTOM: 'Personalizado',
  };
  return (
    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
      {labels[type]}
    </span>
  );
}

interface StepStatusIconProps {
  status: StepStatus;
  locked: boolean;
}

export function StepStatusIcon({ status, locked }: StepStatusIconProps) {
  if (locked) return <span className="text-gray-300 text-lg">🔒</span>;
  if (status === 'COMPLETED')
    return <span className="text-emerald-500 text-lg">✅</span>;
  if (status === 'IN_PROGRESS')
    return <span className="text-blue-500 text-lg">▶️</span>;
  return <span className="text-gray-300 text-lg">○</span>;
}

interface SkeletonProps {
  rows?: number;
}

export function Skeleton({ rows = 4 }: SkeletonProps) {
  return (
    <SharedSkeleton
      rows={rows}
      wrapperClassName="space-y-3 animate-pulse"
      itemClassName="h-28 bg-gray-100 rounded-xl"
    />
  );
}

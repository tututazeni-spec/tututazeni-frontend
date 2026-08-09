// components/courses-learn/atoms.tsx
// Átomos partilhados: anel de progresso, skeleton e ícone de estado do
// módulo. Extraído de app/(platform)/courses/[courseId]/learn/page.tsx.

'use client';

import { Skeleton as SharedSkeleton } from '@/components/ui/Skeleton';

interface ProgressRingProps {
  pct: number;
  size?: number;
}

export function ProgressRing({ pct, size = 36 }: ProgressRingProps) {
  const r = (size - 4) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={3}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#2563eb"
        strokeWidth={3}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

interface SkeletonProps {
  rows?: number;
}

export function Skeleton({ rows = 4 }: SkeletonProps) {
  return (
    <SharedSkeleton
      rows={rows}
      wrapperClassName="space-y-2 animate-pulse"
      itemClassName="h-12 bg-gray-100 rounded-xl"
    />
  );
}

interface ModuleStatusIconProps {
  locked: boolean;
  completed: boolean;
  pct: number;
}

export function ModuleStatusIcon({
  locked,
  completed,
  pct,
}: ModuleStatusIconProps) {
  if (locked) return <span className="text-gray-300 text-base">🔒</span>;
  if (completed) return <span className="text-emerald-500 text-base">✅</span>;
  if (pct > 0) return <span className="text-blue-500 text-base">▶️</span>;
  return <span className="text-gray-300 text-base">○</span>;
}

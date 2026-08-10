// components/reports/atoms.tsx
// Átomos partilhados: skeleton, barra de progresso e badge de
// status por threshold. Extraído de app/(platform)/reports/page.tsx.

'use client';

import { Skeleton as SharedSkeleton } from '@/components/ui/Skeleton';

interface SkeletonProps {
  count?: number;
}

export function Skeleton({ count = 3 }: SkeletonProps) {
  return (
    <SharedSkeleton
      rows={count}
      wrapperClassName="space-y-3 animate-pulse"
      itemClassName="bg-slate-100 rounded-xl h-20"
    />
  );
}

interface ProgressBarProps {
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
        className={`${height} ${color} rounded-full transition-all`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

// Não usado por nenhuma vista actualmente (já estava sem uso no
// ficheiro original) — mantido por ter valor de reutilização caso
// alguma vista futura precise de um badge de status por threshold.
interface StatusBadgeProps {
  value: number;
  thresholds?: [number, number];
}

export function StatusBadge({
  value,
  thresholds = [60, 80],
}: StatusBadgeProps) {
  const color =
    value >= thresholds[1]
      ? 'bg-emerald-100 text-emerald-700'
      : value >= thresholds[0]
        ? 'bg-amber-100 text-amber-700'
        : 'bg-red-100 text-red-600';
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${color}`}>
      {value}%
    </span>
  );
}

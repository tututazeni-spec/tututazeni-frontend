// components/competencies/atoms.tsx
// Átomos partilhados: barra de nível, avaliação por estrelas e
// skeleton. Extraído de app/(platform)/competencies/page.tsx.

'use client';

import { Skeleton as SharedSkeleton } from '@/components/ui/Skeleton';
import { levelBarColor } from './utils';

interface LevelBarProps {
  current: number;
  target?: number | null;
  max?: number;
}

export function LevelBar({ current, target, max = 5 }: LevelBarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden relative">
        <div
          className={`h-full rounded-full transition-all duration-500 ${levelBarColor(current)}`}
          style={{ width: `${(current / max) * 100}%` }}
        />
        {target && target > current && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-gray-400 opacity-60"
            style={{ left: `${(target / max) * 100}%` }}
          />
        )}
      </div>
      <span className="text-xs font-mono text-gray-600 flex-shrink-0">
        {current}/{max}
      </span>
    </div>
  );
}

interface StarRatingProps {
  value: number;
  max?: number;
  onChange?: (v: number) => void;
}

export function StarRating({ value, max = 5, onChange }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((s) => (
        <button
          key={s}
          onClick={() => onChange?.(s)}
          className={`text-xl transition-transform hover:scale-110 ${s <= value ? 'text-amber-400' : 'text-gray-200'} ${onChange ? 'cursor-pointer' : 'cursor-default'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

interface SkeletonProps {
  rows?: number;
}

export function Skeleton({ rows = 4 }: SkeletonProps) {
  return (
    <SharedSkeleton
      rows={rows}
      wrapperClassName="space-y-3 animate-pulse"
      itemClassName="h-16 bg-gray-100 rounded-xl"
    />
  );
}

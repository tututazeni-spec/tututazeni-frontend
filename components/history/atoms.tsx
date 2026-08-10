// components/history/atoms.tsx
// Átomos partilhados: avatar e skeleton. Extraído de
// app/(platform)/history/page.tsx.

'use client';

import Image from 'next/image';
import { Skeleton as SharedSkeleton } from '@/components/ui/Skeleton';

// Não usado por nenhuma tab actualmente (já estava sem uso no ficheiro
// original) — mantido por ter valor de reutilização caso alguma vista
// futura precise de mostrar o avatar do autor de um evento.
interface AvatarProps {
  name: string;
  url?: string;
  size?: number;
}

export function Avatar({ name, url, size = 7 }: AvatarProps) {
  const i = name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
  return url ? (
    <div
      className={`w-${size} h-${size} rounded-full overflow-hidden relative`}
    >
      <Image src={url} alt={name} fill className="object-cover" />
    </div>
  ) : (
    <div
      className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-indigo-500 to-violet-600
        flex items-center justify-center text-white text-[10px] font-bold shrink-0`}
    >
      {i}
    </div>
  );
}

interface SkeletonProps {
  rows?: number;
}

export function Skeleton({ rows = 3 }: SkeletonProps) {
  return (
    <SharedSkeleton
      rows={rows}
      wrapperClassName="space-y-4 animate-pulse"
      itemClassName="bg-slate-100 rounded-xl h-16"
    />
  );
}

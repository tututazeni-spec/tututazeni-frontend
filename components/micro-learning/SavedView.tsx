// components/micro-learning/SavedView.tsx
// Vista "Guardados": conteúdos marcados como salvos pelo utilizador.
// Extraído de app/(platform)/micro-learning/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import { MicroCard } from './MicroCard';
import type { MicroLearning } from './types';

interface SavedViewProps {
  onSelect: (item: MicroLearning) => void;
}

export function SavedView({ onSelect }: SavedViewProps) {
  const { data = [], isLoading: loading } = useApiQuery<MicroLearning[]>(
    queryKeys.microLearning.saved(),
    '/micro-learning/saved/me',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (loading) return <Skeleton />;

  return (
    <div>
      <div className="text-sm text-gray-400 mb-4">{data.length} guardados</div>
      {data.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-2xl">
          🔖 Nenhum conteúdo guardado ainda
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {data.map((item) => (
            <MicroCard
              key={item.id}
              item={item}
              onClick={() => onSelect(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

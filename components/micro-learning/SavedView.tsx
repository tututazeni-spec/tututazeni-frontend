// components/micro-learning/SavedView.tsx
// Vista "Guardados": conteúdos marcados como salvos pelo utilizador.
// Extraído de app/(platform)/micro-learning/page.tsx.

'use client';

import { Bookmark } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
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
      <div className="mb-4 font-body text-sm text-ink-faint">
        {data.length} guardados
      </div>
      {data.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Nenhum conteúdo guardado"
          description="Guarda conteúdos no feed para os encontrares aqui."
        />
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

// components/micro-learning/FeedView.tsx
// Vista "Feed": listagem paginada e filtrável de conteúdos. Extraído
// de app/(platform)/micro-learning/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { TYPE_CFG } from './constants';
import { MicroCard } from './MicroCard';
import type { ContentLevel, ContentType, MicroLearning } from './types';

interface FeedViewProps {
  onSelect: (item: MicroLearning) => void;
}

export function FeedView({ onSelect }: FeedViewProps) {
  const [type, setType] = useState<ContentType | ''>('');
  const [level, setLevel] = useState<ContentLevel | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);
  const params = {
    page,
    limit: 12,
    contentType: type,
    level,
    search: debouncedSearch,
  };

  const { data, isLoading: loading } = useApiQuery<{
    data: MicroLearning[];
    total: number;
  }>(queryKeys.microLearning.feed(params), '/micro-learning/feed/me', {
    params,
    staleTime: STALE_TIME.DYNAMIC,
    placeholderData: keepPreviousData,
  });

  return (
    <div>
      {/* Filtros */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Input
          type="text"
          placeholder="Pesquisar…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="min-w-[180px] max-w-xs flex-1"
        />
        {/* Tipo */}
        <div className="flex gap-1">
          {(['', 'VIDEO', 'TEXT', 'AUDIO', 'QUIZ'] as const).map((t) => (
            <Button
              key={t}
              size="sm"
              intent={type === t ? 'primary' : 'ghost'}
              onClick={() => {
                setType(t);
                setPage(1);
              }}
            >
              {t === ''
                ? 'Todos'
                : TYPE_CFG[t as ContentType].icon +
                  ' ' +
                  TYPE_CFG[t as ContentType].label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <Skeleton rows={4} />
      ) : (
        <>
          <div className="mb-4 font-body text-xs text-ink-faint">
            {data?.total ?? 0} conteúdos
          </div>
          <div className="grid grid-cols-3 gap-4">
            {data?.data.map((item) => (
              <MicroCard
                key={item.id}
                item={item}
                onClick={() => onSelect(item)}
              />
            ))}
            {data?.data.length === 0 && (
              <div className="col-span-3">
                <EmptyState
                  title="Sem conteúdos disponíveis"
                  description="Não há conteúdos para os filtros seleccionados."
                />
              </div>
            )}
          </div>
          {(data?.total ?? 0) > 12 && (
            <div className="mt-6 flex justify-center gap-2">
              <Button
                size="sm"
                intent="secondary"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Anterior
              </Button>
              <Button
                size="sm"
                intent="secondary"
                disabled={(data?.total ?? 0) <= page * 12}
                onClick={() => setPage((p) => p + 1)}
              >
                Próximos →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

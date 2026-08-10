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
import { Skeleton } from './atoms';
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
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <input
          type="text"
          placeholder="Pesquisar…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-[180px] max-w-xs"
        />
        {/* Tipo */}
        <div className="flex gap-1">
          {(['', 'VIDEO', 'TEXT', 'AUDIO', 'QUIZ'] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setType(t);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-colors ${
                type === t
                  ? 'bg-blue-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t === ''
                ? 'Todos'
                : TYPE_CFG[t as ContentType].icon +
                  ' ' +
                  TYPE_CFG[t as ContentType].label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Skeleton rows={4} />
      ) : (
        <>
          <div className="text-xs text-gray-400 mb-4">
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
              <div className="col-span-3 py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-2xl">
                Sem conteúdos disponíveis
              </div>
            )}
          </div>
          {(data?.total ?? 0) > 12 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 text-xs border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50"
              >
                ← Anterior
              </button>
              <button
                disabled={(data?.total ?? 0) <= page * 12}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 text-xs border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50"
              >
                Próximos →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

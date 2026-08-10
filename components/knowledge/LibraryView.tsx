// components/knowledge/LibraryView.tsx
// Separador "Biblioteca" — listagem filtrável/ordenável de artigos.
// Dados próprios + apresentação. Extraído de
// app/(platform)/knowledge/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import { ArticleCard } from './ArticleCard';
import type { Article } from './types';

interface LibraryViewProps {
  onSelectArticle: (id: number) => void;
}

export function LibraryView({ onSelectArticle }: LibraryViewProps) {
  const [search, setSearch] = useState('');
  const [categoryId] = useState('');
  const [sortBy, setSortBy] = useState('RECENT');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);
  const params = {
    page,
    limit: 12,
    sortBy,
    search: debouncedSearch,
    categoryId,
  };

  const { data, isLoading: loading } = useApiQuery<{
    data: Article[];
    total: number;
  }>(queryKeys.knowledge.list(params), '/knowledge', {
    params,
    staleTime: STALE_TIME.SEMI_STATIC,
    placeholderData: keepPreviousData,
  });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="text"
          placeholder="Pesquisar…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 min-w-[200px] text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="RECENT">Mais recentes</option>
          <option value="POPULAR">Mais vistos</option>
          <option value="RATING">Melhor avaliados</option>
          <option value="UPDATED">Actualizados</option>
        </select>
        <span className="text-xs text-gray-400">
          {data?.total ?? 0} artigos
        </span>
      </div>

      {loading ? (
        <Skeleton />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {data?.data.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onClick={() => onSelectArticle(article.id)}
            />
          ))}
          {data?.data.length === 0 && (
            <div className="col-span-3 py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Sem artigos encontrados
            </div>
          )}
        </div>
      )}
    </div>
  );
}

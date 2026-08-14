// components/knowledge/LibraryView.tsx
// Separador "Biblioteca" — listagem filtrável/ordenável de artigos.
// Dados próprios + apresentação. Extraído de
// app/(platform)/knowledge/page.tsx. Migrado para a fundação de design:
// input de pesquisa passa a Input, select de ordenação passa a Select
// (Radix), skeleton local passa a components/ui/Skeleton, estado vazio
// passa a EmptyState.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { ArticleCard } from './ArticleCard';
import type { Article } from './types';

const SORT_ITEMS = [
  { value: 'RECENT', label: 'Mais recentes' },
  { value: 'POPULAR', label: 'Mais vistos' },
  { value: 'RATING', label: 'Melhor avaliados' },
  { value: 'UPDATED', label: 'Actualizados' },
];

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
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Input
          type="text"
          placeholder="Pesquisar…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="min-w-[200px] flex-1"
        />
        <Select items={SORT_ITEMS} value={sortBy} onValueChange={setSortBy} />
        <span className="font-body text-xs text-ink-faint">
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
            <div className="col-span-3">
              <EmptyState
                icon={BookOpen}
                title="Sem artigos encontrados"
                description="Ajusta a pesquisa ou os filtros para encontrar o que procuras."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

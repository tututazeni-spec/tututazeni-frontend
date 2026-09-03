// components/knowledge/PortalView.tsx
// Separador "Portal" — hero de pesquisa, categorias e trending. Dados
// próprios + apresentação. Extraído de app/(platform)/knowledge/page.tsx.
// Migrado para a fundação de design: input/botão de pesquisa passam a
// Input/Button; skeleton local passa a components/ui/Skeleton.

'use client';

import { useState } from 'react';
import { Search, Eye, FileText } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { ArticleCard } from './ArticleCard';
import type { Article, Category, SearchResult } from './types';

interface PortalViewProps {
  onSelectArticle: (id: number) => void;
  onSearch: (q: string) => void;
}

export function PortalView({ onSelectArticle, onSearch }: PortalViewProps) {
  const [searchQ, setSearchQ] = useState('');

  // Categorias e trending em paralelo (cache).
  const catsQ = useApiQuery<Category[]>(
    queryKeys.knowledge.categories(),
    '/knowledge/categories',
    { staleTime: STALE_TIME.STATIC },
  );
  const trendQ = useApiQuery<Article[]>(
    queryKeys.knowledge.trending(),
    '/knowledge/trending',
    { params: { limit: 6 }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const categories = catsQ.data ?? [];
  const trending = trendQ.data ?? [];
  const loading = catsQ.isLoading;

  const searchMutation = useApiMutation((q: string) =>
    apiClient.get<SearchResult[]>('/knowledge/search', { params: { q } }),
  );
  const searchResults = searchMutation.data ?? null;
  const searching = searchMutation.isPending;

  const handleSearch = () => {
    if (searchQ.trim()) searchMutation.mutate(searchQ);
  };

  if (loading) return <Skeleton rows={3} />;

  return (
    <div className="space-y-8">
      {/* Search hero */}
      <div className="rounded-card bg-gradient-to-br from-primary to-primary-active p-8 text-center">
        <div className="mb-5 font-body text-sm text-canvas/70">
          Encontra políticas, processos, guias e muito mais
        </div>
        <div className="mx-auto flex max-w-xl gap-2">
          <Input
            type="text"
            placeholder="Pesquisar artigos, políticas, processos…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 border-0 focus:ring-2 focus:ring-canvas/50"
          />
          <Button onClick={handleSearch} disabled={searching}>
            <Search size={16} strokeWidth={1.75} />
            {searching ? '…' : 'Pesquisar'}
          </Button>
        </div>
      </div>

      {/* Search results */}
      {searchResults !== null && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="font-body text-sm font-semibold text-ink">
              {searchResults.length} resultados para &quot;{searchQ}&quot;
            </div>
            <button
              onClick={() => searchMutation.reset()}
              className="font-body text-xs text-ink-faint hover:text-ink"
            >
              Limpar
            </button>
          </div>
          {searchResults.length === 0 ? (
            <div className="rounded-card border border-dashed border-border-strong py-8 text-center font-body text-sm text-ink-faint">
              <Search
                size={13}
                strokeWidth={1.75}
                className="inline align-[-2px]"
              />{' '}
              Sem resultados. Esta pesquisa foi registada para análise de gaps
              de conhecimento.
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((r) => (
                <div
                  key={r.id}
                  onClick={() => onSelectArticle(r.id)}
                  className="flex cursor-pointer items-center gap-3 rounded-card border border-border bg-surface px-4 py-3 hover:shadow-resting"
                >
                  {r.category?.icon && (
                    <span className="flex-shrink-0 text-xl">
                      {r.category.icon}
                    </span>
                  )}
                  <div className="flex-1">
                    <div className="font-body text-sm font-medium text-ink">
                      {r.title}
                    </div>
                    {r.summary && (
                      <p className="truncate font-body text-xs text-ink-muted">
                        {r.summary}
                      </p>
                    )}
                  </div>
                  <span className="font-body text-xs text-ink-faint">
                    <Eye
                      size={12}
                      strokeWidth={1.75}
                      className="inline align-[-2px]"
                    />{' '}
                    {r.viewCount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Categorias */}
      {!searchResults && (
        <>
          <div>
            <div className="mb-4 font-body text-sm font-semibold text-ink">
              Categorias
            </div>
            <div className="grid grid-cols-4 gap-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="cursor-pointer rounded-card border border-border bg-surface p-4 text-center transition-shadow hover:shadow-resting hover:border-primary-subtle"
                >
                  <div className="mb-2 text-ink-muted">
                    {cat.icon ?? <FileText size={24} strokeWidth={1.5} />}
                  </div>
                  <div className="font-body text-xs font-medium text-ink">
                    {cat.name}
                  </div>
                  <div className="mt-0.5 font-body text-xs text-ink-faint">
                    {cat._count.articles} artigos
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending */}
          <div>
            <div className="mb-4 font-body text-sm font-semibold text-ink">
              Em destaque
            </div>
            <div className="grid grid-cols-3 gap-4">
              {trending.map((art) => (
                <ArticleCard
                  key={art.id}
                  article={art}
                  onClick={() => onSelectArticle(art.id)}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

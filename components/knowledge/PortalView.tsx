// components/knowledge/PortalView.tsx
// Separador "Portal" — hero de pesquisa, categorias e trending. Dados
// próprios + apresentação. Extraído de
// app/(platform)/knowledge/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
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
      <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-8 text-center">
        <div className="text-2xl font-bold text-white mb-2">
          Base de Conhecimento INNOVA
        </div>
        <div className="text-blue-200 text-sm mb-5">
          Encontra políticas, processos, guias e muito mais
        </div>
        <div className="flex gap-2 max-w-xl mx-auto">
          <input
            type="text"
            placeholder="Pesquisar artigos, políticas, processos…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 text-sm px-4 py-3 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="px-5 py-3 bg-white text-blue-700 text-sm font-semibold rounded-xl hover:bg-blue-50 disabled:opacity-50"
          >
            {searching ? '…' : '🔍 Pesquisar'}
          </button>
        </div>
      </div>

      {/* Search results */}
      {searchResults !== null && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-900">
              {searchResults.length} resultados para &quot;{searchQ}&quot;
            </div>
            <button
              onClick={() => searchMutation.reset()}
              className="text-xs text-gray-400 hover:text-gray-700"
            >
              Limpar
            </button>
          </div>
          {searchResults.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              🔍 Sem resultados. Esta pesquisa foi registada para análise de
              gaps de conhecimento.
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((r) => (
                <div
                  key={r.id}
                  onClick={() => onSelectArticle(r.id)}
                  className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:shadow-sm"
                >
                  {r.category?.icon && (
                    <span className="text-xl flex-shrink-0">
                      {r.category.icon}
                    </span>
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {r.title}
                    </div>
                    {r.summary && (
                      <p className="text-xs text-gray-500 truncate">
                        {r.summary}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">👁 {r.viewCount}</span>
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
            <div className="text-sm font-semibold text-gray-900 mb-4">
              Categorias
            </div>
            <div className="grid grid-cols-4 gap-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:shadow-sm hover:border-blue-200 transition-all text-center"
                >
                  <div className="text-3xl mb-2">{cat.icon ?? '📄'}</div>
                  <div className="text-xs font-medium text-gray-900">
                    {cat.name}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {cat._count.articles} artigos
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending */}
          <div>
            <div className="text-sm font-semibold text-gray-900 mb-4">
              🔥 Em destaque
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

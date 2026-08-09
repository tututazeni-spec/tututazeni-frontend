// components/content-library/HomeTab.tsx
// Separador "Início" — pesquisa hero, continuar a ver, obrigatórios,
// recomendados, trending, recentes. Dados próprios (useApiQuery) +
// apresentação, mesmo padrão auto-contido usado em
// components/payslips/page.tsx. Extraído de
// app/(platform)/content-library/page.tsx.

'use client';

import { useState } from 'react';
import { Search, RotateCcw, Shield, Star, TrendingUp, Zap } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import { ContentCard } from './ContentCard';
import { ContentRow } from './ContentRow';
import type { Content } from './types';

export function HomeTab() {
  const [search, setSearch] = useState('');

  const recQuery = useApiQuery<Content[]>(
    queryKeys.contentLibrary.recommended(),
    '/content-library/recommended',
    { params: { limit: 8 }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const trendingQuery = useApiQuery<Content[]>(
    queryKeys.contentLibrary.trending(),
    '/content-library/trending',
    { params: { limit: 8 }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const newQuery = useApiQuery<Content[]>(
    queryKeys.contentLibrary.new(),
    '/content-library/new',
    { params: { limit: 6 }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const continueQuery = useApiQuery<Content[]>(
    queryKeys.contentLibrary.continueWatching(),
    '/content-library/continue-watching',
    { params: { limit: 5 }, staleTime: STALE_TIME.DYNAMIC },
  );
  const mandatoryQuery = useApiQuery<Content[]>(
    queryKeys.contentLibrary.mandatory(),
    '/content-library/mandatory',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const recommended = recQuery.data ?? [];
  const trending = trendingQuery.data ?? [];
  const newContent = newQuery.data ?? [];
  const continueW = continueQuery.data ?? [];
  const mandatory = mandatoryQuery.data ?? [];
  const loading =
    recQuery.isLoading || trendingQuery.isLoading || newQuery.isLoading;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      // Trigger catalogue tab with search
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero search */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-1">O que queres aprender hoje?</h2>
        <p className="text-indigo-200 text-sm mb-4">
          Acede a cursos, vídeos, artigos e muito mais
        </p>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título, skills, tags..."
              className="w-full pl-10 pr-4 py-3 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition-colors text-sm"
          >
            Pesquisar
          </button>
        </form>
      </div>

      {/* Continue watching */}
      {continueW.length > 0 && (
        <ContentRow
          title="Continuar a ver"
          items={continueW}
          icon={RotateCcw}
        />
      )}

      {/* Mandatory */}
      {mandatory.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-red-500" />
            <h3 className="font-semibold text-slate-700">
              Conteúdos Obrigatórios
            </h3>
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
              {mandatory.filter((c) => !c.completed).length} pendentes
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {mandatory.slice(0, 4).map((c) => (
              <ContentCard key={c.id} content={c} compact />
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <Skeleton count={8} />
      ) : (
        <>
          <ContentRow
            title="Recomendado para ti"
            items={recommended}
            icon={Star}
          />
          <ContentRow
            title="Em Trending esta semana"
            items={trending}
            icon={TrendingUp}
          />
          <ContentRow
            title="Adicionados recentemente"
            items={newContent}
            icon={Zap}
          />
        </>
      )}
    </div>
  );
}

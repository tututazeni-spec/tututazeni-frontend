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
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
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
      <div className="rounded-panel bg-gradient-to-br from-primary to-primary-active p-8">
        <h2 className="mb-1 font-display text-2xl font-bold text-canvas">
          O que queres aprender hoje?
        </h2>
        <p className="mb-4 font-body text-sm text-canvas/70">
          Acede a cursos, vídeos, artigos e muito mais
        </p>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              strokeWidth={1.75}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título, skills, tags..."
              className="w-full pl-10"
            />
          </div>
          <Button type="submit">Pesquisar</Button>
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
          <div className="mb-3 flex items-center gap-2">
            <Shield size={16} strokeWidth={1.75} className="text-danger" />
            <h3 className="font-body font-semibold text-ink">
              Conteúdos Obrigatórios
            </h3>
            <Badge intent="danger">
              {mandatory.filter((c) => !c.completed).length} pendentes
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {mandatory.slice(0, 4).map((c) => (
              <ContentCard key={c.id} content={c} compact />
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <Skeleton
          rows={8}
          wrapperClassName="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse"
          itemClassName="bg-surface-sunken rounded-card h-52"
        />
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

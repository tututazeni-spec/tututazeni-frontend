// components/content-library/CatalogueTab.tsx
// Separador "Repositório" (ex-Catálogo + ex-Repositório) — pesquisa/filtros/
// ordenação + grelha paginada de conteúdos e cards de recursos.
// Dados próprios (useApiQuery) + apresentação. Extraído de
// app/(platform)/content-library/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { ArrowUpDown, FileText, ListFilter, TrendingUp, Zap } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { ContentCard } from './ContentCard';
import { ContentRow } from './ContentRow';
import { RecycleBinPanel } from './RecycleBinPanel';
import { useHasRole } from '@/hooks/useCurrentRole';
import { LibraryItemCard } from '@/components/library/LibraryListView';
import type { Item } from '@/components/library/types';
import type { Content } from './types';

// value = ContentFormat/ContentAssetLevel (Prisma enum, validado por
// @IsEnum no backend) — nunca traduzir. label = texto apresentado.
const FORMATS = [
  { value: 'VIDEO', label: 'Vídeo' },
  { value: 'ARTICLE', label: 'Artigos' },
  { value: 'PODCAST', label: 'Podcast' },
  { value: 'PDF', label: 'PDF' },
  { value: 'EBOOK', label: 'E-book' },
  { value: 'SCORM', label: 'SCORM' },
  { value: 'COURSE', label: 'Cursos' },
  { value: 'MICROLEARNING', label: 'Micro-aprendizagem' },
  { value: 'INFOGRAPHIC', label: 'Infográfico' },
  { value: 'QUIZ', label: 'Questionário' },
  { value: 'TEMPLATE', label: 'Modelo' },
  { value: 'PRESENTATION', label: 'Apresentação' },
  { value: 'WEBINAR', label: 'Webinar' },
  { value: 'HTML5', label: 'HTML5' },
];
const LEVELS = [
  { value: 'BEGINNER', label: 'Iniciante' },
  { value: 'INTERMEDIATE', label: 'Intermédio' },
  { value: 'ADVANCED', label: 'Avançado' },
  { value: 'EXPERT', label: 'Perito' },
];

// ContentFormat -> tipo do repositório de recursos (/library/items). Formatos
// sem equivalente não têm recursos no repositório.
const LIBRARY_TYPE_BY_FORMAT: Record<string, string> = {
  VIDEO: 'VIDEO',
  PDF: 'PDF',
  EBOOK: 'EBOOK',
  SCORM: 'SCORM',
  PRESENTATION: 'PRESENTATION',
  PODCAST: 'AUDIO',
};

const FORMAT_ITEMS = [{ value: 'ALL', label: 'Todos os formatos' }, ...FORMATS];
const LEVEL_ITEMS = [{ value: 'ALL', label: 'Todos os níveis' }, ...LEVELS];
const SORT_ITEMS = [
  { value: 'newest', label: 'Mais recente' },
  { value: 'popular', label: 'Mais visto' },
  { value: 'rating', label: 'Melhor avaliado' },
  { value: 'duration', label: 'Mais curto' },
];

interface CatalogueFilters {
  search: string;
  format: string;
  level: string;
  sortBy: string;
  page: number;
}
const INITIAL_CATALOGUE_FILTERS: CatalogueFilters = {
  search: '',
  format: 'ALL',
  level: 'ALL',
  sortBy: 'newest',
  page: 1,
};

export function CatalogueTab() {
  const [filters, setFilters] = useState<CatalogueFilters>(
    INITIAL_CATALOGUE_FILTERS,
  );
  const { search, format, level, sortBy, page } = filters;
  const isAdmin = useHasRole(['ADMIN']);

  function updateFilters(patch: Partial<Omit<CatalogueFilters, 'page'>>) {
    setFilters((f) => ({ ...f, ...patch, page: 1 }));
  }
  function goToPage(delta: number) {
    setFilters((f) => ({ ...f, page: f.page + delta }));
  }

  const debouncedSearch = useDebounce(search, 300);
  const params = {
    page,
    limit: 20,
    sortBy,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(format !== 'ALL' ? { format } : {}),
    ...(level !== 'ALL' ? { level } : {}),
  };
  // Com "Todos os formatos" e sem pesquisa não se lista nada: os conteúdos só
  // aparecem depois de escolher um formato ou pesquisar pelo nome.
  const hasQuery = !!debouncedSearch || format !== 'ALL';
  const { data, isLoading } = useApiQuery<{
    data: Content[];
    meta: { total: number; totalPages: number };
  }>(queryKeys.contentLibrary.catalogue(params), '/content-library', {
    params,
    staleTime: STALE_TIME.SEMI_STATIC,
    placeholderData: keepPreviousData,
    enabled: hasQuery,
  });
  const loading = hasQuery && isLoading;

  // Cards do repositório de recursos (ex-separador Repositório).
  const libraryType = format !== 'ALL' ? LIBRARY_TYPE_BY_FORMAT[format] : '';
  const libraryParams = {
    page: 1,
    limit: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(libraryType ? { type: libraryType } : {}),
  };
  const libraryQuery = useApiQuery<{ data: Item[] }>(
    queryKeys.library.items(libraryParams),
    '/library/items',
    {
      params: libraryParams,
      staleTime: STALE_TIME.SEMI_STATIC,
      enabled: hasQuery && (format === 'ALL' || !!libraryType) && page === 1,
    },
  );
  const libraryItems = libraryQuery.data?.data ?? [];

  // "Adicionados recentemente" e "Em Tendência esta semana": só sem pesquisa.
  const showHighlights = !hasQuery;
  const recentQuery = useApiQuery<Content[]>(
    queryKeys.contentLibrary.new(),
    '/content-library/new',
    {
      params: { limit: 6 },
      staleTime: STALE_TIME.SEMI_STATIC,
      enabled: showHighlights,
    },
  );
  const recent = recentQuery.data ?? [];
  const trendingQuery = useApiQuery<Content[]>(
    queryKeys.contentLibrary.trending(),
    '/content-library/trending',
    {
      params: { limit: 8 },
      staleTime: STALE_TIME.SEMI_STATIC,
      enabled: showHighlights,
    },
  );
  const trending = trendingQuery.data ?? [];

  return (
    <div className="space-y-4">
      {isAdmin && <RecycleBinPanel />}

      {/* Search + filters */}
      <Card>
        <CardBody className="space-y-3">
          <Input
            variant="underline"
            value={search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            placeholder="Pesquisar conteúdos..."
            className="w-full"
          />

          <div className="flex flex-wrap items-center gap-2">
            <Select
              variant="underline"
              icon={FileText}
              items={FORMAT_ITEMS}
              value={format}
              onValueChange={(v) => updateFilters({ format: v })}
            />
            <Select
              variant="underline"
              icon={ListFilter}
              items={LEVEL_ITEMS}
              value={level}
              onValueChange={(v) => updateFilters({ level: v })}
            />
            <Select
              variant="underline"
              icon={ArrowUpDown}
              items={SORT_ITEMS}
              value={sortBy}
              onValueChange={(v) => updateFilters({ sortBy: v })}
            />

            <span className="ml-auto font-body text-xs text-ink-faint">
              {hasQuery ? (data?.meta.total ?? 0) : 0} conteúdos
            </span>
          </div>
        </CardBody>
      </Card>

      {showHighlights && trending.length > 0 && (
        <ContentRow
          title="Em Tendência esta semana"
          items={trending}
          icon={TrendingUp}
        />
      )}

      {showHighlights && recent.length > 0 && (
        <ContentRow
          title="Adicionados recentemente"
          items={recent}
          icon={Zap}
        />
      )}

      {/* Grid */}
      {loading ? (
        <Skeleton
          rows={12}
          wrapperClassName="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse"
          itemClassName="bg-surface-sunken rounded-card h-52"
        />
      ) : !hasQuery ? (
        <EmptyState
          title="Escolhe um formato para ver os conteúdos"
          description="Seleciona um formato no filtro ou pesquisa pelo nome do conteúdo."
        />
      ) : (data?.data.length ?? 0) === 0 && libraryItems.length === 0 ? (
        <EmptyState
          title="Nenhum conteúdo encontrado"
          description="Ajusta os filtros ou a pesquisa para veres mais resultados."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {data?.data.map((c) => (
            <ContentCard key={c.id} content={c} />
          ))}
        </div>
      )}

      {libraryItems.length > 0 && (
        <div>
          <h3 className="mb-3 font-body font-semibold text-ink">Recursos</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {libraryItems.map((item) => (
              <LibraryItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {data && data.meta.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button
            intent="secondary"
            size="sm"
            disabled={page === 1}
            onClick={() => goToPage(-1)}
          >
            ← Anterior
          </Button>
          <span className="px-4 py-2 font-body text-sm text-ink-muted">
            {page} / {data.meta.totalPages}
          </span>
          <Button
            intent="secondary"
            size="sm"
            disabled={page === data.meta.totalPages}
            onClick={() => goToPage(1)}
          >
            Próxima →
          </Button>
        </div>
      )}
    </div>
  );
}

// components/content-library/CatalogueTab.tsx
// Separador "Catálogo" — pesquisa/filtros/ordenação + grelha paginada.
// Dados próprios (useApiQuery) + apresentação. Extraído de
// app/(platform)/content-library/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { BookOpen, Search } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { ContentCard } from './ContentCard';
import type { Content } from './types';

const FORMATS = [
  'VIDEO',
  'ARTICLE',
  'PODCAST',
  'PDF',
  'SCORM',
  'COURSE',
  'MICROLEARNING',
  'QUIZ',
];
const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

const FORMAT_ITEMS = [
  { value: 'ALL', label: 'Todos os formatos' },
  ...FORMATS.map((f) => ({ value: f, label: f })),
];
const LEVEL_ITEMS = [
  { value: 'ALL', label: 'Todos os níveis' },
  ...LEVELS.map((l) => ({ value: l, label: l })),
];
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
  micro: boolean;
  cert: boolean;
  page: number;
}
const INITIAL_CATALOGUE_FILTERS: CatalogueFilters = {
  search: '',
  format: 'ALL',
  level: 'ALL',
  sortBy: 'newest',
  micro: false,
  cert: false,
  page: 1,
};

export function CatalogueTab() {
  const [filters, setFilters] = useState<CatalogueFilters>(
    INITIAL_CATALOGUE_FILTERS,
  );
  const { search, format, level, sortBy, micro, cert, page } = filters;

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
    ...(micro ? { isMicrolearning: 'true' } : {}),
    ...(cert ? { hasCertification: 'true' } : {}),
  };
  const { data, isLoading } = useApiQuery<{
    data: Content[];
    meta: { total: number; totalPages: number };
  }>(queryKeys.contentLibrary.catalogue(params), '/content-library', {
    params,
    staleTime: STALE_TIME.SEMI_STATIC,
    placeholderData: keepPreviousData,
  });
  const loading = isLoading;

  return (
    <div className="space-y-4">
      {/* Search + filters */}
      <Card>
        <CardBody className="space-y-3">
          <div className="relative">
            <Search
              size={16}
              strokeWidth={1.75}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <Input
              value={search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              placeholder="Pesquisar conteúdos..."
              className="w-full pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              items={FORMAT_ITEMS}
              value={format}
              onValueChange={(v) => updateFilters({ format: v })}
            />
            <Select
              items={LEVEL_ITEMS}
              value={level}
              onValueChange={(v) => updateFilters({ level: v })}
            />
            <Select
              items={SORT_ITEMS}
              value={sortBy}
              onValueChange={(v) => updateFilters({ sortBy: v })}
            />

            {[
              { label: '⚡ Micro', value: micro, key: 'micro' as const },
              { label: '🎓 Certif.', value: cert, key: 'cert' as const },
            ].map((t) => (
              <button
                key={t.label}
                type="button"
                aria-pressed={t.value}
                onClick={() => updateFilters({ [t.key]: !t.value })}
                className={cn(
                  'rounded-control border px-3 py-1.5 font-body text-xs transition-colors',
                  t.value
                    ? 'border-primary bg-primary-subtle text-primary'
                    : 'border-border-strong bg-surface text-ink-muted',
                )}
              >
                {t.label}
              </button>
            ))}

            <span className="ml-auto font-body text-xs text-ink-faint">
              {data?.meta.total ?? 0} conteúdos
            </span>
          </div>
        </CardBody>
      </Card>

      {/* Grid */}
      {loading ? (
        <Skeleton
          rows={12}
          wrapperClassName="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse"
          itemClassName="bg-surface-sunken rounded-card h-52"
        />
      ) : (data?.data.length ?? 0) === 0 ? (
        <EmptyState
          icon={BookOpen}
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

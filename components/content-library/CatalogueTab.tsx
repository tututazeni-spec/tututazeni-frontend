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
import { Skeleton } from './atoms';
import { ContentCard } from './ContentCard';
import type { Content } from './types';

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
  format: '',
  level: '',
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
    ...(format ? { format } : {}),
    ...(level ? { level } : {}),
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

  return (
    <div className="space-y-4">
      {/* Search + filters */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-3">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            placeholder="Pesquisar conteúdos..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Format */}
          <select
            value={format}
            onChange={(e) => updateFilters({ format: e.target.value })}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none"
          >
            <option value="">Todos os formatos</option>
            {FORMATS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>

          {/* Level */}
          <select
            value={level}
            onChange={(e) => updateFilters({ level: e.target.value })}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none"
          >
            <option value="">Todos os níveis</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => updateFilters({ sortBy: e.target.value })}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none"
          >
            <option value="newest">Mais recente</option>
            <option value="popular">Mais visto</option>
            <option value="rating">Melhor avaliado</option>
            <option value="duration">Mais curto</option>
          </select>

          {/* Toggles */}
          {[
            { label: '⚡ Micro', value: micro, key: 'micro' as const },
            { label: '🎓 Certif.', value: cert, key: 'cert' as const },
          ].map((t) => (
            <button
              key={t.label}
              onClick={() => updateFilters({ [t.key]: !t.value })}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                t.value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              {t.label}
            </button>
          ))}

          <span className="text-xs text-slate-400 ml-auto">
            {data?.meta.total ?? 0} conteúdos
          </span>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <Skeleton count={12} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {data?.data.map((c) => (
            <ContentCard key={c.id} content={c} />
          ))}
          {(data?.data.length ?? 0) === 0 && (
            <div className="col-span-4 py-16 text-center text-slate-400">
              <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
              <p>Nenhum conteúdo encontrado</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {data && data.meta.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <button
            disabled={page === 1}
            onClick={() => goToPage(-1)}
            className="px-4 py-2 text-sm rounded-lg border border-slate-200 disabled:opacity-40"
          >
            ← Anterior
          </button>
          <span className="px-4 py-2 text-sm text-slate-600">
            {page} / {data.meta.totalPages}
          </span>
          <button
            disabled={page === data.meta.totalPages}
            onClick={() => goToPage(1)}
            className="px-4 py-2 text-sm rounded-lg border border-slate-200 disabled:opacity-40"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}

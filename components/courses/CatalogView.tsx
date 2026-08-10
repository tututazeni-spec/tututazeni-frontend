// components/courses/CatalogView.tsx
// Vista "Catálogo": listagem paginada e filtrável de cursos
// publicados. Extraído de app/(platform)/courses/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './shared';
import { CourseCard } from './CourseCard';
import type { PaginatedCourses } from './types';

// Um só objecto para os filtros + page: mudar qualquer filtro tem sempre de
// repor a página a 1, e um setter partilhado torna isso automático em vez de
// repetido (e potencialmente esquecido) em cada handler.
interface CatalogFilters {
  search: string;
  category: string;
  level: string;
  mandatory: string;
  page: number;
}
const INITIAL_CATALOG_FILTERS: CatalogFilters = {
  search: '',
  category: '',
  level: '',
  mandatory: '',
  page: 1,
};

interface CatalogViewProps {
  onSelect: (id: number) => void;
}

export function CatalogView({ onSelect }: CatalogViewProps) {
  const [filters, setFilters] = useState<CatalogFilters>(
    INITIAL_CATALOG_FILTERS,
  );
  const { search, category, level, mandatory, page } = filters;

  function updateFilters(patch: Partial<Omit<CatalogFilters, 'page'>>) {
    setFilters((f) => ({ ...f, ...patch, page: 1 }));
  }
  function goToPage(delta: number) {
    setFilters((f) => ({ ...f, page: f.page + delta }));
  }

  const debouncedSearch = useDebounce(search);
  const params = {
    page,
    limit: 12,
    status: 'PUBLISHED',
    search: debouncedSearch,
    category,
    level,
    mandatory,
  };

  // Lista e categorias correm em paralelo (queries independentes).
  const {
    data,
    isLoading: loading,
    error,
  } = useApiQuery<PaginatedCourses>(
    queryKeys.courses.list(params),
    '/courses',
    {
      params,
      staleTime: STALE_TIME.SEMI_STATIC,
      placeholderData: keepPreviousData,
    },
  );
  // Categorias mudam pouco → cache longa (STATIC).
  const { data: cats = [] } = useApiQuery<
    Array<{ category: string; count: number }>
  >(queryKeys.courses.categories(), '/courses/categories', {
    staleTime: STALE_TIME.STATIC,
  });
  const categories = cats.map((c) => c.category).filter(Boolean) as string[];

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Pesquisar cursos, competências, tópicos…"
          value={search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          className="flex-1 min-w-[200px] text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={category}
          onChange={(e) => updateFilters({ category: e.target.value })}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={level}
          onChange={(e) => updateFilters({ level: e.target.value })}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os níveis</option>
          <option value="BEGINNER">Iniciante</option>
          <option value="INTERMEDIATE">Intermédio</option>
          <option value="ADVANCED">Avançado</option>
        </select>
        <select
          value={mandatory}
          onChange={(e) => updateFilters({ mandatory: e.target.value })}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Obrigatório e opcional</option>
          <option value="true">Apenas obrigatórios</option>
          <option value="false">Apenas opcionais</option>
        </select>
      </div>

      {error && (
        <div className="text-sm text-red-500 mb-4">{error.message}</div>
      )}

      {loading && <Skeleton rows={3} />}

      {!loading && data && (
        <>
          <div className="text-xs text-gray-400 mb-4">
            {data.total} cursos encontrados
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {data.data.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onClick={() => onSelect(course.id)}
              />
            ))}
          </div>
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Página {data.page} de {data.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => goToPage(-1)}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  ← Anterior
                </button>
                <button
                  disabled={page === data.totalPages}
                  onClick={() => goToPage(1)}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  Próxima →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

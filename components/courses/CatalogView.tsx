// components/courses/CatalogView.tsx
// Vista "Catálogo": listagem paginada e filtrável de cursos
// publicados. Extraído de app/(platform)/courses/page.tsx. Migrado
// para a fundação de design: input de pesquisa passa a Input, selects
// de filtro passam a Select (Radix, sentinela 'ALL' para "todos"/
// "todas" — mesmo padrão de components/learning-paths/CatalogView.tsx),
// estado vazio a EmptyState, paginação a Button secondary/sm.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { SearchX } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from './shared';
import { CourseCard } from './CourseCard';
import type { PaginatedCourses } from './types';

const LEVEL_ITEMS = [
  { value: 'ALL', label: 'Todos os níveis' },
  { value: 'BEGINNER', label: 'Iniciante' },
  { value: 'INTERMEDIATE', label: 'Intermédio' },
  { value: 'ADVANCED', label: 'Avançado' },
];

const MANDATORY_ITEMS = [
  { value: 'ALL', label: 'Obrigatório e opcional' },
  { value: 'true', label: 'Apenas obrigatórios' },
  { value: 'false', label: 'Apenas opcionais' },
];

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
  const categoryItems = [
    { value: 'ALL', label: 'Todas as categorias' },
    ...categories.map((c) => ({ value: c, label: c })),
  ];

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Input
          type="text"
          placeholder="Pesquisar cursos, competências, tópicos…"
          value={search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          className="flex-1 min-w-[200px]"
        />
        <Select
          items={categoryItems}
          value={category || 'ALL'}
          onValueChange={(v) => updateFilters({ category: v === 'ALL' ? '' : v })}
        />
        <Select
          items={LEVEL_ITEMS}
          value={level || 'ALL'}
          onValueChange={(v) => updateFilters({ level: v === 'ALL' ? '' : v })}
        />
        <Select
          items={MANDATORY_ITEMS}
          value={mandatory || 'ALL'}
          onValueChange={(v) => updateFilters({ mandatory: v === 'ALL' ? '' : v })}
        />
      </div>

      {error && (
        <div className="text-sm text-danger mb-4">{error.message}</div>
      )}

      {loading && <Skeleton rows={3} />}

      {!loading && data && (
        <>
          <div className="text-xs text-ink-faint mb-4">
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
          {data.data.length === 0 && (
            <EmptyState
              icon={SearchX}
              title="Nenhum curso encontrado"
              description="Ajusta a pesquisa ou os filtros para encontrar o que procuras."
            />
          )}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-faint">
                Página {data.page} de {data.totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  intent="secondary"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => goToPage(-1)}
                >
                  ← Anterior
                </Button>
                <Button
                  intent="secondary"
                  size="sm"
                  disabled={page === data.totalPages}
                  onClick={() => goToPage(1)}
                >
                  Próxima →
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

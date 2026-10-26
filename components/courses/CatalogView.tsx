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
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { COURSE_MODALITY_LABELS, COURSE_TYPE_LABELS, Skeleton } from './shared';
import { CourseListCard } from './CourseListCard';
import type { PaginatedCourses } from './types';

const TYPE_ITEMS = [
  { value: 'ALL', label: 'Todos os tipos' },
  ...Object.entries(COURSE_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

const MODALITY_ITEMS = [
  { value: 'ALL', label: 'Todas as modalidades' },
  ...Object.entries(COURSE_MODALITY_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

// Um só objecto para os filtros + page: mudar qualquer filtro tem sempre de
// repor a página a 1, e um setter partilhado torna isso automático em vez de
// repetido (e potencialmente esquecido) em cada handler.
interface CatalogFilters {
  search: string;
  type: string;
  modality: string;
  page: number;
}
const INITIAL_CATALOG_FILTERS: CatalogFilters = {
  search: '',
  type: '',
  modality: '',
  page: 1,
};

interface CatalogViewProps {
  onSelect: (id: number) => void;
}

export function CatalogView({ onSelect }: CatalogViewProps) {
  const [filters, setFilters] = useState<CatalogFilters>(
    INITIAL_CATALOG_FILTERS,
  );
  const { search, type, modality, page } = filters;

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
    type: type || undefined,
    modality: modality || undefined,
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
  return (
    <div>
      {/* Filtros — Card + CardBody (padrão do separador Relatórios do roi-impact) */}
      <Card className="mb-6">
        <CardBody className="flex flex-wrap items-center gap-3">
          <Input
            type="text"
            placeholder="Pesquisar cursos…"
            value={search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="min-w-[160px] flex-1"
          />
          <Select
            items={TYPE_ITEMS}
            value={type || 'ALL'}
            onValueChange={(v) => updateFilters({ type: v === 'ALL' ? '' : v })}
          />
          <Select
            items={MODALITY_ITEMS}
            value={modality || 'ALL'}
            onValueChange={(v) =>
              updateFilters({ modality: v === 'ALL' ? '' : v })
            }
          />
        </CardBody>
      </Card>

      {error && <div className="text-sm text-ink mb-4">{error.message}</div>}

      {loading && <Skeleton rows={3} />}

      {!loading && data && (
        <>
          <div className="text-xs text-ink-faint mb-4">
            {data.total} cursos encontrados
          </div>
          <div className="grid auto-rows-fr grid-cols-1 gap-4 mb-6 md:grid-cols-2 xl:grid-cols-3">
            {[...data.data]
              .sort((a, b) => a.id - b.id)
              .map((course) => (
                <CourseListCard
                  key={course.id}
                  courseId={course.id}
                  course={course}
                  mandatory={course.mandatory}
                  onSelect={() => onSelect(course.id)}
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

// components/learning-paths/CatalogView.tsx
// Separador "Catálogo" — pesquisa/filtros paginados de trilhas
// publicadas. Dados próprios + apresentação. Extraído de
// app/(platform)/learning-paths/page.tsx. Migrado para a fundação de
// design: input de pesquisa passa a Input, selects de filtro passam a
// Select (Radix, sentinela 'ALL' para "todos"/"todas" — mesmo padrão
// de components/events/CatalogView.tsx), skeleton local (atoms.tsx)
// passa a Skeleton da fundação, estado vazio a EmptyState, paginação a
// Button secondary/sm.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { RouteOff } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { LP_TYPE_MAP, PATH_TYPE_FILTER_KEYS } from './constants';
import { LearningPathCard } from './LearningPathCard';
import type { PaginatedLPs } from './types';

const LEVEL_ITEMS = [
  { value: 'ALL', label: 'Todos os níveis' },
  { value: 'BEGINNER', label: 'Básico' },
  { value: 'INTERMEDIATE', label: 'Intermédio' },
  { value: 'ADVANCED', label: 'Avançado' },
];

const TYPE_ITEMS = [
  { value: 'ALL', label: 'Todos os tipos' },
  ...PATH_TYPE_FILTER_KEYS.map((k) => ({
    value: k,
    label: LP_TYPE_MAP[k].label,
  })),
];

const MANDATORY_ITEMS = [
  { value: 'ALL', label: 'Todas' },
  { value: 'true', label: 'Apenas obrigatórias' },
  { value: 'false', label: 'Apenas opcionais' },
];

interface CatalogViewProps {
  onSelect: (id: number) => void;
}

export function CatalogView({ onSelect }: CatalogViewProps) {
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [pathType, setPathType] = useState('');
  const [mandatory, setMandatory] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);
  const params = {
    page,
    limit: 12,
    status: 'PUBLISHED',
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(level ? { level } : {}),
    ...(pathType ? { pathType } : {}),
    ...(mandatory ? { mandatory } : {}),
  };
  const {
    data,
    isLoading: loading,
    error,
  } = useApiQuery<PaginatedLPs>(
    queryKeys.learningPaths.catalog(params),
    '/learning-paths',
    {
      params,
      staleTime: STALE_TIME.SEMI_STATIC,
      placeholderData: keepPreviousData,
    },
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Input
          type="text"
          placeholder="Pesquisar trilhas, tags, categorias…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="min-w-[200px] flex-1"
        />
        <Select
          items={LEVEL_ITEMS}
          value={level || 'ALL'}
          onValueChange={(v) => {
            setLevel(v === 'ALL' ? '' : v);
            setPage(1);
          }}
        />
        <Select
          items={TYPE_ITEMS}
          value={pathType || 'ALL'}
          onValueChange={(v) => {
            setPathType(v === 'ALL' ? '' : v);
            setPage(1);
          }}
        />
        <Select
          items={MANDATORY_ITEMS}
          value={mandatory || 'ALL'}
          onValueChange={(v) => {
            setMandatory(v === 'ALL' ? '' : v);
            setPage(1);
          }}
        />
      </div>

      {error && (
        <div className="mb-4 font-body text-sm text-danger">
          {error.message}
        </div>
      )}
      {loading && (
        <Skeleton
          rows={6}
          wrapperClassName="grid grid-cols-3 gap-4"
          itemClassName="skeleton-shimmer h-64 rounded-card"
        />
      )}

      {!loading && data && (
        <>
          <div className="mb-4 font-body text-xs text-ink-faint">
            {data.total} trilhas encontradas
          </div>
          <div className="mb-6 grid grid-cols-3 gap-4">
            {data.data.map((path) => (
              <LearningPathCard
                key={path.id}
                path={path}
                onClick={() => onSelect(path.id)}
              />
            ))}
          </div>
          {data.data.length === 0 && (
            <EmptyState
              icon={RouteOff}
              title="Nenhuma trilha encontrada"
              description="Ajusta a pesquisa ou os filtros para encontrar o que procuras."
            />
          )}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="font-body text-xs text-ink-faint">
                Página {data.page} de {data.totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  intent="secondary"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Anterior
                </Button>
                <Button
                  intent="secondary"
                  size="sm"
                  disabled={page === data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
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

// components/competencies/CatalogView.tsx
// Separador "Catálogo" — pesquisa/filtro por categoria. Dados próprios
// + apresentação. Extraído de app/(platform)/competencies/page.tsx.
// Migrado para a fundação de design: input de pesquisa passa a Input,
// select de categoria passa a Select (Radix), skeleton local passa a
// components/ui/Skeleton, estado vazio passa a EmptyState. O cartão
// clicável usa uma div própria (role="button" + tabIndex + onKeyDown
// manual) em vez do `Card` da fundação com a prop `interactive` — bug
// conhecido (ver plano de rollout), mesmo padrão de
// components/knowledge/ArticleCard.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CATEGORY_CFG } from './constants';
import type { Competency } from './types';

const CATEGORY_ITEMS = [
  { value: 'ALL', label: 'Todas as categorias' },
  ...Object.entries(CATEGORY_CFG).map(([k, v]) => ({
    value: k,
    label: v.label,
  })),
];

interface CatalogViewProps {
  onSelect: (id: number) => void;
}

export function CatalogView({ onSelect }: CatalogViewProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);
  const params = {
    page,
    limit: 24,
    status: 'ACTIVE',
    search: debouncedSearch,
    category: category === 'ALL' ? '' : category,
  };

  const { data, isLoading: loading } = useApiQuery<{
    data: Competency[];
    total: number;
  }>(queryKeys.competencies.catalog(params), '/competencies', {
    params,
    staleTime: STALE_TIME.SEMI_STATIC,
    placeholderData: keepPreviousData,
  });

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Input
          type="text"
          placeholder="Pesquisar competências, tags…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="min-w-[200px] flex-1"
        />
        <Select
          items={CATEGORY_ITEMS}
          value={category}
          onValueChange={(v) => {
            setCategory(v);
            setPage(1);
          }}
        />
        <span className="font-body text-sm text-ink-faint">
          {data?.total ?? 0} competências
        </span>
      </div>

      {loading ? (
        <Skeleton rows={6} />
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {data?.data.map((comp) => (
            <div
              key={comp.id}
              onClick={() => onSelect(comp.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(comp.id);
                }
              }}
              className="cursor-pointer rounded-card border border-border bg-surface p-4 shadow-resting transition-shadow duration-150 hover:shadow-hover"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="mb-1 font-body text-sm font-semibold text-ink">
                    {comp.name}
                  </div>
                  <StatusBadge value={comp.category} map={CATEGORY_CFG} />
                </div>
              </div>
              {comp.description && (
                <p className="mb-2 line-clamp-2 font-body text-xs text-ink-muted">
                  {comp.description}
                </p>
              )}
              <div className="mb-3 flex flex-wrap gap-1">
                {comp.tags.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className="rounded bg-surface-sunken px-1.5 py-0.5 font-body text-xs text-ink-muted"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3 font-body text-xs text-ink-faint">
                <span> {comp._count.userCompetencies}</span>
                <span> {comp._count.courses} cursos</span>
                <span> {comp._count.positions} cargos</span>
              </div>
            </div>
          ))}
          {data?.data.length === 0 && (
            <div className="col-span-3">
              <EmptyState
                title="Nenhuma competência encontrada"
                description="Ajusta a pesquisa ou a categoria seleccionada."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

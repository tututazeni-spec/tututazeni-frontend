// components/competencies/CatalogView.tsx
// Separador "Catálogo" — pesquisa/filtro por categoria. Dados próprios
// + apresentação. Extraído de app/(platform)/competencies/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from './atoms';
import { CATEGORY_CFG } from './constants';
import type { Competency } from './types';

interface CatalogViewProps {
  onSelect: (id: number) => void;
}

export function CatalogView({ onSelect }: CatalogViewProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);
  const params = {
    page,
    limit: 24,
    status: 'ACTIVE',
    search: debouncedSearch,
    category,
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
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="text"
          placeholder="Pesquisar competências, tags…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 min-w-[200px] text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas as categorias</option>
          {Object.entries(CATEGORY_CFG).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-400">
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
              className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900 mb-1">
                    {comp.name}
                  </div>
                  <StatusBadge value={comp.category} map={CATEGORY_CFG} />
                </div>
              </div>
              {comp.description && (
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                  {comp.description}
                </p>
              )}
              <div className="flex flex-wrap gap-1 mb-3">
                {comp.tags.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>👥 {comp._count.userCompetencies}</span>
                <span>📚 {comp._count.courses} cursos</span>
                <span>🎯 {comp._count.positions} cargos</span>
              </div>
            </div>
          ))}
          {data?.data.length === 0 && (
            <div className="col-span-3 py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Nenhuma competência encontrada
            </div>
          )}
        </div>
      )}
    </div>
  );
}

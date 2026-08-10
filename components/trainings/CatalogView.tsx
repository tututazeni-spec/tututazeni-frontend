// components/trainings/CatalogView.tsx
// Separador "Catálogo" — pesquisa/filtros paginados de treinamentos.
// Dados próprios + apresentação. Extraído de
// app/(platform)/trainings/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import { LEVEL_CFG, TYPE_CFG } from './constants';
import { TrainingCard } from './TrainingCard';
import type { Training, TrainingLevel, TrainingType } from './types';

interface CatalogViewProps {
  onSelect: (id: number) => void;
}

export function CatalogView({ onSelect }: CatalogViewProps) {
  const [type, setType] = useState<TrainingType | ''>('');
  const [level, setLevel] = useState<TrainingLevel | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);
  const params = { page, limit: 12, type, level, search: debouncedSearch };

  const { data, isLoading: loading } = useApiQuery<{
    data: Training[];
    total: number;
  }>(queryKeys.trainings.list(params), '/trainings', {
    params,
    staleTime: STALE_TIME.SEMI_STATIC,
    placeholderData: keepPreviousData,
  });

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="text"
          placeholder="Pesquisar treinamentos…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 min-w-[200px] text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as TrainingType | '');
            setPage(1);
          }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os formatos</option>
          {Object.entries(TYPE_CFG).map(([k, v]) => (
            <option key={k} value={k}>
              {v.icon} {v.label}
            </option>
          ))}
        </select>
        <select
          value={level}
          onChange={(e) => {
            setLevel(e.target.value as TrainingLevel | '');
            setPage(1);
          }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os níveis</option>
          {Object.entries(LEVEL_CFG).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-400">
          {data?.total ?? 0} treinamentos
        </span>
      </div>

      {loading ? (
        <Skeleton />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-5">
            {data?.data.map((t) => (
              <TrainingCard
                key={t.id}
                training={t}
                onClick={() => onSelect(t.id)}
              />
            ))}
            {data?.data.length === 0 && (
              <div className="col-span-3 py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
                Sem treinamentos disponíveis
              </div>
            )}
          </div>
          {(data?.total ?? 0) > 12 && (
            <div className="flex justify-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                ← Anterior
              </button>
              <button
                disabled={(data?.total ?? 0) <= page * 12}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Próximos →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

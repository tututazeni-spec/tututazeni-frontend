// components/learning-paths/CatalogView.tsx
// Separador "Catálogo" — pesquisa/filtros paginados de trilhas
// publicadas. Dados próprios + apresentação. Extraído de
// app/(platform)/learning-paths/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import { LearningPathCard } from './LearningPathCard';
import type { PaginatedLPs } from './types';

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
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Pesquisar trilhas, tags, categorias…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 min-w-[200px] text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={level}
          onChange={(e) => {
            setLevel(e.target.value);
            setPage(1);
          }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os níveis</option>
          <option value="BEGINNER">Básico</option>
          <option value="INTERMEDIATE">Intermédio</option>
          <option value="ADVANCED">Avançado</option>
        </select>
        <select
          value={pathType}
          onChange={(e) => {
            setPathType(e.target.value);
            setPage(1);
          }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os tipos</option>
          <option value="ONBOARDING">Onboarding</option>
          <option value="UPSKILLING">Upskilling</option>
          <option value="COMPLIANCE">Compliance</option>
          <option value="LEADERSHIP">Liderança</option>
          <option value="CERTIFICATION">Certificação</option>
        </select>
        <select
          value={mandatory}
          onChange={(e) => {
            setMandatory(e.target.value);
            setPage(1);
          }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas</option>
          <option value="true">Apenas obrigatórias</option>
          <option value="false">Apenas opcionais</option>
        </select>
      </div>

      {error && (
        <div className="text-sm text-red-500 mb-4">{error.message}</div>
      )}
      {loading && <Skeleton />}

      {!loading && data && (
        <>
          <div className="text-xs text-gray-400 mb-4">
            {data.total} trilhas encontradas
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {data.data.map((path) => (
              <LearningPathCard
                key={path.id}
                path={path}
                onClick={() => onSelect(path.id)}
              />
            ))}
          </div>
          {data.data.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Nenhuma trilha encontrada
            </div>
          )}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Página {data.page} de {data.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  ← Anterior
                </button>
                <button
                  disabled={page === data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
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

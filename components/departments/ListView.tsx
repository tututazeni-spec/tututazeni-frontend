// components/departments/ListView.tsx
// Separador "Lista" — tabela paginada de departamentos. Dados próprios
// + apresentação. Extraído de app/(platform)/departments/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar, Skeleton, StatusBadge } from './atoms';
import type { PaginatedDepts } from './types';

interface ListViewProps {
  onSelect: (id: number) => void;
}

export function ListView({ onSelect }: ListViewProps) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);
  const params = {
    page,
    limit: 20,
    search: debouncedSearch,
    active: activeFilter || undefined,
  };

  const {
    data,
    isLoading: loading,
    error: queryError,
  } = useApiQuery<PaginatedDepts>(
    queryKeys.departments.list(params),
    '/departments',
    {
      params,
      staleTime: STALE_TIME.SEMI_STATIC,
      placeholderData: keepPreviousData,
    },
  );
  const error = queryError?.message ?? null;

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="text"
          placeholder="Pesquisar por nome, código ou gestor…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 min-w-[220px] text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value);
            setPage(1);
          }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os estados</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
        <span className="text-sm text-gray-400">
          {data?.total ?? 0} departamentos
        </span>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_90px_160px_80px_90px_70px] gap-3 px-4 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
          <div>Departamento</div>
          <div>Código</div>
          <div>Gestor</div>
          <div>Membros</div>
          <div>Estado</div>
          <div>Sub-deptos</div>
        </div>

        {loading && (
          <div className="p-4">
            <Skeleton />
          </div>
        )}
        {error && (
          <div className="px-4 py-8 text-center text-sm text-red-500">
            {error}
          </div>
        )}
        {!loading && data?.data.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-gray-400">
            Nenhum departamento encontrado
          </div>
        )}

        {!loading &&
          data?.data.map((d) => (
            <div
              key={d.id}
              className="grid grid-cols-[2fr_90px_160px_80px_90px_70px] gap-3 items-center px-4 py-3.5 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors last:border-0"
              onClick={() => onSelect(d.id)}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: d.color ?? '#cbd5e1' }}
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {d.name}
                  </div>
                  {d.parent && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      ↳ {d.parent.name}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-xs font-mono text-gray-500">{d.code}</div>
              <div>
                {d.head ? (
                  <div className="flex items-center gap-2">
                    <Avatar name={d.head.fullName} size="sm" />
                    <span className="text-xs text-gray-700 truncate">
                      {d.head.fullName}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </div>
              <div className="text-sm text-gray-500">{d._count.users}</div>
              <div>
                <StatusBadge active={d.active} />
              </div>
              <div className="text-sm text-gray-400">{d._count.children}</div>
            </div>
          ))}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
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
    </div>
  );
}

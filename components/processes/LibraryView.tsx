// components/processes/LibraryView.tsx
// Separador "Biblioteca" — lista paginada/filtrável de processos. Dados
// próprios (useApiQuery) + apresentação, mesmo padrão auto-contido usado em
// components/payslips/page.tsx (ListView). Extraído de
// app/(platform)/processes/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PROCESS_STATUS_MAP, RISK_LEVEL_MAP } from './constants';
import { Skeleton } from './Skeleton';
import type { PaginatedProcesses } from './types';

export interface LibraryViewProps {
  onSelect: (id: number) => void;
}

export function LibraryView({ onSelect }: LibraryViewProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [risk, setRisk] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);
  const params = {
    page,
    limit: 15,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(status ? { status } : {}),
    ...(risk ? { riskLevel: risk } : {}),
  };
  const {
    data,
    isLoading: loading,
    error,
  } = useApiQuery<PaginatedProcesses>(
    queryKeys.processes.library(params),
    '/processes',
    {
      params,
      staleTime: STALE_TIME.SEMI_STATIC,
      placeholderData: keepPreviousData,
    },
  );

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="text"
          placeholder="Pesquisar por nome, código, tag…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 min-w-[200px] text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os estados</option>
          <option value="DRAFT">Rascunho</option>
          <option value="IN_REVIEW">Em revisão</option>
          <option value="ACTIVE">Activo</option>
          <option value="ARCHIVED">Arquivado</option>
        </select>
        <select
          value={risk}
          onChange={(e) => {
            setRisk(e.target.value);
            setPage(1);
          }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os riscos</option>
          <option value="LOW">Baixo</option>
          <option value="MEDIUM">Médio</option>
          <option value="HIGH">Alto</option>
          <option value="CRITICAL">Crítico</option>
        </select>
        <span className="text-sm text-gray-400">
          {data?.total ?? 0} processos
        </span>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_100px_120px_90px_100px_90px] gap-3 px-4 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
          <div>Processo</div>
          <div>Versão</div>
          <div>Departamento</div>
          <div>Risco</div>
          <div>Estado</div>
          <div>Instâncias</div>
        </div>

        {loading && (
          <div className="p-4">
            <Skeleton />
          </div>
        )}
        {error && (
          <div className="px-4 py-8 text-center text-sm text-red-500">
            {error.message}
          </div>
        )}

        {!loading && data?.data.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-gray-400">
            Nenhum processo encontrado
          </div>
        )}

        {!loading &&
          data?.data.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-[2fr_100px_120px_90px_100px_90px] gap-3 items-center px-4 py-3.5 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors last:border-0"
              onClick={() => onSelect(p.id)}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {p.title}
                  </span>
                  {p.tags.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-gray-400 mt-0.5 font-mono">
                  {p.code}
                </div>
              </div>
              <div className="text-xs font-mono text-gray-500">
                v{p.version}
              </div>
              <div className="text-xs text-gray-500">
                {p.department?.name ?? '—'}
              </div>
              <div>
                <StatusBadge value={p.riskLevel} map={RISK_LEVEL_MAP} />
              </div>
              <div>
                <StatusBadge
                  value={p.status}
                  map={PROCESS_STATUS_MAP}
                  variant="dot"
                />
              </div>
              <div className="text-sm text-gray-500">{p._count.instances}</div>
            </div>
          ))}
      </div>

      {/* Paginação */}
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

// components/enrollments/AdminView.tsx
// Separador "Gestão (Admin)" — tabela filtrável, paginada e com
// actualização de deadline em massa. Dados próprios + apresentação.
// Extraído de app/(platform)/enrollments/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import {
  Avatar,
  DeadlinePill,
  OriginBadge,
  ProgressBar,
  Skeleton,
  StatusBadge,
} from './atoms';
import type { Enrollment } from './types';

export function AdminView() {
  // Um só objecto para os filtros + page: mudar qualquer filtro repõe a
  // página a 1 automaticamente (o checkbox "overdue" não fazia isto antes).
  const [filters, setFilters] = useState({
    status: '',
    mandatory: '',
    overdue: '',
    page: 1,
  });
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkDeadline, setBulkDeadline] = useState('');

  function updateFilters(patch: Partial<Omit<typeof filters, 'page'>>) {
    setFilters((f) => ({ ...f, ...patch, page: 1 }));
  }
  function goToPage(delta: number) {
    setFilters((f) => ({ ...f, page: f.page + delta }));
  }

  const params = {
    page: filters.page,
    limit: 20,
    status: filters.status,
    mandatory: filters.mandatory,
    overdue: filters.overdue ? 'true' : undefined,
  };

  const { data, isLoading: loading } = useApiQuery<{
    data: Enrollment[];
    total: number;
    page: number;
    totalPages: number;
  }>(queryKeys.enrollments.list(params), '/enrollments', {
    params,
    staleTime: STALE_TIME.DYNAMIC,
    placeholderData: keepPreviousData,
  });

  // Deadline em massa: dispara os PATCH em paralelo; ao concluir invalida as listas.
  const bulkDeadlineMut = useApiMutation(
    () =>
      Promise.all(
        selected.map((id) =>
          apiClient.patch(`/enrollments/${id}/deadline`, {
            deadline: bulkDeadline,
          }),
        ),
      ),
    {
      invalidateKeys: [queryKeys.enrollments.lists()],
      onSuccess: () => {
        setSelected([]);
        setBulkDeadline('');
      },
      onError: (e) => alert(e.message),
    },
  );
  const bulkLoading = bulkDeadlineMut.isPending;

  const handleBulkDeadline = () => {
    if (!bulkDeadline || selected.length === 0) return;
    bulkDeadlineMut.mutate(undefined);
  };

  const toggleSelect = (id: number) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select
          value={filters.status}
          onChange={(e) => updateFilters({ status: e.target.value })}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os estados</option>
          <option value="NOT_STARTED">Não iniciado</option>
          <option value="IN_PROGRESS">Em progresso</option>
          <option value="COMPLETED">Concluído</option>
          <option value="OVERDUE">Atrasado</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
        <select
          value={filters.mandatory}
          onChange={(e) => updateFilters({ mandatory: e.target.value })}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Obrigatório e opcional</option>
          <option value="true">Apenas obrigatórios</option>
          <option value="false">Apenas opcionais</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={!!filters.overdue}
            onChange={(e) =>
              updateFilters({ overdue: e.target.checked ? 'true' : '' })
            }
            className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
          />
          Apenas atrasados
        </label>
        <span className="text-sm text-gray-400 ml-auto">
          {data?.total ?? 0} matrículas
        </span>
      </div>

      {/* Bulk deadline */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl">
          <span className="text-sm font-medium text-blue-700">
            {selected.length} seleccionados
          </span>
          <input
            type="date"
            value={bulkDeadline}
            onChange={(e) => setBulkDeadline(e.target.value)}
            className="text-sm border border-blue-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none"
          />
          <button
            onClick={handleBulkDeadline}
            disabled={!bulkDeadline || bulkLoading}
            className="px-3 py-1.5 bg-blue-700 text-white text-xs font-medium rounded-lg disabled:opacity-50"
          >
            {bulkLoading ? 'A aplicar…' : 'Actualizar deadline'}
          </button>
          <button
            onClick={() => setSelected([])}
            className="text-xs text-blue-600 ml-auto"
          >
            Limpar
          </button>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[32px_1fr_180px_120px_100px_120px_80px] gap-3 px-4 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
          <div />
          <div>Colaborador / Curso</div>
          <div>Estado</div>
          <div>Progresso</div>
          <div>Origem</div>
          <div>Deadline</div>
          <div>Tipo</div>
        </div>

        {loading && (
          <div className="p-4">
            <Skeleton />
          </div>
        )}

        {!loading &&
          data?.data?.map((e) => (
            <div
              key={e.id}
              className="grid grid-cols-[32px_1fr_180px_120px_100px_120px_80px] gap-3 items-center px-4 py-3 border-b border-gray-100 hover:bg-gray-50 last:border-0"
            >
              <input
                type="checkbox"
                checked={selected.includes(e.id)}
                onChange={() => toggleSelect(e.id)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600"
              />
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Avatar user={e.user} />
                  <div>
                    <div className="text-xs font-medium text-gray-900">
                      {e.user?.fullName}
                    </div>
                    <div className="text-xs text-gray-400">{e.user?.email}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-600 pl-10 truncate">
                  {e.course?.title}
                </div>
              </div>
              <div>
                <StatusBadge status={e.status} />
              </div>
              <div>
                <ProgressBar
                  pct={e.progressPercent ?? 0}
                  overdue={e.isOverdue}
                />
              </div>
              <div>
                <OriginBadge origin={e.origin} />
              </div>
              <div className="text-xs">
                {e.deadline ? (
                  <DeadlinePill deadline={e.deadline} isOverdue={e.isOverdue} />
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </div>
              <div>
                {e.mandatory ? (
                  <span className="text-xs text-red-600 font-medium">
                    Obrigatório
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Opcional</span>
                )}
              </div>
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
              disabled={filters.page === 1}
              onClick={() => goToPage(-1)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              ← Anterior
            </button>
            <button
              disabled={filters.page === data.totalPages}
              onClick={() => goToPage(1)}
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

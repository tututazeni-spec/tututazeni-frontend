// components/users/UserListView.tsx
// Vista "Utilizadores": tabela paginada e filtrável, com selecção
// múltipla e acções em lote. Extraído de
// app/(platform)/users/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar, Skeleton } from './shared';
import { ACCOUNT_STATUS_MAP, HR_STATUS_MAP } from './types';
import type { PaginatedUsers } from './types';

interface UserListViewProps {
  onSelect: (id: number) => void;
  onCreate: () => void;
}

export function UserListView({ onSelect, onCreate }: UserListViewProps) {
  // Um só objecto para os filtros + page: mudar qualquer filtro repõe a
  // página a 1 automaticamente, em vez de cada handler repetir setPage(1).
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    hrStatus: '',
    page: 1,
  });
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState('');

  function updateFilters(patch: Partial<Omit<typeof filters, 'page'>>) {
    setFilters((f) => ({ ...f, ...patch, page: 1 }));
  }
  function goToPage(delta: number) {
    setFilters((f) => ({ ...f, page: f.page + delta }));
  }

  const debouncedSearch = useDebounce(filters.search);
  const params = {
    page: filters.page,
    limit: 20,
    search: debouncedSearch,
    accountStatus: filters.status,
    hrStatus: filters.hrStatus,
  };

  const {
    data,
    isLoading: loading,
    error,
  } = useApiQuery<PaginatedUsers>(queryKeys.users.list(params), '/users', {
    params,
    staleTime: STALE_TIME.DYNAMIC,
    placeholderData: keepPreviousData,
  });

  // Bulk action como mutação: ao concluir, invalida as listas de utilizadores.
  const bulk = useApiMutation(
    () =>
      apiClient.post('/users/bulk-action', {
        userIds: selected,
        action: bulkAction,
      }),
    {
      invalidateKeys: [queryKeys.users.lists()],
      onSuccess: () => {
        setSelected([]);
        setBulkAction('');
      },
      onError: (e) => alert(e.message),
    },
  );

  const handleBulkAction = () => {
    if (!bulkAction || selected.length === 0) return;
    bulk.mutate(undefined);
  };
  const bulkLoading = bulk.isPending;

  const toggleSelect = (id: number) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="text"
          placeholder="Pesquisar por nome, email, nº funcionário…"
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          className="flex-1 min-w-[200px] text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filters.status}
          onChange={(e) => updateFilters({ status: e.target.value })}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os estados</option>
          <option value="ACTIVE">Activo</option>
          <option value="PENDING">Pendente</option>
          <option value="SUSPENDED">Suspenso</option>
          <option value="INACTIVE">Inactivo</option>
        </select>
        <select
          value={filters.hrStatus}
          onChange={(e) => updateFilters({ hrStatus: e.target.value })}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Estado RH: Todos</option>
          <option value="ACTIVE">Activo</option>
          <option value="ON_LEAVE">Em licença</option>
          <option value="TERMINATED">Desligado</option>
        </select>
        <span className="text-sm text-gray-400">
          {data?.total ?? 0} utilizadores
        </span>
      </div>

      {/* Bulk actions */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl">
          <span className="text-sm font-medium text-blue-700">
            {selected.length} seleccionados
          </span>
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="text-sm border border-blue-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none"
          >
            <option value="">Escolher acção…</option>
            <option value="activate">Activar</option>
            <option value="deactivate">Desactivar</option>
            <option value="suspend">Suspender</option>
          </select>
          <button
            onClick={handleBulkAction}
            disabled={!bulkAction || bulkLoading}
            className="px-3 py-1.5 bg-blue-700 text-white text-xs font-medium rounded-lg disabled:opacity-50"
          >
            {bulkLoading ? 'A aplicar…' : 'Aplicar'}
          </button>
          <button
            onClick={() => setSelected([])}
            className="text-xs text-blue-600 ml-auto"
          >
            Limpar selecção
          </button>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[32px_1fr_160px_140px_130px_100px_80px] gap-3 px-4 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
          <div />
          <div>Utilizador</div>
          <div>Cargo</div>
          <div>Departamento</div>
          <div>Estado conta</div>
          <div>Estado RH</div>
          <div>Acções</div>
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
            Nenhum utilizador encontrado
          </div>
        )}

        {!loading &&
          data?.data.map((user) => (
            <div
              key={user.id}
              className="grid grid-cols-[32px_1fr_160px_140px_130px_100px_80px] gap-3 items-center px-4 py-3 border-b border-gray-100 hover:bg-gray-50 last:border-0 transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.includes(user.id)}
                onChange={() => toggleSelect(user.id)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => onSelect(user.id)}
              >
                <Avatar user={user} size="sm" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {user.fullName}
                  </div>
                  <div className="text-xs text-gray-400">{user.email}</div>
                  {user.employeeNumber && (
                    <div className="text-xs font-mono text-gray-300">
                      {user.employeeNumber}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {user.position?.name ?? '—'}
              </div>
              <div className="text-xs text-gray-500">
                {user.department?.name ?? '—'}
              </div>
              <div>
                <StatusBadge
                  value={user.accountStatus}
                  map={ACCOUNT_STATUS_MAP}
                  variant="dot"
                />
              </div>
              <div>
                <StatusBadge value={user.hrStatus} map={HR_STATUS_MAP} />
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => onSelect(user.id)}
                  className="w-7 h-7 border border-gray-200 rounded-lg text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-700 flex items-center justify-center"
                  title="Ver perfil"
                >
                  →
                </button>
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

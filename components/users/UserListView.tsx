// components/users/UserListView.tsx
// Vista "Utilizadores": tabela paginada e filtrável, com selecção
// múltipla e acções em lote. Extraído de
// app/(platform)/users/page.tsx.

'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Button, IconButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { ACCOUNT_STATUS_MAP, HR_STATUS_MAP } from './types';
import type { PaginatedUsers } from './types';

interface UserListViewProps {
  onSelect: (id: number) => void;
  onCreate: () => void;
}

export function UserListView({ onSelect }: UserListViewProps) {
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
        <Input
          type="text"
          placeholder="Pesquisar por nome, email, nº funcionário…"
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          className="flex-1 min-w-[200px]"
        />
        <select
          value={filters.status}
          onChange={(e) => updateFilters({ status: e.target.value })}
          className="rounded-control border-[1.5px] border-border-strong bg-surface px-3 py-[9px] font-body text-sm text-ink focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent-subtle"
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
          className="rounded-control border-[1.5px] border-border-strong bg-surface px-3 py-[9px] font-body text-sm text-ink focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent-subtle"
        >
          <option value="">Estado RH: Todos</option>
          <option value="ACTIVE">Activo</option>
          <option value="ON_LEAVE">Em licença</option>
          <option value="TERMINATED">Desligado</option>
        </select>
        <span className="text-sm text-ink-faint">
          {data?.total ?? 0} utilizadores
        </span>
      </div>

      {/* Bulk actions */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2.5 bg-info-subtle border border-info/30 rounded-card">
          <span className="text-sm font-medium text-info-ink">
            {selected.length} seleccionados
          </span>
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="text-sm border border-info/40 rounded-control px-2 py-1.5 bg-surface focus:outline-none"
          >
            <option value="">Escolher acção…</option>
            <option value="activate">Activar</option>
            <option value="deactivate">Desactivar</option>
            <option value="suspend">Suspender</option>
          </select>
          <Button
            size="sm"
            onClick={handleBulkAction}
            disabled={!bulkAction || bulkLoading}
            loading={bulkLoading}
          >
            Aplicar
          </Button>
          <button
            onClick={() => setSelected([])}
            className="text-xs text-info-ink ml-auto hover:underline"
          >
            Limpar selecção
          </button>
        </div>
      )}

      {/* Tabela */}
      {loading && (
        <Skeleton
          rows={5}
          wrapperClassName="space-y-2 animate-pulse"
          itemClassName="h-14 rounded-card bg-surface-sunken"
        />
      )}
      {error && (
        <div className="px-4 py-8 text-center text-sm text-danger">
          {error.message}
        </div>
      )}
      {!loading && (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell className="w-8" />
              <TableHeaderCell>Utilizador</TableHeaderCell>
              <TableHeaderCell>Cargo</TableHeaderCell>
              <TableHeaderCell>Departamento</TableHeaderCell>
              <TableHeaderCell>Estado conta</TableHeaderCell>
              <TableHeaderCell>Estado RH</TableHeaderCell>
              <TableHeaderCell>Acções</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-ink-faint">
                  Nenhum utilizador encontrado
                </TableCell>
              </TableRow>
            )}
            {data?.data.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selected.includes(user.id)}
                    onChange={() => toggleSelect(user.id)}
                    className="w-4 h-4 rounded border-border-strong accent-primary"
                  />
                </TableCell>
                <TableCell>
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => onSelect(user.id)}
                  >
                    <Avatar name={user.fullName} url={user.avatarUrl ?? undefined} size="sm" />
                    <div>
                      <div className="text-sm font-medium text-ink">
                        {user.fullName}
                      </div>
                      <div className="text-xs text-ink-faint">{user.email}</div>
                      {user.employeeNumber && (
                        <div className="text-xs font-mono text-ink-faint/70">
                          {user.employeeNumber}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-ink-muted">
                  {user.position?.name ?? '—'}
                </TableCell>
                <TableCell className="text-xs text-ink-muted">
                  {user.department?.name ?? '—'}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    value={user.accountStatus}
                    map={ACCOUNT_STATUS_MAP}
                    variant="dot"
                  />
                </TableCell>
                <TableCell>
                  <StatusBadge value={user.hrStatus} map={HR_STATUS_MAP} />
                </TableCell>
                <TableCell>
                  <IconButton
                    icon={ArrowRight}
                    label="Ver perfil"
                    intent="ghost"
                    size="sm"
                    onClick={() => onSelect(user.id)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Paginação */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-ink-faint">
            Página {data.page} de {data.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              intent="secondary"
              size="sm"
              disabled={filters.page === 1}
              onClick={() => goToPage(-1)}
            >
              ← Anterior
            </Button>
            <Button
              intent="secondary"
              size="sm"
              disabled={filters.page === data.totalPages}
              onClick={() => goToPage(1)}
            >
              Próxima →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

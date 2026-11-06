// components/users/UserListView.tsx
// Vista "Utilizadores": tabela paginada e filtrável, com selecção
// múltipla e acções em lote. Extraído de
// app/(platform)/users/page.tsx.

'use client';

import { useState } from 'react';
import { ArrowRight, Filter, UserCheck } from 'lucide-react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { useDebounce } from '@/hooks/useDebounce';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Button, IconButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card, CardBody } from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
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
import { Checkbox } from '@/components/ui/Checkbox';
import { NativeSelect } from '@/components/ui/NativeSelect';

const STATUS_ITEMS = [
  { value: 'ALL', label: 'Todos os estados' },
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'SUSPENDED', label: 'Suspenso' },
  { value: 'INACTIVE', label: 'Inactivo' },
];

const HR_STATUS_ITEMS = [
  { value: 'ALL', label: 'Estado RH: Todos' },
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'ON_LEAVE', label: 'Em licença' },
  { value: 'TERMINATED', label: 'Desligado' },
];

interface UserListViewProps {
  onSelect: (id: number) => void;
  onCreate: () => void;
}

export function UserListView({ onSelect }: UserListViewProps) {
  const notify = useToast();
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

  // Por omissão a lista não mostra ninguém: só pesquisa quando há filtro.
  const hasFilter =
    filters.search.trim() !== '' ||
    filters.status !== '' ||
    filters.hrStatus !== '';

  const {
    data,
    isLoading: loading,
    error,
  } = useApiQuery<PaginatedUsers>(queryKeys.users.list(params), '/users', {
    params,
    staleTime: STALE_TIME.DYNAMIC,
    placeholderData: keepPreviousData,
    enabled: hasFilter,
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
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
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
      <Card className="mb-3">
        <CardBody className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-3">
          <SearchInput
            variant="underline"
            placeholder="Pesquisar por nome, email, nº funcionário…"
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
          />
          <Select
            variant="underline"
            icon={Filter}
            items={STATUS_ITEMS}
            value={filters.status || 'ALL'}
            onValueChange={(v) =>
              updateFilters({ status: v === 'ALL' ? '' : v })
            }
          />
          <Select
            variant="underline"
            icon={UserCheck}
            items={HR_STATUS_ITEMS}
            value={filters.hrStatus || 'ALL'}
            onValueChange={(v) =>
              updateFilters({ hrStatus: v === 'ALL' ? '' : v })
            }
          />
        </CardBody>
      </Card>
      <div className="mb-5 text-sm text-ink-faint">
        {hasFilter ? (data?.total ?? 0) : 0} utilizadores
      </div>

      {/* Bulk actions */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2.5 bg-info-subtle border border-info/30 rounded-card">
          <span className="text-sm font-medium text-info-ink">
            {selected.length} seleccionados
          </span>
          <NativeSelect
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
          >
            <option value="">Escolher acção…</option>
            <option value="activate">Activar</option>
            <option value="deactivate">Desactivar</option>
            <option value="suspend">Suspender</option>
          </NativeSelect>
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
      {!hasFilter && (
        <EmptyState
          variant="inline"
          title="Pesquise ou filtre para ver utilizadores"
        />
      )}
      {hasFilter && loading && (
        <Skeleton
          rows={5}
          wrapperClassName="space-y-2"
          itemClassName="h-14 rounded-card bg-surface-sunken"
        />
      )}
      {hasFilter && error && (
        <div className="px-4 py-8 text-center text-sm text-danger">
          {error.message}
        </div>
      )}
      {hasFilter && !loading && (
        <Table>
          <TableHead className="bg-brand/60">
            <TableRow className="hover:bg-transparent">
              <TableHeaderCell className="w-8 text-white" />
              <TableHeaderCell className="text-white">
                Utilizador
              </TableHeaderCell>
              <TableHeaderCell className="text-white">Cargo</TableHeaderCell>
              <TableHeaderCell className="text-white">
                Departamento
              </TableHeaderCell>
              <TableHeaderCell className="text-white">
                Estado conta
              </TableHeaderCell>
              <TableHeaderCell className="text-white">
                Estado RH
              </TableHeaderCell>
              <TableHeaderCell className="text-white">Acções</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.data.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-ink-faint"
                >
                  Nenhum utilizador encontrado
                </TableCell>
              </TableRow>
            )}
            {data?.data.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Checkbox
                    checked={selected.includes(user.id)}
                    onChange={() => toggleSelect(user.id)}
                  />
                </TableCell>
                <TableCell>
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => onSelect(user.id)}
                  >
                    <Avatar
                      name={user.fullName}
                      url={user.avatarUrl ?? undefined}
                      size="sm"
                    />
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
      {hasFilter && data && data.totalPages > 1 && (
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

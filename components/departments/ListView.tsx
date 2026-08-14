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
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
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
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Input
          type="text"
          placeholder="Pesquisar por nome, código ou gestor…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="min-w-[220px] flex-1"
        />
        <select
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-control border-[1.5px] border-border-strong bg-surface px-3 py-[9px] font-body text-sm text-ink focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent-subtle"
        >
          <option value="">Todos os estados</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
        <span className="text-sm text-ink-faint">
          {data?.total ?? 0} departamentos
        </span>
      </div>

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
          {error}
        </div>
      )}
      {!loading && (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Departamento</TableHeaderCell>
              <TableHeaderCell>Código</TableHeaderCell>
              <TableHeaderCell>Gestor</TableHeaderCell>
              <TableHeaderCell>Membros</TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
              <TableHeaderCell>Sub-deptos</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.data.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-ink-faint"
                >
                  Nenhum departamento encontrado
                </TableCell>
              </TableRow>
            )}
            {data?.data.map((d) => (
              <TableRow
                key={d.id}
                className="cursor-pointer"
                onClick={() => onSelect(d.id)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                      style={{ background: d.color ?? 'var(--color-ink-faint)' }}
                    />
                    <div>
                      <div className="text-sm font-medium text-ink">
                        {d.name}
                      </div>
                      {d.parent && (
                        <div className="mt-0.5 text-xs text-ink-faint">
                          ↳ {d.parent.name}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-ink-muted">
                  {d.code}
                </TableCell>
                <TableCell>
                  {d.head ? (
                    <div className="flex items-center gap-2">
                      <Avatar name={d.head.fullName} size="sm" />
                      <span className="truncate text-xs text-ink">
                        {d.head.fullName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-ink-faint">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-ink-muted">
                  {d._count.users}
                </TableCell>
                <TableCell>
                  <Badge intent={d.active ? 'success' : 'neutral'}>
                    {d.active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-ink-faint">
                  {d._count.children}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-ink-faint">
            Página {data.page} de {data.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              intent="secondary"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              intent="secondary"
              size="sm"
              disabled={page === data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

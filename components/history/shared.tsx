// components/history/shared.tsx
// Peças partilhadas pelas abas do hub: listagem paginada com filtros globais,
// tabela genérica e formatação de data/hora.

'use client';

import { useState, type ReactNode } from 'react';
import { keepPreviousData, type QueryKey } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { STALE_TIME } from '@/lib/queryClient';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import {
  AUDIT_STATUS_LABEL,
  DOC_STATUS_LABEL,
  EVENT_TYPE_LABEL,
  MODULE_LABEL,
} from './constants';
import { useScopeParams } from './filters';
import type { HistoryEntry, PagedResult } from './types';

const PAGE_SIZE = 30;

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
  });

/** Lista paginada alimentada pelos filtros globais; volta à página 1 quando os filtros mudam. */
export function useHubList<T>(
  keyFn: (params: Record<string, unknown>) => QueryKey,
  path: string,
  extra: Record<string, string | number | undefined> = {},
) {
  const scope = useScopeParams(extra);
  const sig = JSON.stringify(scope);
  const [pageState, setPageState] = useState({ sig, page: 1 });
  const page = pageState.sig === sig ? pageState.page : 1;
  const params = { ...scope, page, limit: PAGE_SIZE };

  const query = useApiQuery<PagedResult<T>>(keyFn(params), path, {
    params,
    staleTime: STALE_TIME.DYNAMIC,
    placeholderData: keepPreviousData,
  });
  const total = query.data?.total ?? 0;
  return {
    query,
    rows: query.data?.data ?? [],
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    setPage: (p: number) => setPageState({ sig, page: p }),
  };
}

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

export function HubTable<T extends { id: string }>({
  columns,
  rows,
  loading,
  error,
  total,
  page,
  totalPages,
  onPageChange,
  emptyTitle = 'Sem registos',
  emptyDescription = 'Não há dados reais para os filtros seleccionados.',
}: {
  columns: Column<T>[];
  rows: T[];
  loading: boolean;
  error?: string | null;
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (loading && rows.length === 0)
    return (
      <Skeleton
        rows={6}
        wrapperClassName="space-y-2"
        itemClassName="skeleton-shimmer h-12 rounded-card"
      />
    );
  if (error)
    return (
      <p className="rounded-card border border-danger bg-danger-subtle p-4 text-sm text-danger-ink">
        {error}
      </p>
    );
  if (rows.length === 0)
    return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-faint">{total} registos</p>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((c) => (
              <TableHeaderCell key={c.header} className={c.className}>
                {c.header}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              {columns.map((c) => (
                <TableCell key={c.header} className={c.className}>
                  {c.cell(r)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  );
}

const dash = (v: ReactNode) => (v === null || v === undefined || v === '' ? '–' : v);

export function statusBadge(status: string) {
  const label = AUDIT_STATUS_LABEL[status] ?? DOC_STATUS_LABEL[status] ?? status;
  const intent =
    status === 'SUCCESS' || status === 'ACTIVE' || status === 'APROVADO'
      ? 'success'
      : status === 'FAILED' || status === 'DENIED' || status === 'DELETED'
        ? 'danger'
        : status === 'EXPIRED' || status === 'SUSPENSO'
          ? 'warning'
          : 'neutral';
  return <Badge intent={intent}>{label}</Badge>;
}

/** Colunas da linha cronológica central (docs/history.md §2) e das Actividades (§7). */
export function entryColumns(variant: 'history' | 'activities'): Column<HistoryEntry>[] {
  const common: Column<HistoryEntry>[] = [
    { header: 'Data', cell: (e) => fmtDate(e.timestamp) },
    { header: 'Hora', cell: (e) => fmtTime(e.timestamp) },
    { header: 'Utilizador', cell: (e) => dash(e.actor?.fullName) },
  ];
  const affected: Column<HistoryEntry> = {
    header: 'Colaborador afectado',
    cell: (e) => dash(e.affected?.fullName),
  };
  const rest: Column<HistoryEntry>[] = [
    { header: 'Módulo', cell: (e) => MODULE_LABEL[e.module] ?? e.module },
    { header: 'Entidade', cell: (e) => e.entity },
    {
      header: variant === 'history' ? 'Tipo de evento' : 'Acção',
      cell: (e) => EVENT_TYPE_LABEL[e.eventType] ?? e.eventType,
    },
    {
      header: 'Descrição',
      className: 'min-w-[260px]',
      cell: (e) => (
        <div>
          <p className="font-medium text-ink">{e.title}</p>
          {e.description && (
            <p className="text-xs text-ink-muted">{e.description}</p>
          )}
        </div>
      ),
    },
    { header: 'Estado', cell: (e) => statusBadge(e.status) },
  ];
  if (variant === 'activities') return [...common, ...rest];
  return [
    ...common,
    affected,
    ...rest,
    { header: 'Referência', cell: (e) => dash(e.reference) },
    { header: 'Origem', cell: (e) => e.origin },
  ];
}

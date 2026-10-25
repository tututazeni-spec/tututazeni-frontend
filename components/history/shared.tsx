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
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import {
  AUDIT_STATUS_LABEL,
  DOC_STATUS_LABEL,
  EVENT_TYPE_LABEL,
  MODULE_LABEL,
} from './constants';
import { useScopeParams } from './filters';
import type { HistoryEntry, PagedResult, PersonRef } from './types';

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

/**
 * Tabela compacta: as células do corpo quebram linha em vez de gerar scroll
 * horizontal; os títulos do cabeçalho ficam sempre numa só linha (navy 60%,
 * letra branca, sem efeito de hover).
 */
export const COMPACT_TABLE =
  'table-auto [&_th]:whitespace-nowrap [&_th]:bg-brand/60 [&_th]:px-1.5 [&_th]:py-2 [&_th]:text-micro [&_th]:tracking-normal [&_th]:text-white [&_thead_tr:hover]:bg-transparent [&_td]:px-2 [&_td]:py-2.5 [&_td]:align-middle [&_td]:text-xs [&_td]:break-words [&_tbody_tr:nth-child(even)]:bg-surface-sunken/30';

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
      <div className="[&>div]:overflow-x-clip">
        <Table className={COMPACT_TABLE}>
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
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}

const dash = (v: ReactNode) =>
  v === null || v === undefined || v === '' ? '–' : v;

export function statusBadge(status: string) {
  const label =
    AUDIT_STATUS_LABEL[status] ?? DOC_STATUS_LABEL[status] ?? status;
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

export function PersonCell({
  person,
}: {
  person: PersonRef | null | undefined;
}) {
  if (!person) return <span className="text-ink-faint">–</span>;
  return (
    <div className="flex items-center gap-2">
      <Avatar
        name={person.fullName}
        url={person.avatarUrl ?? undefined}
        size="sm"
        className="shrink-0"
      />
      <span className="font-medium leading-tight text-ink">
        {person.fullName}
      </span>
    </div>
  );
}

const muted = (v: ReactNode) => (
  <span className="text-ink-muted">{dash(v)}</span>
);

/** Colunas da linha cronológica central (docs/history.md §2) e das Actividades (§7). */
export function entryColumns(
  variant: 'history' | 'activities',
): Column<HistoryEntry>[] {
  const common: Column<HistoryEntry>[] = [
    {
      header: 'Data',
      className: 'w-[84px]',
      cell: (e) => (
        <span className="font-medium tabular-nums text-ink">
          {fmtDate(e.timestamp)}
        </span>
      ),
    },
    {
      header: 'Hora',
      className: 'w-[56px]',
      cell: (e) => (
        <span className="tabular-nums text-ink-muted">
          {fmtTime(e.timestamp)}
        </span>
      ),
    },
    { header: 'Utilizador', cell: (e) => <PersonCell person={e.actor} /> },
  ];
  const affected: Column<HistoryEntry> = {
    header: 'Colaborador afectado',
    cell: (e) => <PersonCell person={e.affected} />,
  };
  const rest: Column<HistoryEntry>[] = [
    {
      header: 'Módulo',
      cell: (e) => (
        <Badge intent="info" dot={false} className="px-2 py-0 text-micro">
          {MODULE_LABEL[e.module] ?? e.module}
        </Badge>
      ),
    },
    { header: 'Entidade', cell: (e) => muted(e.entity) },
    {
      header: variant === 'history' ? 'Tipo de evento' : 'Acção',
      cell: (e) => (
        <span className="font-medium text-ink">
          {EVENT_TYPE_LABEL[e.eventType] ?? e.eventType}
        </span>
      ),
    },
    {
      header: 'Descrição',
      className: 'w-[26%]',
      cell: (e) => (
        <div>
          <p className="font-medium leading-snug text-ink">{e.title}</p>
          {e.description && (
            <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-ink-muted">
              {e.description}
            </p>
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
    {
      header: 'Referência',
      cell: (e) => (
        <span className="tabular-nums text-ink-muted">{dash(e.reference)}</span>
      ),
    },
    { header: 'Origem', cell: (e) => muted(e.origin) },
  ];
}

// components/departments/HistoryView.tsx
// Separador "Histórico" (docs/modulo_departments.md Ponto 8) — regista as
// alterações feitas à estrutura do departamento. Junta, do lado do backend,
// 3 fontes reais (AuditLog do ciclo de vida do departamento + histórico de
// responsáveis + histórico de transferências) num único feed cronológico —
// ver DepartmentsService.getHistory().

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { History as HistoryIcon } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import type { DepartmentNode, PaginatedHistory } from './types';

function flattenTree(
  nodes: DepartmentNode[],
  depth = 0,
): Array<{ value: string; label: string }> {
  return nodes.flatMap((n) => [
    { value: String(n.id), label: `${'— '.repeat(depth)}${n.name}` },
    ...flattenTree(n.children ?? [], depth + 1),
  ]);
}

function fmtValue(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (Array.isArray(v)) return v.join(', ') || '—';
  return String(v);
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-AO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function HistoryView() {
  const [departmentId, setDepartmentId] = useState('');
  const [page, setPage] = useState(1);

  const params = {
    page,
    limit: 25,
    departmentId: departmentId || undefined,
  };

  const { data: tree } = useApiQuery<DepartmentNode[]>(
    queryKeys.departments.tree(),
    '/departments/tree',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const deptItems = [
    { value: 'ALL', label: 'Todos os departamentos' },
    ...flattenTree(tree ?? []),
  ];

  const { data, isLoading, error } = useApiQuery<PaginatedHistory>(
    queryKeys.departments.history(params),
    '/departments/history',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );

  return (
    <div>
      {/* Filtros */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Select
          items={deptItems}
          value={departmentId || 'ALL'}
          onValueChange={(v) => {
            setDepartmentId(v === 'ALL' ? '' : v);
            setPage(1);
          }}
          className="w-64"
        />
      </div>

      {isLoading && (
        <Skeleton
          rows={6}
          wrapperClassName="space-y-2 animate-pulse"
          itemClassName="h-14 rounded-card bg-surface-sunken"
        />
      )}
      {error && <div className="px-4 py-8 text-center text-sm text-danger">{error.message}</div>}

      {!isLoading && !error && data?.data.length === 0 && (
        <EmptyState
          icon={HistoryIcon}
          title="Sem alterações registadas"
          description="As alterações estruturais aos departamentos (criação, dados, responsáveis, transferências) aparecem aqui assim que acontecerem."
        />
      )}

      {!isLoading && !error && data && data.data.length > 0 && (
        <Table>
          <TableHead className="bg-[#0F1F3D]/60 [&_th]:text-white">
            <TableRow className="hover:bg-transparent">
              <TableHeaderCell>Data/Hora</TableHeaderCell>
              <TableHeaderCell>Tipo de alteração</TableHeaderCell>
              <TableHeaderCell>Departamento</TableHeaderCell>
              <TableHeaderCell>Informação alterada</TableHeaderCell>
              <TableHeaderCell>Valor anterior</TableHeaderCell>
              <TableHeaderCell>Novo valor</TableHeaderCell>
              <TableHeaderCell>Utilizador</TableHeaderCell>
              <TableHeaderCell>Motivo</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.data.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="whitespace-nowrap text-xs text-ink-faint">
                  {fmtDateTime(e.date)}
                </TableCell>
                <TableCell className="text-sm text-ink">{e.type}</TableCell>
                <TableCell className="text-sm text-ink-muted">
                  {e.department ? `${e.department.name}${e.department.code ? ` (${e.department.code})` : ''}` : '—'}
                </TableCell>
                <TableCell className="text-sm text-ink-muted">{e.field ?? '—'}</TableCell>
                <TableCell className="max-w-[160px] truncate text-xs text-ink-faint" title={fmtValue(e.before)}>
                  {fmtValue(e.before)}
                </TableCell>
                <TableCell className="max-w-[160px] truncate text-xs text-ink" title={fmtValue(e.after)}>
                  {fmtValue(e.after)}
                </TableCell>
                <TableCell className="text-xs text-ink-muted">
                  {e.changedBy?.fullName ?? '—'}
                </TableCell>
                <TableCell className="max-w-[160px] truncate text-xs text-ink-faint" title={e.reason ?? ''}>
                  {e.reason ?? '—'}
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

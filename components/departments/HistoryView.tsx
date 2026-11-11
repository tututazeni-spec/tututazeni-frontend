// components/departments/HistoryView.tsx
// Separador "Histórico" (docs/modulo_departments.md Ponto 8) — regista as
// alterações feitas à estrutura do departamento. Junta, do lado do backend,
// 3 fontes reais (AuditLog do ciclo de vida do departamento + histórico de
// responsáveis + histórico de transferências) num único feed cronológico —
// ver DepartmentsService.getHistory().

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { Building2, History as HistoryIcon } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
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
import type { DepartmentNode, HistoryEntry, PaginatedHistory } from './types';
import { DepartmentExportMenu, fetchAllRows } from './DepartmentExportMenu';

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
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  const params = {
    page,
    limit: 25,
    departmentId: departmentId || undefined,
    from: from || undefined,
    to: to || undefined,
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
    {
      params,
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );

  return (
    <div>
      {/* Filtros */}
      <div className="mb-5 flex flex-wrap items-end gap-x-6 gap-y-3">
        <DepartmentExportMenu
          className="order-last ml-auto"
          build={async () => {
            const all = await fetchAllRows<HistoryEntry>(
              '/departments/history',
              {
                departmentId: departmentId || undefined,
                from: from || undefined,
                to: to || undefined,
              },
            );
            return {
              title: 'Histórico de departamentos',
              headers: [
                'Data',
                'Tipo',
                'Departamento',
                'Informação alterada',
                'Valor anterior',
                'Novo valor',
                'Utilizador',
                'Motivo',
              ],
              rows: all.map((e) => [
                fmtDateTime(e.date),
                e.type,
                e.department
                  ? `${e.department.name}${e.department.code ? ` (${e.department.code})` : ''}`
                  : '',
                e.field,
                fmtValue(e.before),
                fmtValue(e.after),
                e.changedBy?.fullName,
                e.reason,
              ]),
            };
          }}
        />
        <div className="min-w-[230px]">
          <Select
            variant="underline"
            icon={Building2}
            items={deptItems}
            value={departmentId || 'ALL'}
            onValueChange={(v) => {
              setDepartmentId(v === 'ALL' ? '' : v);
              setPage(1);
            }}
            className="w-full"
          />
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-ink-muted">
          De
          <Input
            type="date"
            variant="underline"
            aria-label="Data inicial"
            max={to || undefined}
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
            className="w-[150px]"
          />
        </label>
        <label className="flex items-center gap-2 text-xs font-medium text-ink-muted">
          Até
          <Input
            type="date"
            variant="underline"
            aria-label="Data final"
            min={from || undefined}
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
            className="w-[150px]"
          />
        </label>
        {(from || to) && (
          <Button
            size="sm"
            intent="ghost"
            onClick={() => {
              setFrom('');
              setTo('');
              setPage(1);
            }}
          >
            Limpar datas
          </Button>
        )}
      </div>

      {isLoading && (
        <Skeleton
          rows={6}
          wrapperClassName="space-y-2"
          itemClassName="h-14 rounded-card bg-surface-sunken"
        />
      )}
      {error && (
        <div className="px-4 py-8 text-center text-sm text-danger">
          {error.message}
        </div>
      )}

      {!isLoading && !error && data?.data.length === 0 && (
        <EmptyState
          icon={HistoryIcon}
          title="Sem alterações registadas"
          description="As alterações estruturais aos departamentos (criação, dados, responsáveis, transferências) aparecem aqui assim que acontecerem."
        />
      )}

      {!isLoading && !error && data && data.data.length > 0 && (
        <Table
          wrapperClassName="overflow-x-visible"
          className="table-fixed [&_td]:break-words [&_td]:px-1.5 [&_td]:py-2 [&_td]:align-top [&_td]:text-[11px] [&_th]:px-1.5 [&_th]:py-2 [&_th]:text-[10px] [&_th]:leading-tight [&_th]:[overflow-wrap:anywhere]"
        >
          <TableHead className="bg-[#DCE8FA] [&_th]:text-brand">
            <TableRow className="hover:bg-transparent">
              <TableHeaderCell className="w-[11%]">Data/Hora</TableHeaderCell>
              <TableHeaderCell className="w-[11%]">
                Tipo de alteração
              </TableHeaderCell>
              <TableHeaderCell className="w-[13%]">
                Departamento
              </TableHeaderCell>
              <TableHeaderCell className="w-[12%]">
                Informação alterada
              </TableHeaderCell>
              <TableHeaderCell className="w-[13%]">
                Valor anterior
              </TableHeaderCell>
              <TableHeaderCell className="w-[13%]">Novo valor</TableHeaderCell>
              <TableHeaderCell className="w-[12%]">Utilizador</TableHeaderCell>
              <TableHeaderCell className="w-[15%]">Motivo</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.data.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="text-ink-faint">
                  {fmtDateTime(e.date)}
                </TableCell>
                <TableCell className="text-ink">{e.type}</TableCell>
                <TableCell className="text-ink-muted">
                  {e.department
                    ? `${e.department.name}${e.department.code ? ` (${e.department.code})` : ''}`
                    : '—'}
                </TableCell>
                <TableCell className="text-ink-muted">
                  {e.field ?? '—'}
                </TableCell>
                <TableCell className="text-ink-faint">
                  {fmtValue(e.before)}
                </TableCell>
                <TableCell className="text-ink">{fmtValue(e.after)}</TableCell>
                <TableCell className="text-ink-muted">
                  {e.changedBy?.fullName ?? '—'}
                </TableCell>
                <TableCell className="text-ink-faint">
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

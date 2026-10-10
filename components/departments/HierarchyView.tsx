// components/departments/HierarchyView.tsx
// Separador "Hierarquia" (docs/modulo_departments.md Ponto 7) — relações de
// reporte entre colaboradores (árvore de User.managerId), distinto da
// "Estrutura Organizacional" (árvore de departamentos). Mesmo padrão de
// EmployeesView.tsx: lista agregada entre toda a organização, com filtros.

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
import type { DepartmentNode, PaginatedHierarchy } from './types';

function flattenTree(
  nodes: DepartmentNode[],
  depth = 0,
): Array<{ value: string; label: string }> {
  return nodes.flatMap((n) => [
    { value: String(n.id), label: `${'— '.repeat(depth)}${n.name}` },
    ...flattenTree(n.children ?? [], depth + 1),
  ]);
}

export function HierarchyView() {
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const params = {
    page,
    limit: 20,
    search: debouncedSearch || undefined,
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

  const { data, isLoading, error } = useApiQuery<PaginatedHierarchy>(
    queryKeys.departments.hierarchy(params),
    '/departments/hierarchy',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );

  return (
    <div>
      {/* Filtros */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Input
          type="text"
          placeholder="Pesquisar por nome ou e-mail…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="min-w-[160px] flex-1"
        />
        <Select
          items={deptItems}
          value={departmentId || 'ALL'}
          onValueChange={(v) => {
            setDepartmentId(v === 'ALL' ? '' : v);
            setPage(1);
          }}
          className="w-56"
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
      {!isLoading && !error && (
        <Table className="[&_td]:px-2 [&_td]:py-2 [&_td]:align-middle [&_td]:text-xs [&_th]:px-2 [&_th]:py-2 [&_th]:text-[10px]">
          <TableHead className="bg-[#0F1F3D]/60 [&_th]:text-white">
            <TableRow className="hover:bg-transparent">
              <TableHeaderCell>Colaborador</TableHeaderCell>
              <TableHeaderCell>Cargo</TableHeaderCell>
              <TableHeaderCell>Departamento</TableHeaderCell>
              <TableHeaderCell>Responsável directo</TableHeaderCell>
              <TableHeaderCell>Nível</TableHeaderCell>
              <TableHeaderCell>Subordinados directos</TableHeaderCell>
              <TableHeaderCell>Subordinados indirectos</TableHeaderCell>
              <TableHeaderCell>Cadeia de reporte</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-ink-faint">
                  Nenhum colaborador encontrado
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((u) => (
                <TableRow key={u.id} className="hover:bg-transparent">
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Avatar name={u.fullName} url={u.avatarUrl ?? undefined} size="sm" />
                      <span className="text-xs text-ink">{u.fullName}</span>
                      {!u.active && (
                        <Badge intent="neutral" className="text-[10px]">
                          Inactivo
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    {u.position?.name ?? '—'}
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    {u.department?.name ?? '—'}
                    {u.subdepartment ? ` · ${u.subdepartment}` : ''}
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    {u.manager?.fullName ?? '—'}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-ink-muted">{u.level}</TableCell>
                  <TableCell className="text-xs font-mono text-ink-muted">
                    {u.directReportsCount}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-ink-muted">
                    {u.indirectReportsCount}
                  </TableCell>
                  <TableCell className="max-w-[9rem] break-words text-[10px] text-ink-faint" title={u.reportingChain.join(' → ')}>
                    {u.reportingChain.join(' → ')}
                  </TableCell>
                </TableRow>
              ))
            )}
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

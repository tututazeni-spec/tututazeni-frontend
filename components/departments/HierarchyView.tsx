// components/departments/HierarchyView.tsx
// Separador "Hierarquia" (docs/modulo_departments.md Ponto 7) — relações de
// reporte entre colaboradores (árvore de User.managerId), distinto da
// "Estrutura Organizacional" (árvore de departamentos). Mesmo padrão de
// EmployeesView.tsx: lista agregada entre toda a organização, com filtros.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useHasRole } from '@/hooks/useCurrentRole';
import { ADMIN_ROLES } from '@/lib/roles';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
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
import type {
  DepartmentNode,
  HierarchyRow,
  PaginatedHierarchy,
  PositionRow,
} from './types';
import { DepartmentExportMenu, fetchAllRows } from './DepartmentExportMenu';

import { Briefcase, Building2, Pencil } from 'lucide-react';
import { HierarchyPreviewPanel } from './HierarchyPreviewPanel';
import {
  ChangeManagerModal,
  type ChangeManagerTarget,
} from './ChangeManagerModal';

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
  const [positionId, setPositionId] = useState('');
  const [page, setPage] = useState(1);
  const [previewId, setPreviewId] = useState<number | null>(null);
  const debouncedSearch = useDebounce(search);
  const canManage = useHasRole(ADMIN_ROLES);
  const [editing, setEditing] = useState<ChangeManagerTarget | null>(null);
  // A tabela só mostra colaboradores depois de aplicado algum filtro.
  const hasFilter = Boolean(search.trim() || departmentId || positionId);

  const params = {
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    departmentId: departmentId || undefined,
    positionId: positionId || undefined,
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

  const { data: positionsResp } = useApiQuery<{ data: PositionRow[] }>(
    queryKeys.departments.positions({ limit: 200 }),
    '/departments/positions',
    { params: { limit: 200 }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const positionItems = [
    { value: 'ALL', label: 'Todos os cargos' },
    ...(positionsResp?.data ?? []).map((p) => ({
      value: String(p.id),
      label: p.name,
    })),
  ];

  const { data, isLoading, error } = useApiQuery<PaginatedHierarchy>(
    queryKeys.departments.hierarchy(params),
    '/departments/hierarchy',
    {
      params,
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
      enabled: hasFilter,
    },
  );
  const previewRow = data?.data.find((u) => u.id === previewId) ?? null;

  return (
    <div>
      {/* Filtros */}
      <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="w-[230px]">
          <SearchInput
            variant="underline"
            placeholder="Pesquisar por nome ou e-mail…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
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
          />
        </div>
        <DepartmentExportMenu
          disabled={!hasFilter}
          build={async () => {
            const all = await fetchAllRows<HierarchyRow>(
              '/departments/hierarchy',
              {
                search: debouncedSearch || undefined,
                departmentId: departmentId || undefined,
                positionId: positionId || undefined,
              },
            );
            return {
              title: 'Hierarquia',
              headers: [
                'Colaborador',
                'Cargo',
                'Departamento',
                'Subdepartamento',
                'Responsável directo',
                'Nível',
                'Subordinados directos',
                'Subordinados indirectos',
                'Cadeia de reporte',
                'Estado',
              ],
              rows: all.map((u) => [
                u.fullName,
                u.position?.name,
                u.department?.name,
                u.subdepartment,
                u.manager?.fullName,
                u.level,
                u.directReportsCount,
                u.indirectReportsCount,
                u.reportingChain.join(' → '),
                u.active ? 'Activo' : 'Inactivo',
              ]),
            };
          }}
        />
        <div className="min-w-[210px]">
          <Select
            variant="underline"
            icon={Briefcase}
            items={positionItems}
            value={positionId || 'ALL'}
            onValueChange={(v) => {
              setPositionId(v === 'ALL' ? '' : v);
              setPage(1);
            }}
          />
        </div>
      </div>

      {hasFilter && isLoading && (
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
      {!(hasFilter && isLoading) && !error && (
        <Table className="[&_td]:px-2 [&_td]:py-2 [&_td]:align-middle [&_td]:text-xs [&_th]:px-2 [&_th]:py-2 [&_th]:text-micro">
          <TableHead className="bg-[#DCE8FA] [&_th]:text-brand">
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
            {!hasFilter ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-12 text-center text-ink-faint"
                >
                  Pesquise ou aplique um filtro para ver os colaboradores
                </TableCell>
              </TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-12 text-center text-ink-faint"
                >
                  Nenhum colaborador encontrado
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((u) => (
                <TableRow
                  key={u.id}
                  onClick={() => setPreviewId(u.id)}
                  className={`cursor-pointer ${previewId === u.id ? 'bg-brand-soft' : ''}`}
                >
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Avatar
                        name={u.fullName}
                        url={u.avatarUrl ?? undefined}
                        size="sm"
                      />
                      <span className="text-xs text-ink">{u.fullName}</span>
                      {!u.active && (
                        <Badge intent="neutral" className="text-micro">
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
                    <span className="flex items-center gap-1">
                      <span>{u.manager?.fullName ?? '—'}</span>
                      {canManage && (
                        <Button
                          size="sm"
                          intent="ghost"
                          title="Alterar responsável directo"
                          aria-label={`Alterar o responsável directo de ${u.fullName}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditing({
                              id: u.id,
                              fullName: u.fullName,
                              departmentId: u.department?.id ?? null,
                              departmentName: u.department?.name ?? null,
                              manager: u.manager
                                ? {
                                    id: u.manager.id,
                                    fullName: u.manager.fullName,
                                  }
                                : null,
                            });
                          }}
                        >
                          <Pencil size={13} strokeWidth={1.75} />
                        </Button>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    {u.level}
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    {u.directReportsCount}
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    {u.indirectReportsCount}
                  </TableCell>
                  <TableCell
                    className="max-w-[9rem] break-words text-micro text-ink-faint"
                    title={u.reportingChain.join(' → ')}
                  >
                    {u.reportingChain.join(' → ')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {hasFilter && data && data.totalPages > 1 && (
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

      {previewRow && (
        <HierarchyPreviewPanel
          row={previewRow}
          onChangeManager={
            canManage
              ? (u) =>
                  setEditing({
                    id: u.id,
                    fullName: u.fullName,
                    departmentId: u.department?.id ?? null,
                    departmentName: u.department?.name ?? null,
                    manager: u.manager
                      ? { id: u.manager.id, fullName: u.manager.fullName }
                      : null,
                  })
              : undefined
          }
          onClose={() => setPreviewId(null)}
        />
      )}

      {editing && (
        <ChangeManagerModal target={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

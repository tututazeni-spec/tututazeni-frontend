// components/departments/EmployeesView.tsx
// Separador "Colaboradores" (docs/modulo_departments.md Ponto 5) — lista dos
// colaboradores alocados aos departamentos, agregada entre toda a
// organização. Mostra apenas os dados necessários à gestão departamental;
// os dados completos do colaborador continuam no módulo Users/Colaboradores
// (components/employees/).

'use client';

import { genderLabel } from '@/lib/gender';
import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import {
  Building2,
  FileText,
  Filter,
  Users,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { CONTRACT_LABELS } from '@/components/employees/constants';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import type { DepartmentNode, PaginatedEmployees } from './types';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDateNumeric } from '@/lib/format';

function flattenTree(
  nodes: DepartmentNode[],
  depth = 0,
): Array<{ value: string; label: string }> {
  return nodes.flatMap((n) => [
    { value: String(n.id), label: `${'— '.repeat(depth)}${n.name}` },
    ...flattenTree(n.children ?? [], depth + 1),
  ]);
}

function contractLabel(value: string | null) {
  if (!value) return '—';
  return (CONTRACT_LABELS as Record<string, string>)[value] ?? value;
}

function BreakdownCard({
  title,
  buckets,
}: {
  title: string;
  buckets: Array<{ label: string; count: number }>;
}) {
  const top = [...buckets].sort((a, b) => b.count - a.count).slice(0, 6);
  return (
    <Card className="overflow-hidden p-0">
      <div className="bg-brand/60 px-4 py-2 text-xs font-medium uppercase tracking-wide text-white">
        {title}
      </div>
      <div className="p-4">
        {top.length === 0 ? (
          <EmptyState variant="inline" title="Sem dados" />
        ) : (
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {top.map((b) => (
              <span key={b.label} className="text-xs text-ink">
                {b.label} <strong>{b.count}</strong>
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

export function EmployeesView() {
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [contractType, setContractType] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);
  // A tabela só mostra colaboradores depois de aplicado algum filtro.
  const hasFilter = Boolean(
    search.trim() || departmentId || contractType || activeFilter,
  );

  const params = {
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    departmentId: departmentId || undefined,
    contractType: contractType || undefined,
    active: activeFilter || undefined,
  };

  const { data: tree } = useApiQuery<DepartmentNode[]>(
    queryKeys.departments.tree(),
    '/departments/tree',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const deptItems = flattenTree(tree ?? []);

  const {
    data,
    isLoading: loading,
    error: queryError,
  } = useApiQuery<PaginatedEmployees>(
    queryKeys.departments.employees(params),
    '/departments/employees',
    {
      params,
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );
  const error = queryError?.message ?? null;
  const indicators = data?.indicators;

  return (
    <div>
      {/* Indicadores */}
      {indicators && (
        <div className="mb-5 space-y-3">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <NavyStatCard
              icon={Users}
              tone="blue"
              label="Total de colaboradores"
              value={indicators.total}
            />
            <NavyStatCard
              icon={UserCheck}
              tone="green"
              label="Activos"
              value={indicators.active}
            />
            <NavyStatCard
              icon={UserX}
              tone="orange"
              label="Inactivos"
              value={indicators.inactive}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <BreakdownCard
              title="Por género"
              buckets={indicators.byGender.map((b) => ({
                ...b,
                label: genderLabel(b.label) ?? b.label,
              }))}
            />
            <BreakdownCard
              title="Por faixa etária"
              buckets={indicators.byAgeBracket}
            />
            <BreakdownCard title="Por cargo" buckets={indicators.byPosition} />
            <BreakdownCard
              title="Por localização"
              buckets={indicators.byLocation}
            />
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="min-w-[220px] flex-1">
          <SearchInput
            variant="underline"
            placeholder="Pesquisar por nome, e-mail ou nº de colaborador…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="min-w-[190px]">
          <Select
            variant="underline"
            icon={Building2}
            items={[
              { value: 'ALL', label: 'Todos os departamentos' },
              ...deptItems.map((d) => ({
                value: String(d.value),
                label: d.label,
              })),
            ]}
            value={departmentId || 'ALL'}
            onValueChange={(v) => {
              setDepartmentId(v === 'ALL' ? '' : v);
              setPage(1);
            }}
          />
        </div>
        <div className="min-w-[170px]">
          <Select
            variant="underline"
            icon={FileText}
            items={[
              { value: 'ALL', label: 'Todos os vínculos' },
              ...Object.entries(CONTRACT_LABELS).map(([value, label]) => ({
                value,
                label,
              })),
            ]}
            value={contractType || 'ALL'}
            onValueChange={(v) => {
              setContractType(v === 'ALL' ? '' : v);
              setPage(1);
            }}
          />
        </div>
        <div className="min-w-[160px]">
          <Select
            variant="underline"
            icon={Filter}
            items={[
              { value: 'ALL', label: 'Todos os estados' },
              { value: 'true', label: 'Activos' },
              { value: 'false', label: 'Inactivos' },
            ]}
            value={activeFilter || 'ALL'}
            onValueChange={(v) => {
              setActiveFilter(v === 'ALL' ? '' : v);
              setPage(1);
            }}
          />
        </div>
        {hasFilter && (
          <span className="text-sm text-ink-faint">
            {data?.total ?? 0} colaboradores
          </span>
        )}
      </div>

      {/* Tabela */}
      {loading && (
        <Skeleton
          rows={6}
          wrapperClassName="space-y-2"
          itemClassName="h-14 rounded-card bg-surface-sunken"
        />
      )}
      {error && (
        <div className="px-4 py-8 text-center text-sm text-danger">{error}</div>
      )}
      {!loading && !error && (
        <Table
          wrapperClassName="overflow-x-visible"
          className="table-fixed [&_td]:break-words [&_td]:px-1.5 [&_td]:py-2 [&_td]:align-middle [&_td]:text-[11px] [&_th]:px-1.5 [&_th]:py-2 [&_th]:text-[10px] [&_th]:leading-tight [&_th]:[overflow-wrap:anywhere]"
        >
          <TableHead className="bg-[#DCE8FA] [&_th]:text-brand">
            <TableRow className="hover:bg-transparent">
              <TableHeaderCell className="w-[17%]">Colaborador</TableHeaderCell>
              <TableHeaderCell className="w-[11%]">Cargo</TableHeaderCell>
              <TableHeaderCell className="w-[12%]">
                Departamento
              </TableHeaderCell>
              <TableHeaderCell className="w-[14%] whitespace-nowrap">
                Subdepartamento
              </TableHeaderCell>
              <TableHeaderCell className="w-[12%]">
                Responsável directo
              </TableHeaderCell>
              <TableHeaderCell className="w-[9%]">Localização</TableHeaderCell>
              <TableHeaderCell className="w-[9%]">
                Tipo de vínculo
              </TableHeaderCell>
              <TableHeaderCell className="w-[8%]">Admissão</TableHeaderCell>
              <TableHeaderCell className="w-[8%]">Estado</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!hasFilter ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-12 text-center text-ink-faint"
                >
                  Pesquise ou aplique um filtro para ver os colaboradores
                </TableCell>
              </TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-12 text-center text-ink-faint"
                >
                  Nenhum colaborador encontrado
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Avatar
                        name={u.fullName}
                        url={u.avatarUrl ?? undefined}
                        size="sm"
                      />
                      <div>
                        <div className="text-[11px] leading-tight text-ink">
                          {u.fullName}
                        </div>
                        <div className="break-all text-micro text-ink-faint">
                          {u.employeeNumber ? `${u.employeeNumber} · ` : ''}
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    {u.position?.name ?? '—'}
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    {u.department?.name ?? '—'}
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    {u.subdepartment ?? '—'}
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    {u.manager?.fullName ?? '—'}
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    {u.location ?? '—'}
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    {contractLabel(u.contractType)}
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    {formatDateNumeric(u.hireDate)}
                  </TableCell>
                  <TableCell>
                    <Badge intent={u.active ? 'success' : 'neutral'}>
                      {u.active ? 'Activo' : 'Inactivo'}
                    </Badge>
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
    </div>
  );
}

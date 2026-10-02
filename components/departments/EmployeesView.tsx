// components/departments/EmployeesView.tsx
// Separador "Colaboradores" (docs/modulo_departments.md Ponto 5) — lista dos
// colaboradores alocados aos departamentos, agregada entre toda a
// organização. Mostra apenas os dados necessários à gestão departamental;
// os dados completos do colaborador continuam no módulo Users/Colaboradores
// (components/employees/).

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { Users, UserCheck, UserX } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { CONTRACT_LABELS } from '@/components/employees/constants';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { KpiCard } from '@/components/ui/KpiCard';
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

function flattenTree(
  nodes: DepartmentNode[],
  depth = 0,
): Array<{ value: string; label: string }> {
  return nodes.flatMap((n) => [
    { value: String(n.id), label: `${'— '.repeat(depth)}${n.name}` },
    ...flattenTree(n.children ?? [], depth + 1),
  ]);
}

function fmtDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString('pt-AO') : '—';
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
    <Card className="p-4">
      <div className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-faint">
        {title}
      </div>
      {top.length === 0 ? (
        <p className="text-xs text-ink-faint">Sem dados</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {top.map((b) => (
            <span
              key={b.label}
              className="rounded-full bg-surface-sunken px-2.5 py-1 text-xs text-ink-muted"
            >
              {b.label} <strong className="text-ink">{b.count}</strong>
            </span>
          ))}
        </div>
      )}
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
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );
  const error = queryError?.message ?? null;
  const indicators = data?.indicators;

  return (
    <div>
      {/* Indicadores */}
      {indicators && (
        <div className="mb-5 space-y-3">
          <div className="flex flex-wrap gap-3">
            <KpiCard icon={Users} label="Total de colaboradores" value={indicators.total} />
            <KpiCard
              icon={UserCheck}
              label="Activos"
              value={indicators.active}
              intent="success"
            />
            <KpiCard icon={UserX} label="Inactivos" value={indicators.inactive} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <BreakdownCard title="Por género" buckets={indicators.byGender} />
            <BreakdownCard title="Por faixa etária" buckets={indicators.byAgeBracket} />
            <BreakdownCard title="Por cargo" buckets={indicators.byPosition} />
            <BreakdownCard title="Por localização" buckets={indicators.byLocation} />
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Input
          type="text"
          placeholder="Pesquisar por nome, e-mail ou nº de colaborador…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="min-w-[220px] flex-1"
        />
        <select
          value={departmentId}
          onChange={(e) => {
            setDepartmentId(e.target.value);
            setPage(1);
          }}
          className="rounded-control border-[1.5px] border-border-strong bg-surface px-3 py-[9px] font-body text-sm text-ink focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent-subtle"
        >
          <option value="">Todos os departamentos</option>
          {deptItems.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
        <select
          value={contractType}
          onChange={(e) => {
            setContractType(e.target.value);
            setPage(1);
          }}
          className="rounded-control border-[1.5px] border-border-strong bg-surface px-3 py-[9px] font-body text-sm text-ink focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent-subtle"
        >
          <option value="">Todos os vínculos</option>
          {Object.entries(CONTRACT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
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
        <span className="text-sm text-ink-faint">{data?.total ?? 0} colaboradores</span>
      </div>

      {/* Tabela */}
      {loading && (
        <Skeleton
          rows={6}
          wrapperClassName="space-y-2 animate-pulse"
          itemClassName="h-14 rounded-card bg-surface-sunken"
        />
      )}
      {error && <div className="px-4 py-8 text-center text-sm text-danger">{error}</div>}
      {!loading && !error && (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Colaborador</TableHeaderCell>
              <TableHeaderCell>Cargo</TableHeaderCell>
              <TableHeaderCell>Departamento</TableHeaderCell>
              <TableHeaderCell>Subdepartamento</TableHeaderCell>
              <TableHeaderCell>Responsável directo</TableHeaderCell>
              <TableHeaderCell>Localização</TableHeaderCell>
              <TableHeaderCell>Tipo de vínculo</TableHeaderCell>
              <TableHeaderCell>Admissão</TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center text-ink-faint">
                  Nenhum colaborador encontrado
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar name={u.fullName} url={u.avatarUrl ?? undefined} size="sm" />
                      <div>
                        <div className="text-sm text-ink">{u.fullName}</div>
                        <div className="text-xs text-ink-faint">
                          {u.employeeNumber ? `${u.employeeNumber} · ` : ''}
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-ink-muted">
                    {u.position?.name ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm text-ink-muted">
                    {u.department?.name ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm text-ink-muted">
                    {u.subdepartment ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm text-ink-muted">
                    {u.manager?.fullName ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm text-ink-muted">
                    {u.location ?? '—'}
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    {contractLabel(u.contractType)}
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    {fmtDate(u.hireDate)}
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

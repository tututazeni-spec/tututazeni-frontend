// components/departments/PositionsView.tsx
// Separador "Cargos & Funções" (docs/modulo_departments.md Ponto 6) — cargos
// existentes nos departamentos, agregados entre toda a organização, com
// filtros, indicadores e detalhe por cargo. Distinto do picker simples em
// GET /positions (usado por live-classes/trainings) — consome
// GET /departments/positions.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { Plus, Briefcase, UserCheck, UserX } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { ADMIN_ROLES } from '@/lib/roles';
import { LEVEL_CFG } from './constants';
import type { PosLevel } from './types';
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
import type { DepartmentNode, PaginatedPositions } from './types';
import { PositionDetailModal } from './PositionDetailModal';
import { PositionFormModal } from './PositionFormModal';

function flattenTree(
  nodes: DepartmentNode[],
  depth = 0,
): Array<{ value: string; label: string }> {
  return nodes.flatMap((n) => [
    { value: String(n.id), label: `${'— '.repeat(depth)}${n.name}` },
    ...flattenTree(n.children ?? [], depth + 1),
  ]);
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

export function PositionsView() {
  const role = useCurrentRole();
  const canManage = !!role && ADMIN_ROLES.includes(role);

  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [level, setLevel] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const debouncedSearch = useDebounce(search);

  const params = {
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    departmentId: departmentId || undefined,
    level: level || undefined,
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
  } = useApiQuery<PaginatedPositions>(
    queryKeys.departments.positions(params),
    '/departments/positions',
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
            <KpiCard icon={Briefcase} label="Total de cargos" value={indicators.total} />
            <KpiCard icon={UserCheck} label="Activos" value={indicators.active} intent="success" />
            <KpiCard icon={UserX} label="Inactivos" value={indicators.inactive} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <BreakdownCard title="Por família profissional" buckets={indicators.byJobFamily} />
            <BreakdownCard
              title="Por nível hierárquico"
              buckets={indicators.byLevel.map((b) => ({
                label: LEVEL_CFG[b.label as PosLevel]?.label ?? b.label,
                count: b.count,
              }))}
            />
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Input
          type="text"
          placeholder="Pesquisar por cargo, código ou função…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="min-w-[160px] flex-1"
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
          value={level}
          onChange={(e) => {
            setLevel(e.target.value);
            setPage(1);
          }}
          className="rounded-control border-[1.5px] border-border-strong bg-surface px-3 py-[9px] font-body text-sm text-ink focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent-subtle"
        >
          <option value="">Todos os níveis</option>
          {(Object.keys(LEVEL_CFG) as PosLevel[]).map((lvl) => (
            <option key={lvl} value={lvl}>
              {LEVEL_CFG[lvl].label}
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
        <span className="text-sm text-ink-faint">{data?.total ?? 0} cargos</span>
        {canManage && (
          <Button size="sm" className="ml-auto" onClick={() => setCreateOpen(true)}>
            <Plus size={14} strokeWidth={1.75} />
            Novo cargo
          </Button>
        )}
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
              <TableHeaderCell>Cargo</TableHeaderCell>
              <TableHeaderCell>Função</TableHeaderCell>
              <TableHeaderCell>Departamento</TableHeaderCell>
              <TableHeaderCell>Nível</TableHeaderCell>
              <TableHeaderCell>Reporta a</TableHeaderCell>
              <TableHeaderCell>Posições</TableHeaderCell>
              <TableHeaderCell>Ocupadas</TableHeaderCell>
              <TableHeaderCell>Vagas</TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center text-ink-faint">
                  Nenhum cargo encontrado
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((pos) => (
                <TableRow
                  key={pos.id}
                  className="cursor-pointer"
                  onClick={() => setDetailId(pos.id)}
                >
                  <TableCell>
                    <span className="text-sm font-medium text-ink">{pos.name}</span>
                    {pos.code && (
                      <span className="ml-1.5 font-mono text-xs text-ink-faint">{pos.code}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-ink-muted">
                    {pos.jobFunction ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm text-ink-muted">
                    {pos.department?.name ?? '—'}
                  </TableCell>
                  <TableCell>
                    {pos.level ? (
                      <Badge intent="neutral">
                        {LEVEL_CFG[pos.level as PosLevel]?.label ?? pos.level}
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-ink-muted">
                    {pos.reportsTo?.name ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm text-ink-muted">{pos.headcountPlanned}</TableCell>
                  <TableCell className="text-sm text-ink-muted">
                    {pos.headcountOccupied}
                  </TableCell>
                  <TableCell className="text-sm text-ink-muted">{pos.vacancies}</TableCell>
                  <TableCell>
                    <Badge intent={pos.active ? 'success' : 'neutral'}>
                      {pos.active ? 'Activo' : 'Inactivo'}
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

      {createOpen && <PositionFormModal onClose={() => setCreateOpen(false)} />}
      {detailId != null && (
        <PositionDetailModal positionId={detailId} onClose={() => setDetailId(null)} />
      )}
    </div>
  );
}

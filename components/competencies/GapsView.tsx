// components/competencies/GapsView.tsx
// Separador "Gaps de Competências" (docs/módulo_competencies.md §7) — lista
// onde existe diferença entre o nível actual e o nível necessário (GET
// /competencies/gaps). Prioridade/Impacto/Estado são derivados no backend a
// partir do gap e do PDI associado, não persistidos. Mesmo padrão de
// components/competencies/EvaluationsView.tsx.

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import {
  CATEGORY_CFG,
  GAP_IMPACT_CFG,
  GAP_PRIORITY_CFG,
  GAP_STATUS_CFG,
  POSITION_LEVEL_CFG,
} from './constants';
import {
  useCompetencyOptions,
  useDepartmentOptions,
  usePositionOptions,
  type DirectoryUser,
} from './modelFormData';
import { UserFilterSearch } from './UserFilterSearch';
import type { CompetencyGap } from './types';

const ALL = 'ALL';

const HIERARCHY_LEVEL_ITEMS = [
  { value: ALL, label: 'Todos os níveis hierárquicos' },
  ...Object.entries(POSITION_LEVEL_CFG).map(([value, cfg]) => ({ value, label: cfg.label })),
];

const PRIORITY_ITEMS = [
  { value: ALL, label: 'Todas as prioridades' },
  ...Object.entries(GAP_PRIORITY_CFG).map(([value, cfg]) => ({ value, label: cfg.label })),
];

const STATUS_ITEMS = [
  { value: ALL, label: 'Todos os estados' },
  ...Object.entries(GAP_STATUS_CFG).map(([value, cfg]) => ({ value, label: cfg.label })),
];

export function GapsView() {
  const [departmentId, setDepartmentId] = useState(ALL);
  const [positionId, setPositionId] = useState(ALL);
  const [competencyId, setCompetencyId] = useState(ALL);
  const [hierarchyLevel, setHierarchyLevel] = useState(ALL);
  const [priority, setPriority] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [user, setUser] = useState<DirectoryUser | null>(null);

  const { options: departmentOptions } = useDepartmentOptions();
  const { options: positionOptions } = usePositionOptions();
  const { options: competencyOptions } = useCompetencyOptions();

  const params = {
    departmentId: departmentId === ALL ? undefined : departmentId,
    positionId: positionId === ALL ? undefined : positionId,
    competencyId: competencyId === ALL ? undefined : competencyId,
    hierarchyLevel: hierarchyLevel === ALL ? undefined : hierarchyLevel,
    priority: priority === ALL ? undefined : priority,
    status: status === ALL ? undefined : status,
    userId: user?.id,
  };

  const { data: rows, isLoading: loading } = useApiQuery<CompetencyGap[]>(
    queryKeys.competencies.gaps(params),
    '/competencies/gaps',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Select
          items={[{ value: ALL, label: 'Todos os departamentos' }, ...departmentOptions]}
          value={departmentId}
          onValueChange={setDepartmentId}
        />
        <Select
          items={[{ value: ALL, label: 'Todos os cargos' }, ...positionOptions]}
          value={positionId}
          onValueChange={setPositionId}
        />
        <Select
          items={[{ value: ALL, label: 'Todas as competências' }, ...competencyOptions]}
          value={competencyId}
          onValueChange={setCompetencyId}
        />
        <Select items={HIERARCHY_LEVEL_ITEMS} value={hierarchyLevel} onValueChange={setHierarchyLevel} />
        <Select items={PRIORITY_ITEMS} value={priority} onValueChange={setPriority} />
        <Select items={STATUS_ITEMS} value={status} onValueChange={setStatus} />
        <UserFilterSearch selected={user} onChange={setUser} className="w-[220px]" />
      </div>

      {loading ? (
        <Skeleton rows={6} />
      ) : !rows || rows.length === 0 ? (
        <EmptyState
          title="Sem gaps"
          description="Nenhum gap de competência corresponde aos filtros seleccionados."
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              {[
                'Colaborador',
                'Competência',
                'Nível atual',
                'Nível esperado',
                'Gap',
                'Prioridade',
                'Crítica',
                'Impacto',
                'Identificado em',
                'Plano associado',
                'Estado',
              ].map((h) => (
                <TableHeaderCell key={h}>{h}</TableHeaderCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={r.colaborador}
                      url={r.colaboradorAvatarUrl ?? undefined}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-medium text-ink">{r.colaborador}</p>
                      <p className="text-[11px] text-ink-faint">
                        {r.departamento ?? '—'} · {r.cargo ?? '—'}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-ink">{r.competencia}</p>
                  <StatusBadge value={r.categoria} map={CATEGORY_CFG} className="mt-0.5" />
                </TableCell>
                <TableCell className="text-sm text-ink-muted">{r.nivelAtual}</TableCell>
                <TableCell className="text-sm font-medium text-ink">{r.nivelEsperado}</TableCell>
                <TableCell className="text-sm font-medium text-danger-ink">{r.gap}</TableCell>
                <TableCell>
                  <StatusBadge value={r.prioridade} map={GAP_PRIORITY_CFG} />
                </TableCell>
                <TableCell className="text-xs text-ink-muted">
                  {r.competenciaCritica ? 'Sim' : 'Não'}
                </TableCell>
                <TableCell>
                  <StatusBadge value={r.impacto} map={GAP_IMPACT_CFG} />
                </TableCell>
                <TableCell className="text-xs text-ink-muted">
                  {new Date(r.dataIdentificacao).toLocaleDateString('pt')}
                </TableCell>
                <TableCell className="text-xs text-ink-muted">
                  {r.planoDesenvolvimentoAssociado?.name ?? '—'}
                </TableCell>
                <TableCell>
                  <StatusBadge value={r.estado} map={GAP_STATUS_CFG} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

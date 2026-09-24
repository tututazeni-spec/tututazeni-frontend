// components/competencies/EvaluationsView.tsx
// Separador "Avaliações" (docs/módulo_competencies.md §6) — lista
// consolidada das avaliações de competência já gravadas (GET
// /competencies/evaluations). A avaliação em si continua integrada com os
// módulos Evaluation e Evaluation 360°; este separador apresenta o
// resultado relacionado à competência, guardado em UserCompetency. Dados
// próprios + apresentação, mesmo padrão de
// components/evaluation/EvaluationsTab.tsx.

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
  EVALUATION_STATUS_CFG,
  EVALUATION_TYPE_LABELS,
  POSITION_LEVEL_CFG,
} from './constants';
import {
  useCompetencyOptions,
  useDepartmentOptions,
  usePositionOptions,
  type DirectoryUser,
} from './modelFormData';
import { UserFilterSearch } from './UserFilterSearch';
import type { CompetencyEvaluation } from './types';

const ALL = 'ALL';

const HIERARCHY_LEVEL_ITEMS = [
  { value: ALL, label: 'Todos os níveis hierárquicos' },
  ...Object.entries(POSITION_LEVEL_CFG).map(([value, cfg]) => ({ value, label: cfg.label })),
];

const TYPE_ITEMS = [
  { value: ALL, label: 'Todos os tipos' },
  ...Object.entries(EVALUATION_TYPE_LABELS).map(([value, label]) => ({ value, label })),
];

const STATUS_ITEMS = [
  { value: ALL, label: 'Todos os estados' },
  ...Object.entries(EVALUATION_STATUS_CFG).map(([value, cfg]) => ({ value, label: cfg.label })),
];

export function EvaluationsView() {
  const [departmentId, setDepartmentId] = useState(ALL);
  const [positionId, setPositionId] = useState(ALL);
  const [competencyId, setCompetencyId] = useState(ALL);
  const [hierarchyLevel, setHierarchyLevel] = useState(ALL);
  const [source, setSource] = useState(ALL);
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
    source: source === ALL ? undefined : source,
    status: status === ALL ? undefined : status,
    userId: user?.id,
  };

  const { data: rows, isLoading: loading } = useApiQuery<CompetencyEvaluation[]>(
    queryKeys.competencies.evaluations(params),
    '/competencies/evaluations',
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
        <Select items={TYPE_ITEMS} value={source} onValueChange={setSource} />
        <Select items={STATUS_ITEMS} value={status} onValueChange={setStatus} />
        <UserFilterSearch selected={user} onChange={setUser} className="w-[220px]" />
      </div>

      {loading ? (
        <Skeleton rows={6} />
      ) : !rows || rows.length === 0 ? (
        <EmptyState
          title="Sem avaliações"
          description="Nenhuma avaliação de competência corresponde aos filtros seleccionados."
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              {[
                'Colaborador',
                'Avaliador',
                'Competência',
                'Tipo',
                'Nível obtido',
                'Nível esperado',
                'Gap',
                'Data',
                'Estado',
                'Comentários',
                'Evidências',
                'Próxima avaliação',
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
                <TableCell className="text-sm text-ink-muted">{r.avaliador ?? '—'}</TableCell>
                <TableCell>
                  <p className="text-sm text-ink">{r.competencia}</p>
                  <StatusBadge value={r.categoria} map={CATEGORY_CFG} className="mt-0.5" />
                </TableCell>
                <TableCell className="text-xs text-ink-muted">{r.tipoAvaliacao}</TableCell>
                <TableCell className="text-sm font-medium text-ink">{r.nivelObtido}</TableCell>
                <TableCell className="text-sm text-ink-muted">{r.nivelEsperado ?? '—'}</TableCell>
                <TableCell
                  className={
                    r.gap != null && r.gap > 0
                      ? 'text-sm font-medium text-danger-ink'
                      : 'text-sm text-ink-muted'
                  }
                >
                  {r.gap ?? '—'}
                </TableCell>
                <TableCell className="text-xs text-ink-muted">
                  {new Date(r.data).toLocaleDateString('pt')}
                </TableCell>
                <TableCell>
                  <StatusBadge value={r.estado} map={EVALUATION_STATUS_CFG} />
                </TableCell>
                <TableCell className="max-w-[180px] truncate text-xs text-ink-muted" title={r.comentarios ?? ''}>
                  {r.comentarios ?? '—'}
                </TableCell>
                <TableCell className="max-w-[140px] truncate text-xs text-ink-muted" title={r.evidencias ?? ''}>
                  {r.evidencias ?? '—'}
                </TableCell>
                <TableCell className="text-xs text-ink-faint">
                  {r.proximaAvaliacao ? new Date(r.proximaAvaliacao).toLocaleDateString('pt') : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

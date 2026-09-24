// components/competencies/DevelopmentView.tsx
// Separador "Desenvolvimento" (docs/módulo_competencies.md §8) — liga as
// lacunas de competências às acções de desenvolvimento do PDI (GET
// /competencies/development). Integração com Development Plans/PDI,
// Trainings e Courses — ver competencies.service.ts#getDevelopmentActions.
// Mesmo padrão de components/competencies/EvaluationsView.tsx/GapsView.tsx.

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
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
  DEV_ACTION_STATUS_CFG,
  DEV_ACTION_TYPE_CFG,
  DEV_RESULT_CFG,
} from './constants';
import { useCompetencyOptions, type DirectoryUser } from './modelFormData';
import { UserFilterSearch } from './UserFilterSearch';
import type { CompetencyDevelopmentAction } from './types';

const ALL = 'ALL';

const TYPE_ITEMS = [
  { value: ALL, label: 'Todos os tipos' },
  ...Object.entries(DEV_ACTION_TYPE_CFG).map(([value, cfg]) => ({ value, label: cfg.label })),
];

const STATUS_ITEMS = [
  { value: ALL, label: 'Todos os estados' },
  ...Object.entries(DEV_ACTION_STATUS_CFG).map(([value, cfg]) => ({ value, label: cfg.label })),
];

export function DevelopmentView() {
  const [competencyId, setCompetencyId] = useState(ALL);
  const [type, setType] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [user, setUser] = useState<DirectoryUser | null>(null);

  const { options: competencyOptions } = useCompetencyOptions();

  const params = {
    competencyId: competencyId === ALL ? undefined : competencyId,
    type: type === ALL ? undefined : type,
    status: status === ALL ? undefined : status,
    userId: user?.id,
  };

  const { data: rows, isLoading: loading } = useApiQuery<CompetencyDevelopmentAction[]>(
    queryKeys.competencies.development(params),
    '/competencies/development',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Select
          items={[{ value: ALL, label: 'Todas as competências' }, ...competencyOptions]}
          value={competencyId}
          onValueChange={setCompetencyId}
        />
        <Select items={TYPE_ITEMS} value={type} onValueChange={setType} />
        <Select items={STATUS_ITEMS} value={status} onValueChange={setStatus} />
        <UserFilterSearch selected={user} onChange={setUser} className="w-[220px]" />
      </div>

      {loading ? (
        <Skeleton rows={6} />
      ) : !rows || rows.length === 0 ? (
        <EmptyState
          title="Sem acções de desenvolvimento"
          description="Nenhuma acção de desenvolvimento corresponde aos filtros seleccionados."
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              {[
                'Colaborador',
                'Competência',
                'Gap',
                'Nível actual',
                'Nível objectivo',
                'Acção',
                'Tipo',
                'Curso/Formação',
                'PDI',
                'Responsável',
                'Início',
                'Conclusão prevista',
                'Estado',
                'Progresso',
                'Resultado',
                'Nível após',
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
                      <p className="text-[11px] text-ink-faint">{r.departamento ?? '—'}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-ink">{r.competencia}</p>
                  <StatusBadge value={r.categoria} map={CATEGORY_CFG} className="mt-0.5" />
                </TableCell>
                <TableCell className="text-sm text-ink-muted">{r.gap ?? '—'}</TableCell>
                <TableCell className="text-sm text-ink-muted">{r.nivelAtual ?? '—'}</TableCell>
                <TableCell className="text-sm font-medium text-ink">
                  {r.nivelObjetivo ?? '—'}
                </TableCell>
                <TableCell className="max-w-[160px] truncate text-sm text-ink" title={r.acao}>
                  {r.acao}
                </TableCell>
                <TableCell>
                  <StatusBadge value={r.tipoAcao} map={DEV_ACTION_TYPE_CFG} />
                </TableCell>
                <TableCell className="text-xs text-ink-muted">{r.cursoFormacao ?? '—'}</TableCell>
                <TableCell className="text-xs text-ink-muted">{r.pdiAssociado.name}</TableCell>
                <TableCell className="text-xs text-ink-muted">{r.responsavel ?? '—'}</TableCell>
                <TableCell className="text-xs text-ink-muted">
                  {r.dataInicio ? new Date(r.dataInicio).toLocaleDateString('pt') : '—'}
                </TableCell>
                <TableCell className="text-xs text-ink-muted">
                  {r.dataPrevistaConclusao
                    ? new Date(r.dataPrevistaConclusao).toLocaleDateString('pt')
                    : '—'}
                </TableCell>
                <TableCell>
                  <StatusBadge value={r.estado} map={DEV_ACTION_STATUS_CFG} />
                </TableCell>
                <TableCell className="w-[100px]">
                  <ProgressBar value={r.progresso} />
                  <p className="mt-0.5 text-[11px] text-ink-faint">{r.progresso}%</p>
                </TableCell>
                <TableCell>
                  <StatusBadge value={r.resultado} map={DEV_RESULT_CFG} />
                </TableCell>
                <TableCell className="text-sm text-ink-muted">
                  {r.nivelAposDesenvolvimento ?? '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

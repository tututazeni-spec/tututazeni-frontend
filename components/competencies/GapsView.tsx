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
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
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
import { avatarColor, initials } from './EvaluationsView';
import { UserFilterSearch } from './UserFilterSearch';
import type { CompetencyGap } from './types';

const ALL = '';

const HIERARCHY_LEVEL_ITEMS = [
  { value: ALL, label: 'Nível hierárquico' },
  ...Object.entries(POSITION_LEVEL_CFG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
  })),
];

const PRIORITY_ITEMS = [
  { value: ALL, label: 'Prioridade' },
  ...Object.entries(GAP_PRIORITY_CFG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
  })),
];

const STATUS_ITEMS = [
  { value: ALL, label: 'Estado' },
  ...Object.entries(GAP_STATUS_CFG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
  })),
];

const COLUMNS = [
  { label: 'Colaborador' },
  { label: 'Competência' },
  { label: 'Nível atual', center: true },
  { label: 'Nível esperado', center: true },
  { label: 'Lacuna', center: true },
  { label: 'Prioridade' },
  { label: 'Crítica' },
  { label: 'Impacto' },
  { label: 'Identificado em' },
  { label: 'Plano associado' },
  { label: 'Estado' },
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

  // Sem nenhum filtro seleccionado só se mostra o cabeçalho da tabela.
  const hasFilter = Object.values(params).some((v) => v !== undefined);

  const { data: rows, isLoading: loading } = useApiQuery<CompetencyGap[]>(
    queryKeys.competencies.gaps(params),
    '/competencies/gaps',
    { params, staleTime: STALE_TIME.DYNAMIC, enabled: hasFilter },
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Select
          items={[
            { value: ALL, label: 'Departamento' },
            ...departmentOptions,
          ]}
          value={departmentId}
          onValueChange={setDepartmentId}
        />
        <Select
          items={[{ value: ALL, label: 'Cargo' }, ...positionOptions]}
          value={positionId}
          onValueChange={setPositionId}
        />
        <Select
          items={[
            { value: ALL, label: 'Competência' },
            ...competencyOptions,
          ]}
          value={competencyId}
          onValueChange={setCompetencyId}
        />
        <Select
          items={HIERARCHY_LEVEL_ITEMS}
          value={hierarchyLevel}
          onValueChange={setHierarchyLevel}
        />
        <Select
          items={PRIORITY_ITEMS}
          value={priority}
          onValueChange={setPriority}
        />
        <Select items={STATUS_ITEMS} value={status} onValueChange={setStatus} />
        <UserFilterSearch
          selected={user}
          onChange={setUser}
          className="w-[220px]"
        />
      </div>

      {hasFilter && loading ? (
        <Skeleton rows={6} />
      ) : hasFilter && (!rows || rows.length === 0) ? (
        <EmptyState
          title="Sem lacunas"
          description="Nenhuma lacuna de competência corresponde aos filtros seleccionados."
        />
      ) : (
        <div className="overflow-x-auto rounded-[14px] border border-[#1E3A66] bg-[#071D3B] shadow-[0_4px_16px_rgba(7,29,59,0.35)]">
          <table className="w-full min-w-[1100px] border-collapse font-body text-sm text-white">
            <thead className="bg-[#0B2D5B]">
              <tr>
                {COLUMNS.map((c) => (
                  <th
                    key={c.label}
                    className={`px-4 py-3 text-xs font-bold uppercase leading-tight tracking-wide text-white ${c.center ? 'text-center' : 'text-left'}`}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(hasFilter ? (rows ?? []) : []).map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[#6F8FB8]/20 transition-colors duration-150 last:border-0 hover:bg-white/5"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {r.colaboradorAvatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.colaboradorAvatarUrl}
                          alt={r.colaborador}
                          className="h-9 w-9 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span
                          aria-hidden
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: avatarColor(r.colaborador) }}
                        >
                          {initials(r.colaborador)}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">
                          {r.colaborador}
                        </p>
                        <p className="truncate text-xs text-[#9DB4D3]">
                          {r.departamento ?? '—'} · {r.cargo ?? '—'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 leading-snug text-white">
                    <p>{r.competencia}</p>
                    <StatusBadge
                      value={r.categoria}
                      map={CATEGORY_CFG}
                      className="mt-0.5"
                    />
                  </td>
                  <td className="px-4 py-3 text-center text-[#E8EEF7]">
                    {r.nivelAtual}
                  </td>
                  <td className="px-4 py-3 text-center text-[#E8EEF7]">
                    {r.nivelEsperado}
                  </td>
                  <td className="px-4 py-3 text-center text-[#E8EEF7]">
                    {r.gap}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={r.prioridade} map={GAP_PRIORITY_CFG} />
                  </td>
                  <td className="px-4 py-3 text-xs text-white">
                    {r.competenciaCritica ? 'Sim' : 'Não'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={r.impacto} map={GAP_IMPACT_CFG} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-[#CFE3FF]">
                    {new Date(r.dataIdentificacao).toLocaleDateString('pt')}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#CFE3FF]">
                    {r.planoDesenvolvimentoAssociado?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={r.estado} map={GAP_STATUS_CFG} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

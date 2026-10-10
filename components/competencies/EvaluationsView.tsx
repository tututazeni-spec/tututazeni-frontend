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
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
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

const ALL = '';

const HIERARCHY_LEVEL_ITEMS = [
  { value: ALL, label: 'Nível hierárquico' },
  ...Object.entries(POSITION_LEVEL_CFG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
  })),
];

const TYPE_ITEMS = [
  { value: ALL, label: 'Tipo' },
  ...Object.entries(EVALUATION_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

const STATUS_ITEMS = [
  { value: ALL, label: 'Estado' },
  ...Object.entries(EVALUATION_STATUS_CFG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
  })),
];

const COLUMNS = [
  { label: 'Colaborador' },
  { label: 'Avaliador' },
  { label: 'Competência' },
  { label: 'Tipo' },
  { label: 'Nível obtido', center: true },
  { label: 'Nível esperado', center: true },
  { label: 'Lacuna', center: true },
  { label: 'Data' },
  { label: 'Estado' },
  { label: 'Comentários' },
  { label: 'Evidências' },
  { label: 'Próxima avaliação' },
];

const AVATAR_COLORS = ['#22B8A7', '#9B35D5', '#FF9C2A', '#1685FF'];

function avatarColor(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

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

  // Sem nenhum filtro seleccionado só se mostra o cabeçalho da tabela.
  const hasFilter = Object.values(params).some((v) => v !== undefined);

  const { data: rows, isLoading: loading } = useApiQuery<
    CompetencyEvaluation[]
  >(queryKeys.competencies.evaluations(params), '/competencies/evaluations', {
    params,
    staleTime: STALE_TIME.DYNAMIC,
    enabled: hasFilter,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Select
          items={[{ value: ALL, label: 'Departamento' }, ...departmentOptions]}
          value={departmentId}
          onValueChange={setDepartmentId}
        />
        <Select
          items={[{ value: ALL, label: 'Cargo' }, ...positionOptions]}
          value={positionId}
          onValueChange={setPositionId}
        />
        <Select
          items={[{ value: ALL, label: 'Competência' }, ...competencyOptions]}
          value={competencyId}
          onValueChange={setCompetencyId}
        />
        <Select
          items={HIERARCHY_LEVEL_ITEMS}
          value={hierarchyLevel}
          onValueChange={setHierarchyLevel}
        />
        <Select items={TYPE_ITEMS} value={source} onValueChange={setSource} />
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
          title="Sem avaliações"
          description="Nenhuma avaliação de competência corresponde aos filtros seleccionados."
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
                          style={{
                            backgroundColor: avatarColor(r.colaborador),
                          }}
                        >
                          {initials(r.colaborador)}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">
                          {r.colaborador}
                        </p>
                        <p className="truncate text-xs text-[#9DB4D3]">
                          {r.departamento ?? '—'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#CFE3FF]">
                    {r.avaliador ?? '—'}
                  </td>
                  <td className="px-4 py-3 leading-snug text-white">
                    <p>{r.competencia}</p>
                    <StatusBadge
                      value={r.categoria}
                      map={CATEGORY_CFG}
                      className="mt-0.5"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block whitespace-nowrap rounded-full bg-[#124A88] px-2.5 py-0.5 text-xs font-medium text-[#CFE3FF]">
                      {r.tipoAvaliacao}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-[#E8EEF7]">
                    {r.nivelObtido}
                  </td>
                  <td className="px-4 py-3 text-center text-[#E8EEF7]">
                    {r.nivelEsperado ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-[#E8EEF7]">
                    {r.gap ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-[#CFE3FF]">
                    {new Date(r.data).toLocaleDateString('pt')}
                  </td>
                  <td className="px-4 py-3 text-xs text-white">
                    {EVALUATION_STATUS_CFG[r.estado]?.label ?? r.estado}
                  </td>
                  <td
                    className="max-w-[180px] truncate px-4 py-3 text-xs text-[#CFE3FF]"
                    title={r.comentarios ?? ''}
                  >
                    {r.comentarios ?? '—'}
                  </td>
                  <td
                    className="max-w-[140px] truncate px-4 py-3 text-xs text-[#CFE3FF]"
                    title={r.evidencias ?? ''}
                  >
                    {r.evidencias ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-[#9DB4D3]">
                    {r.proximaAvaliacao
                      ? new Date(r.proximaAvaliacao).toLocaleDateString('pt')
                      : '—'}
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

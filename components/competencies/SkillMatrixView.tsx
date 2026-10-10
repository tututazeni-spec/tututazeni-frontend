// components/competencies/SkillMatrixView.tsx
// Separador "Skill Matrix" — matriz de níveis por utilizador/
// competência. Dados próprios + apresentação. Extraído de
// app/(platform)/competencies/page.tsx.
// Migrado para a fundação de design: input de filtro passa a Input,
// avatar circular local passa a components/ui/Avatar, skeleton local
// passa a components/ui/Skeleton. A legenda de níveis e as células da
// matriz usam a mesma função levelColor (tokens semânticos) — antes a
// legenda usava levelBarColor (6 tons distintos, eliminado com a
// ProgressBar mono da fundação) enquanto as células usavam levelColor
// (que já fundia os níveis 4 e 5 na mesma cor); agora ambas usam
// levelColor, eliminando essa divergência.
//
// docs/módulo_competencies.md §5 — "Permanece como está feita atualmente;
// acrescentar filtros por: Departamento, cargo, competência, nível
// hierárquico, colaborador, nível atual." O grid e o backend
// (getSkillMatrix) continuam iguais; só a barra de filtros cresce (o único
// filtro que existia era um Input numérico de "ID do departamento").

'use client';

import { useState } from 'react';
import { UserRound, type LucideIcon } from 'lucide-react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { iconForCompetencyName } from './competencyIcons';
import {
  useCompetencyOptions,
  useDepartmentOptions,
  usePositionOptions,
  type DirectoryUser,
} from './modelFormData';
import { POSITION_LEVEL_CFG } from './constants';
import { UserFilterSearch } from './UserFilterSearch';
import type { SkillMatrix } from './types';

const LEGEND = [
  { level: 0, label: '0 — Sem registo' },
  { level: 1, label: '1 — Básico' },
  { level: 2, label: '2 — Elementar' },
  { level: 3, label: '3 — Intermédio' },
  { level: 4, label: '4 — Avançado' },
  { level: 5, label: '5 — Especialista' },
];

// Heatmap: 1 coral → 5 verde intenso; 0 (sem registo) em neutro. Classes
// literais para o Tailwind as detectar. Texto escuro em todas para contraste.
const HEAT_CLS: Record<number, string> = {
  0: 'bg-[#ECE8E1] text-[#6B7280]',
  1: 'bg-[#F26B6B] text-[#0F2D55]',
  2: 'bg-[#F6A36B] text-[#0F2D55]',
  3: 'bg-[#F7DF72] text-[#0F2D55]',
  4: 'bg-[#76D6A0] text-[#0F2D55]',
  5: 'bg-[#20B981] text-[#0F2D55]',
};

function heatClass(level: number): string {
  return HEAT_CLS[Math.min(5, Math.max(0, Math.round(level)))];
}

function CompetencyIcon({ name }: { name: string }) {
  const Icon: LucideIcon = iconForCompetencyName(name) ?? UserRound;
  return <Icon size={16} strokeWidth={1.75} aria-hidden="true" />;
}

const HIERARCHY_LEVEL_OPTIONS = Object.entries(POSITION_LEVEL_CFG).map(
  ([value, cfg]) => ({
    value,
    label: cfg.label,
  }),
);

const CURRENT_LEVEL_OPTIONS = LEGEND.map(({ level, label }) => ({
  value: String(level),
  label,
}));

export function SkillMatrixView() {
  const [departmentId, setDepartmentId] = useState('ALL');
  const [positionId, setPositionId] = useState('ALL');
  const [competencyId, setCompetencyId] = useState('ALL');
  const [hierarchyLevel, setHierarchyLevel] = useState('ALL');
  const [currentLevel, setCurrentLevel] = useState('ALL');
  const [user, setUser] = useState<DirectoryUser | null>(null);

  const { options: departmentOptions } = useDepartmentOptions();
  const { options: positionOptions } = usePositionOptions();
  const { options: competencyOptions } = useCompetencyOptions();

  const params = {
    departmentId: departmentId === 'ALL' ? undefined : departmentId,
    positionId: positionId === 'ALL' ? undefined : positionId,
    competencyId: competencyId === 'ALL' ? undefined : competencyId,
    hierarchyLevel: hierarchyLevel === 'ALL' ? undefined : hierarchyLevel,
    currentLevel: currentLevel === 'ALL' ? undefined : currentLevel,
    userId: user?.id,
  };

  const { data: matrix, isLoading: loading } = useApiQuery<SkillMatrix>(
    queryKeys.competencies.skillMatrix(params),
    '/competencies/skill-matrix',
    {
      params,
      staleTime: STALE_TIME.SEMI_STATIC,
      placeholderData: keepPreviousData,
    },
  );

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Select
          items={[
            { value: 'ALL', label: 'Todos os departamentos' },
            ...departmentOptions,
          ]}
          value={departmentId}
          onValueChange={setDepartmentId}
          className="w-[180px]"
        />
        <Select
          items={[
            { value: 'ALL', label: 'Todos os cargos' },
            ...positionOptions,
          ]}
          value={positionId}
          onValueChange={setPositionId}
          className="w-[180px]"
        />
        <Select
          items={[
            { value: 'ALL', label: 'Todas as competências' },
            ...competencyOptions,
          ]}
          value={competencyId}
          onValueChange={setCompetencyId}
          className="w-[200px]"
        />
        <Select
          items={[
            { value: 'ALL', label: 'Todos os níveis hierárquicos' },
            ...HIERARCHY_LEVEL_OPTIONS,
          ]}
          value={hierarchyLevel}
          onValueChange={setHierarchyLevel}
          className="w-[200px]"
        />
        <Select
          items={[
            { value: 'ALL', label: 'Todos os níveis actuais' },
            ...CURRENT_LEVEL_OPTIONS,
          ]}
          value={currentLevel}
          onValueChange={setCurrentLevel}
          className="w-[190px]"
        />
        <UserFilterSearch
          selected={user}
          onChange={setUser}
          className="w-[220px]"
        />
      </div>

      <div className="mb-5 flex justify-end gap-2 font-body text-xs text-ink-faint">
        {LEGEND.map(({ level, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div
              className={`h-3 w-3 rounded-sm ${heatClass(level).split(' ')[0]}`}
            />
            {label}
          </div>
        ))}
      </div>

      {loading ? (
        <Skeleton rows={6} />
      ) : !matrix ? null : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="max-h-[70vh] overflow-auto">
            <table className="min-w-max border-separate border-spacing-0 font-body">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="sticky left-0 top-0 z-30 w-56 min-w-56 border-b border-r border-white/20 bg-[#0F2D55] px-3 py-3 text-left text-xs font-semibold text-white"
                  >
                    <span className="flex items-center gap-2">
                      <UserRound
                        size={16}
                        strokeWidth={1.75}
                        aria-hidden="true"
                      />
                      Pessoas
                    </span>
                  </th>
                  {matrix.competencies.map((comp) => (
                    <th
                      key={comp.id}
                      scope="col"
                      className="sticky top-0 z-20 w-28 min-w-28 border-b border-r border-white/20 bg-[#0F2D55] px-2 py-3 text-center align-top text-xs font-semibold leading-tight text-white last:border-r-0"
                    >
                      <span className="flex flex-col items-center gap-1.5">
                        <CompetencyIcon name={comp.name} />
                        <span className="break-words">{comp.name}</span>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.matrix.map((row) => (
                  <tr key={row.user.id}>
                    <th
                      scope="row"
                      className="sticky left-0 z-10 w-56 min-w-56 border-b border-r border-white/20 bg-[#0F2D55] px-3 py-2 text-left font-normal"
                    >
                      <span className="flex items-center gap-2">
                        <Avatar name={row.user.fullName} size="sm" />
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-semibold text-white">
                            {row.user.fullName}
                          </span>
                          {row.user.position?.name && (
                            <span className="block truncate text-[11px] text-white/70">
                              {row.user.position.name}
                            </span>
                          )}
                        </span>
                      </span>
                    </th>
                    {row.levels.map((lv) => (
                      <td
                        key={lv.competencyId}
                        className={`h-12 w-28 min-w-28 border-b border-r border-white px-2 text-center text-sm font-semibold last:border-r-0 ${heatClass(lv.level)}`}
                      >
                        {lv.level || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {matrix.matrix.length === 0 && (
              <div className="py-12 text-center font-body text-sm text-ink-faint">
                Sem utilizadores encontrados
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

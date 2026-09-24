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
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { levelColor } from './utils';
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

const HIERARCHY_LEVEL_OPTIONS = Object.entries(POSITION_LEVEL_CFG).map(([value, cfg]) => ({
  value,
  label: cfg.label,
}));

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
          items={[{ value: 'ALL', label: 'Todos os departamentos' }, ...departmentOptions]}
          value={departmentId}
          onValueChange={setDepartmentId}
          className="w-[180px]"
        />
        <Select
          items={[{ value: 'ALL', label: 'Todos os cargos' }, ...positionOptions]}
          value={positionId}
          onValueChange={setPositionId}
          className="w-[180px]"
        />
        <Select
          items={[{ value: 'ALL', label: 'Todas as competências' }, ...competencyOptions]}
          value={competencyId}
          onValueChange={setCompetencyId}
          className="w-[200px]"
        />
        <Select
          items={[{ value: 'ALL', label: 'Todos os níveis hierárquicos' }, ...HIERARCHY_LEVEL_OPTIONS]}
          value={hierarchyLevel}
          onValueChange={setHierarchyLevel}
          className="w-[200px]"
        />
        <Select
          items={[{ value: 'ALL', label: 'Todos os níveis actuais' }, ...CURRENT_LEVEL_OPTIONS]}
          value={currentLevel}
          onValueChange={setCurrentLevel}
          className="w-[190px]"
        />
        <UserFilterSearch selected={user} onChange={setUser} className="w-[220px]" />
      </div>

      <div className="mb-5 flex justify-end gap-2 font-body text-xs text-ink-faint">
        {LEGEND.map(({ level, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div className={`h-3 w-3 rounded-sm ${levelColor(level).split(' ')[0]}`} />
            {label}
          </div>
        ))}
      </div>

      {loading ? (
        <Skeleton rows={6} />
      ) : !matrix ? null : (
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Header row — competências */}
            <div className="flex">
              <div className="w-44 flex-shrink-0" />
              {matrix.competencies.map((comp) => (
                <div
                  key={comp.id}
                  className="w-16 flex-shrink-0 px-1 pb-2 text-center font-body text-xs leading-tight text-ink-muted"
                  style={{
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                    height: 100,
                  }}
                >
                  {comp.name}
                </div>
              ))}
            </div>

            {/* Rows — utilizadores */}
            {matrix.matrix.map((row) => (
              <div
                key={row.user.id}
                className="flex items-center border-b border-border hover:bg-surface-sunken"
              >
                <div className="flex w-44 flex-shrink-0 items-center gap-2 py-2 pr-3">
                  <Avatar name={row.user.fullName} size="sm" />
                  <div>
                    <div className="truncate font-body text-xs font-medium text-ink">
                      {row.user.fullName}
                    </div>
                    <div className="truncate font-body text-xs text-ink-faint">
                      {row.user.position?.name}
                    </div>
                  </div>
                </div>
                {row.levels.map((lv) => (
                  <div
                    key={lv.competencyId}
                    className="flex w-16 flex-shrink-0 items-center justify-center py-2"
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-control font-body text-xs font-bold ${levelColor(lv.level)}`}
                    >
                      {lv.level || '—'}
                    </div>
                  </div>
                ))}
              </div>
            ))}

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

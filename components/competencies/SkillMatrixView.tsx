// components/competencies/SkillMatrixView.tsx
// Separador "Skill Matrix" — matriz de níveis por utilizador/
// competência, filtrável por departamento. Dados próprios +
// apresentação. Extraído de app/(platform)/competencies/page.tsx.
// Migrado para a fundação de design: input de filtro passa a Input,
// avatar circular local passa a components/ui/Avatar, skeleton local
// passa a components/ui/Skeleton. A legenda de níveis e as células da
// matriz usam a mesma função levelColor (tokens semânticos) — antes a
// legenda usava levelBarColor (6 tons distintos, eliminado com a
// ProgressBar mono da fundação) enquanto as células usavam levelColor
// (que já fundia os níveis 4 e 5 na mesma cor); agora ambas usam
// levelColor, eliminando essa divergência.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { levelColor } from './utils';
import type { SkillMatrix } from './types';

const LEGEND = [
  { level: 0, label: '0 — Sem registo' },
  { level: 1, label: '1 — Básico' },
  { level: 2, label: '2 — Elementar' },
  { level: 3, label: '3 — Intermédio' },
  { level: 4, label: '4 — Avançado' },
  { level: 5, label: '5 — Especialista' },
];

export function SkillMatrixView() {
  const [deptId, setDeptId] = useState('');
  const debouncedDept = useDebounce(deptId);

  const { data: matrix, isLoading: loading } = useApiQuery<SkillMatrix>(
    queryKeys.competencies.skillMatrix(debouncedDept),
    '/competencies/skill-matrix',
    {
      params: { departmentId: debouncedDept || undefined },
      staleTime: STALE_TIME.SEMI_STATIC,
      placeholderData: keepPreviousData,
    },
  );

  if (loading) return <Skeleton rows={6} />;
  if (!matrix) return null;

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <Input
          type="number"
          placeholder="ID do departamento (opcional)"
          value={deptId}
          onChange={(e) => setDeptId(e.target.value)}
          className="max-w-xs"
        />
        {/* Legenda */}
        <div className="ml-auto flex gap-2 font-body text-xs text-ink-faint">
          {LEGEND.map(({ level, label }) => (
            <div key={label} className="flex items-center gap-1">
              <div className={`h-3 w-3 rounded-sm ${levelColor(level).split(' ')[0]}`} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Matrix table */}
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
    </div>
  );
}

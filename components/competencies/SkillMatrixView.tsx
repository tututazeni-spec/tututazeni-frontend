// components/competencies/SkillMatrixView.tsx
// Separador "Skill Matrix" — matriz de níveis por utilizador/
// competência, filtrável por departamento. Dados próprios +
// apresentação. Extraído de app/(platform)/competencies/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { getInitials as initials } from '@/lib/format';
import { Skeleton } from './atoms';
import { levelColor } from './utils';
import type { SkillMatrix } from './types';

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
      <div className="flex items-center gap-3 mb-5">
        <input
          type="number"
          placeholder="ID do departamento (opcional)"
          value={deptId}
          onChange={(e) => setDeptId(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {/* Legenda */}
        <div className="flex gap-2 ml-auto text-xs text-gray-400">
          {[
            { color: 'bg-gray-200', label: '0 — Sem registo' },
            { color: 'bg-red-400', label: '1 — Básico' },
            { color: 'bg-amber-400', label: '2 — Elementar' },
            { color: 'bg-blue-400', label: '3 — Intermédio' },
            { color: 'bg-emerald-400', label: '4 — Avançado' },
            { color: 'bg-emerald-600', label: '5 — Especialista' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-sm ${color}`} />
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
                className="w-16 flex-shrink-0 text-xs text-gray-500 text-center leading-tight px-1 pb-2"
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
              className="flex items-center border-b border-gray-100 hover:bg-gray-50"
            >
              <div className="w-44 flex-shrink-0 flex items-center gap-2 pr-3 py-2">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  {initials(row.user.fullName)}
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-900 truncate">
                    {row.user.fullName}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {row.user.position?.name}
                  </div>
                </div>
              </div>
              {row.levels.map((lv) => (
                <div
                  key={lv.competencyId}
                  className="w-16 flex-shrink-0 flex items-center justify-center py-2"
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${levelColor(lv.level)}`}
                  >
                    {lv.level || '—'}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {matrix.matrix.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400">
              Sem utilizadores encontrados
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

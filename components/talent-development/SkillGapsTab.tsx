// components/talent-development/SkillGapsTab.tsx
// Separador "Skill Gaps" — necessidades de formação + heatmap de skills
// por departamento. Dados próprios (useApiQuery) + apresentação. Extraído
// de app/(platform)/talent-development/page.tsx.

'use client';

import { useState } from 'react';
import { Brain } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { ProgressBar, Skeleton } from './atoms';
import type { SkillHeatmapRow, TrainingNeed } from './types';

export function SkillGapsTab() {
  const [view, setView] = useState<'needs' | 'heatmap'>('needs');

  const needsQuery = useApiQuery<TrainingNeed[]>(
    queryKeys.talentDevelopment.trainingNeeds(),
    '/talent/training-needs',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const heatmapQuery = useApiQuery<SkillHeatmapRow[]>(
    queryKeys.talentDevelopment.skillHeatmap(),
    '/talent/skill-heatmap',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const needs = needsQuery.data ?? [];
  const heatmap = heatmapQuery.data ?? [];

  if (needsQuery.isLoading || heatmapQuery.isLoading) return <Skeleton />;

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex gap-2">
        {(['needs', 'heatmap'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === v
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            {v === 'needs' ? 'Necessidades de Formação' : 'Heatmap de Skills'}
          </button>
        ))}
      </div>

      {view === 'needs' && (
        <div className="bg-white rounded-xl border border-slate-100">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-700">
              Top Skills com Maior Gap
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ordenado por gap médio — colaboradores vs nível alvo
            </p>
          </div>
          <div className="divide-y divide-slate-50">
            {needs.slice(0, 15).map((item, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-4">
                <span className="text-xs font-bold text-slate-400 w-5">
                  #{i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700">
                    {item.skill?.name ?? item.competency?.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {item.category} · {item.count} colaboradores
                  </p>
                  <div className="mt-1.5">
                    <ProgressBar
                      value={100 - (item.avgGap / 5) * 100}
                      color={
                        item.avgGap >= 3
                          ? 'bg-red-400'
                          : item.avgGap >= 2
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                      }
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-red-500">
                    -{item.avgGap}
                  </p>
                  <p className="text-[10px] text-slate-400">gap médio</p>
                </div>
              </div>
            ))}
            {needs.length === 0 && (
              <div className="py-12 text-center text-slate-400">
                <Brain size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sem gaps de skills registados</p>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'heatmap' && (
        <div className="bg-white rounded-xl border border-slate-100 overflow-x-auto">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-700">
              Heatmap de Skills por Departamento
            </h3>
          </div>
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left text-slate-500 font-medium">
                  Skill
                </th>
                {Array.from(
                  new Set(
                    heatmap.flatMap((h) =>
                      h.departments.map((d) => d.department),
                    ),
                  ),
                ).map((dept) => (
                  <th
                    key={dept}
                    className="px-3 py-2 text-center text-slate-500 font-medium whitespace-nowrap"
                  >
                    {dept}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {heatmap.map((row, i) => {
                const depts = Array.from(
                  new Set(
                    heatmap.flatMap((h) =>
                      h.departments.map((d) => d.department),
                    ),
                  ),
                );
                return (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium text-slate-700">
                      {row.skill}
                    </td>
                    {depts.map((dept) => {
                      const d = row.departments.find(
                        (x) => x.department === dept,
                      );
                      const lvl = d?.avgLevel ?? null;
                      const bg =
                        lvl === null
                          ? 'bg-slate-50'
                          : lvl >= 4
                            ? 'bg-emerald-100 text-emerald-700'
                            : lvl >= 3
                              ? 'bg-teal-100 text-teal-700'
                              : lvl >= 2
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-600';
                      return (
                        <td
                          key={dept}
                          className={`px-3 py-2 text-center font-semibold ${bg}`}
                        >
                          {lvl !== null ? lvl.toFixed(1) : '–'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {heatmap.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm">Sem dados de skills avaliadas</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

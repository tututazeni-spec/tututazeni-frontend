// components/career/PathsView.tsx
// Separador "Trilhas" — lista + detalhe (passos/cargos) de uma trilha
// de carreira. Dados próprios + apresentação. Extraído de
// app/(platform)/career/page.tsx.

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge, Skeleton } from './atoms';
import { CAREER_PATH_TYPE } from './constants';
import type { CareerPath } from './types';

export function PathsView() {
  const [selected, setSelected] = useState<CareerPath | null>(null);
  const { data: paths = [], isLoading: loading } = useApiQuery<CareerPath[]>(
    queryKeys.career.paths(),
    '/career/paths',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading) return <Skeleton />;

  return (
    <div className="grid grid-cols-[300px_1fr] gap-5">
      {/* Lista */}
      <div className="space-y-2">
        {paths.map((path) => (
          <div
            key={path.id}
            onClick={() => setSelected(path)}
            className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-sm transition-all ${selected?.id === path.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}
          >
            <div className="text-sm font-semibold text-gray-900">
              {path.name}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-400">
                {CAREER_PATH_TYPE[path.type] ?? path.type}
              </span>
              <span className="text-xs text-gray-400">
                {path.steps?.length ?? 0} cargos
              </span>
            </div>
          </div>
        ))}
        {paths.length === 0 && (
          <div className="py-10 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
            Sem trilhas de carreira
          </div>
        )}
      </div>

      {/* Detalhe */}
      <div>
        {!selected ? (
          <div className="h-48 flex items-center justify-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
            Selecciona uma trilha
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-lg font-bold text-gray-900 mb-1">
              {selected.name}
            </div>
            <div className="flex gap-2 mb-4">
              <Badge
                label={CAREER_PATH_TYPE[selected.type] ?? selected.type}
                cls="bg-blue-50 text-blue-700"
              />
              <Badge
                label={`${selected.steps.length} passos`}
                cls="bg-gray-100 text-gray-600"
              />
            </div>
            {selected.description && (
              <p className="text-sm text-gray-500 mb-4">
                {selected.description}
              </p>
            )}

            {/* Passos / Cargos */}
            <div className="space-y-3">
              {selected.steps.map((step, idx) => (
                <div key={step.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {step.order}
                    </div>
                    {idx < selected.steps.length - 1 && (
                      <div className="w-0.5 h-6 bg-gray-200 mt-1" />
                    )}
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl p-3">
                    <div className="text-sm font-semibold text-gray-900">
                      {step.position?.name}
                    </div>
                    <div className="flex gap-3 text-xs text-gray-400 mt-1">
                      {step.minMonthsRequired && (
                        <span>⏱ {step.minMonthsRequired}m mínimos</span>
                      )}
                      {step.minPerformanceScore && (
                        <span>⭐ Score ≥{step.minPerformanceScore}</span>
                      )}
                      {(step.requiredCourseIds?.length ?? 0) > 0 && (
                        <span>
                          📚 {step.requiredCourseIds?.length} cursos
                          obrigatórios
                        </span>
                      )}
                    </div>
                    {(step.position?.competencies?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {step.position?.competencies?.slice(0, 4).map((pc) => (
                          <span
                            key={pc.competency.id}
                            className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded"
                          >
                            {pc.competency.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

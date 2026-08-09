// components/evaluation/CyclesTab.tsx
// Separador "Ciclos" — grelha de ciclos de avaliação + acções de
// publicar/activar. Dados próprios (useApiQuery) + apresentação. Extraído
// de app/(platform)/evaluation/page.tsx.

'use client';

import { Layers } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { ProgressBar, Skeleton } from './atoms';
import { MODEL_LABEL, STATUS_COLOR } from './constants';
import type { Cycle } from './types';

export function CyclesTab() {
  const { data, isLoading: loading } = useApiQuery<{
    data: Cycle[];
    meta: { total: number };
  }>(queryKeys.evaluation.cycles(), '/evaluations/cycles', {
    staleTime: STALE_TIME.SEMI_STATIC,
  });

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-slate-700">Ciclos de Avaliação</h3>
        <span className="text-xs text-slate-400">
          {data?.meta.total ?? 0} ciclos
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data?.data.map((cycle) => (
          <div
            key={cycle.id}
            className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[cycle.status]}`}
              >
                {cycle.status}
              </span>
              <span className="text-xs text-slate-400">
                {MODEL_LABEL[cycle.model] ?? cycle.model}
              </span>
            </div>

            <h4 className="font-semibold text-slate-800 mb-3">{cycle.name}</h4>

            {/* Participation */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">Participação</span>
                <span className="font-semibold text-indigo-600">
                  {cycle.participation.rate}%
                </span>
              </div>
              <ProgressBar
                value={cycle.participation.rate}
                color={
                  cycle.participation.rate >= 75
                    ? 'bg-emerald-500'
                    : 'bg-indigo-500'
                }
                height="h-1.5"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                {cycle.participation.completed}/{cycle.participation.total}{' '}
                avaliações
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span>
                📅 {new Date(cycle.startDate).toLocaleDateString('pt')}
              </span>
              <span>→</span>
              <span>{new Date(cycle.endDate).toLocaleDateString('pt')}</span>
            </div>

            {/* Actions */}
            {cycle.status === 'DRAFT' && (
              <button
                onClick={() =>
                  apiClient
                    .post(`/evaluations/cycles/${cycle.id}/publish`, {})
                    .then(() => window.location.reload())
                }
                className="mt-3 w-full py-1.5 border border-indigo-300 text-indigo-600 text-xs rounded-lg hover:bg-indigo-50 transition-colors"
              >
                Publicar
              </button>
            )}
            {cycle.status === 'PUBLISHED' && (
              <button
                onClick={() =>
                  apiClient
                    .post(`/evaluations/cycles/${cycle.id}/activate`, {})
                    .then(() => window.location.reload())
                }
                className="mt-3 w-full py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Activar
              </button>
            )}
          </div>
        ))}

        {(data?.data.length ?? 0) === 0 && (
          <div className="col-span-3 py-16 text-center text-slate-400">
            <Layers size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhum ciclo criado ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}

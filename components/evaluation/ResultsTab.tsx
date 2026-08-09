// components/evaluation/ResultsTab.tsx
// Separador "Resultados" — pesquisa por colaborador + score 360°,
// concordância, radar de competências e sugestão de PDI. Dados próprios
// (useApiMutation, pesquisa manual por ID) + apresentação. Extraído de
// app/(platform)/evaluation/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { ProgressBar, Skeleton } from './atoms';
import { RadarChart } from './RadarChart';
import { SCORE_BG, SCORE_COLOR, TYPE_LABEL } from './constants';
import type { EvalResults } from './types';

export function ResultsTab() {
  const [userId, setUserId] = useState('');

  const loadResults = useApiMutation((uid: string) =>
    Promise.all([
      apiClient.get<EvalResults>(`/evaluations/results/${uid}`),
      apiClient.get<unknown>(`/evaluations/evolution/${uid}`),
    ]),
  );
  const result = loadResults.data?.[0] ?? null;
  const evolution = loadResults.data?.[1] ?? null;
  const loading = loadResults.isPending;

  const load = () => {
    if (userId) loadResults.mutate(userId);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 flex gap-3">
        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="ID do colaborador..."
          className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-400"
        />
        <button
          onClick={load}
          className="px-5 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
        >
          Ver Resultados
        </button>
      </div>

      {loading && <Skeleton />}

      {!loading && result && (
        <div className="space-y-4">
          {/* Header */}
          <div
            className={`rounded-xl border p-5 ${SCORE_BG(result.finalScore)}`}
          >
            <div className="flex items-start gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Score 360°</p>
                <p
                  className={`text-5xl font-black ${SCORE_COLOR(result.finalScore)}`}
                >
                  {result.finalScore.toFixed(1)}
                </p>
                <p className="font-semibold text-slate-700 mt-1">
                  {result.scoreLabel}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-sm font-semibold text-slate-700">
                  {result.evaluated.fullName}
                </p>
                <p className="text-xs text-slate-400">
                  {result.evaluated.position?.name}
                </p>
                <p className="text-xs text-slate-400">
                  {result.evaluated.department?.name}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {result.totalEvaluators} avaliadores
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* By evaluator type */}
            <div className="bg-white rounded-xl border border-slate-100 p-5">
              <h4 className="font-semibold text-slate-700 mb-3">
                Por Tipo de Avaliador
              </h4>
              <div className="space-y-3">
                {Object.entries(result.byType).map(([type, score]) => (
                  <div key={type}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{TYPE_LABEL[type] ?? type}</span>
                      <span className={`font-bold ${SCORE_COLOR(+score)}`}>
                        {(+score).toFixed(1)}/5
                      </span>
                    </div>
                    <ProgressBar
                      value={(+score / 5) * 100}
                      color={
                        +score >= 4
                          ? 'bg-emerald-500'
                          : +score >= 3
                            ? 'bg-teal-400'
                            : 'bg-amber-400'
                      }
                      height="h-2"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Concordance */}
            {result.concordance && (
              <div className="bg-white rounded-xl border border-slate-100 p-5">
                <h4 className="font-semibold text-slate-700 mb-3">
                  Matriz de Concordância
                </h4>
                <div className="flex items-center justify-center gap-6 py-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-indigo-600">
                      {result.concordance.selfScore.toFixed(1)}
                    </p>
                    <p className="text-xs text-slate-500">Autoavaliação</p>
                  </div>
                  <div className="text-center">
                    <span
                      className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                        result.concordance.label === 'Alinhado'
                          ? 'bg-emerald-100 text-emerald-700'
                          : Math.abs(result.concordance.gap) > 1
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {result.concordance.label}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">
                      gap: {result.concordance.gap > 0 ? '+' : ''}
                      {result.concordance.gap.toFixed(1)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-slate-700">
                      {result.concordance.othersScore.toFixed(1)}
                    </p>
                    <p className="text-xs text-slate-500">Outros</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Competency Radar */}
          {Object.keys(result.competencies).length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 p-5">
              <h4 className="font-semibold text-slate-700 mb-4">
                Mapa de Competências
              </h4>
              <RadarChart
                data={Object.entries(result.competencies).map(
                  ([id, score]) => ({
                    label: `C${id}`,
                    value: +score,
                    max: 5,
                  }),
                )}
                size={220}
              />
            </div>
          )}

          {/* Qualitative */}
          {(result.qualitative.strengths.length > 0 ||
            result.qualitative.improvements.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.qualitative.strengths.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <h4 className="font-semibold text-emerald-700 mb-2">
                    💪 Pontos Fortes
                  </h4>
                  <div className="space-y-1">
                    {result.qualitative.strengths.slice(0, 5).map((s, i) => (
                      <p key={i} className="text-xs text-emerald-800">
                        • {s}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {result.qualitative.improvements.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <h4 className="font-semibold text-amber-700 mb-2">
                    🎯 Áreas de Melhoria
                  </h4>
                  <div className="space-y-1">
                    {result.qualitative.improvements.slice(0, 5).map((s, i) => (
                      <p key={i} className="text-xs text-amber-800">
                        • {s}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PDI trigger */}
          <button
            onClick={() => {
              void apiClient
                .post(`/evaluations/results/${userId}/trigger-pdi`, {})
                .catch(() => {});
            }}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            🎯 Gerar Sugestão de PDI com base nestes resultados
          </button>
        </div>
      )}
    </div>
  );
}

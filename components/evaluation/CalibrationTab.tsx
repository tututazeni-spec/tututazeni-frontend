// components/evaluation/CalibrationTab.tsx
// Separador "Calibração" — pesquisa por ciclo, alerta de avaliadores com
// viés e ajuste manual de scores. Dados próprios (useApiMutation, pesquisa
// manual por ID) + apresentação. Extraído de
// app/(platform)/evaluation/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { Avatar, Skeleton } from './atoms';
import { SCORE_COLOR } from './constants';
import type { CalibrationData } from './types';

export function CalibrationTab() {
  const [cycleId, setCycleId] = useState('');

  const loadCalibration = useApiMutation((id: string) =>
    apiClient.get<CalibrationData>(`/evaluations/calibration/${id}`),
  );
  const data = loadCalibration.data ?? null;
  const loading = loadCalibration.isPending;

  const load = () => {
    if (cycleId) loadCalibration.mutate(cycleId);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-100 p-4 flex gap-3">
        <input
          value={cycleId}
          onChange={(e) => setCycleId(e.target.value)}
          placeholder="ID do ciclo..."
          className="w-48 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-400"
        />
        <button
          onClick={load}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
        >
          Abrir Calibração
        </button>
      </div>

      {loading && <Skeleton />}

      {!loading && data && (
        <div className="space-y-4">
          {/* Biased evaluators alert */}
          {(data.biasedEvaluators ?? []).length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-amber-700 mb-2">
                ⚠️ {data.biasedEvaluators?.length} avaliadores com viés
                detectado
              </p>
              <div className="space-y-1">
                {(data.biasedEvaluators ?? []).map((e, i) => (
                  <p key={i} className="text-xs text-amber-700">
                    Avaliador #{e.evaluatorId}: média {e.avg.toFixed(1)} (desvio{' '}
                    {e.deviation > 0 ? '+' : ''}
                    {e.deviation.toFixed(2)})
                    {e.deviation > 0
                      ? ' — muito generoso'
                      : ' — muito rigoroso'}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Participants ranking */}
          <div className="bg-white rounded-xl border border-slate-100">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-semibold text-slate-700">
                Participantes para Calibração
              </h4>
              <span className="text-xs text-slate-400">
                Média global: {data.globalAvg?.toFixed(2)}
              </span>
            </div>
            <div className="divide-y divide-slate-50 max-h-[480px] overflow-y-auto">
              {(data.participants ?? []).map((p, i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-300 w-5 text-right">
                    #{i + 1}
                  </span>
                  <Avatar
                    name={p.evaluated?.fullName ?? '?'}
                    url={p.evaluated?.avatarUrl}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">
                      {p.evaluated?.fullName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {p.evaluated?.position?.name} ·{' '}
                      {p.evaluated?.department?.name}
                    </p>
                  </div>
                  <div className="text-center">
                    <p
                      className={`text-sm font-bold ${SCORE_COLOR(p.avgScore)}`}
                    >
                      {p.avgScore.toFixed(1)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      P{p.percentile}
                    </p>
                  </div>
                  {(p.dispersion ?? 0) > 1 && (
                    <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                      ±{p.dispersion?.toFixed(1)}
                    </span>
                  )}
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    defaultValue={p.avgScore}
                    className="w-16 text-sm border border-slate-200 rounded px-2 py-1 text-center focus:outline-none"
                    onBlur={async (e) => {
                      const val = parseFloat(e.target.value);
                      if (val >= 0 && val <= 5 && val !== p.avgScore) {
                        await apiClient.post(
                          `/evaluations/calibration/${cycleId}/calibrate`,
                          { evaluatedId: p.evaluated.id, calibratedScore: val },
                        );
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// components/roi-impact/SimulatorTab.tsx
// Tab "Simulador": what-if de taxa de conclusão vs. ROI projectado.
// Extraído de app/(platform)/roi-impact/page.tsx.

'use client';

import { useState } from 'react';
import { Brain } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { fmt$ } from './utils';
import type { SimulateResult } from './types';

export function SimulatorTab() {
  const [targetRate, setTargetRate] = useState(80);

  const simulateMutation = useApiMutation((rate: number) =>
    apiClient.post<SimulateResult>('/roi-impact/simulate', {
      targetCompletionRate: rate,
    }),
  );
  const result = simulateMutation.data ?? null;
  const loading = simulateMutation.isPending;

  const run = () => simulateMutation.mutate(targetRate);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Brain size={16} className="text-violet-500" />
          Simulador What-If — Impacto de Taxa de Conclusão
        </h4>
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm text-slate-600 shrink-0">
            Meta de Conclusão:
          </label>
          <input
            type="range"
            min={10}
            max={100}
            value={targetRate}
            onChange={(e) => setTargetRate(+e.target.value)}
            className="flex-1 accent-indigo-600"
          />
          <span className="text-xl font-bold text-indigo-600 w-14 text-right">
            {targetRate}%
          </span>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? 'A calcular…' : 'Calcular Impacto'}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          {/* Narrative */}
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-5">
            <p className="text-sm text-indigo-800 leading-relaxed">
              💡 {result.narrative}
            </p>
          </div>

          {/* Comparison */}
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: 'Estado Actual',
                data: result.current,
                color: 'border-slate-200',
              },
              {
                label: `Com ${targetRate}% conclusão`,
                data: result.projected,
                color: 'border-indigo-300',
              },
            ].map((item) => (
              <div
                key={item.label}
                className={`bg-white rounded-xl border-2 ${item.color} p-4`}
              >
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  {item.label}
                </p>
                {[
                  {
                    label: 'Taxa Conclusão',
                    value: `${item.data.completionRate ?? 0}%`,
                  },
                  { label: 'Custo', value: fmt$(item.data.cost ?? 0) },
                  { label: 'Benefício', value: fmt$(item.data.benefit ?? 0) },
                  { label: 'ROI', value: `${item.data.roi ?? 0}%` },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="flex justify-between text-xs py-0.5"
                  >
                    <span className="text-slate-500">{m.label}</span>
                    <span className="font-semibold text-slate-700">
                      {m.value}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Delta */}
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Impacto Projectado
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: 'ROI Lift',
                  value: `${result.delta.roiLift >= 0 ? '+' : ''}${result.delta.roiLift}pts`,
                  color:
                    result.delta.roiLift >= 0
                      ? 'text-emerald-600'
                      : 'text-red-500',
                },
                {
                  label: 'Benefício Extra',
                  value: fmt$(result.delta.benefitDelta),
                  color:
                    result.delta.benefitDelta >= 0
                      ? 'text-emerald-600'
                      : 'text-red-500',
                },
                {
                  label: 'Custo Delta',
                  value: fmt$(result.delta.costDelta),
                  color: 'text-slate-700',
                },
              ].map((d) => (
                <div
                  key={d.label}
                  className="text-center p-2 rounded-lg bg-slate-50"
                >
                  <p className={`text-xl font-bold ${d.color}`}>{d.value}</p>
                  <p className="text-[10px] text-slate-400">{d.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

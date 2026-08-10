// components/payslips/CompareView.tsx
// Vista "Comparar meses": comparação lado a lado de dois períodos.
// Extraído de app/(platform)/payslips/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { formatKz as fmtKz } from '@/lib/format';
import { DeltaBadge } from './atoms';
import { fmtPeriod } from './format';
import type { CompareResult } from './types';

export function CompareView() {
  const currentYear = new Date().getFullYear();
  const [periodA, setPeriodA] = useState(
    `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
  );
  const [periodB, setPeriodB] = useState(
    `${currentYear}-${String(new Date().getMonth()).padStart(2, '0')}`,
  );

  // useApiMutation em vez de loading/error/data à mão: mesmo padrão usado no
  // resto da página (DetailView usa useApiQuery), com retry/backoff de borla.
  const compareMut = useApiMutation<CompareResult, void>(() =>
    apiClient.get<CompareResult>('/payslips/my/compare', {
      params: { periodA, periodB },
    }),
  );
  const { data: result, isPending: loading, error } = compareMut;
  const compare = () => compareMut.mutate();

  const compareFields: Array<{ key: string; label: string }> = [
    { key: 'baseSalary', label: 'Salário base' },
    { key: 'grossSalary', label: 'Bruto total' },
    { key: 'incomeTax', label: 'IRT' },
    { key: 'socialSecurity', label: 'INSS (3%)' },
    { key: 'bonuses', label: 'Prémios' },
    { key: 'overtime', label: 'Horas extras' },
    { key: 'totalDeductions', label: 'Total deduções' },
    { key: 'netSalary', label: 'Salário líquido' },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <input
          type="month"
          value={periodA}
          onChange={(e) => setPeriodA(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-400">vs</span>
        <input
          type="month"
          value={periodB}
          onChange={(e) => setPeriodB(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={compare}
          disabled={loading}
          className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors"
        >
          {loading ? 'A comparar…' : 'Comparar'}
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-500 mb-4">{error.message}</div>
      )}

      {result && (
        <div>
          <div className="grid grid-cols-[1fr_80px_1fr] gap-4 bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Col A */}
            <div className="p-4">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                {fmtPeriod(result.periodA)}
              </div>
              {compareFields.map((f) => {
                const field = result[f.key] as {
                  a: number;
                  b: number;
                  delta: number;
                  pct: number | null;
                };
                return (
                  <div
                    key={f.key}
                    className="flex justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-xs text-gray-500">{f.label}</span>
                    <span
                      className={`text-xs font-mono font-medium ${f.key === 'netSalary' ? 'text-blue-700' : 'text-gray-900'}`}
                    >
                      {fmtKz(field.a)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Delta col */}
            <div className="bg-gray-50 flex flex-col pt-9">
              {compareFields.map((f) => {
                const field = result[f.key] as {
                  a: number;
                  b: number;
                  delta: number;
                  pct: number | null;
                };
                return (
                  <div
                    key={f.key}
                    className="flex items-center justify-center py-2 border-b border-gray-100 last:border-0 h-[37px]"
                  >
                    <DeltaBadge delta={field.delta} pct={field.pct} />
                  </div>
                );
              })}
            </div>

            {/* Col B */}
            <div className="p-4">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                {fmtPeriod(result.periodB)}
              </div>
              {compareFields.map((f) => {
                const field = result[f.key] as {
                  a: number;
                  b: number;
                  delta: number;
                  pct: number | null;
                };
                return (
                  <div
                    key={f.key}
                    className="flex justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-xs text-gray-500">{f.label}</span>
                    <span
                      className={`text-xs font-mono font-medium ${f.key === 'netSalary' ? 'text-blue-700' : 'text-gray-900'}`}
                    >
                      {fmtKz(field.b)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Insight automático */}
          {(() => {
            const net = result['netSalary'] as {
              delta: number;
              pct: number | null;
            };
            if (!net || net.delta === 0) return null;
            const up = net.delta > 0;
            return (
              <div
                className={`mt-4 px-4 py-3 rounded-xl text-sm ${up ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}
              >
                <strong>
                  {up ? '↑' : '↓'} Variação de {fmtKz(Math.abs(net.delta))} no
                  salário líquido
                </strong>
                {net.pct !== null && ` (${Math.abs(net.pct).toFixed(1)}%)`}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

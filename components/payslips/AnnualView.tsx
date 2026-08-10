// components/payslips/AnnualView.tsx
// Vista "Resumo anual": totais do ano, subsídios e evolução mensal.
// Extraído de app/(platform)/payslips/page.tsx.

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatKz as fmtKz } from '@/lib/format';
import { fmtPeriod } from './format';
import type { AnnualSummary } from './types';

export function AnnualView() {
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const {
    data,
    isLoading: loading,
    error: queryError,
  } = useApiQuery<AnnualSummary>(
    queryKeys.payslips.annual(year),
    '/payslips/my/annual-summary',
    { params: { year }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const error = queryError?.message ?? null;

  const years = Array.from({ length: 4 }, (_, i) =>
    (new Date().getFullYear() - i).toString(),
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <button className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
          ⬇ Exportar CSV
        </button>
      </div>

      {loading && (
        <div className="text-sm text-gray-400 animate-pulse">A carregar…</div>
      )}
      {error && <div className="text-sm text-red-500">{error}</div>}

      {data && (
        <>
          {/* Métricas */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total bruto', value: data.totalGross },
              { label: 'Total líquido', value: data.totalNet },
              { label: 'Total IRT', value: data.totalIRT },
              { label: 'Total INSS', value: data.totalINSSEmployee },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-1.5">{label}</div>
                <div className="text-lg font-semibold font-mono text-gray-900">
                  {fmtKz(value)}
                </div>
              </div>
            ))}
          </div>

          {/* Subsídios */}
          {data.totalMealAllowance +
            data.totalVacationAllowance +
            data.totalChristmasAllowance +
            data.totalBonuses >
            0 && (
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                {
                  label: 'Subsídio alimentação',
                  value: data.totalMealAllowance,
                },
                {
                  label: 'Subsídio férias',
                  value: data.totalVacationAllowance,
                },
                {
                  label: 'Subsídio Natal',
                  value: data.totalChristmasAllowance,
                },
                { label: 'Prémios', value: data.totalBonuses },
              ].map(({ label, value }) => (
                <div key={label} className="bg-emerald-50 rounded-xl p-4">
                  <div className="text-xs text-emerald-600 mb-1.5">{label}</div>
                  <div className="text-base font-semibold font-mono text-emerald-800">
                    {fmtKz(value)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Evolução mensal simples */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
              Evolução mensal {year}
            </div>
            {data.monthlySeries.map((m) => {
              const maxVal = Math.max(
                ...data.monthlySeries.map((x) => x.grossSalary),
              );
              const pct = (m.netSalary / maxVal) * 100;
              return (
                <div
                  key={m.period}
                  className="flex items-center gap-4 px-4 py-2.5 border-b border-gray-100 last:border-0"
                >
                  <div className="w-20 text-xs text-gray-500 flex-shrink-0">
                    {fmtPeriod(m.period)}
                  </div>
                  <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded transition-all duration-500"
                      style={{ width: `${pct.toFixed(1)}%` }}
                    />
                  </div>
                  <div className="w-28 text-right text-xs font-mono font-medium text-gray-900">
                    {fmtKz(m.netSalary)}
                  </div>
                  <div className="w-20 text-right text-xs font-mono text-red-500">
                    IRT {fmtKz(m.incomeTax)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

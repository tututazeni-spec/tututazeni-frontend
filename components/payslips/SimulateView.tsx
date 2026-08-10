// components/payslips/SimulateView.tsx
// Vista "Simulador IRT": simulação debounced de salário líquido com
// tabela de escalões IRT Angola 2026. Extraído de
// app/(platform)/payslips/page.tsx.

'use client';

import { useEffect, useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { formatKz as fmtKz } from '@/lib/format';
import type { SimulateResult } from './types';

export function SimulateView() {
  const [form, setForm] = useState({
    baseSalary: 350000,
    overtime: 0,
    bonuses: 0,
    mealAllowance: 25000,
    otherAllowances: 0,
  });
  // Simulação disparada 400ms após o form mudar. Em erro, `data` do
  // useMutation mantém o último resultado bem-sucedido (mesmo comportamento
  // do try/catch silencioso anterior — "keep old result").
  const simulateMutation = useApiMutation((payload: typeof form) =>
    apiClient.post<SimulateResult>('/payslips/simulate', payload),
  );
  const result = simulateMutation.data ?? null;
  const loading = simulateMutation.isPending;

  useEffect(() => {
    const t = setTimeout(() => simulateMutation.mutate(form), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `mutate` do useMutation é estável entre renders; só `form` deve disparar o debounce.
  }, [form]);

  const IRT_BRACKETS = [
    { min: 0, max: 150000, label: '1', rate: 'Isento' },
    { min: 150001, max: 200000, label: '2', rate: '10%' },
    { min: 200001, max: 300000, label: '3', rate: '13%' },
    { min: 300001, max: 500000, label: '4', rate: '16%' },
    { min: 500001, max: 1000000, label: '5', rate: '18%' },
    { min: 1000001, max: 1500000, label: '6', rate: '19%' },
    { min: 1500001, max: Infinity, label: '7', rate: '25%' },
  ];

  const activeIdx = result
    ? IRT_BRACKETS.findIndex(
        (b) => form.baseSalary >= b.min && form.baseSalary <= b.max,
      )
    : -1;

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Inputs */}
      <div className="space-y-4">
        {[
          { key: 'baseSalary', label: 'Salário base (Kz)' },
          { key: 'mealAllowance', label: 'Subsídio de alimentação (Kz)' },
          { key: 'overtime', label: 'Horas extras (Kz)' },
          { key: 'bonuses', label: 'Prémios / Comissões (Kz)' },
          { key: 'otherAllowances', label: 'Outros subsídios (Kz)' },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
              {label}
            </label>
            <input
              type="number"
              min={0}
              value={form[key as keyof typeof form]}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  [key]: parseFloat(e.target.value) || 0,
                }))
              }
              className="w-full text-sm font-mono border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        ))}

        {/* Tabela IRT */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Tabela IRT Angola 2026
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400">
                <th className="text-left pb-1.5 font-medium">Escal.</th>
                <th className="text-left pb-1.5 font-medium">Mínimo</th>
                <th className="text-left pb-1.5 font-medium">Máximo</th>
                <th className="text-right pb-1.5 font-medium">Taxa</th>
              </tr>
            </thead>
            <tbody>
              {IRT_BRACKETS.map((b, i) => (
                <tr
                  key={i}
                  className={`${i === activeIdx ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-600'} rounded`}
                >
                  <td className="py-1 pl-1 rounded-l">{b.label}</td>
                  <td className="py-1 font-mono">
                    {b.min.toLocaleString('pt-AO')}
                  </td>
                  <td className="py-1 font-mono">
                    {b.max === Infinity ? '—' : b.max.toLocaleString('pt-AO')}
                  </td>
                  <td className="py-1 text-right rounded-r">{b.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resultado */}
      <div>
        <div className="bg-blue-50 rounded-xl p-5 space-y-3">
          <div className="text-xs font-medium text-blue-700 uppercase tracking-wide">
            Resultado estimado
          </div>

          {[
            { label: 'Bruto total', value: result?.grossSalary },
            {
              label: `IRT (${result ? (result.irtDetails.bracket.rate * 100).toFixed(0) : '—'}%)`,
              value: result?.incomeTax,
              negative: true,
            },
            {
              label: 'INSS colaborador (3%)',
              value: result?.socialSecurity,
              negative: true,
            },
            {
              label: 'Total deduções',
              value: result?.totalDeductions,
              negative: true,
            },
          ].map(({ label, value, negative }) => (
            <div
              key={label}
              className="flex justify-between items-baseline border-b border-blue-100 pb-2 last:border-0"
            >
              <span className="text-sm text-gray-600">{label}</span>
              <span
                className={`text-sm font-mono font-medium ${negative ? 'text-red-600' : 'text-gray-900'}`}
              >
                {loading
                  ? '…'
                  : value !== undefined
                    ? `${negative ? '− ' : ''}${fmtKz(value)}`
                    : '—'}
              </span>
            </div>
          ))}

          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-semibold text-gray-900">
              Salário líquido
            </span>
            <span className="text-2xl font-bold font-mono text-blue-700">
              {loading ? '…' : result ? fmtKz(result.netSalary) : '—'}
            </span>
          </div>
        </div>

        {result && (
          <>
            <div className="mt-3 bg-amber-50 rounded-xl p-4 text-xs text-amber-800">
              <div className="font-medium mb-1">Fórmula IRT aplicada</div>
              <div className="font-mono">{result.irtDetails.formula}</div>
              <div className="mt-1 text-amber-700">
                Taxa efectiva: {result.irtDetails.effectiveRate.toFixed(1)}%
                &nbsp;·&nbsp; INSS empregador: {fmtKz(result.employerInss)}
              </div>
            </div>

            <div className="mt-3 p-3 bg-gray-50 rounded-xl text-xs text-gray-500">
              Simulação meramente indicativa. Os valores finais podem variar com
              deduções adicionais aprovadas pelo RH.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

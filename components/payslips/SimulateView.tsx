// components/payslips/SimulateView.tsx
// Vista "Simulador IRT": simulação debounced de salário líquido com
// tabela de escalões IRT Angola 2026. Extraído de
// app/(platform)/payslips/page.tsx.

'use client';

import { useEffect, useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { formatKz as fmtKz } from '@/lib/format';
import { cn } from '@/lib/cn';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
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
          <FormField key={key} label={label} htmlFor={`sim-${key}`}>
            <Input
              id={`sim-${key}`}
              type="number"
              min={0}
              value={form[key as keyof typeof form]}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  [key]: parseFloat(e.target.value) || 0,
                }))
              }
              className="w-full font-mono"
            />
          </FormField>
        ))}

        {/* Tabela IRT */}
        <div className="rounded-card bg-surface-sunken p-4">
          <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Tabela IRT Angola 2026
          </div>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell className="py-1.5">Escal.</TableHeaderCell>
                <TableHeaderCell className="py-1.5">Mínimo</TableHeaderCell>
                <TableHeaderCell className="py-1.5">Máximo</TableHeaderCell>
                <TableHeaderCell className="py-1.5 text-right">
                  Taxa
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {IRT_BRACKETS.map((b, i) => (
                <TableRow
                  key={i}
                  className={cn(
                    i === activeIdx &&
                      'bg-primary-subtle font-medium text-primary hover:bg-primary-subtle',
                  )}
                >
                  <TableCell className="py-1.5 text-xs">{b.label}</TableCell>
                  <TableCell className="py-1.5 font-mono text-xs">
                    {b.min.toLocaleString('pt-AO')}
                  </TableCell>
                  <TableCell className="py-1.5 font-mono text-xs">
                    {b.max === Infinity ? '—' : b.max.toLocaleString('pt-AO')}
                  </TableCell>
                  <TableCell className="py-1.5 text-right text-xs">
                    {b.rate}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Resultado */}
      <div>
        <div className="space-y-3 rounded-card bg-primary-subtle p-5">
          <div className="font-body text-xs font-medium uppercase tracking-wide text-primary">
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
              className="flex items-baseline justify-between border-b border-border pb-2 last:border-0"
            >
              <span className="font-body text-sm text-ink-muted">
                {label}
              </span>
              <span
                className={`font-mono text-sm font-medium ${negative ? 'text-danger' : 'text-ink'}`}
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
            <span className="font-body text-sm font-semibold text-ink">
              Salário líquido
            </span>
            <span className="font-mono text-2xl font-bold text-primary">
              {loading ? '…' : result ? fmtKz(result.netSalary) : '—'}
            </span>
          </div>
        </div>

        {result && (
          <>
            <div className="mt-3 rounded-card bg-warning-subtle p-4 font-body text-xs text-warning-ink">
              <div className="mb-1 font-medium">Fórmula IRT aplicada</div>
              <div className="font-mono">{result.irtDetails.formula}</div>
              <div className="mt-1">
                Taxa efectiva: {result.irtDetails.effectiveRate.toFixed(1)}%
                &nbsp;·&nbsp; INSS empregador: {fmtKz(result.employerInss)}
              </div>
            </div>

            <div className="mt-3 rounded-card bg-surface-sunken p-3 font-body text-xs text-ink-muted">
              Simulação meramente indicativa. Os valores finais podem variar com
              deduções adicionais aprovadas pelo RH.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

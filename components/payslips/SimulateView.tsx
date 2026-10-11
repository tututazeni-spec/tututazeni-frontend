// components/payslips/SimulateView.tsx
// Vista "Simulador IRT": simulação debounced de salário líquido com
// tabela de escalões IRT Angola 2026. Layout dividido: formulário à esquerda,
// painel de resultado à direita. Extraído de app/(platform)/payslips/page.tsx.

'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  Calculator,
  Coins,
  Gift,
  Info,
  Percent,
  Receipt,
  Timer,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { formatKz as fmtKz } from '@/lib/format';
import { cn } from '@/lib/cn';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import type { SimulateResult } from './types';

type FormKey =
  | 'baseSalary'
  | 'mealAllowance'
  | 'overtime'
  | 'bonuses'
  | 'otherAllowances';

const FIELDS: Array<{ key: FormKey; label: string; icon: LucideIcon }> = [
  { key: 'baseSalary', label: 'Salário base', icon: Wallet },
  { key: 'mealAllowance', label: 'Subsídio de alimentação', icon: UtensilsCrossed },
  { key: 'overtime', label: 'Horas extras', icon: Timer },
  { key: 'bonuses', label: 'Prémios / Comissões', icon: Gift },
  { key: 'otherAllowances', label: 'Outros subsídios', icon: Receipt },
];

export function SimulateView() {
  const [form, setForm] = useState<Record<FormKey, number>>({
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `mutate` do useMutation é estável entre renders; só `form` deve disparar o debounce. Consequência: o React Compiler salta este componente por não conseguir verificar a omissão à volta de uma regra desligada.
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

  const rows = [
    { label: 'Bruto total', value: result?.grossSalary, negative: false },
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
  ];

  return (
    <div className="space-y-6">
      <div className="grid overflow-hidden rounded-[18px] shadow-[0_8px_30px_rgba(11,61,145,0.10)] lg:grid-cols-[46fr_54fr]">
        {/* Formulário */}
        <form
          className="bg-white p-6 sm:p-7"
          onSubmit={(e) => {
            e.preventDefault();
            simulateMutation.mutate(form);
          }}
        >
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8F0FE] ">
              <Calculator size={20} strokeWidth={1.75} fill="#FFFFFF" stroke="#0F1F3D" />
            </span>
            <h2 className="font-body text-lg font-semibold text-[#0F1F3D]">
              Calculadora Salarial
            </h2>
          </div>

          <div className="mb-4 font-body text-sm font-medium text-[#0F1F3D]">
            Dados do salário
          </div>

          <div className="space-y-3.5">
            {FIELDS.map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex items-end gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E8F0FE] text-[#0D6EFD]"
                >
                  <Icon size={18} strokeWidth={1.75} fill="#FFFFFF" stroke="#0F1F3D" />
                </span>
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor={`sim-${key}`}
                    className="mb-1 block font-body text-xs text-[#0F1F3D]/70"
                  >
                    {label} (Kz)
                  </label>
                  <div className="relative">
                    <input
                      id={`sim-${key}`}
                      type="number"
                      min={0}
                      value={form[key]}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          [key]: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="h-10 w-full rounded-lg border border-[#D6E4F5] bg-white pl-3 pr-10 font-body tabular-nums text-sm text-[#0F1F3D] outline-none focus-visible:border-[#0D6EFD] focus-visible:ring-2 focus-visible:ring-[#0D6EFD]/30"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-body text-xs text-[#0F1F3D]/50">
                      Kz
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#0D6EFD] font-body text-sm font-semibold text-white transition-colors hover:bg-[#0B5ED7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D6EFD]/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Calculator size={18} strokeWidth={1.75} fill="#FFFFFF" stroke="#0F1F3D" />
            {loading ? 'A calcular…' : 'Calcular'}
          </button>
        </form>

        {/* Resultado */}
        <div className="flex flex-col bg-gradient-to-br from-[#0B3D91] to-[#06275F] p-6 text-white sm:p-7">
          <div className="mb-5 flex items-center gap-2.5">
            <BarChart3 size={20} strokeWidth={1.75} />
            <h3 className="font-body text-sm font-semibold uppercase tracking-wider">
              Resultado estimado
            </h3>
          </div>

          <div aria-live="polite">
            {rows.map(({ label, value, negative }) => (
              <div
                key={label}
                className="flex items-baseline justify-between border-b border-white/15 py-3"
              >
                <span className="font-body text-sm text-white/85">{label}</span>
                <span className="font-body tabular-nums text-sm font-semibold">
                  {loading
                    ? '…'
                    : value !== undefined
                      ? `${negative ? '− ' : ''}${fmtKz(value)}`
                      : '—'}
                </span>
              </div>
            ))}

            <div className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-[#075FE8] px-4 py-4">
              <span className="flex items-center gap-2 font-body text-sm font-semibold">
                <Coins size={20} strokeWidth={1.75} />
                Salário líquido
              </span>
              <span className="font-body tabular-nums text-2xl font-bold">
                {loading ? '…' : result ? fmtKz(result.netSalary) : '—'}
              </span>
            </div>
          </div>

          {result && (
            <div className="mt-4 font-body text-xs text-white/80">
              <div className="font-body tabular-nums">{result.irtDetails.formula}</div>
              <div className="mt-1">
                Taxa efectiva: {result.irtDetails.effectiveRate.toFixed(1)}%
                &nbsp;·&nbsp; INSS empregador: {fmtKz(result.employerInss)}
              </div>
            </div>
          )}

          <p className="mt-auto flex items-start gap-2 pt-6 font-body text-xs leading-relaxed text-white/80">
            <Info size={16} strokeWidth={1.75} className="mt-0.5 shrink-0" />
            Simulação meramente indicativa. Os valores finais podem variar com
            deduções adicionais aprovadas pelo RH.
          </p>
        </div>
      </div>

      {/* Tabela IRT */}
      <div className="overflow-hidden rounded-[18px] border border-[#D6E4F5] bg-white shadow-[0_8px_30px_rgba(11,61,145,0.10)]">
        <div className="flex items-center gap-2.5 bg-gradient-to-br from-[#0B3D91] to-[#06275F] px-6 py-4 text-white">
          <Percent size={20} strokeWidth={1.75} />
          <h3 className="font-body text-sm font-semibold uppercase tracking-wider">
            Tabela IRT Angola 2026
          </h3>
        </div>
        <div className="p-4 sm:px-6">
          <Table>
            <TableHead>
              <TableRow className="bg-[#0F1F3D]/60 hover:bg-[#0F1F3D]/60">
                <TableHeaderCell className="py-1.5 text-white">
                  Escal.
                </TableHeaderCell>
                <TableHeaderCell className="py-1.5 text-white">
                  Mínimo
                </TableHeaderCell>
                <TableHeaderCell className="py-1.5 text-white">
                  Máximo
                </TableHeaderCell>
                <TableHeaderCell className="py-1.5 text-right text-white">
                  Taxa
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {IRT_BRACKETS.map((b, i) => (
                <TableRow
                  key={i}
                  className={cn(
                    'border-[#D6E4F5] text-[#0F1F3D]',
                    i === activeIdx &&
                      'bg-[#075FE8] font-semibold text-white hover:bg-[#075FE8]',
                  )}
                >
                  <TableCell className="py-1.5 text-xs">{b.label}</TableCell>
                  <TableCell className="py-1.5 font-body tabular-nums text-xs">
                    {b.min.toLocaleString('pt-AO')}
                  </TableCell>
                  <TableCell className="py-1.5 font-body tabular-nums text-xs">
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
    </div>
  );
}

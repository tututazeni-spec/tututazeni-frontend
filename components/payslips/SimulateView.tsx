// components/payslips/SimulateView.tsx
// Vista "Simulador IRT": simulação debounced de salário líquido com
// tabela de escalões IRT Angola 2026. Layout dividido: formulário à esquerda,
// painel de resultado à direita. Extraído de app/(platform)/payslips/page.tsx.

'use client';

import { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  Calculator,
  Coins,
  Gift,
  Info,
  Bus,
  Pencil,
  Percent,
  Receipt,
  Timer,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useHasRole } from '@/hooks/useCurrentRole';
import { ADMIN_ROLES } from '@/lib/roles';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { EditTaxRulesModal } from '@/components/payroll/EditTaxRulesModal';
import type { TaxConfig } from '@/components/payroll/insightTypes';
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
import type { MyCompensation, SimulateResult } from './types';
import { Input } from '@/components/ui/Input';

type FormKey =
  | 'baseSalary'
  | 'mealAllowance'
  | 'transportAllowance'
  | 'overtime'
  | 'bonuses'
  | 'otherAllowances';

const FIELDS: Array<{ key: FormKey; label: string; icon: LucideIcon }> = [
  { key: 'baseSalary', label: 'Salário base', icon: Wallet },
  {
    key: 'mealAllowance',
    label: 'Subsídio de alimentação',
    icon: UtensilsCrossed,
  },
  { key: 'transportAllowance', label: 'Subsídio de transporte', icon: Bus },
  { key: 'overtime', label: 'Horas extras', icon: Timer },
  { key: 'bonuses', label: 'Prémios / Comissões', icon: Gift },
  { key: 'otherAllowances', label: 'Outros subsídios', icon: Receipt },
];

const EMPTY_FORM: Record<FormKey, number> = {
  baseSalary: 0,
  mealAllowance: 0,
  transportAllowance: 0,
  overtime: 0,
  bonuses: 0,
  otherAllowances: 0,
};

const pct = (rate: number) => `${+(rate * 100).toFixed(2)}%`;

export function SimulateView() {
  const canEditRules = useHasRole(ADMIN_ROLES);
  const [editingRules, setEditingRules] = useState(false);
  const [form, setForm] = useState<Record<FormKey, number>>(EMPTY_FORM);
  // Texto em edição por campo: permite apagar tudo e reescrever sem o 0 forçado.
  const [drafts, setDrafts] = useState<Partial<Record<FormKey, string>>>({});

  // Os dados salariais do próprio utilizador (compensação actual) preenchem o
  // formulário, para o simulador partir exactamente do que o recibo usa.
  const { data: mine } = useApiQuery<MyCompensation | null>(
    queryKeys.payslips.compensation(),
    '/payslips/my/compensation',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const prefilled = useRef(false);
  useEffect(() => {
    if (!mine || prefilled.current) return;
    prefilled.current = true;
    setForm((prev) => ({
      ...prev,
      baseSalary: mine.baseSalary ?? 0,
      mealAllowance: mine.foodAllowance ?? 0,
      transportAllowance: mine.transportAllowance ?? 0,
      otherAllowances: mine.otherAllowances ?? 0,
    }));
  }, [mine]);

  // Regras fiscais reais (as mesmas dos processamentos; editáveis por Admin/RH).
  const { data: rules } = useApiQuery<TaxConfig>(
    queryKeys.payroll.section('tax-rules', 'simulator'),
    '/payslips/tax-rules',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  // Simulação disparada 400ms após o form mudar. Em erro, `data` do
  // useMutation mantém o último resultado bem-sucedido (mesmo comportamento
  // do try/catch silencioso anterior — "keep old result").
  const simulateMutation = useApiMutation((payload: typeof form) =>
    apiClient.post<SimulateResult>('/payslips/simulate', payload),
  );
  const result = simulateMutation.data ?? null;
  const loading = simulateMutation.isPending;

  // `mutate` é estável (React Query v5), por isso só `form` dispara o debounce.
  const { mutate: simulate } = simulateMutation;
  // `rules` também refaz a simulação: ao editar a tabela IRT o resultado acompanha.
  useEffect(() => {
    const t = setTimeout(() => simulate(form), 400);
    return () => clearTimeout(t);
  }, [form, simulate, rules]);

  const brackets = rules?.irtBrackets ?? [];
  const activeMin = result?.irtDetails.bracket.min;

  const rows: Array<{
    label: string;
    value: number | undefined;
    negative: boolean;
  }> = [
    { label: 'Bruto total', value: result?.grossSalary, negative: false },
    ...(result
      ? result.deductionLines.map((l) => ({
          label:
            l.code === 'IRT'
              ? `IRT (${pct(result.irtDetails.bracket.rate)})`
              : l.name,
          value: l.value,
          negative: true,
        }))
      : [
          { label: 'IRT', value: undefined, negative: true },
          { label: 'INSS colaborador', value: undefined, negative: true },
        ]),
    { label: 'Total deduções', value: result?.totalDeductions, negative: true },
  ];

  return (
    <div className="space-y-6">
      <div className="grid overflow-hidden rounded-[18px] shadow-[0_8px_30px_rgba(11,61,145,0.10)] lg:grid-cols-[46fr_54fr]">
        {/* Formulário */}
        <form
          className="bg-surface p-6 sm:p-7"
          onSubmit={(e) => {
            e.preventDefault();
            simulateMutation.mutate(form);
          }}
        >
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-control bg-brand-soft ">
              <Calculator
                size={20}
                strokeWidth={1.75}
                fill="#FFFFFF"
                stroke="#0F1F3D"
              />
            </span>
            <h2 className="font-body text-lg font-semibold text-brand">
              Calculadora Salarial
            </h2>
          </div>

          <div className="mb-4 font-body text-sm font-medium text-brand">
            Dados do salário
          </div>

          <div className="space-y-3.5">
            {FIELDS.map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex items-end gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-brand-soft text-brand-ink"
                >
                  <Icon
                    size={18}
                    strokeWidth={1.75}
                    fill="#FFFFFF"
                    stroke="#0F1F3D"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor={`sim-${key}`}
                    className="mb-1 block font-body text-xs text-brand/70"
                  >
                    {label} (AOA)
                  </label>
                  <div className="relative">
                    <Input
                      id={`sim-${key}`}
                      type="number"
                      min={0}
                      value={drafts[key] ?? form[key]}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setDrafts((prev) => ({ ...prev, [key]: raw }));
                        setForm((prev) => ({
                          ...prev,
                          [key]: parseFloat(raw) || 0,
                        }));
                      }}
                      onBlur={() =>
                        setDrafts((prev) => {
                          const { [key]: _omit, ...rest } = prev;
                          return rest;
                        })
                      }
                      className="w-full"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-body text-xs text-brand/50">
                      AOA
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-control bg-[#0D6EFD] font-body text-sm font-semibold text-white transition-colors hover:bg-[#0B5ED7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D6EFD]/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Calculator
              size={18}
              strokeWidth={1.75}
              fill="#FFFFFF"
              stroke="#0F1F3D"
            />
            {loading ? 'A calcular…' : 'Calcular'}
          </button>
        </form>

        {/* Resultado */}
        <div className="flex flex-col bg-gradient-to-br from-brand-mid to-brand-dark p-6 text-white sm:p-7">
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
                <span className="font-body text-sm font-semibold">
                  {loading
                    ? '…'
                    : value !== undefined
                      ? `${negative ? '− ' : ''}${fmtKz(value)}`
                      : '—'}
                </span>
              </div>
            ))}

            <div className="mt-5 flex items-center justify-between gap-3 rounded-card bg-[#075FE8] px-4 py-4">
              <span className="flex items-center gap-2 font-body text-sm font-semibold">
                <Coins size={20} strokeWidth={1.75} />
                Salário líquido
              </span>
              <span className="font-body text-2xl font-bold">
                {loading ? '…' : result ? fmtKz(result.netSalary) : '—'}
              </span>
            </div>
          </div>

          {result && (
            <div className="mt-4 font-body text-xs text-white/80">
              <div className="font-body">
                IRT sobre {fmtKz(result.irtDetails.base)}:{' '}
                {result.irtDetails.formula}
              </div>
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

      {/* Tabela IRT — regras reais, as mesmas dos processamentos */}
      <div className="overflow-hidden rounded-[18px] border border-brand-line bg-surface shadow-[0_8px_30px_rgba(11,61,145,0.10)]">
        <div className="flex items-center justify-between gap-3 bg-gradient-to-br from-brand-mid to-brand-dark px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <Percent size={20} strokeWidth={1.75} />
            <h3 className="font-body text-sm font-semibold uppercase tracking-wider">
              Tabela IRT Angola {rules?.taxYear ?? new Date().getFullYear()}
            </h3>
          </div>
          {canEditRules && rules && (
            <Button
              size="sm"
              intent="secondary"
              className="!rounded-full !border-white !bg-transparent !text-white hover:!bg-white hover:!text-[#0F1F3D]"
              onClick={() => setEditingRules(true)}
            >
              <Pencil size={14} strokeWidth={1.75} />
              Editar tabela
            </Button>
          )}
        </div>
        <div className="p-4 sm:px-6">
          <Table>
            <TableHead>
              <TableRow className="bg-brand-dark hover:bg-brand-dark">
                <TableHeaderCell className="py-1.5 text-white">
                  Escal.
                </TableHeaderCell>
                <TableHeaderCell className="py-1.5 text-right text-white">
                  Mínimo
                </TableHeaderCell>
                <TableHeaderCell className="py-1.5 text-right text-white">
                  Máximo
                </TableHeaderCell>
                <TableHeaderCell className="py-1.5 text-right text-white">
                  Taxa
                </TableHeaderCell>
                <TableHeaderCell className="py-1.5 text-right text-white">
                  Parcela fixa
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {brackets.map((b, i) => (
                <TableRow
                  key={b.id ?? i}
                  className={cn(
                    'border-brand-line text-brand',
                    b.min === activeMin &&
                      'bg-[#075FE8] font-semibold text-white hover:bg-[#075FE8]',
                  )}
                >
                  <TableCell className="py-1.5 text-xs">{i + 1}</TableCell>
                  <TableCell className="py-1.5 text-right font-body text-xs tabular-nums">
                    {b.min.toLocaleString('pt-AO')}
                  </TableCell>
                  <TableCell className="py-1.5 text-right font-body text-xs tabular-nums">
                    {b.max == null ? '—' : b.max.toLocaleString('pt-AO')}
                  </TableCell>
                  <TableCell className="py-1.5 text-right text-xs tabular-nums">
                    {b.rate === 0 ? 'Isento' : pct(b.rate)}
                  </TableCell>
                  <TableCell className="py-1.5 text-right font-body text-xs tabular-nums">
                    {(b.deduction ?? 0).toLocaleString('pt-AO')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {editingRules && rules && (
        <EditTaxRulesModal
          config={rules}
          onClose={() => setEditingRules(false)}
        />
      )}
    </div>
  );
}

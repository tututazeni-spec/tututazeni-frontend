// components/payslips/CompareView.tsx
// Vista "Comparar meses": comparação lado a lado de dois períodos.
// Extraído de app/(platform)/payslips/page.tsx.

'use client';

import { useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { formatKz as fmtKz } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { fmtPeriod } from './format';
import {
  PayslipAmountBreakdown,
  type PayslipAmountBreakdownProps,
} from './PayslipAmountBreakdown';
import type { CompareResult } from './types';

type Amount = { a: number; b: number; delta: number; pct: number | null };

/** Monta o recibo de um dos dois meses a partir do resultado da comparação. */
function toPayslip(
  result: CompareResult,
  side: 'a' | 'b',
): PayslipAmountBreakdownProps['payslip'] {
  const v = (key: string) => (result[key] as Amount | undefined)?.[side] ?? 0;
  return {
    baseSalary: v('baseSalary'),
    mealAllowance: v('mealAllowance'),
    vacationAllowance: v('vacationAllowance'),
    christmasAllowance: v('christmasAllowance'),
    overtime: v('overtime'),
    bonuses: v('bonuses'),
    otherAllowances: v('otherAllowances'),
    grossSalary: v('grossSalary'),
    incomeTax: v('incomeTax'),
    socialSecurity: v('socialSecurity'),
    employerInss: v('employerInss'),
    healthInsurance: v('healthInsurance'),
    loanDeduction: v('loanDeduction'),
    advanceDeduction: v('advanceDeduction'),
    otherDeductions: v('otherDeductions'),
    totalDeductions: v('totalDeductions'),
    netSalary: v('netSalary'),
    irtBracketRate: null,
  };
}

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
  // `silent`: "recibo de AAAA-MM não encontrado" (404) é um resultado esperado
  // quando o mês não tem recibo; já é mostrado inline abaixo, sem toast/overlay.
  const compareMut = useApiMutation<CompareResult, void>(
    () =>
      apiClient.get<CompareResult>('/payslips/my/compare', {
        params: { periodA, periodB },
      }),
    { meta: { silent: true } },
  );
  const { data: result, isPending: loading, error } = compareMut;
  const compare = () => compareMut.mutate();

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Input
          type="month"
          value={periodA}
          onChange={(e) => setPeriodA(e.target.value)}
          className="text-sm"
        />
        <span className="font-body text-sm text-ink-faint">vs</span>
        <Input
          type="month"
          value={periodB}
          onChange={(e) => setPeriodB(e.target.value)}
          className="text-sm"
        />
        <Button onClick={compare} disabled={loading}>
          {loading ? 'A comparar…' : 'Comparar'}
        </Button>
      </div>

      {error && (
        <div className="mb-4 font-body text-sm text-danger">
          {error.message}
        </div>
      )}

      {result && (
        <div>
          <div
            className="grid overflow-hidden rounded-[22px] border border-[#D6E0F2] md:grid-cols-2 md:divide-x md:divide-[#BCC6E0]"
            style={{
              backgroundColor: '#F5F9FF',
              boxShadow: '0 6px 18px rgba(21,47,89,0.12)',
            }}
          >
            {(['a', 'b'] as const).map((side) => (
              <div key={side} className="px-6 py-5">
                <div className="mb-4 inline-flex rounded-full bg-[#0F1F3D] px-4 py-1 font-body text-sm font-bold text-white">
                  {fmtPeriod(side === 'a' ? result.periodA : result.periodB)}
                </div>
                <PayslipAmountBreakdown
                  stacked
                  payslip={toPayslip(result, side)}
                />
              </div>
            ))}
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
                className={`mt-4 flex items-center gap-2 rounded-card px-4 py-3 font-body text-sm ${up ? 'bg-success-subtle text-success-ink' : 'bg-danger-subtle text-danger-ink'}`}
              >
                {up ? (
                  <TrendingUp size={16} strokeWidth={1.75} />
                ) : (
                  <TrendingDown size={16} strokeWidth={1.75} />
                )}
                <strong>
                  Variação de {fmtKz(Math.abs(net.delta))} no salário líquido
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

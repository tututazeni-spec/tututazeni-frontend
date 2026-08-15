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
import type { CompareResult } from './types';

interface DeltaBadgeProps {
  delta: number;
  pct: number | null;
}

function DeltaBadge({ delta, pct }: DeltaBadgeProps) {
  if (delta === 0)
    return <span className="font-mono text-xs text-ink-faint">—</span>;
  const up = delta > 0;
  return (
    <span
      className={`flex items-center gap-1 font-mono text-xs font-medium ${up ? 'text-success' : 'text-danger'}`}
    >
      {up ? (
        <TrendingUp size={14} strokeWidth={1.75} />
      ) : (
        <TrendingDown size={14} strokeWidth={1.75} />
      )}
      {pct !== null ? `${Math.abs(pct).toFixed(1)}%` : fmtKz(Math.abs(delta))}
    </span>
  );
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
          <div className="grid grid-cols-[1fr_80px_1fr] gap-4 overflow-hidden rounded-card border border-border bg-surface">
            {/* Col A */}
            <div className="p-4">
              <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
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
                    className="flex justify-between border-b border-border py-2 last:border-0"
                  >
                    <span className="font-body text-xs text-ink-muted">
                      {f.label}
                    </span>
                    <span
                      className={`font-mono text-xs font-medium ${f.key === 'netSalary' ? 'text-primary' : 'text-ink'}`}
                    >
                      {fmtKz(field.a)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Delta col */}
            <div className="flex flex-col bg-surface-sunken pt-9">
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
                    className="flex h-[37px] items-center justify-center border-b border-border py-2 last:border-0"
                  >
                    <DeltaBadge delta={field.delta} pct={field.pct} />
                  </div>
                );
              })}
            </div>

            {/* Col B */}
            <div className="p-4">
              <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
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
                    className="flex justify-between border-b border-border py-2 last:border-0"
                  >
                    <span className="font-body text-xs text-ink-muted">
                      {f.label}
                    </span>
                    <span
                      className={`font-mono text-xs font-medium ${f.key === 'netSalary' ? 'text-primary' : 'text-ink'}`}
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

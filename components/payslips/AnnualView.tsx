// components/payslips/AnnualView.tsx
// Vista "Resumo anual": totais do ano, subsídios e evolução mensal.
// Extraído de app/(platform)/payslips/page.tsx.

'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { API_URL as API_BASE } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatKz as fmtKz } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Select } from '@/components/ui/Select';
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
        <Select
          items={years.map((y) => ({ value: y, label: y }))}
          value={year}
          onValueChange={setYear}
        />
        <Button
          intent="secondary"
          size="sm"
          onClick={() =>
            window.open(
              `${API_BASE}/payslips/my/annual-summary/export?year=${year}&format=csv`,
              '_blank',
            )
          }
        >
          <Download size={14} strokeWidth={1.75} />
          Exportar CSV
        </Button>
      </div>

      {loading && (
        <div className="animate-pulse font-body text-sm text-ink-faint">
          A carregar…
        </div>
      )}
      {error && <div className="font-body text-sm text-danger">{error}</div>}

      {data && data.months === 0 && (
        <EmptyState
          title="Sem recibos"
          description={`Ainda não há recibos emitidos em ${year}.`}
        />
      )}

      {data && data.months > 0 && (
        <>
          {/* Métricas */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total bruto', value: data.totalGross },
              { label: 'Total líquido', value: data.totalNet },
              { label: 'Total IRT', value: data.totalIRT },
              { label: 'Total INSS', value: data.totalINSSEmployee },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-card bg-surface-sunken p-4">
                <div className="mb-1.5 font-body text-xs text-ink-faint">
                  {label}
                </div>
                <div className="font-mono text-lg font-semibold text-ink">
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
                <div key={label} className="rounded-card bg-success-subtle p-4">
                  <div className="mb-1.5 font-body text-xs text-success-ink">
                    {label}
                  </div>
                  <div className="font-mono text-base font-semibold text-success-ink">
                    {fmtKz(value)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Evolução mensal simples */}
          <div className="overflow-hidden rounded-card border border-border bg-surface">
            <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
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
                  className="flex items-center gap-4 border-b border-border px-4 py-2.5 last:border-0"
                >
                  <div className="w-20 flex-shrink-0 font-body text-xs text-ink-muted">
                    {fmtPeriod(m.period)}
                  </div>
                  <ProgressBar value={pct} className="flex-1" />
                  <div className="w-28 text-right font-mono text-xs font-medium text-ink">
                    {fmtKz(m.netSalary)}
                  </div>
                  <div className="w-20 text-right font-mono text-xs text-danger">
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

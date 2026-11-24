// components/payslips/AnnualView.tsx
// Vista "Resumo anual": totais do ano, subsídios e evolução mensal.
// Extraído de app/(platform)/payslips/page.tsx.

'use client';

import { useState } from 'react';
import {
  Award,
  Coins,
  Download,
  Gift,
  ListFilter,
  Percent,
  ShieldCheck,
  Umbrella,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
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
import { Skeleton } from '@/components/ui/Skeleton';

// Efeito de hover dos botões secundários já usado no detalhe do recibo.
const BTN_HOVER =
  'hover:!border-black hover:!bg-black hover:!text-white focus-visible:!bg-black focus-visible:!text-white';

const EXPORT_MONTHS = [
  { value: 'ALL', label: 'Ano completo' },
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

interface SummaryItem {
  icon: LucideIcon;
  label: string;
  value: number;
}

/**
 * Uma linha do card: células com ícone, separadas por linhas finas que não
 * tocam nas margens (como no desenho). As linhas usam pseudo-elementos para que
 * as colunas fiquem exactamente alinhadas entre a primeira e a segunda fila.
 */
function SummaryRow({
  items,
  divided,
}: {
  items: SummaryItem[];
  divided?: boolean;
}) {
  return (
    <div
      className={`relative grid grid-cols-2 lg:grid-cols-4 ${
        divided
          ? "before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-[#E3EAF6] before:content-['']"
          : ''
      }`}
    >
      {items.map(({ icon: Icon, label, value }, i) => (
        <div
          key={label}
          className={`relative flex items-center gap-4 px-6 py-5 before:absolute before:bottom-4 before:left-0 before:top-4 before:w-px before:bg-[#E3EAF6] before:content-[''] ${
            i === 0 ? 'before:hidden' : ''
          } ${i % 2 === 0 ? 'max-lg:before:hidden' : ''}`}
        >
          <Icon
            className="h-9 w-9 shrink-0 text-[#0F1F3D]"
            strokeWidth={1.5}
            aria-hidden
          />
          <div className="min-w-0">
            <p className="font-body text-sm leading-tight text-[#0F1F3D]">
              {label}
            </p>
            <p className="mt-0.5 font-body text-lg font-bold leading-tight text-[#0F1F3D]">
              {fmtKz(value)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AnnualView() {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [exportMonth, setExportMonth] = useState('ALL');

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

  const monthParam = exportMonth === 'ALL' ? '' : `&month=${exportMonth}`;

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <Select
          items={years.map((y) => ({ value: y, label: y }))}
          value={year}
          onValueChange={setYear}
        />
        <Select
          variant="underline"
          icon={ListFilter}
          items={EXPORT_MONTHS}
          value={exportMonth}
          onValueChange={setExportMonth}
        />
        <Button
          intent="secondary"
          size="sm"
          className={BTN_HOVER}
          onClick={() =>
            window.open(
              `${API_BASE}/payslips/my/annual-summary/export?year=${year}${monthParam}&format=csv`,
              '_blank',
            )
          }
        >
          <Download size={14} strokeWidth={1.75} />
          Exportar CSV
        </Button>
        <Button
          intent="secondary"
          size="sm"
          className={BTN_HOVER}
          onClick={() =>
            window.open(
              `${API_BASE}/payslips/my/annual-summary/export?year=${year}${monthParam}&format=pdf`,
              '_blank',
            )
          }
        >
          <Download size={14} strokeWidth={1.75} />
          Exportar PDF
        </Button>
      </div>

      {loading && <Skeleton rows={3} />}
      {error && <div className="font-body text-sm text-danger">{error}</div>}

      {data && data.months === 0 && (
        <EmptyState
          title="Sem recibos"
          description={`Ainda não há recibos emitidos em ${year}.`}
        />
      )}

      {data && data.months > 0 && (
        <>
          {/* Totais e subsídios — desenho de public/images/resumo animal.jpg */}
          <div
            className="mb-6 overflow-hidden rounded-[22px] border border-[#D6E0F2] bg-white"
            style={{ boxShadow: '0 6px 18px rgba(21,47,89,0.12)' }}
          >
            <SummaryRow
              items={[
                { icon: Coins, label: 'Total bruto', value: data.totalGross },
                { icon: Wallet, label: 'Total líquido', value: data.totalNet },
                { icon: Percent, label: 'Total IRT', value: data.totalIRT },
                {
                  icon: ShieldCheck,
                  label: 'Total INSS',
                  value: data.totalINSSEmployee,
                },
              ]}
            />
            {data.totalMealAllowance +
              data.totalVacationAllowance +
              data.totalChristmasAllowance +
              data.totalBonuses >
              0 && (
              <SummaryRow
                divided
                items={[
                  {
                    icon: UtensilsCrossed,
                    label: 'Subsídio alimentação',
                    value: data.totalMealAllowance,
                  },
                  {
                    icon: Umbrella,
                    label: 'Subsídio férias',
                    value: data.totalVacationAllowance,
                  },
                  {
                    icon: Gift,
                    label: 'Subsídio Natal',
                    value: data.totalChristmasAllowance,
                  },
                  { icon: Award, label: 'Prémios', value: data.totalBonuses },
                ]}
              />
            )}
          </div>

          {/* Evolução mensal simples */}
          <div className="overflow-hidden rounded-card border border-border bg-surface">
            <div className="border-b border-border bg-brand-dark px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-white">
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
                  className="grid grid-cols-[9rem_1fr_9rem_9rem] items-center gap-4 border-b border-border px-4 py-2.5 font-body text-sm text-ink last:border-0"
                >
                  <div>{fmtPeriod(m.period)}</div>
                  <ProgressBar value={pct} color="#0F1F3D" />
                  <div className="text-right font-semibold tabular-nums">
                    {fmtKz(m.netSalary)}
                  </div>
                  <div className="text-right tabular-nums">
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

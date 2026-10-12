'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatKz as fmtKz } from '@/lib/format';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { ShareGaugeCard } from '@/components/ui/charts/SpeedometerStatCard';
import { DonutStatCard } from '@/components/ui/charts/DonutStatCard';
import type { HrDashboard } from './types';

const thisMonth = () => new Date().toISOString().slice(0, 7);

export function HrDashboardView() {
  const [period, setPeriod] = useState(thisMonth());
  const params = { period };
  const { data, isLoading, error } = useApiQuery<HrDashboard>(
    queryKeys.payslips.dashboard(period),
    '/payslips/dashboard',
    { params, staleTime: STALE_TIME.SEMI_STATIC },
  );

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <Input
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          placeholder="Período (AAAA-MM)"
          className="w-44"
        />
      </div>

      {isLoading && <Skeleton rows={6} />}
      {error && (
        <div className="font-body text-sm text-danger">{error.message}</div>
      )}

      {!isLoading && !error && data && (
        <div className="space-y-8">
          <section>
            <h3 className="mb-3 font-body text-sm font-semibold uppercase tracking-wide text-ink-faint">
              Contagens
            </h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              <ShareGaugeCard
                label="Total"
                value={data.counts.total}
                total={data.counts.total}
              />
              <ShareGaugeCard
                label="Emitidos"
                value={data.counts.issued}
                total={data.counts.total}
              />
              <ShareGaugeCard
                label="Confirmados"
                value={data.counts.acknowledged}
                total={data.counts.total}
              />
              <ShareGaugeCard
                label="Em disputa"
                value={data.counts.disputed}
                total={data.counts.total}
                lowerIsBetter
              />
              <ShareGaugeCard
                label="Por confirmar"
                value={data.counts.notViewed}
                total={data.counts.total}
                lowerIsBetter
              />
              <ShareGaugeCard
                label="Rascunhos"
                value={data.counts.draft}
                total={data.counts.total}
                lowerIsBetter
              />
            </div>
          </section>

          <section>
            <h3 className="mb-3 font-body text-sm font-semibold uppercase tracking-wide text-ink-faint">
              Financeiro
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ShareGaugeCard
                label="Bruto total"
                value={data.financials.totalGross}
                total={data.financials.totalGross}
                caption={fmtKz(data.financials.totalGross)}
                showPercent
              />
              <ShareGaugeCard
                label="Líquido total"
                value={data.financials.totalNet}
                total={data.financials.totalGross}
                caption={fmtKz(data.financials.totalNet)}
                showPercent
              />
              <ShareGaugeCard
                label="IRT total"
                value={data.financials.totalIRT}
                total={data.financials.totalGross}
                caption={fmtKz(data.financials.totalIRT)}
                showPercent
                lowerIsBetter
              />
              <ShareGaugeCard
                label="INSS colaborador"
                value={data.financials.totalINSSEmployee}
                total={data.financials.totalGross}
                caption={fmtKz(data.financials.totalINSSEmployee)}
                showPercent
                lowerIsBetter
              />
              <ShareGaugeCard
                label="INSS empregador"
                value={data.financials.totalINSSEmployer}
                total={data.financials.totalGross}
                caption={fmtKz(data.financials.totalINSSEmployer)}
                showPercent
                lowerIsBetter
              />
              <ShareGaugeCard
                label="Líquido médio"
                value={data.financials.avgNet}
                total={data.financials.totalGross}
                caption={fmtKz(data.financials.avgNet)}
                showPercent
              />
            </div>
          </section>

          <section>
            <h3 className="mb-3 font-body text-sm font-semibold uppercase tracking-wide text-ink-faint">
              Compliance
            </h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              <DonutStatCard label="Taxa de confirmação" value={parseFloat(data.compliance.viewRate) || 0} />
              <ShareGaugeCard
                label="Pendentes de confirmação"
                value={data.compliance.pendingAcknowledgement}
                total={data.counts.total}
                lowerIsBetter
              />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

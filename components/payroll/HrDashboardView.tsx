'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatKz as fmtKz } from '@/lib/format';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { KpiCard } from '@/components/ui/KpiCard';
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
      {error && <div className="font-body text-sm text-danger">{error.message}</div>}

      {!isLoading && !error && data && (
        <div className="space-y-8">
          <section>
            <h3 className="mb-3 font-body text-sm font-semibold uppercase tracking-wide text-ink-faint">Contagens</h3>
            <div className="flex flex-wrap gap-3">
              <KpiCard label="Total" value={data.counts.total} />
              <KpiCard label="Emitidos" value={data.counts.issued} intent="success" />
              <KpiCard label="Confirmados" value={data.counts.acknowledged} intent="info" />
              <KpiCard label="Em disputa" value={data.counts.disputed} intent="danger" />
              <KpiCard label="Por confirmar" value={data.counts.notViewed} intent="warning" />
              <KpiCard label="Rascunhos" value={data.counts.draft} />
            </div>
          </section>

          <section>
            <h3 className="mb-3 font-body text-sm font-semibold uppercase tracking-wide text-ink-faint">Financeiro</h3>
            <div className="flex flex-wrap gap-3">
              <KpiCard label="Bruto total" value={fmtKz(data.financials.totalGross)} />
              <KpiCard label="Líquido total" value={fmtKz(data.financials.totalNet)} intent="success" />
              <KpiCard label="IRT total" value={fmtKz(data.financials.totalIRT)} />
              <KpiCard label="INSS colaborador" value={fmtKz(data.financials.totalINSSEmployee)} />
              <KpiCard label="INSS empregador" value={fmtKz(data.financials.totalINSSEmployer)} />
              <KpiCard label="Líquido médio" value={fmtKz(data.financials.avgNet)} />
            </div>
          </section>

          <section>
            <h3 className="mb-3 font-body text-sm font-semibold uppercase tracking-wide text-ink-faint">Compliance</h3>
            <div className="flex flex-wrap gap-3">
              <KpiCard label="Taxa de confirmação" value={data.compliance.viewRate} intent="info" />
              <KpiCard label="Pendentes de confirmação" value={data.compliance.pendingAcknowledgement} intent="warning" />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

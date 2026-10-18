'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  FileEdit,
  FileText,
  Percent,
  ShieldAlert,
  ThumbsUp,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatKz as fmtKz } from '@/lib/format';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { WalletStat } from '@/components/roi-impact/WalletStat';
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
              <KpiCard
                className="min-h-[178px]"
                icon={FileText}
                label="Total"
                value={data.counts.total}
              />
              <KpiCard
                className="min-h-[178px]"
                icon={CheckCircle2}
                label="Emitidos"
                value={data.counts.issued}
                intent="success"
              />
              <KpiCard
                className="min-h-[178px]"
                icon={ThumbsUp}
                label="Confirmados"
                value={data.counts.acknowledged}
                intent="info"
              />
              <KpiCard
                className="min-h-[178px]"
                icon={AlertTriangle}
                label="Em disputa"
                value={data.counts.disputed}
                intent="danger"
              />
              <KpiCard
                className="min-h-[178px]"
                icon={Eye}
                label="Por confirmar"
                value={data.counts.notViewed}
                intent="warning"
              />
              <KpiCard
                className="min-h-[178px]"
                icon={FileEdit}
                label="Rascunhos"
                value={data.counts.draft}
              />
            </div>
          </section>

          <section>
            <h3 className="mb-3 font-body text-sm font-semibold uppercase tracking-wide text-ink-faint">
              Compliance
            </h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              <KpiCard
                className="min-h-[178px]"
                icon={Percent}
                label="Taxa de confirmação"
                value={data.compliance.viewRate}
                intent="info"
              />
              <KpiCard
                className="min-h-[178px]"
                icon={ShieldAlert}
                label="Pendentes de confirmação"
                value={data.compliance.pendingAcknowledgement}
                intent="warning"
              />
            </div>
          </section>

          <section>
            <h3 className="mb-3 font-body text-sm font-semibold uppercase tracking-wide text-ink-faint">
              Financeiro
            </h3>
            <div className="grid grid-cols-2 items-start gap-6 md:grid-cols-3">
              <WalletStat
                zoom
                money="bills"
                tone="blue"
                label="Bruto total"
                value={fmtKz(data.financials.totalGross)}
              />
              <WalletStat
                zoom
                money="stack"
                tone="green"
                label="Líquido total"
                value={fmtKz(data.financials.totalNet)}
              />
              <WalletStat
                zoom
                money="coins"
                tone="orange"
                label="IRT total"
                value={fmtKz(data.financials.totalIRT)}
              />
              <WalletStat
                zoom
                money="coins"
                tone="orange"
                label="INSS colaborador"
                value={fmtKz(data.financials.totalINSSEmployee)}
              />
              <WalletStat
                zoom
                money="mixed"
                tone="red"
                label="INSS empregador"
                value={fmtKz(data.financials.totalINSSEmployer)}
              />
              <WalletStat
                zoom
                money="fan"
                tone="green"
                label="Líquido médio"
                value={fmtKz(data.financials.avgNet)}
              />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

// components/crm/partners/ReportView.tsx
// Separador "Relatório" — GET /crm/partners/report?start&end, só ADMIN/RH.
// Endpoint já existia no backend sem UI.

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { formatKz } from '@/lib/format';
import {
  DateRangeForm,
  DistributionList,
  SummaryCard,
  ErrorBanner,
  formatDate,
  type DateRange,
} from '@/components/crm/shared';
import type { PartnerReport } from './types';

interface ReportViewProps {
  range: DateRange;
  setRange: (range: DateRange) => void;
  generate: () => void;
  report: PartnerReport | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string;
}

export function ReportView({
  range,
  setRange,
  generate,
  report,
  isLoading,
  isError,
  errorMessage,
}: ReportViewProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            Relatório por Período
          </h1>
          <p className="font-body text-ink-muted">Parceiros e actividade no intervalo</p>
        </div>
        <Link href="/crm/partners">
          <Button intent="secondary">← Parceiros</Button>
        </Link>
      </div>

      <DateRangeForm value={range} onChange={setRange} onSubmit={generate} loading={isLoading} />

      {isError && <ErrorBanner message={errorMessage} onRetry={generate} />}

      {report && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard
              label={`Parceiros criados (${formatDate(report.period.start)} – ${formatDate(report.period.end)})`}
              value={String(report.created)}
              color="text-ink"
            />
            <SummaryCard
              label="Valor total (activos)"
              value={formatKz(report.totalValue)}
              color="text-primary"
            />
            <SummaryCard
              label="Interacções no período"
              value={String(report.interactions)}
              color="text-ink"
            />
            <SummaryCard
              label="Milestones concluídos"
              value={String(report.milestonesCompleted)}
              color="text-success-ink"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DistributionList title="Por tipo" data={report.byType} labelKey="type" />
            <DistributionList title="Por nível" data={report.byTier} labelKey="tier" />
          </div>
        </>
      )}
    </div>
  );
}

// components/crm/funders/ReportView.tsx
// Separador "Relatório" — GET /crm/funders/report?start&end, só ADMIN/RH.
// Endpoint já existia no backend sem UI.

import {
  DateRangeForm,
  DistributionList,
  SummaryCard,
  ErrorBanner,
  formatMoney,
  formatDate,
  type DateRange,
} from '@/components/crm/shared';
import type { FunderReportSummary } from './types';

interface ReportViewProps {
  range: DateRange;
  setRange: (range: DateRange) => void;
  generate: () => void;
  report: FunderReportSummary | undefined;
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
      <DateRangeForm
        value={range}
        onChange={setRange}
        onSubmit={generate}
        loading={isLoading}
      />

      {isError && <ErrorBanner message={errorMessage} onRetry={generate} />}

      {report && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard
              label={`Financiadores criados (${formatDate(report.period.start)} – ${formatDate(report.period.end)})`}
              value={String(report.created)}
              color="text-ink"
            />
            <SummaryCard
              label="Grants criados"
              value={String(report.grantsCreated)}
              color="text-primary"
            />
            <SummaryCard
              label="Total desembolsado"
              value={formatMoney(report.totalDisbursed)}
              color="text-success-ink"
            />
            <SummaryCard
              label="Relatórios submetidos"
              value={String(report.reportsSubmitted)}
              color="text-ink"
            />
          </div>
          <DistributionList
            title="Por tipo"
            data={report.byType}
            labelKey="type"
          />
        </>
      )}
    </div>
  );
}

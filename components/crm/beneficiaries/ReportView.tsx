// components/crm/beneficiaries/ReportView.tsx
// Separador "Relatório" — GET /crm/beneficiaries/report?start&end, só
// ADMIN/RH. Endpoint já existia no backend sem UI.

import {
  DateRangeForm,
  DistributionList,
  SummaryCard,
  ErrorBanner,
  formatDate,
  type DateRange,
} from '@/components/crm/shared';
import type { BeneficiaryReport } from './types';

interface ReportViewProps {
  range: DateRange;
  setRange: (range: DateRange) => void;
  generate: () => void;
  report: BeneficiaryReport | undefined;
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
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
            <SummaryCard
              label={`Beneficiários criados (${formatDate(report.period.start)} – ${formatDate(report.period.end)})`}
              value={String(report.created)}
              color="text-ink"
            />
            <SummaryCard
              label="Interacções no período"
              value={String(report.interactions)}
              color="text-primary"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DistributionList
              title="Por tipo"
              data={report.byType}
              labelKey="type"
            />
            <DistributionList
              title="Por província"
              data={report.byProvince}
              labelKey="province"
            />
          </div>
        </>
      )}
    </div>
  );
}

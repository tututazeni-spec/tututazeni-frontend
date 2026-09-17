// hooks/useFunderReport.ts
// GET /crm/funders/report?start&end — relatório por período, gerado sob
// pedido (só dispara quando `generate()` é chamado). Endpoint já existia no
// backend sem nenhum consumidor no frontend.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useDateRangeReport } from '@/components/crm/shared';
import { queryKeys } from '@/lib/queryKeys';
import type { FunderReportSummary } from '@/components/crm/funders/types';

export function useFunderReport() {
  const { range, setRange, submitted, generate } = useDateRangeReport();

  const { data, isLoading, isError, error } = useApiQuery<FunderReportSummary>(
    queryKeys.funders.report(submitted ?? {}),
    '/crm/funders/report',
    {
      params: submitted ?? undefined,
      enabled: !!submitted,
    },
  );

  return {
    range,
    setRange,
    generate,
    report: submitted ? data : undefined,
    isLoading: !!submitted && isLoading,
    isError,
    errorMessage: error?.message || 'Erro ao gerar relatório',
  };
}

// hooks/useBeneficiaryReport.ts
// GET /crm/beneficiaries/report?start&end — relatório por período, gerado
// sob pedido (só dispara quando `generate()` é chamado).

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useDateRangeReport } from '@/components/crm/shared';
import { queryKeys } from '@/lib/queryKeys';
import type { BeneficiaryReport } from '@/components/crm/beneficiaries/types';

export function useBeneficiaryReport() {
  const { range, setRange, submitted, generate } = useDateRangeReport();

  const { data, isLoading, isError, error } = useApiQuery<BeneficiaryReport>(
    queryKeys.beneficiaries.report(submitted ?? {}),
    '/crm/beneficiaries/report',
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

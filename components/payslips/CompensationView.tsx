// components/payslips/CompensationView.tsx
// Vista "A minha compensação": resumo só-leitura da compensação actual do
// próprio colaborador (GET /payslips/my/compensation). O backend devolve
// uma forma achatada e mascarada — sem componentes individuais, sem totais
// derivados, sem userId/id. Ver src/payslips/employee-compensation.service.ts.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate, formatKz as fmtKz } from '@/lib/format';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { MyCompensation } from './types';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3 last:border-0">
      <dt className="font-body text-sm text-ink-muted">{label}</dt>
      <dd className="font-mono text-sm font-medium text-ink">{value}</dd>
    </div>
  );
}

export function CompensationView() {
  const {
    data,
    isLoading: loading,
    error: queryError,
  } = useApiQuery<MyCompensation | null>(
    queryKeys.payslips.compensation(),
    '/payslips/my/compensation',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const error = queryError?.message ?? null;

  if (loading) return <Skeleton rows={5} />;
  if (error)
    return <div className="font-body text-sm text-danger">{error}</div>;

  if (!data) {
    return (
      <EmptyState
        title="Sem informação de compensação"
        description="Ainda não há informação de compensação registada. Fala com os Recursos Humanos."
      />
    );
  }

  return (
    <div className="max-w-md">
      <dl className="overflow-hidden rounded-card border border-border bg-surface">
        <Row label="Salário base" value={fmtKz(data.baseSalary)} />
        {data.foodAllowance != null && (
          <Row
            label="Subsídio de alimentação"
            value={fmtKz(data.foodAllowance)}
          />
        )}
        {data.transportAllowance != null && (
          <Row
            label="Subsídio de transporte"
            value={fmtKz(data.transportAllowance)}
          />
        )}
        <Row label="Banco" value={data.bankName ?? '—'} />
        <Row label="IBAN" value={data.ibanMasked ?? '—'} />
      </dl>
      <p className="mt-3 font-body text-xs text-ink-faint">
        Em vigor desde {formatDate(data.effectiveFrom)}
      </p>
    </div>
  );
}

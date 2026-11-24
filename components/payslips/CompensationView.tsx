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
import { Wallet } from 'lucide-react';
import { SectionHeader } from './PayslipAmountBreakdown';
import type { MyCompensation } from './types';

// Mesmo desenho dos cards de "Comparar meses": painel claro, moldura fina e
// sombra suave; um único card; Banco e IBAN por baixo das remunerações.
const CARD_STYLE = {
  backgroundColor: '#F5F9FF',
  boxShadow: '0 6px 18px rgba(21,47,89,0.12)',
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-[#EAEFF8] py-1.5 last:border-0">
      <dt className="font-body text-sm text-[#1B2742]">{label}</dt>
      <dd className="break-all text-right font-body text-sm font-semibold tabular-nums text-[#1B2742]">
        {value}
      </dd>
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
    <div className="max-w-xl">
      <div
        className="grid overflow-hidden rounded-[22px] border border-[#D6E0F2] "
        style={CARD_STYLE}
      >
        <section className="px-6 py-5">
          <SectionHeader icon={Wallet}>A minha compensação</SectionHeader>
          <dl>
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
        </section>
      </div>
      <p className="mt-3 font-body text-xs text-ink-faint">
        Em vigor desde {formatDate(data.effectiveFrom)}
      </p>
    </div>
  );
}

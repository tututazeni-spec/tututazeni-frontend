// components/payroll/DisputesView.tsx
// Separador "Disputas" da vista admin RH: lista paginada de
// GET /payslips/disputes com filtro de estado (default OPEN). Cada linha
// tem um botão de código de recibo que abre o recibo (onOpenPayslip) e,
// só em disputas OPEN, um botão "Resolver" que abre o ResolveDisputeModal.
'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { fmtPeriod } from '@/components/payslips/format';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { ResolveDisputeModal } from './ResolveDisputeModal';
import { DisputeItem, PayslipDisputeCard } from './PayslipDisputeCard';
import {
  DISPUTE_STATUS_MAP,
  type Paginated,
  type PayslipDispute,
} from './types';
import { FileText, ListFilter, UserRound } from 'lucide-react';

export interface DisputesViewProps {
  onOpenPayslip: (payslipId: number) => void;
}

const STATUS_ITEMS = [
  { value: 'OPEN', label: DISPUTE_STATUS_MAP.OPEN.label },
  { value: 'RESOLVED', label: DISPUTE_STATUS_MAP.RESOLVED.label },
  { value: 'all', label: 'Todas' },
];

export function DisputesView({ onOpenPayslip }: DisputesViewProps) {
  const [status, setStatus] = useState('OPEN');
  const [page, setPage] = useState(1);
  const [resolving, setResolving] = useState<PayslipDispute | null>(null);

  const params: Record<string, string | number> = { page, limit: 20 };
  if (status !== 'all') params.status = status;

  const { data, isLoading, error } = useApiQuery<Paginated<PayslipDispute>>(
    queryKeys.payslips.disputes(params),
    '/payslips/disputes',
    {
      params,
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );

  const rows = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 0;

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <Select
          variant="underline"
          icon={ListFilter}
          items={STATUS_ITEMS}
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          className="w-44"
        />
      </div>

      {isLoading && <Skeleton rows={6} />}
      {error && (
        <div className="font-body text-sm text-danger">{error.message}</div>
      )}

      {!isLoading && !error && rows.length === 0 && (
        <EmptyState
          title={status === 'OPEN' ? 'Sem disputas abertas' : 'Sem disputas'}
          description="Nenhuma disputa corresponde a este filtro."
        />
      )}

      {!isLoading && rows.length > 0 && (
        <div className="space-y-3">
          {rows.map((d) => (
            <PayslipDisputeCard
              key={d.id}
              dispute={d}
              onResolve={
                d.status === 'OPEN' ? () => setResolving(d) : undefined
              }
              leading={
                <>
                  <DisputeItem icon={UserRound} label="Colaborador">
                    {d.user?.fullName ?? `#${d.userId}`}
                  </DisputeItem>
                  <DisputeItem icon={FileText} label="Recibo">
                    <button
                      type="button"
                      className="text-left underline-offset-2 hover:underline"
                      onClick={() => d.payslip && onOpenPayslip(d.payslip.id)}
                    >
                      {d.payslip?.receiptCode ?? `#${d.payslipId}`}
                      {d.payslip ? ` · ${fmtPeriod(d.payslip.period)}` : ''}
                    </button>
                  </DisputeItem>
                </>
              }
            />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {resolving && (
        <ResolveDisputeModal
          disputeId={resolving.id}
          payslipId={resolving.payslipId}
          onClose={() => setResolving(null)}
        />
      )}
    </div>
  );
}

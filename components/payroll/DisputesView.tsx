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
import { formatDate as fmtDate } from '@/lib/format';
import { fmtPeriod } from '@/components/payslips/format';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { ResolveDisputeModal } from './ResolveDisputeModal';
import { DISPUTE_STATUS_MAP, type Paginated, type PayslipDispute } from './types';

export interface DisputesViewProps {
  onOpenPayslip: (payslipId: number) => void;
}

const STATUS_ITEMS = [
  { value: 'OPEN', label: DISPUTE_STATUS_MAP.OPEN.label },
  { value: 'RESOLVED', label: DISPUTE_STATUS_MAP.RESOLVED.label },
  { value: 'all', label: 'Todas' },
];

const COLS =
  'grid grid-cols-[1.3fr_1.4fr_1.4fr_110px_130px_130px_110px] gap-3';

export function DisputesView({ onOpenPayslip }: DisputesViewProps) {
  const [status, setStatus] = useState('OPEN');
  const [page, setPage] = useState(1);
  const [resolving, setResolving] = useState<PayslipDispute | null>(null);

  const params: Record<string, string | number> = { page, limit: 20 };
  if (status !== 'all') params.status = status;

  const { data, isLoading, error } = useApiQuery<Paginated<PayslipDispute>>(
    queryKeys.payslips.disputes(params),
    '/payslips/disputes',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );

  const rows = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 0;

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <Select
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
        <div className="overflow-x-auto">
          <div className="min-w-[900px] overflow-hidden rounded-card border border-border bg-surface">
            <div
              className={`${COLS} border-b border-border px-4 py-2.5 font-body text-xs font-medium uppercase tracking-wide text-ink-faint`}
            >
              <div>Colaborador</div>
              <div>Recibo</div>
              <div>Motivo</div>
              <div>Estado</div>
              <div>Aberta em</div>
              <div>Resolvida em</div>
              <div>Acções</div>
            </div>
            {rows.map((d) => (
              <div
                key={d.id}
                className={`${COLS} items-center border-b border-border px-4 py-3.5 last:border-0 font-body text-sm`}
              >
                <div className="min-w-0 truncate text-ink">
                  {d.user?.fullName ?? `#${d.userId}`}
                </div>
                <button
                  type="button"
                  className="min-w-0 truncate text-left font-mono text-xs text-primary hover:underline"
                  onClick={() => d.payslip && onOpenPayslip(d.payslip.id)}
                >
                  {d.payslip?.receiptCode ?? `#${d.payslipId}`}
                  {d.payslip ? ` · ${fmtPeriod(d.payslip.period)}` : ''}
                </button>
                <div className="truncate text-ink-muted">{d.reason}</div>
                <div>
                  <StatusBadge
                    value={d.status}
                    map={DISPUTE_STATUS_MAP}
                    variant="plain"
                  />
                </div>
                <div className="text-ink-muted">{fmtDate(d.createdAt)}</div>
                <div className="text-ink-muted">
                  {d.resolvedAt ? fmtDate(d.resolvedAt) : '—'}
                </div>
                <div>
                  {d.status === 'OPEN' && (
                    <Button
                      size="sm"
                      intent="secondary"
                      onClick={() => setResolving(d)}
                    >
                      Resolver
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
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

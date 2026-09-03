'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatKz as fmtKz } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { PAYSLIP_STATUS_MAP } from '@/components/payslips/types';
import { RecalcPayslipModal } from './RecalcPayslipModal';
import type { Paginated, RunPayslip, RunStatus } from './types';

export interface RunPayslipsTableProps {
  runId: number;
  runStatus: RunStatus;
  highlightPayslipId?: number | null;
}

const COLS = 'grid grid-cols-[1.4fr_130px_130px_110px_120px_220px] gap-3';

export function RunPayslipsTable({
  runId,
  runStatus,
  highlightPayslipId,
}: RunPayslipsTableProps) {
  const confirm = useConfirm();
  const notify = useToast();
  const [page, setPage] = useState(1);
  const [recalcTarget, setRecalcTarget] = useState<RunPayslip | null>(null);

  const params = { page, limit: 50 };
  const { data, isLoading, error } = useApiQuery<Paginated<RunPayslip>>(
    queryKeys.payroll.runPayslips(runId, params),
    `/payroll/runs/${runId}/payslips`,
    {
      params,
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );

  const exclude = useApiMutation(
    (payslipId: number) =>
      apiClient.patch(`/payroll/runs/${runId}/payslips/${payslipId}/exclude`),
    {
      invalidateKeys: [
        queryKeys.payroll.runDetail(runId),
        queryKeys.payroll.runPayslipsAll(runId),
        queryKeys.payroll.runExceptions(runId),
      ],
      onSuccess: () =>
        notify({ title: 'Recibo excluído do run', intent: 'success' }),
    },
  );

  const handleExclude = async (p: RunPayslip) => {
    const ok = await confirm({
      title: `Excluir "${p.user.fullName}" deste run?`,
      message: 'O recibo volta a ficar solto, sem run associado.',
      confirmLabel: 'Excluir',
      destructive: true,
    });
    if (!ok) return;
    exclude.mutate(p.id);
  };

  const rows = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 0;
  const editable = runStatus === 'SIMULATED';

  return (
    <div>
      <h3 className="mb-3 font-body text-sm font-semibold uppercase tracking-wide text-ink-faint">
        Recibos do run
      </h3>

      {isLoading && <Skeleton rows={6} />}
      {error && (
        <div className="font-body text-sm text-danger">{error.message}</div>
      )}

      {!isLoading && !error && rows.length === 0 && (
        <EmptyState
          title="Sem recibos"
          description="Este run ainda não tem recibos gerados."
        />
      )}

      {!isLoading && rows.length > 0 && (
        <div className="overflow-x-auto">
          <div className="min-w-[900px] overflow-hidden rounded-card border border-border bg-surface">
            <div
              className={`${COLS} border-b border-border px-4 py-2.5 font-body text-xs font-medium uppercase tracking-wide text-ink-faint`}
            >
              <div>Colaborador</div>
              <div>Bruto</div>
              <div>Líquido</div>
              <div>Estado</div>
              <div>Exceções</div>
              {editable && <div>Acções</div>}
            </div>
            {rows.map((p) => (
              <div
                key={p.id}
                data-testid={`run-payslip-row-${p.id}`}
                className={`${COLS} items-center border-b border-border px-4 py-3 last:border-0 ${
                  highlightPayslipId === p.id ? 'bg-warning-subtle' : ''
                }`}
              >
                <div className="min-w-0">
                  <div className="truncate font-body text-sm font-medium text-ink">
                    {p.user.fullName}
                  </div>
                  <div className="truncate font-mono text-xs text-ink-faint">
                    {p.user.employeeNumber ?? '—'}
                  </div>
                </div>
                <div className="font-mono text-sm text-ink-muted">
                  {fmtKz(p.grossSalary)}
                </div>
                <div className="font-mono text-sm font-semibold text-ink">
                  {fmtKz(p.netSalary)}
                </div>
                <div>
                  <StatusBadge
                    value={p.status}
                    map={PAYSLIP_STATUS_MAP}
                    variant="plain"
                  />
                </div>
                <div>
                  {p.hasExceptions && (
                    <span className="flex items-center gap-1 text-warning-ink">
                      <AlertCircle size={14} strokeWidth={1.75} />
                    </span>
                  )}
                </div>
                {editable && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      intent="secondary"
                      onClick={() => setRecalcTarget(p)}
                    >
                      Recalcular
                    </Button>
                    <Button
                      size="sm"
                      intent="danger"
                      onClick={() => handleExclude(p)}
                    >
                      Excluir
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {recalcTarget && (
        <RecalcPayslipModal
          runId={runId}
          payslip={recalcTarget}
          onClose={() => setRecalcTarget(null)}
        />
      )}
    </div>
  );
}

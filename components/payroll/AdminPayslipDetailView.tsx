'use client';

import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { fmtPeriod } from '@/components/payslips/format';
import { PAYSLIP_STATUS_MAP } from '@/components/payslips/types';
import { PayslipAmountBreakdown } from '@/components/payslips/PayslipAmountBreakdown';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { AccessLogsPanel } from './AccessLogsPanel';
import { EditPayslipModal } from './EditPayslipModal';
import { ResolveDisputeModal } from './ResolveDisputeModal';
import { DISPUTE_STATUS_MAP, type AdminPayslip, type PayslipDispute } from './types';

export interface AdminPayslipDetailViewProps {
  payslipId: number;
  onBack: () => void;
}

const LOCKED_NOTE: Record<string, string> = {
  ISSUED: 'Recibo emitido — já não é editável.',
  ACKNOWLEDGED: 'Recibo confirmado pelo colaborador — já não é editável.',
  DISPUTED: 'Recibo em disputa — já não é editável.',
};

export function AdminPayslipDetailView({ payslipId, onBack }: AdminPayslipDetailViewProps) {
  const confirm = useConfirm();
  const notify = useToast();
  const [editing, setEditing] = useState(false);
  const [resolving, setResolving] = useState<PayslipDispute | null>(null);

  const { data, isLoading, error } = useApiQuery<AdminPayslip>(
    queryKeys.payslips.adminDetail(payslipId),
    `/payslips/${payslipId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const issue = useApiMutation(
    () => apiClient.patch(`/payslips/${payslipId}/issue`),
    {
      invalidateKeys: [
        queryKeys.payslips.adminDetail(payslipId),
        [...queryKeys.payslips.all, 'admin-list'],
        [...queryKeys.payslips.all, 'dashboard'],
      ],
      onSuccess: () => notify({ title: 'Recibo emitido', intent: 'success' }),
      onError: (e: Error) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const handleIssue = async () => {
    const ok = await confirm({
      title: 'Emitir recibo?',
      message: 'O colaborador é notificado e passa a poder ver o recibo.',
      confirmLabel: 'Emitir',
    });
    if (ok) issue.mutate(undefined);
  };

  if (isLoading) return <Skeleton rows={8} />;
  if (error) return <div className="font-body text-sm text-danger">{error.message}</div>;
  if (!data) return null;

  const editable = data.status === 'DRAFT' && data.run?.status !== 'PUBLISHED';

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1 font-body text-sm text-ink-muted hover:text-ink"
      >
        <ChevronLeft size={16} strokeWidth={1.75} />
        Voltar
      </button>

      <div className="mb-5 flex items-center gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">
            {data.user?.fullName ?? '—'}
          </h2>
          <p className="font-body text-sm text-ink-faint">
            {fmtPeriod(data.period)} · <span className="font-mono">{data.receiptCode ?? data.id}</span>
          </p>
        </div>
        <StatusBadge value={data.status} map={PAYSLIP_STATUS_MAP} variant="dot" />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {editable ? (
          <>
            <Button size="sm" intent="secondary" onClick={() => setEditing(true)}>Editar</Button>
            <Button size="sm" onClick={handleIssue} disabled={issue.isPending}>Emitir</Button>
          </>
        ) : (
          <p className="font-body text-sm text-ink-faint">
            {data.run?.status === 'PUBLISHED'
              ? 'Recibo pertence a um run publicado — já não é editável.'
              : (LOCKED_NOTE[data.status] ?? '')}
          </p>
        )}
      </div>

      <div className="mb-8 rounded-card border border-border bg-surface p-6">
        <PayslipAmountBreakdown payslip={data} />
      </div>

      {data.disputes.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-3 font-body text-sm font-semibold uppercase tracking-wide text-ink-faint">
            Disputas
          </h3>
          <div className="space-y-3">
            {data.disputes.map((d) => (
              <div key={d.id} className="rounded-card border border-border bg-surface p-4">
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm font-medium text-ink">{d.reason}</span>
                  <StatusBadge value={d.status} map={DISPUTE_STATUS_MAP} variant="plain" />
                </div>
                {d.details && <p className="mt-1 font-body text-sm text-ink-muted">{d.details}</p>}
                <p className="mt-1 font-body text-xs text-ink-faint">Aberta em {fmtDate(d.createdAt)}</p>
                {d.status === 'RESOLVED' && (
                  <p className="mt-1 font-body text-xs text-success-ink">
                    Resolvida em {fmtDate(d.resolvedAt)} — {d.resolution}
                  </p>
                )}
                {d.status === 'OPEN' && (
                  <Button size="sm" intent="secondary" className="mt-3" onClick={() => setResolving(d)}>
                    Resolver
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-8">
        <AccessLogsPanel payslipId={payslipId} />
      </div>

      {editing && <EditPayslipModal payslip={data} onClose={() => setEditing(false)} />}
      {resolving && (
        <ResolveDisputeModal
          disputeId={resolving.id}
          payslipId={payslipId}
          onClose={() => setResolving(null)}
        />
      )}
    </div>
  );
}

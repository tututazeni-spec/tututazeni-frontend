'use client';

import { useState } from 'react';
import { ChevronLeft, Download } from 'lucide-react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient, API_URL } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
import { formatDate as fmtDate } from '@/lib/format';
import { fmtPeriod } from '@/components/payslips/format';
import { PAYSLIP_STATUS_MAP } from '@/components/payslips/types';
import { PayslipAmountBreakdown } from '@/components/payslips/PayslipAmountBreakdown';
import { Button, buttonVariants } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { AccessLogsPanel } from './AccessLogsPanel';
import { PayslipDisputeCard } from './PayslipDisputeCard';
import { EditPayslipModal } from './EditPayslipModal';
import { ResolveDisputeModal } from './ResolveDisputeModal';
import {
  DISPUTE_STATUS_MAP,
  type AdminPayslip,
  type PayslipDispute,
} from './types';

export interface AdminPayslipDetailViewProps {
  payslipId: number;
  onBack: () => void;
}

// Hover: fundo preto com letra branca (Descarregar PDF, Editar).
const BTN_HOVER =
  'hover:!border-black hover:!bg-black hover:!text-white focus-visible:!bg-black focus-visible:!text-white';

const LOCKED_NOTE: Record<string, string> = {
  ISSUED: 'Recibo emitido — já não é editável.',
  ACKNOWLEDGED: 'Recibo confirmado pelo colaborador — já não é editável.',
  DISPUTED: 'Recibo em disputa — já não é editável.',
};

export function AdminPayslipDetailView({
  payslipId,
  onBack,
}: AdminPayslipDetailViewProps) {
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
      meta: { silent: true },
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
  if (error)
    return <div className="font-body text-sm text-danger">{error.message}</div>;
  if (!data) return null;

  const editable = data.status === 'DRAFT' && data.run?.status !== 'PUBLISHED';

  const isDisputed = data.status === 'DISPUTED';
  const statusBadge = (
    <StatusBadge
      value={data.status}
      map={PAYSLIP_STATUS_MAP}
      variant="plain"
      className={cn(
        '!px-3 !py-0.5 !rounded-full border-[1.5px] font-body !text-xs !font-semibold',
        data.status === 'DRAFT' || isDisputed
          ? '!border-[#F59E0B] !bg-[#F59E0B] !text-white'
          : data.status === 'ISSUED'
            ? '!border-[#218653] !bg-[#218653] !text-white'
            : '!border-[#0F1F3D]/30 !bg-transparent !text-[#0F1F3D]',
      )}
    />
  );
  const rightBadge = <div className="ml-auto">{statusBadge}</div>;

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1 font-body text-sm text-ink-muted"
      >
        <ChevronLeft size={16} strokeWidth={1.75} />
        Voltar
      </button>

      <div className="mb-5 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold text-ink">
            {data.user?.fullName ?? '—'}
          </h2>
          <p className="font-body text-sm text-black">
            {fmtPeriod(data.period)}
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-2">
        <a
          href={`${API_URL}/payslips/${payslipId}/pdf`}
          target="_blank"
          rel="noreferrer"
          className={cn(
            buttonVariants({ intent: 'secondary', size: 'sm' }),
            BTN_HOVER,
          )}
        >
          <Download size={15} strokeWidth={1.75} />
          Descarregar PDF
        </a>
        {editable && (
          <Button
            size="sm"
            intent="secondary"
            className={BTN_HOVER}
            onClick={() => setEditing(true)}
          >
            Editar
          </Button>
        )}

        {editable && (
          <Button size="sm" onClick={handleIssue} disabled={issue.isPending}>
            Emitir
          </Button>
        )}

        {!editable && (
          <p className="font-body text-sm text-ink-faint">
            {data.run?.status === 'PUBLISHED'
              ? 'Recibo pertence a um run publicado — já não é editável.'
              : (LOCKED_NOTE[data.status] ?? '')}
          </p>
        )}
        {rightBadge}
      </div>

      <div className="mb-8">
        <PayslipAmountBreakdown payslip={data} />
      </div>

      {data.disputes.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-3 font-body text-sm font-semibold uppercase tracking-wide text-ink-label">
            Disputas
          </h3>
          <div className="space-y-3">
            {data.disputes.map((d) => (
              <PayslipDisputeCard
                key={d.id}
                dispute={d}
                onResolve={
                  d.status === 'OPEN' ? () => setResolving(d) : undefined
                }
              />
            ))}
          </div>
        </div>
      )}

      <div className="mb-8">
        <AccessLogsPanel payslipId={payslipId} />
      </div>

      {editing && (
        <EditPayslipModal payslip={data} onClose={() => setEditing(false)} />
      )}
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

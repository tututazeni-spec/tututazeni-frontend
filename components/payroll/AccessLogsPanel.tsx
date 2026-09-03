'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { Skeleton } from '@/components/ui/Skeleton';
import type { PayslipAccessLog } from './types';

const ACTION_LABEL: Record<PayslipAccessLog['action'], string> = {
  VIEW: 'Visualização',
  ADMIN_VIEW: 'Visualização (admin)',
  DOWNLOAD: 'Descarga',
};

export interface AccessLogsPanelProps {
  payslipId: number;
}

export function AccessLogsPanel({ payslipId }: AccessLogsPanelProps) {
  const { data, isLoading, error } = useApiQuery<PayslipAccessLog[]>(
    queryKeys.payslips.accessLogs(payslipId),
    `/payslips/${payslipId}/access-logs`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  return (
    <div>
      <h3 className="mb-3 font-body text-sm font-semibold uppercase tracking-wide text-ink-faint">
        Últimos 50 acessos
      </h3>
      {isLoading && <Skeleton rows={3} />}
      {error && <div className="font-body text-sm text-danger">{error.message}</div>}
      {!isLoading && !error && (data?.length ?? 0) === 0 && (
        <p className="font-body text-sm text-ink-faint">Sem acessos registados.</p>
      )}
      {!isLoading && !error && (data?.length ?? 0) > 0 && (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <div className="grid grid-cols-[160px_1fr_140px_180px] gap-3 border-b border-border px-4 py-2.5 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            <div>Acção</div><div>Quem</div><div>IP</div><div>Quando</div>
          </div>
          {data!.map((log) => (
            <div key={log.id} className="grid grid-cols-[160px_1fr_140px_180px] gap-3 border-b border-border px-4 py-2.5 last:border-0 font-body text-sm">
              <div className="text-ink-muted">{ACTION_LABEL[log.action]}</div>
              <div className="text-ink">{log.user?.fullName ?? `#${log.userId}`}</div>
              <div className="font-mono text-xs text-ink-faint">{log.ipAddress ?? '—'}</div>
              <div className="text-ink-muted">{fmtDate(log.accessedAt)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

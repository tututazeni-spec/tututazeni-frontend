'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EXCEPTION_SEVERITY_MAP, EXCEPTION_CODE_LABEL, type RunException } from './types';

export interface ExceptionsPanelProps {
  runId: number;
  onSelectException?: (payslipId: number) => void;
}

function Group({
  title,
  items,
  onSelectException,
}: {
  title: string;
  items: RunException[];
  onSelectException?: (payslipId: number) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-4">
      <h4 className="mb-2 font-body text-sm font-semibold text-ink">
        {title} ({items.length})
      </h4>
      <div className="overflow-hidden rounded-card border border-border bg-surface">
        {items.map((e, i) => (
          <button
            key={`${e.payslipId}-${e.code}-${i}`}
            type="button"
            onClick={() => onSelectException?.(e.payslipId)}
            className="flex w-full items-center gap-3 border-b border-border px-4 py-2.5 text-left last:border-0 hover:bg-surface-sunken"
          >
            <StatusBadge value={e.severity} map={EXCEPTION_SEVERITY_MAP} variant="pill" />
            <span className="font-body text-sm font-medium text-ink">{e.fullName}</span>
            <span className="font-body text-xs text-ink-faint">
              {EXCEPTION_CODE_LABEL[e.code] ?? e.code}
            </span>
            <span className="ml-auto font-body text-sm text-ink-muted">{e.message}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ExceptionsPanel({ runId, onSelectException }: ExceptionsPanelProps) {
  const { data, isLoading } = useApiQuery<RunException[]>(
    queryKeys.payroll.runExceptions(runId),
    `/payroll/runs/${runId}/exceptions`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const exceptions = data ?? [];
  const errors = exceptions.filter((e) => e.severity === 'ERROR');
  const warnings = exceptions.filter((e) => e.severity === 'WARNING');

  return (
    <div>
      <h3 className="mb-3 font-body text-sm font-semibold uppercase tracking-wide text-ink-faint">
        Exceções
      </h3>
      {!isLoading && exceptions.length === 0 && (
        <EmptyState title="Sem exceções" description="Nenhuma exceção detectada neste run." />
      )}
      <Group title="Erros" items={errors} onSelectException={onSelectException} />
      <Group title="Avisos" items={warnings} onSelectException={onSelectException} />
    </div>
  );
}

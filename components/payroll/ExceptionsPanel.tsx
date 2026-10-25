'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  EXCEPTION_SEVERITY_MAP,
  EXCEPTION_CODE_LABEL,
  type RunException,
} from './types';

export interface ExceptionsPanelProps {
  runId: number;
  onSelectException?: (payslipId: number) => void;
}

interface GroupProps {
  title: string;
  items: RunException[];
  onSelectException?: (payslipId: number) => void;
}

function Group({ title, items, onSelectException }: GroupProps) {
  if (items.length === 0) return null;
  return (
    <div className="mb-4">
      <h4 className="mb-2 font-body text-sm font-semibold text-ink">
        {title} ({items.length})
      </h4>
      <div className="overflow-hidden rounded-[14px] border border-brand-edge bg-brand-deep shadow-[0_4px_16px_rgba(7,29,59,0.35)]">
        {items.map((e, i) => (
          <button
            key={`${e.payslipId}-${e.code}-${i}`}
            type="button"
            onClick={() => onSelectException?.(e.payslipId)}
            className="flex w-full items-center gap-3 border-b border-[#6F8FB8]/20 px-3 py-2 text-left text-white transition-colors duration-150 last:border-0 hover:bg-white/5"
          >
            <StatusBadge
              value={e.severity}
              map={EXCEPTION_SEVERITY_MAP}
              variant="pill"
            />
            <Avatar
              name={e.fullName}
              url={e.avatarUrl ?? undefined}
              size="md"
              className="shrink-0"
            />
            <span className="font-body text-sm font-medium text-white">
              {e.fullName}
            </span>
            <span className="font-body text-xs text-on-brand-faint">
              {EXCEPTION_CODE_LABEL[e.code] ?? e.code}
            </span>
            <span className="ml-auto text-right font-body text-sm text-on-brand">
              {e.message}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ExceptionsPanel({
  runId,
  onSelectException,
}: ExceptionsPanelProps) {
  const { data, isLoading, error } = useApiQuery<RunException[]>(
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
      {isLoading && <Skeleton rows={4} />}
      {error && (
        <div className="font-body text-sm text-danger">{error.message}</div>
      )}
      {!isLoading && !error && exceptions.length === 0 && (
        <EmptyState
          title="Sem exceções"
          description="Nenhuma exceção detectada neste run."
        />
      )}
      <Group
        title="Erros"
        items={errors}
        onSelectException={onSelectException}
      />
      <Group
        title="Avisos"
        items={warnings}
        onSelectException={onSelectException}
      />
    </div>
  );
}

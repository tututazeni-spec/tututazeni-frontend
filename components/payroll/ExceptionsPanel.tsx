'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { resolveBadge } from '@/lib/statusBadge';
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

const COLS =
  'grid grid-cols-[minmax(240px,2fr)_minmax(160px,1fr)_minmax(240px,2fr)_110px] gap-2';

function Group({ title, items, onSelectException }: GroupProps) {
  if (items.length === 0) return null;
  return (
    <div className="mb-4">
      <h4 className="mb-2 font-body text-sm font-semibold text-ink">
        {title} ({items.length})
      </h4>
      <div className="overflow-x-auto rounded-[18px] border border-brand-line bg-surface shadow-[0_4px_12px_rgba(21,47,89,0.10)]">
        <div className="min-w-[820px]">
          <div
            className={`${COLS} bg-brand-dark px-4 py-3 font-body text-xs font-bold uppercase leading-tight tracking-wide text-white`}
          >
            <div>Colaborador</div>
            <div>Tipo</div>
            <div>Mensagem</div>
            <div>Gravidade</div>
          </div>
          {items.map((e, i) => (
            <button
              key={`${e.payslipId}-${e.code}-${i}`}
              type="button"
              onClick={() => onSelectException?.(e.payslipId)}
              className={`${COLS} w-full cursor-pointer items-center border-b border-brand-line px-4 py-3 text-left text-ink last:border-0`}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <Avatar
                  name={e.fullName}
                  url={e.avatarUrl ?? undefined}
                  size="lg"
                  className="shrink-0"
                />
                <span className="break-words font-body text-sm font-medium leading-tight text-ink">
                  {e.fullName}
                </span>
              </div>
              <div className="font-body text-sm text-ink">
                {EXCEPTION_CODE_LABEL[e.code] ?? e.code}
              </div>
              <div className="font-body text-sm text-ink">{e.message}</div>
              <div className="font-body text-sm text-ink">
                {resolveBadge(EXCEPTION_SEVERITY_MAP, e.severity).label}
              </div>
            </button>
          ))}
        </div>
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

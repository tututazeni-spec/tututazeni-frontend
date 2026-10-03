// components/processes/ReportRecordsPanel.tsx
// Registos que originaram um indicador (docs/Modulo_Processes.md §12: «consultar
// os registos que originaram os indicadores»). GET /processes/reports/records.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate } from '@/lib/format';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { Skeleton } from './Skeleton';
import type { PaginatedReportRecords, ReportRecordIndicator } from './types';

export interface ReportRecordsPanelProps {
  indicator: ReportRecordIndicator;
  title: string;
  definition?: string;
  /** Filtros do relatório (mesmos parâmetros do indicador). */
  filters: Record<string, string>;
  assigneeId?: number;
  onClose: () => void;
  onOpenInstance: (instanceId: number) => void;
}

const KIND_LABEL = { INSTANCE: 'Processo', TASK: 'Tarefa', APPROVAL: 'Aprovação', EXECUTION: 'Execução' } as const;

export function ReportRecordsPanel({
  indicator,
  title,
  definition,
  filters,
  assigneeId,
  onClose,
  onOpenInstance,
}: ReportRecordsPanelProps) {
  const [page, setPage] = useState(1);
  const params = {
    ...filters,
    indicator,
    page: String(page),
    limit: '15',
    ...(assigneeId ? { assigneeId: String(assigneeId) } : {}),
  };
  const { data, isLoading, error } = useApiQuery<PaginatedReportRecords>(
    queryKeys.processes.reportRecords(params),
    '/processes/reports/records',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title={title}
        description={definition}
        className="max-h-[90vh] max-w-4xl overflow-y-auto"
      >
        <div className="mt-4 overflow-x-auto rounded-card border border-border">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[110px_1.8fr_110px_1.2fr_90px_90px] gap-3 border-b border-border bg-surface-sunken px-3 py-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              <div>Tipo</div>
              <div>Registo</div>
              <div>Estado</div>
              <div>Responsável</div>
              <div>Início</div>
              <div>Prazo</div>
            </div>
            {isLoading && (
              <div className="p-3">
                <Skeleton rows={3} />
              </div>
            )}
            {error && <div className="px-3 py-6 text-center font-body text-sm text-danger">{error.message}</div>}
            {data?.data.length === 0 && (
              <EmptyState title="Sem registos" description="Nenhum registo originou este indicador no período." />
            )}
            {data?.data.map((r) => {
              const clickable = r.instanceId != null;
              return (
                <div
                  key={`${r.kind}-${r.id}`}
                  className={`grid grid-cols-[110px_1.8fr_110px_1.2fr_90px_90px] items-center gap-3 border-b border-border px-3 py-2.5 last:border-0 ${clickable ? 'cursor-pointer hover:bg-surface-sunken' : ''}`}
                  onClick={() => clickable && onOpenInstance(r.instanceId as number)}
                >
                  <div className="font-body text-xs text-ink-faint">{KIND_LABEL[r.kind]}</div>
                  <div className="min-w-0">
                    <div className="truncate font-body text-sm text-ink">{r.title}</div>
                    <div className="truncate font-mono text-xs text-ink-faint">{r.code}</div>
                    {r.detail && <div className="truncate font-body text-xs text-ink-muted">{r.detail}</div>}
                  </div>
                  <div className="font-body text-xs text-ink-muted">{r.status}</div>
                  <div className="font-body text-xs text-ink-muted">{r.owner ?? '—'}</div>
                  <div className="font-body text-xs text-ink-muted">{formatDate(r.startedAt)}</div>
                  <div className="font-body text-xs text-ink-muted">{formatDate(r.dueAt)}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between font-body text-xs text-ink-faint">
          <span>{data?.total ?? 0} registos</span>
        </div>
        {data && <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />}
      </ModalContent>
    </Modal>
  );
}

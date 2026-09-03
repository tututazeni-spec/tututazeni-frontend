// components/payroll/RunListView.tsx
// Lista paginada de PayrollRun (GET /payroll/runs). Mesmo molde de
// components/payslips/CompensationsView.tsx: filtros na toolbar, tabela,
// paginação, "+ Novo run" abre CreateRunModal; onCreated navega logo para
// o detalhe do run recém-criado.
'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatKz as fmtKz, formatDate as fmtDate } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CreateRunModal } from './CreateRunModal';
import { RUN_STATUS_MAP, type Paginated, type PayrollRun } from './types';

export interface RunListViewProps {
  onSelect: (runId: number) => void;
}

const STATUS_ITEMS = [
  { value: 'all', label: 'Todos os estados' },
  { value: 'DRAFT', label: RUN_STATUS_MAP.DRAFT.label },
  { value: 'PROCESSING', label: RUN_STATUS_MAP.PROCESSING.label },
  { value: 'SIMULATED', label: RUN_STATUS_MAP.SIMULATED.label },
  { value: 'PENDING_APPROVAL', label: RUN_STATUS_MAP.PENDING_APPROVAL.label },
  { value: 'APPROVED', label: RUN_STATUS_MAP.APPROVED.label },
  { value: 'PUBLISHED', label: RUN_STATUS_MAP.PUBLISHED.label },
  { value: 'CANCELLED', label: RUN_STATUS_MAP.CANCELLED.label },
];

const COLS = 'grid grid-cols-[110px_1fr_70px_120px_1fr_130px_110px_110px] gap-3';

export function RunListView({ onSelect }: RunListViewProps) {
  const [status, setStatus] = useState('all');
  const [period, setPeriod] = useState('');
  const [payGroup, setPayGroup] = useState('');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);

  const params: Record<string, string | number> = { page, limit: 20 };
  if (status !== 'all') params.status = status;
  if (period.trim()) params.period = period.trim();
  if (payGroup.trim()) params.payGroup = payGroup.trim();

  const { data, isLoading, error } = useApiQuery<Paginated<PayrollRun>>(
    queryKeys.payroll.runList(params),
    '/payroll/runs',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );

  const rows = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 0;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Select
          items={STATUS_ITEMS}
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          className="w-56"
        />
        <Input
          value={period}
          onChange={(e) => {
            setPeriod(e.target.value);
            setPage(1);
          }}
          placeholder="Período (AAAA-MM)"
          className="w-40"
        />
        <Input
          value={payGroup}
          onChange={(e) => {
            setPayGroup(e.target.value);
            setPage(1);
          }}
          placeholder="Grupo"
          className="w-40"
        />
        <Button className="ml-auto" onClick={() => setCreating(true)}>
          + Novo run
        </Button>
      </div>

      {isLoading && <Skeleton rows={8} />}
      {error && <div className="font-body text-sm text-danger">{error.message}</div>}

      {!isLoading && !error && rows.length === 0 && (
        <EmptyState
          title="Nenhum run encontrado"
          description='Limpa os filtros ou cria um novo run com "+ Novo run".'
        />
      )}

      {!isLoading && rows.length > 0 && (
        <div className="overflow-x-auto">
          <div className="min-w-[900px] overflow-hidden rounded-card border border-border bg-surface">
            <div
              className={`${COLS} border-b border-border px-4 py-2.5 font-body text-xs font-medium uppercase tracking-wide text-ink-faint`}
            >
              <div>Período</div>
              <div>Grupo</div>
              <div>País</div>
              <div>Estado</div>
              <div>Colaboradores</div>
              <div>Total líquido</div>
              <div>Exceções</div>
              <div>Criado em</div>
            </div>
            {rows.map((r) => (
              <div
                key={r.id}
                className={`${COLS} cursor-pointer items-center border-b border-border px-4 py-3.5 last:border-0 hover:bg-surface-sunken`}
                onClick={() => onSelect(r.id)}
              >
                <div className="font-mono text-sm font-medium text-ink">{r.period}</div>
                <div className="truncate font-body text-sm text-ink-muted">
                  {r.payGroup ?? '—'}
                </div>
                <div className="font-body text-sm text-ink-muted">{r.countryCode}</div>
                <div>
                  <StatusBadge value={r.status} map={RUN_STATUS_MAP} variant="dot" />
                </div>
                <div className="font-mono text-sm text-ink">{r.employeeCount ?? '—'}</div>
                <div className="font-mono text-sm font-semibold text-ink">
                  {fmtKz(r.totalNet)}
                </div>
                <div className="font-body text-sm text-ink-muted">
                  {r.exceptionsCount ?? 0}
                  {(r.errorCount ?? 0) > 0 && (
                    <span className="ml-1 text-danger">({r.errorCount} erro)</span>
                  )}
                </div>
                <div className="font-body text-sm text-ink-muted">{fmtDate(r.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {creating && (
        <CreateRunModal
          onClose={() => setCreating(false)}
          onCreated={(runId) => {
            setCreating(false);
            onSelect(runId);
          }}
        />
      )}
    </div>
  );
}

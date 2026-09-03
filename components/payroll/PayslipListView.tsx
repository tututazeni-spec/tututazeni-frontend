// components/payroll/PayslipListView.tsx
// Tabela paginada de TODOS os recibos (GET /payslips, vista admin RH).
// Mesmo molde de RunListView.tsx: filtros na toolbar (estado/período/ano),
// tabela, paginação. Acção de linha "Emitir" só em rascunhos (confirm →
// PATCH /payslips/:id/issue). "+ Novo recibo" apenas chama onCreate — o
// CreatePayslipModal é propriedade de page.tsx (Task 14).
'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient, API_URL } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
import { formatKz as fmtKz, formatDate as fmtDate } from '@/lib/format';
import { fmtPeriod } from '@/components/payslips/format';
import { PAYSLIP_STATUS_MAP, type PayslipStatus } from '@/components/payslips/types';
import { Button, IconButton, buttonVariants } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Download, Eye } from 'lucide-react';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import type { Paginated } from './types';

export interface AdminPayslipRow {
  id: number;
  receiptCode: string | null;
  period: string;
  paymentDate: string | null;
  grossSalary: number;
  netSalary: number;
  status: PayslipStatus;
  user: { id: number; fullName: string; employeeNumber: string | null } | null;
}

export interface PayslipListViewProps {
  onSelect: (id: number) => void;
  onCreate: () => void;
}

const STATUS_ITEMS = [
  { value: 'all', label: 'Todos os estados' },
  { value: 'DRAFT', label: PAYSLIP_STATUS_MAP.DRAFT.label },
  { value: 'ISSUED', label: PAYSLIP_STATUS_MAP.ISSUED.label },
  { value: 'ACKNOWLEDGED', label: PAYSLIP_STATUS_MAP.ACKNOWLEDGED.label },
  { value: 'DISPUTED', label: PAYSLIP_STATUS_MAP.DISPUTED.label },
];

const COLS =
  'grid grid-cols-[1.4fr_110px_120px_130px_130px_120px_120px] gap-3';

export function PayslipListView({ onSelect, onCreate }: PayslipListViewProps) {
  const confirm = useConfirm();
  const notify = useToast();
  const [status, setStatus] = useState('all');
  const [period, setPeriod] = useState('');
  const [year, setYear] = useState('');
  const [page, setPage] = useState(1);

  const params: Record<string, string | number> = { page, limit: 20 };
  if (status !== 'all') params.status = status;
  if (period.trim()) params.period = period.trim();
  if (year.trim() && !period.trim()) params.year = year.trim();

  const { data, isLoading, error } = useApiQuery<Paginated<AdminPayslipRow>>(
    queryKeys.payslips.adminList(params),
    '/payslips',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );

  const issue = useApiMutation(
    (id: number) => apiClient.patch(`/payslips/${id}/issue`),
    {
      invalidateKeys: [
        [...queryKeys.payslips.all, 'admin-list'],
        [...queryKeys.payslips.all, 'admin-detail'],
        [...queryKeys.payslips.all, 'dashboard'],
      ],
      onSuccess: () => notify({ title: 'Recibo emitido', intent: 'success' }),
      onError: (e: Error) => notify({ title: e.message, intent: 'danger' }),
      meta: { silent: true },
    },
  );

  const handleIssue = async (r: AdminPayslipRow) => {
    const ok = await confirm({
      title: 'Emitir recibo?',
      message: 'O colaborador é notificado e passa a poder ver o recibo.',
      confirmLabel: 'Emitir',
    });
    if (ok) issue.mutate(r.id);
  };

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
          className="w-48"
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
          value={year}
          onChange={(e) => {
            setYear(e.target.value);
            setPage(1);
          }}
          placeholder="Ano (AAAA)"
          className="w-32"
        />
        <Button className="ml-auto" onClick={onCreate}>
          + Novo recibo
        </Button>
      </div>

      {isLoading && (
        <Skeleton
          rows={8}
          wrapperClassName="space-y-2 animate-pulse"
          itemClassName="h-12 rounded-card bg-surface-sunken"
        />
      )}
      {error && (
        <div className="font-body text-sm text-danger">{error.message}</div>
      )}

      {!isLoading && !error && rows.length === 0 && (
        <EmptyState
          title="Sem recibos"
          description="Nenhum recibo corresponde aos filtros."
        />
      )}

      {!isLoading && rows.length > 0 && (
        <div className="overflow-x-auto">
          <div className="min-w-[900px] overflow-hidden rounded-card border border-border bg-surface">
            <div
              className={`${COLS} border-b border-border px-4 py-2.5 font-body text-xs font-medium uppercase tracking-wide text-ink-faint`}
            >
              <div>Colaborador</div>
              <div>Período</div>
              <div>Pagamento</div>
              <div>Bruto</div>
              <div>Líquido</div>
              <div>Estado</div>
              <div>Acções</div>
            </div>
            {rows.map((r) => (
              <div
                key={r.id}
                className={`${COLS} cursor-pointer items-center border-b border-border px-4 py-3.5 last:border-0 hover:bg-surface-sunken`}
                onClick={() => onSelect(r.id)}
              >
                <div className="min-w-0">
                  <div className="truncate font-body text-sm font-medium text-ink">
                    {r.user?.fullName ?? '—'}
                  </div>
                  <div className="truncate font-mono text-xs text-ink-faint">
                    {r.user?.employeeNumber ?? '—'}
                  </div>
                </div>
                <div className="font-body text-sm text-ink-muted">
                  {fmtPeriod(r.period)}
                </div>
                <div className="font-body text-sm text-ink-muted">
                  {fmtDate(r.paymentDate)}
                </div>
                <div className="font-mono text-sm text-ink-muted">
                  {fmtKz(r.grossSalary)}
                </div>
                <div className="font-mono text-sm font-semibold text-ink">
                  {fmtKz(r.netSalary)}
                </div>
                <div>
                  <StatusBadge
                    value={r.status}
                    map={PAYSLIP_STATUS_MAP}
                    variant="dot"
                  />
                </div>
                <div
                  className="flex gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <IconButton
                    icon={Eye}
                    label="Ver detalhe"
                    intent="ghost"
                    size="sm"
                    onClick={() => onSelect(r.id)}
                  />
                  <a
                    href={`${API_URL}/payslips/${r.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Descarregar PDF"
                    title="Descarregar PDF"
                    className={cn(
                      buttonVariants({ intent: 'ghost', size: 'sm' }),
                      'aspect-square h-9 w-9 p-0',
                    )}
                  >
                    <Download size={16} strokeWidth={1.75} />
                  </a>
                  {r.status === 'DRAFT' && (
                    <Button
                      size="sm"
                      intent="secondary"
                      onClick={() => handleIssue(r)}
                    >
                      Emitir
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

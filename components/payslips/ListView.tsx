// components/payslips/ListView.tsx
// Vista "Os meus recibos": tabela paginada por ano. Extraído de
// app/(platform)/payslips/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { Download, Eye, Receipt } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { API_URL as API_BASE } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate, formatKz as fmtKz } from '@/lib/format';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button, IconButton } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { fmtPeriod } from './format';
import { PAYSLIP_STATUS_MAP } from './types';
import type { PaginatedPayslips } from './types';

interface ListViewProps {
  onSelect: (id: number) => void;
}

export function ListView({ onSelect }: ListViewProps) {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [page, setPage] = useState(1);
  const params = { year, page, limit: 12 };

  const {
    data,
    isLoading: loading,
    error: queryError,
  } = useApiQuery<PaginatedPayslips>(
    queryKeys.payslips.list(params),
    '/payslips/my',
    {
      params,
      staleTime: STALE_TIME.SEMI_STATIC,
      placeholderData: keepPreviousData,
    },
  );
  const error = queryError?.message ?? null;

  const years = Array.from({ length: 4 }, (_, i) =>
    (new Date().getFullYear() - i).toString(),
  );

  return (
    <div>
      {/* Filtros */}
      <div className="flex items-center gap-3 mb-5">
        <Select
          items={years.map((y) => ({ value: y, label: y }))}
          value={year}
          onValueChange={(y) => {
            setYear(y);
            setPage(1);
          }}
        />
        <span className="font-body text-sm text-ink-faint">
          {data?.total ?? 0} recibos
        </span>
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-card border border-border bg-surface">
        {/* Cabeçalho */}
        <div className="grid grid-cols-[1fr_120px_160px_130px_100px] gap-3 border-b border-border px-4 py-2.5 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
          <div>Período</div>
          <div>Pagamento</div>
          <div>Salário líquido</div>
          <div>Estado</div>
          <div>Acções</div>
        </div>

        {loading && (
          <div className="p-4">
            <Skeleton
              rows={5}
              wrapperClassName="space-y-2 animate-pulse"
              itemClassName="h-12 rounded-card bg-surface-sunken"
            />
          </div>
        )}

        {error && (
          <div className="px-4 py-8 text-center font-body text-sm text-danger">
            {error}
          </div>
        )}

        {!loading && !error && data?.data.length === 0 && (
          <EmptyState
            title="Sem recibos"
            description={`Não há recibos disponíveis para ${year}.`}
          />
        )}

        {!loading &&
          data?.data.map((p) => (
            <div
              key={p.id}
              className="grid cursor-pointer grid-cols-[1fr_120px_160px_130px_100px] items-center gap-3 border-b border-border px-4 py-3.5 last:border-0 hover:bg-surface-sunken"
              onClick={() => onSelect(p.id)}
            >
              <div>
                <div className="font-body text-sm font-medium text-ink">
                  {fmtPeriod(p.period)}
                </div>
                <div className="mt-0.5 font-mono text-xs text-ink-faint">
                  {p.receiptCode}
                </div>
              </div>
              <div className="font-body text-sm text-ink-muted">
                {fmtDate(p.paymentDate)}
              </div>
              <div className="font-mono text-sm font-semibold text-ink">
                {fmtKz(p.netSalary)}
              </div>
              <div>
                <StatusBadge
                  value={p.status}
                  map={PAYSLIP_STATUS_MAP}
                  variant="dot"
                />
              </div>
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <IconButton
                  icon={Eye}
                  label="Ver detalhe"
                  intent="ghost"
                  size="sm"
                  onClick={() => onSelect(p.id)}
                />
                <IconButton
                  icon={Download}
                  label="Descarregar PDF"
                  intent="ghost"
                  size="sm"
                  onClick={() =>
                    window.open(`${API_BASE}/payslips/my/${p.id}/pdf`, '_blank')
                  }
                />
              </div>
            </div>
          ))}
      </div>

      {/* Paginação */}
      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="font-body text-xs text-ink-faint">
            Página {data.page} de {data.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              intent="secondary"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Anterior
            </Button>
            <Button
              intent="secondary"
              size="sm"
              disabled={page === data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

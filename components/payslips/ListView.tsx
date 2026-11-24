// components/payslips/ListView.tsx
// Vista "Os meus recibos": tabela paginada por ano. Extraído de
// app/(platform)/payslips/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { Download, Eye, ListFilter } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { API_URL as API_BASE } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate, formatKz as fmtKz } from '@/lib/format';
import { Button, IconButton } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { fmtPeriod } from './format';
import { PAYSLIP_STATUS_SOLID_MAP } from './types';
import type { PaginatedPayslips } from './types';

interface ListViewProps {
  onSelect: (id: number) => void;
}

const EXPORT_MONTHS = [
  { value: 'ALL', label: 'Ano completo' },
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

export function ListView({ onSelect }: ListViewProps) {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [exportMonth, setExportMonth] = useState('ALL');
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
          {data?.meta.total ?? 0} recibos
        </span>
        <Select
          variant="underline"
          icon={ListFilter}
          items={EXPORT_MONTHS}
          value={exportMonth}
          onValueChange={setExportMonth}
          className="ml-auto"
        />
        <Button
          intent="secondary"
          size="sm"
          onClick={() => {
            const monthParam =
              exportMonth === 'ALL' ? '' : `&month=${exportMonth}`;
            window.open(
              `${API_BASE}/payslips/my/annual-summary/export?year=${year}${monthParam}&format=pdf`,
              '_blank',
            );
          }}
        >
          <Download size={14} strokeWidth={1.75} />
          {exportMonth === 'ALL' ? 'Exportar ano' : 'Exportar mês'}
        </Button>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-[18px] border border-brand-line bg-surface shadow-[0_4px_12px_rgba(21,47,89,0.10)]">
        <div className="min-w-[700px]">
          {/* Cabeçalho */}
          <div className="grid grid-cols-[1fr_120px_160px_130px_100px] gap-3 bg-brand-dark px-4 py-3 font-body text-xs font-bold uppercase leading-tight tracking-wide text-white">
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
                wrapperClassName="space-y-2"
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
            <div className="px-4 py-10 text-center">
              <div className="font-body text-sm font-semibold text-ink">
                Sem recibos
              </div>
              <div className="mt-1 font-body text-xs text-ink-muted">
                {`Não há recibos disponíveis para ${year}.`}
              </div>
            </div>
          )}

          {!loading &&
            data?.data.map((p) => (
              <div
                key={p.id}
                className="grid cursor-pointer grid-cols-[1fr_120px_160px_130px_100px] items-center gap-3 border-b border-brand-line px-4 py-3.5 text-ink last:border-0"
                onClick={() => onSelect(p.id)}
              >
                <div>
                  <div className="font-body text-sm font-semibold text-ink">
                    {fmtPeriod(p.period)}
                  </div>
                  <div className="mt-0.5 font-body text-xs text-ink-muted">
                    {p.receiptCode}
                  </div>
                </div>
                <div className="font-body text-sm text-ink">
                  {fmtDate(p.paymentDate)}
                </div>
                <div className="font-body text-sm font-semibold text-ink">
                  {fmtKz(p.netSalary)}
                </div>
                <div>
                  <StatusBadge
                    value={p.status}
                    map={PAYSLIP_STATUS_SOLID_MAP}
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
                    className="text-ink hover:bg-transparent"
                    onClick={() => onSelect(p.id)}
                  />
                  <IconButton
                    icon={Download}
                    label="Descarregar PDF"
                    intent="ghost"
                    size="sm"
                    className="text-ink hover:bg-transparent"
                    onClick={() =>
                      window.open(
                        `${API_BASE}/payslips/my/${p.id}/pdf`,
                        '_blank',
                      )
                    }
                  />
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Paginação */}
      {data && data.meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="font-body text-xs text-ink-faint">
            Página {data.meta.page} de {data.meta.totalPages}
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
              disabled={page === data.meta.totalPages}
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

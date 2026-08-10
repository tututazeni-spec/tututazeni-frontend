// components/payslips/ListView.tsx
// Vista "Os meus recibos": tabela paginada por ano. Extraído de
// app/(platform)/payslips/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { API_URL as API_BASE } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate, formatKz as fmtKz } from '@/lib/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SkeletonRow } from './atoms';
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
        <select
          value={year}
          onChange={(e) => {
            setYear(e.target.value);
            setPage(1);
          }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-400">
          {data?.total ?? 0} recibos
        </span>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Cabeçalho */}
        <div className="grid grid-cols-[1fr_120px_160px_130px_100px] gap-3 px-4 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
          <div>Período</div>
          <div>Pagamento</div>
          <div>Salário líquido</div>
          <div>Estado</div>
          <div>Acções</div>
        </div>

        {loading &&
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}

        {error && (
          <div className="px-4 py-8 text-center text-sm text-red-500">
            {error}
          </div>
        )}

        {!loading && !error && data?.data.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-gray-400">
            Sem recibos para {year}
          </div>
        )}

        {!loading &&
          data?.data.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-[1fr_120px_160px_130px_100px] gap-3 items-center px-4 py-3.5 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors last:border-0"
              onClick={() => onSelect(p.id)}
            >
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {fmtPeriod(p.period)}
                </div>
                <div className="text-xs text-gray-400 font-mono mt-0.5">
                  {p.receiptCode}
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {fmtDate(p.paymentDate)}
              </div>
              <div className="text-sm font-semibold font-mono text-gray-900">
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
                <button
                  onClick={() => onSelect(p.id)}
                  className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors text-sm"
                  title="Ver detalhe"
                >
                  &#128065;
                </button>
                <button
                  onClick={() =>
                    window.open(`${API_BASE}/payslips/my/${p.id}/pdf`, '_blank')
                  }
                  className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors text-sm"
                  title="Download PDF"
                >
                  &#8595;
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* Paginação */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-gray-400">
            Página {data.page} de {data.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              ← Anterior
            </button>
            <button
              disabled={page === data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Próxima →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

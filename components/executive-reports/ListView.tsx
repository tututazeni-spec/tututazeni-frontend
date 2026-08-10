// components/executive-reports/ListView.tsx
// Vista "Relatórios Executivos": stats + grelha filtrável de
// relatórios. Extraído de app/(platform)/executive-reports/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import { STATUS_CFG, TYPE_CFG } from './constants';
import { ReportCard } from './ReportCard';
import type { Report, ReportStats } from './types';

interface ListViewProps {
  onSelect: (id: number) => void;
  onGenerate: () => void;
}

export function ListView({ onSelect, onGenerate }: ListViewProps) {
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const params = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
  };
  const { data, isLoading: loading } = useApiQuery<{
    data: Report[];
    total: number;
  }>(queryKeys.executiveReports.list(params), '/executive-reports', {
    params,
    staleTime: STALE_TIME.SEMI_STATIC,
    placeholderData: keepPreviousData,
  });
  const { data: stats } = useApiQuery<ReportStats>(
    queryKeys.executiveReports.stats(),
    '/executive-reports/stats',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  return (
    <div>
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total },
            {
              label: 'Publicados',
              value: stats.byStatus['PUBLISHED'] ?? 0,
              color: 'text-emerald-600',
            },
            {
              label: 'Em revisão',
              value: stats.byStatus['IN_REVIEW'] ?? 0,
              color: 'text-amber-600',
            },
            { label: 'Rascunhos', value: stats.byStatus['DRAFT'] ?? 0 },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs text-gray-400 mb-1">{label}</div>
              <div
                className={`text-2xl font-bold font-mono ${color ?? 'text-gray-900'}`}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex items-center gap-3 mb-5">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os tipos</option>
          {Object.entries(TYPE_CFG).map(([k, v]) => (
            <option key={k} value={k}>
              {v.icon} {v.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os estados</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-400 ml-auto">
          {data?.total ?? 0} relatórios
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <Skeleton rows={3} />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {data?.data.map((r) => (
            <ReportCard key={r.id} report={r} onClick={() => onSelect(r.id)} />
          ))}
          {data?.data.length === 0 && (
            <div className="col-span-2 py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              <div className="text-4xl mb-3">📊</div>
              Sem relatórios criados ainda
              <div className="mt-3">
                <button
                  onClick={onGenerate}
                  className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800"
                >
                  Gerar primeiro relatório
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

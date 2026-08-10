// components/audit/LogsView.tsx
// Vista "Logs": tabela paginada e filtrável de eventos de auditoria.
// Extraído de app/(platform)/audit/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import { ACTION_ICONS } from './constants';
import { LogRow } from './LogRow';
import type { AuditLog } from './types';

export function LogsView() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    action: '',
    severity: '',
    status: '',
    entity: '',
    criticalOnly: false,
  });
  const params = {
    page,
    limit: 50,
    action: filters.action,
    severity: filters.severity,
    status: filters.status,
    entity: filters.entity,
    criticalOnly: filters.criticalOnly ? 'true' : undefined,
  };

  const { data, isLoading: loading } = useApiQuery<{
    data: AuditLog[];
    total: number;
    totalPages: number;
  }>(queryKeys.audit.list(params), '/audit', {
    params,
    staleTime: STALE_TIME.DYNAMIC,
    placeholderData: keepPreviousData,
  });

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="Entidade (ex: User, PDI)"
          value={filters.entity}
          onChange={(e) =>
            setFilters((f) => ({ ...f, entity: e.target.value }))
          }
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
        />
        <select
          value={filters.action}
          onChange={(e) =>
            setFilters((f) => ({ ...f, action: e.target.value }))
          }
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas as acções</option>
          {[
            'CREATE',
            'UPDATE',
            'DELETE',
            'LOGIN',
            'FAILED',
            'EXPORT',
            'APPROVE',
            'REJECT',
            'DENIED',
          ].map((a) => (
            <option key={a} value={a}>
              {ACTION_ICONS[a]} {a}
            </option>
          ))}
        </select>
        <select
          value={filters.severity}
          onChange={(e) =>
            setFilters((f) => ({ ...f, severity: e.target.value }))
          }
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Severidade</option>
          {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((f) => ({ ...f, status: e.target.value }))
          }
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Estado</option>
          {['SUCCESS', 'FAILED', 'DENIED'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.criticalOnly}
            onChange={(e) =>
              setFilters((f) => ({ ...f, criticalOnly: e.target.checked }))
            }
            className="rounded"
          />
          Só críticos
        </label>
        <span className="ml-auto text-xs text-gray-400 self-center">
          {data?.total ?? 0} registos
        </span>
      </div>

      {loading ? (
        <Skeleton rows={10} />
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {[
                    '#',
                    'Timestamp',
                    'Utilizador',
                    'Acção',
                    'Entidade',
                    'Estado',
                    'IP',
                    'Severidade',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.data.map((log) => (
                  <LogRow key={log.id} log={log} />
                ))}
                {data?.data.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-sm text-gray-400"
                    >
                      Sem logs encontrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {(data?.totalPages ?? 1) > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                ← Anterior
              </button>
              <span className="self-center text-xs text-gray-400">
                Pág. {page} / {data?.totalPages}
              </span>
              <button
                disabled={page >= (data?.totalPages ?? 1)}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Seguinte →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

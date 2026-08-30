// components/audit/LogsView.tsx
// Vista "Logs": tabela paginada e filtrável de eventos de auditoria.
// Extraído de app/(platform)/audit/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { ACTION_LABELS, SEVERITY_CFG, STATUS_CFG } from './constants';
import { LogRow } from './LogRow';
import type { AuditLog } from './types';

const ACTION_ITEMS = [
  { value: 'ALL', label: 'Todas as acções' },
  ...(
    [
      'CREATE',
      'UPDATE',
      'DELETE',
      'LOGIN',
      'FAILED',
      'EXPORT',
      'APPROVE',
      'REJECT',
      'DENIED',
    ] as const
  ).map((a) => ({ value: a, label: ACTION_LABELS[a] ?? a })),
];

const SEVERITY_ITEMS = [
  { value: 'ALL', label: 'Severidade' },
  ...(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((s) => ({
    value: s,
    label: SEVERITY_CFG[s].label,
  })),
];

const STATUS_ITEMS = [
  { value: 'ALL', label: 'Estado' },
  ...(['SUCCESS', 'FAILED', 'DENIED'] as const).map((s) => ({
    value: s,
    label: STATUS_CFG[s].label,
  })),
];

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
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          type="text"
          placeholder="Entidade (ex: User, PDI)"
          value={filters.entity}
          onChange={(e) =>
            setFilters((f) => ({ ...f, entity: e.target.value }))
          }
          className="w-44"
        />
        <Select
          items={ACTION_ITEMS}
          value={filters.action || 'ALL'}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, action: v === 'ALL' ? '' : v }))
          }
          className="w-44"
        />
        <Select
          items={SEVERITY_ITEMS}
          value={filters.severity || 'ALL'}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, severity: v === 'ALL' ? '' : v }))
          }
          className="w-40"
        />
        <Select
          items={STATUS_ITEMS}
          value={filters.status || 'ALL'}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, status: v === 'ALL' ? '' : v }))
          }
          className="w-32"
        />
        <label className="flex cursor-pointer items-center gap-2 font-body text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={filters.criticalOnly}
            onChange={(e) =>
              setFilters((f) => ({ ...f, criticalOnly: e.target.checked }))
            }
            className="rounded accent-primary"
          />
          Só críticos
        </label>
        <span className="ml-auto self-center font-body text-xs text-ink-faint">
          {data?.total ?? 0} registos
        </span>
      </div>

      {loading ? (
        <Skeleton rows={10} />
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow>
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
                  <TableHeaderCell key={h}>{h}</TableHeaderCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.data.map((log) => (
                <LogRow key={log.id} log={log} />
              ))}
              {data?.data.length === 0 && (
                <TableRow>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center font-body text-sm text-ink-faint"
                  >
                    Sem logs encontrados
                  </td>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {(data?.totalPages ?? 1) > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              <Button
                intent="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Anterior
              </Button>
              <span className="self-center font-body text-xs text-ink-faint">
                Pág. {page} / {data?.totalPages}
              </span>
              <Button
                intent="secondary"
                size="sm"
                disabled={page >= (data?.totalPages ?? 1)}
                onClick={() => setPage((p) => p + 1)}
              >
                Seguinte →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

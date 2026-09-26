// components/users/AuditHistoryView.tsx
// Separador "Histórico & Auditoria" do módulo (docs/modulo_users.md Ponto
// 6) — trilha de eventos de UserAuditLog (criação, alterações de campo,
// activação/desactivação, MFA, login/logout, importações), com filtro por
// acção e por período. GET /users/audit-logs (ADMIN/RH).

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime as fmtDateTime } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { AUDIT_ACTION_LABELS, auditActionLabel, describeAuditMeta } from './auditLogLabels';
import type { ModuleAuditLogsResponse } from './types';

const ACTION_ITEMS = [
  { value: 'ALL', label: 'Todas as ações' },
  ...Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => ({ value, label })),
];

export function AuditHistoryView() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const params = {
    page,
    limit: 30,
    action: action || undefined,
    from: from || undefined,
    to: to || undefined,
  };

  const { data, isLoading } = useApiQuery<ModuleAuditLogsResponse>(
    queryKeys.users.moduleAuditLogs(params),
    '/users/audit-logs',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select
          items={ACTION_ITEMS}
          value={action || 'ALL'}
          onValueChange={(v) => {
            setPage(1);
            setAction(v === 'ALL' ? '' : v);
          }}
          className="w-56"
        />
        <Input
          type="date"
          value={from}
          onChange={(e) => {
            setPage(1);
            setFrom(e.target.value);
          }}
          className="w-40"
        />
        <span className="font-body text-xs text-ink-faint">até</span>
        <Input
          type="date"
          value={to}
          onChange={(e) => {
            setPage(1);
            setTo(e.target.value);
          }}
          className="w-40"
        />
        <span className="ml-auto self-center font-body text-xs text-ink-faint">
          {data?.meta.total ?? 0} registos
        </span>
      </div>

      {isLoading ? (
        <Skeleton rows={10} />
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Data/hora</TableHeaderCell>
                <TableHeaderCell>Utilizador</TableHeaderCell>
                <TableHeaderCell>Ação</TableHeaderCell>
                <TableHeaderCell>Executado por</TableHeaderCell>
                <TableHeaderCell>Detalhe</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.data.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-ink-faint">
                    {fmtDateTime(log.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm text-ink">
                    {log.user?.fullName ?? `#${log.userId}`}
                  </TableCell>
                  <TableCell>
                    <Badge intent="neutral">{auditActionLabel(log.action)}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-ink-muted">
                    {log.performedBy?.fullName ?? `#${log.performedById}`}
                  </TableCell>
                  <TableCell className="text-xs text-ink-faint">
                    {describeAuditMeta(log.action, log.meta) ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
              {data?.data.length === 0 && (
                <TableRow>
                  <td colSpan={5} className="px-4 py-10 text-center font-body text-sm text-ink-faint">
                    Sem registos de auditoria para os filtros escolhidos
                  </td>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {(data?.meta.totalPages ?? 1) > 1 && (
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
                Pág. {page} / {data?.meta.totalPages}
              </span>
              <Button
                intent="secondary"
                size="sm"
                disabled={page >= (data?.meta.totalPages ?? 1)}
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

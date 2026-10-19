// components/certificates/HistoryTab.tsx
// Histórico de emissões, aprovações e alterações de regras (AuditLog).

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime } from '@/lib/format';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { ACTION_LABEL } from './labels';
import type { HistoryRow, Paginated } from './types';

export function HistoryTab() {
  const [page, setPage] = useState(1);
  const params = { page, limit: 20 };
  const { data, isLoading, error, refetch } = useApiQuery<
    Paginated<HistoryRow>
  >(queryKeys.certificates.history(params), '/certificates/admin/history', {
    params,
    staleTime: STALE_TIME.DYNAMIC,
    placeholderData: keepPreviousData,
  });

  if (isLoading) return <Skeleton rows={4} />;
  if (error) return <QueryError error={error} onRetry={() => void refetch()} />;
  if (!data || data.data.length === 0) {
    return (
      <EmptyState
        title="Sem histórico"
        description="Ainda não há emissões, aprovações ou alterações de regras registadas."
      />
    );
  }

  return (
    <div>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Quando</TableHeaderCell>
            <TableHeaderCell>Acção</TableHeaderCell>
            <TableHeaderCell>Responsável</TableHeaderCell>
            <TableHeaderCell>Certificado</TableHeaderCell>
            <TableHeaderCell>Motivo</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.data.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{formatDateTime(r.timestamp)}</TableCell>
              <TableCell>{ACTION_LABEL[r.action] ?? 'Outra acção'}</TableCell>
              <TableCell>{r.userName ?? 'Sistema'}</TableCell>
              <TableCell>
                {r.certificateId ? `#${r.certificateId}` : '—'}
              </TableCell>
              <TableCell>{r.reason ?? '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination
        page={data.page}
        totalPages={data.totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}

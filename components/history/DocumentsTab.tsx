// components/history/DocumentsTab.tsx
// Aba "Documentos & Registos" (docs/history.md §6): histórico das acções sobre
// documentos. O ficheiro em si continua na Biblioteca / Document Repository.
// A versão mostrada é a actual do documento (o log não guarda a versão por evento).

'use client';

import { queryKeys } from '@/lib/queryKeys';
import { EVENT_TYPE_LABEL } from './constants';
import {
  HubTable,
  fmtDate,
  fmtTime,
  statusBadge,
  useHubList,
  type Column,
} from './shared';
import type { DocRecord } from './types';

const COLUMNS: Column<DocRecord>[] = [
  { header: 'Data', cell: (d) => `${fmtDate(d.timestamp)} ${fmtTime(d.timestamp)}` },
  { header: 'Documento', cell: (d) => d.document },
  { header: 'Colaborador / entidade', cell: (d) => d.subject ?? '–' },
  { header: 'Tipo', cell: (d) => d.type },
  {
    header: 'Acção',
    cell: (d) => (
      <div>
        <p className="font-medium text-ink">{d.action}</p>
        <p className="text-xs text-ink-muted">
          {EVENT_TYPE_LABEL[d.eventType] ?? d.eventType}
        </p>
      </div>
    ),
  },
  { header: 'Versão actual', cell: (d) => d.version ?? '–' },
  { header: 'Utilizador', cell: (d) => d.user?.fullName ?? '–' },
  { header: 'Estado do documento', cell: (d) => statusBadge(d.status) },
];

export function DocumentsTab() {
  const list = useHubList<DocRecord>(
    queryKeys.history.documents,
    '/history/documents',
  );
  return (
    <HubTable
      columns={COLUMNS}
      rows={list.rows}
      loading={list.query.isLoading}
      error={list.query.error?.message}
      total={list.total}
      page={list.page}
      totalPages={list.totalPages}
      onPageChange={list.setPage}
    />
  );
}

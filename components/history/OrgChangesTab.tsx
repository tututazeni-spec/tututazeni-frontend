// components/history/OrgChangesTab.tsx
// Aba "Alterações Organizacionais" (docs/history.md §5): histórico da
// estrutura da empresa (departamentos e responsáveis). Só os departamentos
// têm registo de alterações no sistema — unidades não são auditadas.

'use client';

import { queryKeys } from '@/lib/queryKeys';
import { HubTable, fmtDate, useHubList, type Column } from './shared';
import type { OrgChange } from './types';

const COLUMNS: Column<OrgChange>[] = [
  { header: 'Data', cell: (o) => fmtDate(o.timestamp) },
  { header: 'Unidade', cell: (o) => o.unit ?? '–' },
  { header: 'Departamento', cell: (o) => o.department ?? '–' },
  {
    header: 'Alteração',
    cell: (o) => (
      <div>
        <p className="font-medium text-ink">{o.change}</p>
        {o.field && <p className="text-xs text-ink-muted">{o.field}</p>}
      </div>
    ),
  },
  { header: 'Valor anterior', cell: (o) => o.before ?? '–' },
  { header: 'Novo valor', cell: (o) => o.after ?? '–' },
  { header: 'Responsável', cell: (o) => o.responsible?.fullName ?? '–' },
  { header: 'Motivo', cell: (o) => o.reason ?? '–' },
];

export function OrgChangesTab() {
  const list = useHubList<OrgChange>(
    queryKeys.history.orgChanges,
    '/history/org-changes',
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

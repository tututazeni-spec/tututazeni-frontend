// components/history/ActivitiesTab.tsx
// Aba "Actividades" (docs/history.md §7): acções relevantes dos utilizadores
// na plataforma (sem ruído de login/consulta de conteúdo).

'use client';

import { queryKeys } from '@/lib/queryKeys';
import { HubTable, entryColumns, useHubList } from './shared';
import type { HistoryEntry } from './types';

export function ActivitiesTab() {
  const list = useHubList<HistoryEntry>(
    queryKeys.history.activities,
    '/history/activities',
  );
  return (
    <HubTable
      columns={entryColumns('activities')}
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

// components/history/HistoryFeedTab.tsx
// Aba "Histórico" (docs/history.md §2): linha cronológica central da INNOVA,
// construída a partir das tabelas reais dos restantes módulos.

'use client';

import { queryKeys } from '@/lib/queryKeys';
import { HubTable, entryColumns, useHubList } from './shared';
import type { HistoryEntry } from './types';

export function HistoryFeedTab() {
  const list = useHubList<HistoryEntry>(
    queryKeys.history.feed,
    '/history/feed',
  );
  return (
    <HubTable
      columns={entryColumns('history')}
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

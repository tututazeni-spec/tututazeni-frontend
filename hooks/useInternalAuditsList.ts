// hooks/useInternalAuditsList.ts
// Lista paginada de auditorias internas (GET /audit/audits) com filtros.
// Extraído de components/audit/AuditsView.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from './useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { InternalAuditList } from '@/components/audit/types';

export interface InternalAuditFilters {
  status: string;
  type: string;
  search: string;
}

const PAGE_SIZE = 15;

export function useInternalAuditsList() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<InternalAuditFilters>({
    status: '',
    type: '',
    search: '',
  });

  /** Alterar um filtro volta sempre à primeira página. */
  const setFilter = (patch: Partial<InternalAuditFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const { data, isLoading } = useApiQuery<InternalAuditList>(
    queryKeys.audit.audits({ ...filters, page }),
    '/audit/audits',
    {
      params: { ...filters, page, limit: PAGE_SIZE },
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );

  return {
    filters,
    setFilter,
    page,
    setPage,
    data,
    isLoading,
    countsByStatus: data?.counts.byStatus ?? {},
  };
}

export type InternalAuditListController = ReturnType<
  typeof useInternalAuditsList
>;

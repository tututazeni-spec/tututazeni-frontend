// hooks/useFundersList.ts
// Dados + filtros da listagem de financiadores (crm/funders). Extraído de
// app/(platform)/crm/funders/page.tsx. Adaptador fino sobre
// usePaginatedListQuery — mantém a forma de retorno que FundersListView espera.

'use client';

import { usePaginatedListQuery } from '@/hooks/usePaginatedListQuery';
import { queryKeys } from '@/lib/queryKeys';
import type { Funder } from '@/components/crm/funders/types';

export function useFundersList() {
  const { page, setPage, search, onSearchChange, filters, setFilter, query } =
    usePaginatedListQuery<{ data: Funder[]; total: number; totalPages: number }>({
      queryKey: (params) => queryKeys.funders.list(params),
      path: '/crm/funders',
      filterKeys: ['type', 'status'],
    });

  return {
    data: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    totalPages: query.data?.totalPages ?? 1,
    page,
    setPage,
    search,
    onSearchChange,
    typeFilter: filters.type,
    onTypeFilterChange: (value: string) => setFilter('type', value),
    statusFilter: filters.status,
    onStatusFilterChange: (value: string) => setFilter('status', value),
    loading: query.isLoading,
    error: query.error?.message ?? '',
    onRetry: () => query.refetch(),
  };
}

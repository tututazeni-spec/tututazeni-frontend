// hooks/usePartnersList.ts
// Extraído de app/(platform)/crm/partners/page.tsx. Adaptador fino sobre
// usePaginatedListQuery — mantém a forma de retorno que PartnersListView espera.

'use client';

import { usePaginatedListQuery } from '@/hooks/usePaginatedListQuery';
import { queryKeys } from '@/lib/queryKeys';
import type { Partner } from '@/components/crm/partners/types';

export function usePartnersList() {
  const { page, setPage, search, onSearchChange, filters, setFilter, query } =
    usePaginatedListQuery<{
      data: Partner[];
      total: number;
      totalPages: number;
    }>({
      queryKey: (params) => queryKeys.partners.list(params),
      path: '/crm/partners',
      filterKeys: ['tier', 'status'],
    });

  return {
    data: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    totalPages: query.data?.totalPages ?? 1,
    page,
    setPage,
    search,
    onSearchChange,
    tierFilter: filters.tier,
    onTierFilterChange: (value: string) => setFilter('tier', value),
    statusFilter: filters.status,
    onStatusFilterChange: (value: string) => setFilter('status', value),
    loading: query.isLoading,
    error: query.error?.message ?? '',
    onRetry: () => query.refetch(),
  };
}

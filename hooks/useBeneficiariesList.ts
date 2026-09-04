// hooks/useBeneficiariesList.ts
// Extraído de app/(platform)/crm/beneficiaries/page.tsx. Adaptador fino sobre
// usePaginatedListQuery — mantém a forma de retorno que BeneficiariesListView
// espera (rows / isLoading / isFetching / isError / errorMessage).

'use client';

import { usePaginatedListQuery } from '@/hooks/usePaginatedListQuery';
import { queryKeys } from '@/lib/queryKeys';
import type { BeneficiaryList } from '@/components/crm/beneficiaries/types';

export function useBeneficiariesList() {
  const { page, setPage, search, onSearchChange, filters, setFilter, query } =
    usePaginatedListQuery<BeneficiaryList>({
      queryKey: (params) => queryKeys.beneficiaries.list(params),
      path: '/crm/beneficiaries',
      filterKeys: ['status', 'type'],
    });

  return {
    total: query.data?.total ?? 0,
    totalPages: query.data?.totalPages ?? 1,
    rows: query.data?.data ?? [],
    page,
    setPage,
    search,
    onSearchChange,
    statusFilter: filters.status,
    onStatusFilterChange: (value: string) => setFilter('status', value),
    typeFilter: filters.type,
    onTypeFilterChange: (value: string) => setFilter('type', value),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    errorMessage: query.error?.message || 'Erro ao carregar beneficiários',
    onRetry: () => query.refetch(),
  };
}

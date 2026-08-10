// hooks/useFundersList.ts
// Dados + filtros da listagem de financiadores (crm/funders). Extraído de
// app/(platform)/crm/funders/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { Funder } from '@/components/crm/funders/types';

export function useFundersList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const debouncedSearch = useDebounce(search);
  const params = {
    page,
    limit: 20,
    search: debouncedSearch,
    type: typeFilter,
    status: statusFilter,
  };

  const {
    data: resp,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useApiQuery<{ data: Funder[]; total: number; totalPages: number }>(
    queryKeys.funders.list(params),
    '/crm/funders',
    {
      params,
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );

  function onSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }
  function onTypeFilterChange(value: string) {
    setTypeFilter(value);
    setPage(1);
  }
  function onStatusFilterChange(value: string) {
    setStatusFilter(value);
    setPage(1);
  }

  return {
    data: resp?.data ?? [],
    total: resp?.total ?? 0,
    totalPages: resp?.totalPages ?? 1,
    page,
    setPage,
    search,
    onSearchChange,
    typeFilter,
    onTypeFilterChange,
    statusFilter,
    onStatusFilterChange,
    loading,
    error: queryError?.message ?? '',
    onRetry: () => refetch(),
  };
}

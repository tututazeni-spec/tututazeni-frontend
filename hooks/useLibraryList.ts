// hooks/useLibraryList.ts
// Extraído de app/(platform)/library/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { Item } from '@/components/library/types';

export function useLibraryList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const debouncedSearch = useDebounce(search);
  const params = { page, limit: 20, search: debouncedSearch, type: typeFilter };

  const {
    data: resp,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useApiQuery<{ data: Item[]; total: number; totalPages: number }>(
    queryKeys.library.items(params),
    '/library/items',
    {
      params,
      staleTime: STALE_TIME.SEMI_STATIC,
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
    loading,
    error: queryError?.message ?? '',
    onRetry: () => refetch(),
  };
}

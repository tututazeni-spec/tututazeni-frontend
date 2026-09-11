// hooks/useAcademicPrograms.ts
// Extraído de app/(platform)/academic/programs/page.tsx.

'use client';

import { useEffect, useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { Program } from '@/components/academic/types';

export function useAcademicPrograms() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const debouncedSearch = useDebounce(search);
  // Termo efetivamente usado na query: segue o debounce normalmente, mas
  // onSearchSubmit (Enter / clique na lupa) força-o de imediato, saltando
  // a espera de 350ms.
  const [activeSearch, setActiveSearch] = useState('');
  useEffect(() => {
    setActiveSearch(debouncedSearch);
  }, [debouncedSearch]);
  const params = {
    page,
    limit: 20,
    search: activeSearch,
    level: levelFilter,
  };

  const {
    data: resp,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useApiQuery<{ data: Program[]; total: number; totalPages: number }>(
    queryKeys.academic.programs(params),
    '/academic/programs',
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
  function onSearchSubmit() {
    setActiveSearch(search);
    setPage(1);
  }
  function onLevelFilterChange(value: string) {
    setLevelFilter(value);
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
    onSearchSubmit,
    levelFilter,
    onLevelFilterChange,
    loading,
    error: queryError?.message ?? '',
    onRetry: () => refetch(),
  };
}

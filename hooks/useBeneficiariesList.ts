// hooks/useBeneficiariesList.ts
// Extraído de app/(platform)/crm/beneficiaries/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { BeneficiaryList } from '@/components/crm/beneficiaries/types';

export function useBeneficiariesList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Pesquisa com debounce: 1 pedido depois de parar de escrever, não 1 por tecla.
  const debouncedSearch = useDebounce(search);

  // params enxutos — o apiClient omite os vazios (optimização de payload).
  const params = {
    page,
    limit: 20,
    search: debouncedSearch,
    status: statusFilter,
    type: typeFilter,
  };

  const { data, isLoading, isFetching, isError, error, refetch } =
    useApiQuery<BeneficiaryList>(
      queryKeys.beneficiaries.list(params),
      '/crm/beneficiaries',
      {
        params,
        staleTime: STALE_TIME.DYNAMIC,
        // Mantém a página anterior visível enquanto a próxima carrega (sem flash).
        placeholderData: keepPreviousData,
      },
    );

  function onFilterChange(setter: (v: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  return {
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 1,
    rows: data?.data ?? [],
    page,
    setPage,
    search,
    onSearchChange: (value: string) => onFilterChange(setSearch, value),
    statusFilter,
    onStatusFilterChange: (value: string) =>
      onFilterChange(setStatusFilter, value),
    typeFilter,
    onTypeFilterChange: (value: string) => onFilterChange(setTypeFilter, value),
    isLoading,
    isFetching,
    isError,
    errorMessage: error?.message || 'Erro ao carregar beneficiários',
    onRetry: () => refetch(),
  };
}

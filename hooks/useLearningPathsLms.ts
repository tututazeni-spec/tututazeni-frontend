// hooks/useLearningPathsLms.ts
// Extraído de app/(platform)/lms/paths/page.tsx.
// Nome "Lms" no sufixo para não colidir com o hook homónimo do módulo
// learning-paths (RH), que é um domínio diferente.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { Path } from '@/components/lms/types';

export function useLearningPathsLms() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const params = { page, limit: 20, search: debouncedSearch };

  const {
    data: resp,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useApiQuery<{ data: Path[]; total: number; totalPages: number }>(
    queryKeys.lms.paths(params),
    '/lms/paths',
    {
      params,
      staleTime: STALE_TIME.SEMI_STATIC,
      placeholderData: keepPreviousData,
    },
  );

  const enrollMut = useApiMutation(
    (pathId: string) => apiClient.post(`/lms/paths/${pathId}/enroll`, {}),
    {
      invalidateKeys: [queryKeys.lms.all],
      onSuccess: () => alert('Inscrição realizada com sucesso!'),
      onError: (e) => alert(e.message || 'Erro ao inscrever'),
    },
  );

  function onSearchChange(value: string) {
    setSearch(value);
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
    loading,
    error: queryError?.message ?? '',
    onRetry: () => refetch(),
    enroll: (pathId: string) => enrollMut.mutate(pathId),
  };
}

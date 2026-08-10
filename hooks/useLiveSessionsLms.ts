// hooks/useLiveSessionsLms.ts
// Extraído de app/(platform)/lms/sessions/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { Session } from '@/components/lms/types';

export function useLiveSessionsLms() {
  const [page, setPage] = useState(1);
  const params = { page, limit: 20 };

  const {
    data: resp,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useApiQuery<{ data: Session[]; total: number; totalPages: number }>(
    queryKeys.lms.sessions(params),
    '/lms/sessions/upcoming',
    {
      params,
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );

  const registerMut = useApiMutation(
    (sessionId: string) =>
      apiClient.post(`/lms/sessions/${sessionId}/register`, {}),
    {
      invalidateKeys: [queryKeys.lms.all],
      onSuccess: () => alert('Inscrição na sessão realizada!'),
      onError: (e) => alert(e.message || 'Erro ao inscrever'),
    },
  );

  return {
    data: resp?.data ?? [],
    total: resp?.total ?? 0,
    totalPages: resp?.totalPages ?? 1,
    page,
    setPage,
    loading,
    error: queryError?.message ?? '',
    onRetry: () => refetch(),
    register: (sessionId: string) => registerMut.mutate(sessionId),
  };
}

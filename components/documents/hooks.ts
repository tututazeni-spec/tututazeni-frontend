// components/documents/hooks.ts
// Hooks de dados do repositório de documentos (lista filtrada, dashboard
// de KPIs, tags). Extraído de app/(platform)/documents/page.tsx.

import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { DashboardData, DocFilters, Document } from './types';

export function useDocuments(filters: DocFilters) {
  const debouncedSearch = useDebounce(filters.search, 300);
  const params = {
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.sensitivity ? { sensitivity: filters.sensitivity } : {}),
    ...(filters.tag ? { tag: filters.tag } : {}),
    ...(filters.expiringSoon ? { expiringSoon: 'true' } : {}),
  };
  const { data, isLoading, refetch } = useApiQuery<{
    data: Document[];
    meta: { total: number };
  }>(queryKeys.documents.list(params), '/documents', {
    params,
    staleTime: STALE_TIME.DYNAMIC,
    placeholderData: keepPreviousData,
  });
  return { data: data ?? null, loading: isLoading, refetch };
}

export function useDashboard() {
  const { data } = useApiQuery<DashboardData>(
    queryKeys.documents.dashboard(),
    '/documents/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  return data ?? null;
}

export function useTags() {
  const { data } = useApiQuery<Array<{ tag: string; count: number }>>(
    queryKeys.documents.tags(),
    '/documents/tags',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  return data ?? [];
}

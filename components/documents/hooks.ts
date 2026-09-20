// components/documents/hooks.ts
// Hooks de dados do repositório de documentos (lista filtrada, dashboard
// de KPIs, tags). Extraído de app/(platform)/documents/page.tsx.
// docs/biblioteca.md acrescentou: confirmação de leitura, favoritos,
// recentes e relatório de compliance de leitura obrigatória.

import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type {
  ComplianceOverviewRow,
  DashboardData,
  DocFilters,
  Document,
  PendingRead,
  ReadStatus,
} from './types';

export function useDocuments(filters: DocFilters) {
  const debouncedSearch = useDebounce(filters.search, 300);
  const params = {
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.sensitivity ? { sensitivity: filters.sensitivity } : {}),
    ...(filters.tag ? { tag: filters.tag } : {}),
    ...(filters.expiringSoon ? { expiringSoon: 'true' } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.requiresReadConfirmation ? { requiresReadConfirmation: 'true' } : {}),
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

// ─── docs/biblioteca.md — Pendentes de Leitura / Favoritos / Recentes ──────

export function usePendingReads() {
  const { data, isLoading, refetch } = useApiQuery<PendingRead[]>(
    queryKeys.documents.pendingReads(),
    '/documents/pending-reads',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  return { data: data ?? [], loading: isLoading, refetch };
}

export function useFavoriteDocuments() {
  const { data, isLoading, refetch } = useApiQuery<Document[]>(
    queryKeys.documents.favorites(),
    '/documents/favorites',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  return { data: data ?? [], loading: isLoading, refetch };
}

export function useRecentDocuments() {
  const { data, isLoading } = useApiQuery<Document[]>(
    queryKeys.documents.recent(),
    '/documents/recent',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  return { data: data ?? [], loading: isLoading };
}

// `enabled: false` evita um 403 ruidoso para quem não é ADMIN/RH/DIRECTOR —
// espelha @Roles(...) em GET /documents/compliance-overview.
export function useComplianceOverview(enabled = true) {
  const { data, isLoading } = useApiQuery<ComplianceOverviewRow[]>(
    queryKeys.documents.complianceOverview(),
    '/documents/compliance-overview',
    { staleTime: STALE_TIME.DYNAMIC, enabled },
  );
  return { data: data ?? [], loading: isLoading };
}

export function useReadStatus(documentId: number | null) {
  const { data, isLoading } = useApiQuery<ReadStatus>(
    queryKeys.documents.readStatus(documentId ?? 0),
    `/documents/${documentId}/read-status`,
    { staleTime: STALE_TIME.DYNAMIC, enabled: documentId !== null },
  );
  return { data: data ?? null, loading: isLoading };
}

export function useConfirmRead() {
  return useApiMutation<{ message: string }, number>(
    (documentId) => apiClient.post(`/documents/${documentId}/confirm-read`, {}),
    { invalidateKeys: [queryKeys.documents.pendingReads()] },
  );
}

export function useToggleFavorite() {
  return useApiMutation<{ favorited: boolean }, number>(
    (documentId) => apiClient.post(`/documents/${documentId}/favorite`, {}),
    { invalidateKeys: [queryKeys.documents.favorites()] },
  );
}

// ─── docs/biblioteca.md — Fluxo de aprovação ────────────────────────────────

type WorkflowAction =
  | 'submit-review'
  | 'submit-approval'
  | 'approve'
  | 'publish'
  | 'suspend';

export function useDocumentWorkflow() {
  return useApiMutation<Document, { id: number; action: WorkflowAction; body?: object }>(
    ({ id, action, body }) => apiClient.patch(`/documents/${id}/${action}`, body ?? {}),
    { invalidateKeys: [queryKeys.documents.all] },
  );
}

export function useRejectDocument() {
  return useApiMutation<Document, { id: number; reason: string }>(
    ({ id, reason }) => apiClient.patch(`/documents/${id}/reject`, { reason }),
    { invalidateKeys: [queryKeys.documents.all] },
  );
}

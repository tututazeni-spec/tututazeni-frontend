// hooks/useSecuritySessions.ts
// Sessões activas: as minhas (todos) e as da organização (ADMIN).
// Extraído de components/settings/TabSeguranca.tsx.

'use client';

import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useApiMutation, useApiQuery } from './useApiQuery';
import type { ToastFn } from '@/components/settings/seguranca/logic';
import type { SessionRow } from '@/components/settings/types';

interface SessionsPayload {
  total: number;
  items: SessionRow[];
}

export function useMySessions(toastFn: ToastFn) {
  const sessions = useApiQuery<SessionsPayload>(
    queryKeys.settings.sessions('me'),
    '/settings/security/me/sessions',
  );
  const revoke = useApiMutation(
    (id: number) => apiClient.delete(`/settings/security/me/sessions/${id}`),
    {
      invalidateKeys: [queryKeys.settings.sessions('me')],
      onSuccess: () => toastFn('Sessão terminada', 'success'),
      onError: (e) => toastFn(e.message, 'error'),
    },
  );

  return {
    isLoading: sessions.isLoading,
    items: sessions.data?.items ?? [],
    revoke: (id: number) => revoke.mutate(id),
    revoking: revoke.isPending,
  };
}

export type MySessionsController = ReturnType<typeof useMySessions>;

export function useOrgSessions(toastFn: ToastFn) {
  const confirm = useConfirm();
  const query = useApiQuery<SessionsPayload>(
    queryKeys.settings.sessions('all'),
    '/settings/security/sessions',
  );
  const revoke = useApiMutation(
    (id: number) => apiClient.delete(`/settings/security/sessions/${id}`),
    {
      invalidateKeys: [queryKeys.settings.sessions('all')],
      onSuccess: () => toastFn('Sessão terminada', 'success'),
      onError: (e) => toastFn(e.message, 'error'),
    },
  );
  const revokeAll = useApiMutation(
    (userId: number) =>
      apiClient.delete(`/settings/security/users/${userId}/sessions`),
    {
      invalidateKeys: [queryKeys.settings.sessions('all')],
      onSuccess: () => toastFn('Sessões terminadas', 'success'),
      onError: (e) => toastFn(e.message, 'error'),
    },
  );

  /** Pede confirmação (destrutivo) antes de terminar todas as sessões. */
  const requestRevokeAll = async (s: SessionRow) => {
    const ok = await confirm({
      title: `Terminar todas as sessões de ${s.user?.fullName ?? `#${s.userId}`}?`,
      confirmLabel: 'Terminar todas',
      destructive: true,
    });
    if (ok) revokeAll.mutate(s.userId);
  };

  return {
    isLoading: query.isLoading,
    total: query.data?.total,
    items: query.data?.items ?? [],
    revoke: (id: number) => revoke.mutate(id),
    requestRevokeAll,
    revoking: revoke.isPending,
    revokingAll: revokeAll.isPending,
  };
}

export type OrgSessionsController = ReturnType<typeof useOrgSessions>;

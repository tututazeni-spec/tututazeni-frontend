// hooks/useLockedUsers.ts
// Contas bloqueadas por tentativas falhadas (ADMIN): listar e desbloquear.
// Extraído de components/settings/TabSeguranca.tsx.

'use client';

import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useApiMutation, useApiQuery } from './useApiQuery';
import type { ToastFn } from '@/components/settings/seguranca/logic';
import type { LockedUser } from '@/components/settings/types';

export function useLockedUsers(toastFn: ToastFn) {
  const confirm = useConfirm();
  const query = useApiQuery<{ total: number; items: LockedUser[] }>(
    queryKeys.settings.lockedUsers(),
    '/settings/security/locked-users',
  );
  const unlock = useApiMutation(
    (id: number) => apiClient.post(`/settings/security/users/${id}/unlock`, {}),
    {
      invalidateKeys: [queryKeys.settings.lockedUsers()],
      onSuccess: () => toastFn('Conta desbloqueada', 'success'),
      onError: (e) => toastFn(e.message, 'error'),
    },
  );

  /** Pede confirmação antes de desbloquear. */
  const requestUnlock = async (u: LockedUser) => {
    const ok = await confirm({
      title: `Desbloquear ${u.fullName}?`,
      confirmLabel: 'Desbloquear',
    });
    if (ok) unlock.mutate(u.id);
  };

  return {
    isLoading: query.isLoading,
    total: query.data?.total,
    items: query.data?.items ?? [],
    requestUnlock,
    unlocking: unlock.isPending,
  };
}

export type LockedUsersController = ReturnType<typeof useLockedUsers>;

// hooks/useUserProfile.ts
// Container do perfil de um utilizador — as 3 queries (user, stats, audit
// logs — este último lazy, só quando o separador de auditoria está aberto)
// e a mutação de acção (activate/deactivate/suspend). Extraído de
// UserProfileView em app/(platform)/users/page.tsx (357 linhas, misturava
// isto tudo com o JSX de 4 separadores). `tab` entra como argumento (não
// como estado do próprio hook) porque quem decide qual separador está
// activo é a UI — o hook só usa esse valor para decidir se activa a query
// de auditoria.
// Ver memory project_innova_component_separation_audit, item 3.3.

'use client';

import { useApiMutation, useApiQuery } from './useApiQuery';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { AuditLogEntry, User, UserStats } from '@/components/users/types';

export type ProfileTab = 'overview' | 'learning' | 'team' | 'audit';
export type UserAction = 'activate' | 'deactivate' | 'suspend';

export function useUserProfile(userId: number, tab: ProfileTab) {
  const notify = useToast();
  // user e stats correm em paralelo (sem waterfall).
  const { data: user, isLoading: loadingUser } = useApiQuery<User>(
    queryKeys.users.detail(userId),
    `/users/${userId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const { data: stats } = useApiQuery<UserStats>(
    queryKeys.users.stats(userId),
    `/users/${userId}/stats`,
    { staleTime: STALE_TIME.DYNAMIC },
  );
  // Auditoria só é pedida quando o separador é aberto (lazy).
  const { data: auditData } = useApiQuery<{ data: AuditLogEntry[] }>(
    queryKeys.users.auditLogs(userId),
    `/users/${userId}/audit-logs`,
    { enabled: tab === 'audit', staleTime: STALE_TIME.DYNAMIC },
  );
  const auditLogs = auditData?.data ?? [];

  // Acções (activate/deactivate/suspend): invalidam detalhe + listas após sucesso.
  const action = useApiMutation(
    (act: UserAction) => apiClient.patch(`/users/${userId}/${act}`, {}),
    {
      invalidateKeys: [queryKeys.users.detail(userId), queryKeys.users.lists()],
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const actionLoading = action.isPending;
  const confirm = useConfirm();

  const handleAction = async (act: UserAction) => {
    if (
      !(await confirm({
        title: `${act} este utilizador?`,
        confirmLabel: act,
        destructive: true,
      }))
    )
      return;
    action.mutate(act);
  };

  return {
    user,
    loadingUser,
    stats,
    auditLogs,
    actionLoading,
    handleAction,
  };
}

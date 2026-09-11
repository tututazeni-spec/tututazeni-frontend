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
import { useCurrentRole } from './useCurrentRole';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { ADMIN_ROLES, USER_PROFILE_MGMT_ROLES } from '@/lib/roles';
import type { AuditLogEntry, User, UserStats } from '@/components/users/types';

export type ProfileTab = 'overview' | 'learning' | 'team' | 'audit';
export type UserAction = 'activate' | 'deactivate' | 'suspend';

export function useUserProfile(userId: number, tab: ProfileTab) {
  const notify = useToast();
  const viewerRole = useCurrentRole();
  // Perfil de outra pessoa aberto por qualquer colega (ex.: pesquisa global do
  // dashboard) — /users/:id/stats e /:id/audit-logs são mais restritos que o
  // /users/:id base (ver lib/roles.ts). Só disparamos essas queries quando o
  // role do próprio viewer as passaria no backend; caso contrário ficam
  // undefined em vez de rebentar em 403 + toast de erro.
  const canSeeStats = !!viewerRole && USER_PROFILE_MGMT_ROLES.includes(viewerRole);
  const canSeeAudit = !!viewerRole && ADMIN_ROLES.includes(viewerRole);

  // user e stats correm em paralelo (sem waterfall).
  const { data: user, isLoading: loadingUser } = useApiQuery<User>(
    queryKeys.users.detail(userId),
    `/users/${userId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const { data: stats } = useApiQuery<UserStats>(
    queryKeys.users.stats(userId),
    `/users/${userId}/stats`,
    { staleTime: STALE_TIME.DYNAMIC, enabled: canSeeStats },
  );
  // Auditoria só é pedida quando o separador é aberto (lazy) e o viewer tem acesso.
  const { data: auditData } = useApiQuery<{ data: AuditLogEntry[] }>(
    queryKeys.users.auditLogs(userId),
    `/users/${userId}/audit-logs`,
    { enabled: tab === 'audit' && canSeeAudit, staleTime: STALE_TIME.DYNAMIC },
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
    canSeeStats,
    canSeeAudit,
    // activate/deactivate/suspend (ver handleAction) são @Roles(ADMIN, RH) —
    // mesmo conjunto que audit-logs.
    canManageAccount: canSeeAudit,
  };
}

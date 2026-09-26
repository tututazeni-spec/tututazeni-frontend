// hooks/useUserProfile.ts
// Container do perfil de um utilizador — user/stats (sempre pedidos, para o
// cabeçalho e o separador "Resumo") e a mutação de acção (activate/
// deactivate/suspend). Os restantes separadores (docs/modulo_users.md Ponto
// 3) fazem o seu próprio fetch lazy em components/users/ProfileTabs.tsx, só
// pedido quando o separador é montado — mesmo padrão que já existia aqui
// para a auditoria antes desta extracção.
// Ver memory project_innova_component_separation_audit, item 3.3.

'use client';

import { useApiMutation, useApiQuery } from './useApiQuery';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { User, UserStats } from '@/components/users/types';

// docs/modulo_users.md Ponto 3 — separadores do "Perfil do Colaborador".
// 'personal'/'professional'/'organization'/'access' e os separadores de
// 'training' a 'activity' são renderizados por components/users/ProfileTabs.tsx,
// cada um com o seu próprio fetch lazy (só pedido quando montado).
export type ProfileTab =
  | 'overview'
  | 'personal'
  | 'professional'
  | 'organization'
  | 'access'
  | 'training'
  | 'courses'
  | 'competencies'
  | 'performance'
  | 'evaluations'
  | 'pdi'
  | 'career'
  | 'documents'
  | 'leave'
  | 'attendance'
  | 'history'
  | 'activity';
export type UserAction = 'activate' | 'deactivate' | 'suspend';

export function useUserProfile(userId: number) {
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

  // Acções (activate/deactivate/suspend): invalidam detalhe + listas após sucesso.
  const action = useApiMutation(
    (act: UserAction) => apiClient.patch(`/users/${userId}/${act}`, {}),
    {
      mutationKey: ['users', 'action', userId],
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
    actionLoading,
    handleAction,
  };
}

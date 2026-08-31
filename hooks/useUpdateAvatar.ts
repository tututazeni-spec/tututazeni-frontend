// frontend/hooks/useUpdateAvatar.ts
// Mutações da foto de perfil. Ambas invalidam queryKeys.auth.me() — a única
// entrada de cache do utilizador autenticado — por isso Topbar e Definições
// re-renderizam com a nova foto sem reload.

'use client';

import { useApiMutation } from './useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/providers/ToastProvider';

export function useUpdateAvatar() {
  const notify = useToast();

  const set = useApiMutation<{ avatarUrl: string }, string>(
    (dataUrl) => apiClient.patch('/users/me/avatar', { avatarUrl: dataUrl }),
    {
      invalidateKeys: [queryKeys.auth.me()],
      onSuccess: () =>
        notify({ title: 'Foto de perfil actualizada', intent: 'success' }),
      onError: (e) =>
        notify({
          title: e.message || 'Erro ao guardar a foto',
          intent: 'danger',
        }),
    },
  );

  const remove = useApiMutation<{ avatarUrl: null }, void>(
    () => apiClient.delete('/users/me/avatar'),
    {
      invalidateKeys: [queryKeys.auth.me()],
      onSuccess: () =>
        notify({ title: 'Foto de perfil removida', intent: 'success' }),
      onError: (e) =>
        notify({
          title: e.message || 'Erro ao remover a foto',
          intent: 'danger',
        }),
    },
  );

  return {
    setAvatar: set.mutate,
    removeAvatar: remove.mutate,
    saving: set.isPending || remove.isPending,
  };
}

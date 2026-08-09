// hooks/useNotificationsInbox.ts
// Container da caixa de entrada de notificações — query com polling de 60s,
// mutação optimista de "marcar lida" (lista activa + badge global, com
// rollback em erro), arquivar e marcar-todas. Extraído de InboxView em
// app/(platform)/notifications/page.tsx (162 linhas, misturava isto com o
// JSX da toolbar + lista). `category`/`readFilter` entram como argumentos
// (não são estado do hook) porque decidem os parâmetros da query — quem
// guarda o valor actual dos filtros é a UI.
// Ver memory project_innova_component_separation_audit, item 3.6.

'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useApiMutation, useApiQuery } from './useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { NotifData, Notification } from '@/components/notifications/types';

export type ReadFilter = 'all' | 'unread' | 'read';

export function useNotificationsInbox(
  category: string,
  readFilter: ReadFilter,
) {
  const qc = useQueryClient();

  const params = {
    limit: 50,
    category,
    read: readFilter === 'all' ? undefined : String(readFilter === 'read'),
  };
  const listKey = queryKeys.notifications.my(params);

  // Polling inteligente: a caixa de entrada refresca a cada 60s.
  const { data, isLoading: loading } = useApiQuery<NotifData>(
    listKey,
    '/notifications/my',
    { params, staleTime: STALE_TIME.DYNAMIC, refetchInterval: 60_000 },
  );

  // Marcar lida: optimistic na lista activa + no badge global; rollback em erro.
  const markRead = useApiMutation(
    (id: number) => apiClient.patch(`/notifications/my/${id}/read`, {}),
    {
      onMutate: async (id: number) => {
        await qc.cancelQueries({ queryKey: listKey });
        const prev = qc.getQueryData<NotifData>(listKey);
        const flip = (arr: Notification[]) =>
          arr.map((n) => (n.id === id ? { ...n, read: true } : n));
        if (prev) {
          qc.setQueryData<NotifData>(listKey, {
            ...prev,
            unreadCount: Math.max(0, prev.unreadCount - 1),
            data: flip(prev.data),
            grouped: {
              today: flip(prev.grouped.today),
              yesterday: flip(prev.grouped.yesterday),
              thisWeek: flip(prev.grouped.thisWeek),
              older: flip(prev.grouped.older),
            },
          });
        }
        qc.setQueryData<{ count: number }>(
          queryKeys.notifications.unreadCount(),
          (c) => (c ? { count: Math.max(0, c.count - 1) } : c),
        );
        return { prev };
      },
      onError: (_e, _id, ctx) => {
        const prev = (ctx as { prev?: NotifData } | undefined)?.prev;
        if (prev) qc.setQueryData(listKey, prev);
      },
      invalidateKeys: [queryKeys.notifications.unreadCount()],
    },
  );

  const archive = useApiMutation(
    (id: number) => apiClient.patch(`/notifications/my/${id}/archive`, {}),
    { invalidateKeys: [listKey, queryKeys.notifications.unreadCount()] },
  );

  const readAll = useApiMutation(
    () => apiClient.patch('/notifications/my/read-all', {}),
    { invalidateKeys: [listKey, queryKeys.notifications.unreadCount()] },
  );

  const handleRead = (id: number) => markRead.mutate(id);
  const handleArchive = (id: number) => archive.mutate(id);
  const handleReadAll = () => readAll.mutate(undefined);
  const marking = readAll.isPending;

  return {
    data,
    loading,
    handleRead,
    handleArchive,
    handleReadAll,
    marking,
  };
}

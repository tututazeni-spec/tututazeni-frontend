// hooks/useNotificationsAdmin.ts
// Container da vista de administração de notificações — stats agregadas +
// formulário de envio em massa. Extraído de AdminView em
// app/(platform)/notifications/page.tsx, que misturava isto com o JSX dos
// cards de stats e do formulário de envio.
// Ver memory project_innova_component_separation_audit, item 3.6.

'use client';

import { useApiMutation, useApiQuery } from './useApiQuery';
import { useFormValidation } from './useFormValidation';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { required } from '@/lib/validation';
import type { Stats } from '@/components/notifications/types';

export function useNotificationsAdmin() {
  const notify = useToast();
  const {
    values: form,
    setValues: setForm,
    validateAll,
  } = useFormValidation(
    {
      type: 'ANNOUNCEMENT',
      message: '',
      title: '',
    },
    { message: [required('Mensagem obrigatória')] },
  );

  const { data: stats, isLoading } = useApiQuery<Stats>(
    queryKeys.notifications.stats(),
    '/notifications/stats',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const sendAll = useApiMutation(
    () => apiClient.post<{ sent: number }>('/notifications/send-all', form),
    {
      // Um envio em massa altera stats e as caixas de entrada → invalida tudo.
      invalidateKeys: [queryKeys.notifications.all],
      onSuccess: (res) => {
        notify({
          title: `✓ Enviado a ${res.sent} colaboradores`,
          intent: 'success',
        });
        setForm({ type: 'ANNOUNCEMENT', message: '', title: '' });
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const sending = sendAll.isPending;

  const handleSendAll = () => {
    if (!validateAll()) {
      notify({ title: 'Mensagem obrigatória', intent: 'danger' });
      return;
    }
    sendAll.mutate(undefined);
  };

  return {
    stats,
    loading: isLoading,
    form,
    setForm,
    sending,
    handleSendAll,
  };
}

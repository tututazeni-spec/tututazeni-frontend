// hooks/useResourceDelete.ts
// Soft-delete de um recurso restrito a ADMIN/RH, com confirmação e redirect.
//
// Antes desta extracção, useFunderDetail / usePartnerDetail /
// useBeneficiaryDetail tinham cada um ~35 linhas idênticas: derivar o papel,
// `canDelete = ADMIN_ROLES.includes(role)`, a mutação DELETE com toast de
// sucesso/erro + `router.push`, e um `onDelete()` que abre o diálogo de
// confirmação destrutivo. O backend continua a ser a barreira real (@Roles no
// controller); esconder o botão é só defesa em profundidade.

'use client';

import { useRouter } from 'next/navigation';
import type { QueryKey } from '@tanstack/react-query';
import { useApiMutation } from './useApiQuery';
import { useCurrentRole } from './useCurrentRole';
import { useToast } from '../providers/ToastProvider';
import { useConfirm } from '../providers/ConfirmProvider';
import { apiClient } from '../lib/apiClient';
import { ADMIN_ROLES } from '../lib/roles';

interface UseResourceDeleteOptions {
  /** Path REST do recurso sem id — ex.: '/crm/funders'. */
  basePath: string;
  /** Id do recurso a eliminar. */
  id: string;
  /** Key a invalidar após sucesso — normalmente `queryKeys.<recurso>.all`. */
  invalidateKey: QueryKey;
  /** Título do diálogo de confirmação (o chamador interpola o nome do registo). */
  confirmTitle: string;
  /** Mensagem do diálogo de confirmação. */
  confirmMessage: string;
  /** Toast apresentado após eliminar. */
  successMessage: string;
  /** Rota para onde navegar após eliminar. */
  redirectTo: string;
}

export function useResourceDelete(opts: UseResourceDeleteOptions) {
  const notify = useToast();
  const router = useRouter();
  const confirm = useConfirm();
  const role = useCurrentRole();

  const canDelete = !!role && ADMIN_ROLES.includes(role);

  const deleteMut = useApiMutation(
    () => apiClient.delete(`${opts.basePath}/${opts.id}`),
    {
      invalidateKeys: [opts.invalidateKey],
      onSuccess: () => {
        notify({ title: opts.successMessage, intent: 'success' });
        router.push(opts.redirectTo);
      },
      onError: (e) =>
        notify({ title: e.message || 'Erro ao eliminar', intent: 'danger' }),
    },
  );

  async function onDelete() {
    const ok = await confirm({
      title: opts.confirmTitle,
      message: opts.confirmMessage,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (ok) deleteMut.mutate(undefined);
  }

  return { canDelete, onDelete, isDeleting: deleteMut.isPending };
}

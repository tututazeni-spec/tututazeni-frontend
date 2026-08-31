// hooks/usePartnerDetail.ts
// Extraído de app/(platform)/crm/partners/[id]/page.tsx.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { ADMIN_ROLES, type Role } from '@/lib/roles';
import type {
  PartnerDetail,
  InteractionForm,
} from '@/components/crm/partners/types';

const EMPTY_FORM: InteractionForm = {
  type: 'MEETING',
  subject: '',
  description: '',
  outcome: '',
  satisfaction: '',
};

export function usePartnerDetail(id: string) {
  const notify = useToast();
  const router = useRouter();
  const confirm = useConfirm();
  const { data: me } = useCurrentUser();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<InteractionForm>(EMPTY_FORM);

  const {
    data: partner,
    isLoading: loading,
    error: queryError,
  } = useApiQuery<PartnerDetail>(
    queryKeys.partners.detail(id),
    `/crm/partners/${id}`,
    { enabled: !!id, staleTime: STALE_TIME.DYNAMIC },
  );
  const error = queryError?.message ?? '';
  const detailKey = queryKeys.partners.detail(id);

  const intMut = useApiMutation(
    () =>
      apiClient.post(`/crm/partners/${id}/interactions`, {
        type: form.type,
        subject: form.subject,
        description: form.description,
        ...(form.outcome && { outcome: form.outcome }),
        ...(form.satisfaction && { satisfaction: Number(form.satisfaction) }),
      }),
    {
      invalidateKeys: [detailKey],
      onSuccess: () => {
        setShowForm(false);
        setForm(EMPTY_FORM);
      },
      onError: (e) =>
        notify({ title: e.message || 'Erro inesperado', intent: 'danger' }),
    },
  );
  const saving = intMut.isPending;

  const completeMut = useApiMutation(
    (milestoneId: string) =>
      apiClient.put(`/crm/partners/milestones/${milestoneId}/complete`, {}),
    {
      invalidateKeys: [detailKey],
      onError: (e) =>
        notify({ title: e.message || 'Erro inesperado', intent: 'danger' }),
    },
  );

  function submitInteraction(e: React.FormEvent) {
    e.preventDefault();
    intMut.mutate(undefined);
  }

  function completeMilestone(milestoneId: string) {
    completeMut.mutate(milestoneId);
  }

  // Eliminar parceiro — só ADMIN/RH (espelha @Roles(ADMIN, RH) do
  // DELETE /crm/partners/:id, que faz soft delete). O backend é a
  // barreira real; esconder o botão é só defesa em profundidade.
  const role = me?.role?.name as Role | undefined;
  const canDelete = !!role && ADMIN_ROLES.includes(role);

  const deleteMut = useApiMutation(
    () => apiClient.delete(`/crm/partners/${id}`),
    {
      invalidateKeys: [queryKeys.partners.all],
      onSuccess: () => {
        notify({ title: 'Parceiro eliminado.', intent: 'success' });
        router.push('/crm/partners');
      },
      onError: (e) =>
        notify({ title: e.message || 'Erro ao eliminar', intent: 'danger' }),
    },
  );

  async function onDelete() {
    const ok = await confirm({
      title: `Eliminar "${partner?.name ?? 'parceiro'}"?`,
      message:
        'O parceiro deixa de aparecer nas listagens. Esta acção não pode ser desfeita pela interface.',
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (ok) deleteMut.mutate(undefined);
  }

  return {
    partner,
    loading,
    error,
    showForm,
    setShowForm,
    form,
    setForm,
    submitInteraction,
    completeMilestone,
    saving,
    canDelete,
    onDelete,
    isDeleting: deleteMut.isPending,
  };
}

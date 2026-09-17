// hooks/usePartnerDetail.ts
// Extraído de app/(platform)/crm/partners/[id]/page.tsx.

'use client';

import { useState } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { useResourceDelete } from '@/hooks/useResourceDelete';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import {
  EMPTY_MILESTONE_FORM,
  type PartnerDetail,
  type InteractionForm,
  type MilestoneForm,
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
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<InteractionForm>(EMPTY_FORM);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState<MilestoneForm>(
    EMPTY_MILESTONE_FORM,
  );

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

  // POST /crm/partners/:id/milestones — existia no backend sem nenhum
  // consumidor no frontend (só era possível concluir milestones já criados
  // pelo seed, nunca criar um novo pela UI).
  const milestoneMut = useApiMutation(
    () =>
      apiClient.post(`/crm/partners/${id}/milestones`, {
        title: milestoneForm.title,
        dueDate: milestoneForm.dueDate,
        ...(milestoneForm.description && {
          description: milestoneForm.description,
        }),
        ...(milestoneForm.value && { value: Number(milestoneForm.value) }),
        ...(milestoneForm.currency && { currency: milestoneForm.currency }),
        ...(milestoneForm.priority && { priority: milestoneForm.priority }),
      }),
    {
      invalidateKeys: [detailKey],
      onSuccess: () => {
        setShowMilestoneForm(false);
        setMilestoneForm(EMPTY_MILESTONE_FORM);
      },
      onError: (e) =>
        notify({ title: e.message || 'Erro inesperado', intent: 'danger' }),
    },
  );

  function submitMilestone(e: React.FormEvent) {
    e.preventDefault();
    milestoneMut.mutate(undefined);
  }

  // Eliminar parceiro — só ADMIN/RH (espelha @Roles(ADMIN, RH) do
  // DELETE /crm/partners/:id, que faz soft delete). Ver useResourceDelete.
  const { canDelete, onDelete, isDeleting } = useResourceDelete({
    basePath: '/crm/partners',
    id,
    invalidateKey: queryKeys.partners.all,
    confirmTitle: `Eliminar "${partner?.name ?? 'parceiro'}"?`,
    confirmMessage:
      'O parceiro deixa de aparecer nas listagens. Esta acção não pode ser desfeita pela interface.',
    successMessage: 'Parceiro eliminado.',
    redirectTo: '/crm/partners',
  });

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
    showMilestoneForm,
    setShowMilestoneForm,
    milestoneForm,
    setMilestoneForm,
    submitMilestone,
    savingMilestone: milestoneMut.isPending,
    saving,
    canDelete,
    onDelete,
    isDeleting,
  };
}

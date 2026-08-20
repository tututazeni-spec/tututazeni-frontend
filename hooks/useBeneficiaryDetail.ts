// hooks/useBeneficiaryDetail.ts
// Extraído de app/(platform)/crm/beneficiaries/[id]/page.tsx.
// Mantém o padrão de Optimistic UI original: a interacção aparece na lista
// antes da API confirmar, com rollback automático em erro.

'use client';

import { useState } from 'react';
import { useApiQuery, useOptimisticMutation } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import {
  EMPTY_INTERACTION_FORM,
  type BeneficiaryDetail,
  type Interaction,
  type InteractionForm,
} from '@/components/crm/beneficiaries/types';

export function useBeneficiaryDetail(id: string) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<InteractionForm>(EMPTY_INTERACTION_FORM);
  const notify = useToast();

  // GET com cache + cancelamento automático ao desmontar/mudar id.
  const {
    data: beneficiary,
    isLoading,
    isError,
    error,
  } = useApiQuery<BeneficiaryDetail>(
    queryKeys.beneficiaries.detail(id),
    `/crm/beneficiaries/${id}`,
    { enabled: !!id, staleTime: STALE_TIME.DYNAMIC },
  );

  // Optimistic UI: a nova interacção aparece na lista antes de a API responder;
  // em erro faz rollback automático e re-sincroniza no fim.
  const addInteraction = useOptimisticMutation<
    BeneficiaryDetail,
    InteractionForm
  >({
    key: queryKeys.beneficiaries.detail(id),
    mutationFn: (f) => {
      const payload = {
        type: f.type,
        subject: f.subject,
        description: f.description,
        ...(f.outcome && { outcome: f.outcome }),
        ...(f.satisfaction && { satisfaction: Number(f.satisfaction) }),
      };
      return apiClient.post<BeneficiaryDetail>(
        `/crm/beneficiaries/${id}/interactions`,
        payload,
      );
    },
    applyOptimistic: (prev, f) => {
      if (!prev) return prev;
      const optimistic: Interaction = {
        id: `optimistic-${Date.now()}`,
        type: f.type,
        subject: f.subject,
        description: f.description,
        date: new Date().toISOString(),
        outcome: f.outcome || null,
        satisfaction: f.satisfaction ? Number(f.satisfaction) : null,
        user: null,
        _optimistic: true,
      };
      return { ...prev, interactions: [optimistic, ...prev.interactions] };
    },
    onError: (err) => {
      notify({
        title: err.message || 'Erro ao guardar interacção',
        intent: 'danger',
      });
    },
  });

  function submitInteraction(e: React.FormEvent) {
    e.preventDefault();
    // UI optimista: fecha o form e limpa de imediato; a entrada já aparece na lista.
    addInteraction.mutate(form);
    setShowForm(false);
    setForm(EMPTY_INTERACTION_FORM);
  }

  return {
    beneficiary,
    isLoading,
    isError,
    errorMessage: error?.message || 'Beneficiário não encontrado',
    showForm,
    setShowForm,
    form,
    setForm,
    submitInteraction,
  };
}

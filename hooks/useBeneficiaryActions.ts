// hooks/useBeneficiaryActions.ts
// Mutações do detalhe de um beneficiário (interacções e necessidades). Cada
// secção da vista usa a sua e trata do seu próprio formulário; antes tudo
// vivia em useBeneficiaryDetail, que devolvia o estado dos formulários, os
// setters e os submits para BeneficiaryDetailView.

'use client';

import { useApiMutation, useOptimisticMutation } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import type {
  BeneficiaryDetail,
  Interaction,
  InteractionForm,
  NeedForm,
} from '@/components/crm/beneficiaries/types';

/**
 * Optimistic UI: a nova interacção aparece na lista antes de a API responder;
 * em erro faz rollback automático e re-sincroniza no fim.
 */
export function useAddBeneficiaryInteraction(beneficiaryId: string) {
  const notify = useToast();
  return useOptimisticMutation<BeneficiaryDetail, InteractionForm>({
    key: queryKeys.beneficiaries.detail(beneficiaryId),
    mutationFn: (f) => {
      const payload = {
        type: f.type,
        subject: f.subject,
        description: f.description,
        ...(f.outcome && { outcome: f.outcome }),
        ...(f.satisfaction && { satisfaction: Number(f.satisfaction) }),
        ...(f.channel && { channel: f.channel }),
        ...(f.nextAction && { nextAction: f.nextAction }),
        ...(f.nextActionDate && { nextActionDate: f.nextActionDate }),
        ...(f.notes && { notes: f.notes }),
      };
      return apiClient.post<BeneficiaryDetail>(
        `/crm/beneficiaries/${beneficiaryId}/interactions`,
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
}

// POST /crm/beneficiaries/:id/needs — existia no backend sem nenhum
// consumidor no frontend (a secção "Necessidades" só listava, nunca criava).
export function useAddNeed(beneficiaryId: string) {
  const notify = useToast();
  return useApiMutation<BeneficiaryDetail, NeedForm>(
    (f) =>
      apiClient.post<BeneficiaryDetail>(
        `/crm/beneficiaries/${beneficiaryId}/needs`,
        f,
      ),
    {
      invalidateKeys: [queryKeys.beneficiaries.detail(beneficiaryId)],
      onError: (err) =>
        notify({
          title: err.message || 'Erro ao registar necessidade',
          intent: 'danger',
        }),
    },
  );
}

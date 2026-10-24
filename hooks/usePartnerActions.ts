// hooks/usePartnerActions.ts
// Mutações do detalhe de um parceiro (interacções e marcos). Cada secção da
// vista usa só a(s) que precisa e trata do seu próprio formulário; antes tudo
// vivia em usePartnerDetail, que devolvia o estado dos formulários, os
// setters e os submits para PartnerDetailView.

'use client';

import { useCrmDetailMutation } from '@/hooks/useCrmDetailMutation';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import type {
  InteractionForm,
  MilestoneForm,
} from '@/components/crm/partners/types';

export const useCreatePartnerInteraction = (partnerId: string) =>
  useCrmDetailMutation(
    queryKeys.partners.detail(partnerId),
    (form: InteractionForm) =>
      apiClient.post(`/crm/partners/${partnerId}/interactions`, {
        type: form.type,
        subject: form.subject,
        description: form.description,
        ...(form.outcome && { outcome: form.outcome }),
        ...(form.satisfaction && { satisfaction: Number(form.satisfaction) }),
      }),
  );

export const useCompleteMilestone = (partnerId: string) =>
  useCrmDetailMutation(
    queryKeys.partners.detail(partnerId),
    (milestoneId: string) =>
      apiClient.put(`/crm/partners/milestones/${milestoneId}/complete`, {}),
  );

// POST /crm/partners/:id/milestones — existia no backend sem nenhum
// consumidor no frontend (só era possível concluir milestones já criados
// pelo seed, nunca criar um novo pela UI).
export const useCreateMilestone = (partnerId: string) =>
  useCrmDetailMutation(
    queryKeys.partners.detail(partnerId),
    (form: MilestoneForm) =>
      apiClient.post(`/crm/partners/${partnerId}/milestones`, {
        title: form.title,
        dueDate: form.dueDate,
        ...(form.description && { description: form.description }),
        ...(form.value && { value: Number(form.value) }),
        ...(form.currency && { currency: form.currency }),
        ...(form.priority && { priority: form.priority }),
      }),
  );

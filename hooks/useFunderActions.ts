// hooks/useFunderActions.ts
// Mutações do detalhe de um financiador (grants, desembolsos, relatórios,
// interacções). Cada secção da vista usa só a(s) que precisa e trata do seu
// próprio formulário; antes tudo vivia em useFunderDetail, que devolvia ~30
// valores (estado dos formulários + setters + submits) para FunderDetailView.
//
// Todas invalidam o detalhe do financiador e mostram o erro num toast. O que
// acontece em caso de sucesso (fechar o formulário, limpar campos) fica a
// cargo de quem chama, via `mutate(vars, { onSuccess })`.

'use client';

import { useApiMutation } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import type {
  CreateReportForm,
  GrantForm,
  InteractionForm,
} from '@/components/crm/funders/types';

function useFunderMutation<TVars>(
  funderId: string,
  mutationFn: (vars: TVars) => Promise<unknown>,
) {
  const notify = useToast();
  return useApiMutation(mutationFn, {
    invalidateKeys: [queryKeys.funders.detail(funderId)],
    onError: (e) =>
      notify({ title: e.message || 'Erro inesperado', intent: 'danger' }),
  });
}

export const useCreateGrant = (funderId: string) =>
  useFunderMutation(funderId, (form: GrantForm) =>
    apiClient.post(`/crm/funders/${funderId}/grants`, {
      title: form.title,
      amount: Number(form.amount),
      startDate: form.startDate,
      ...(form.endDate && { endDate: form.endDate }),
    }),
  );

export const useCreateInteraction = (funderId: string) =>
  useFunderMutation(funderId, (form: InteractionForm) =>
    apiClient.post(`/crm/funders/${funderId}/interactions`, {
      type: form.type,
      subject: form.subject,
      description: form.description,
      ...(form.outcome && { outcome: form.outcome }),
    }),
  );

export const useAddDisbursement = (funderId: string) =>
  useFunderMutation(funderId, (vars: { grantId: string; amount: number }) =>
    apiClient.post(`/crm/funders/grants/${vars.grantId}/disbursements`, {
      amount: vars.amount,
      receivedAt: new Date().toISOString().slice(0, 10),
    }),
  );

// PUT /crm/funders/grants/:grantId/status — existia no backend sem nenhum
// consumidor no frontend (grants só podiam ser criados, nunca actualizados).
export const useUpdateGrantStatus = (funderId: string) =>
  useFunderMutation(funderId, (vars: { grantId: string; status: string }) =>
    apiClient.put(`/crm/funders/grants/${vars.grantId}/status`, {
      status: vars.status,
    }),
  );

// POST /crm/funders/:id/reports — existia no backend sem nenhum consumidor
// no frontend (a secção "Relatórios" só listava, nunca criava).
export const useCreateReport = (funderId: string) =>
  useFunderMutation(funderId, (form: CreateReportForm) =>
    apiClient.post(`/crm/funders/${funderId}/reports`, {
      title: form.title,
      period: form.period,
      dueDate: form.dueDate,
      ...(form.grantId && { grantId: form.grantId }),
    }),
  );

// PUT /crm/funders/reports/:reportId/submit — existia no backend sem nenhum
// consumidor no frontend (nunca era possível anexar o ficheiro e avançar um
// relatório de PENDING para SUBMITTED pela UI).
export const useSubmitReport = (funderId: string) =>
  useFunderMutation(funderId, (vars: { reportId: string; fileUrl: string }) =>
    apiClient.put(`/crm/funders/reports/${vars.reportId}/submit`, {
      fileUrl: vars.fileUrl,
    }),
  );

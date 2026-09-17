// hooks/useFunderDetail.ts
// Detalhe de um financiador + mutações (grants, interacções, desembolsos).
// Extraído de app/(platform)/crm/funders/[id]/page.tsx.

'use client';

import { useState } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { useResourceDelete } from '@/hooks/useResourceDelete';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import {
  EMPTY_REPORT_FORM,
  type FunderDetail,
  type GrantForm,
  type InteractionForm,
  type CreateReportForm,
} from '@/components/crm/funders/types';

const EMPTY_GRANT_FORM: GrantForm = {
  title: '',
  amount: '',
  startDate: '',
  endDate: '',
};

const EMPTY_INTERACTION_FORM: InteractionForm = {
  type: 'MEETING',
  subject: '',
  description: '',
  outcome: '',
};

export function useFunderDetail(id: string) {
  const notify = useToast();
  const [showGrantForm, setShowGrantForm] = useState(false);
  const [grantForm, setGrantForm] = useState<GrantForm>(EMPTY_GRANT_FORM);

  const [showIntForm, setShowIntForm] = useState(false);
  const [intForm, setIntForm] = useState<InteractionForm>(
    EMPTY_INTERACTION_FORM,
  );

  const [showReportForm, setShowReportForm] = useState(false);
  const [reportForm, setReportForm] = useState<CreateReportForm>(
    EMPTY_REPORT_FORM,
  );
  const [submittingReportId, setSubmittingReportId] = useState<string | null>(
    null,
  );
  const [reportFileUrl, setReportFileUrl] = useState('');

  const {
    data: funder,
    isLoading: loading,
    error: queryError,
  } = useApiQuery<FunderDetail>(
    queryKeys.funders.detail(id),
    `/crm/funders/${id}`,
    { enabled: !!id, staleTime: STALE_TIME.DYNAMIC },
  );
  const error = queryError?.message ?? '';
  const detailKey = queryKeys.funders.detail(id);

  const grantMut = useApiMutation(
    () =>
      apiClient.post(`/crm/funders/${id}/grants`, {
        title: grantForm.title,
        amount: Number(grantForm.amount),
        startDate: grantForm.startDate,
        ...(grantForm.endDate && { endDate: grantForm.endDate }),
      }),
    {
      invalidateKeys: [detailKey],
      onSuccess: () => {
        setShowGrantForm(false);
        setGrantForm(EMPTY_GRANT_FORM);
      },
      onError: (e) =>
        notify({ title: e.message || 'Erro inesperado', intent: 'danger' }),
    },
  );

  const intMut = useApiMutation(
    () =>
      apiClient.post(`/crm/funders/${id}/interactions`, {
        type: intForm.type,
        subject: intForm.subject,
        description: intForm.description,
        ...(intForm.outcome && { outcome: intForm.outcome }),
      }),
    {
      invalidateKeys: [detailKey],
      onSuccess: () => {
        setShowIntForm(false);
        setIntForm(EMPTY_INTERACTION_FORM);
      },
      onError: (e) =>
        notify({ title: e.message || 'Erro inesperado', intent: 'danger' }),
    },
  );

  const disbMut = useApiMutation(
    (vars: { grantId: string; amount: number }) =>
      apiClient.post(`/crm/funders/grants/${vars.grantId}/disbursements`, {
        amount: vars.amount,
        receivedAt: new Date().toISOString().slice(0, 10),
      }),
    {
      invalidateKeys: [detailKey],
      onError: (e) =>
        notify({ title: e.message || 'Erro inesperado', intent: 'danger' }),
    },
  );

  // PUT /crm/funders/grants/:grantId/status — existia no backend sem nenhum
  // consumidor no frontend (grants só podiam ser criados, nunca actualizados).
  const grantStatusMut = useApiMutation(
    (vars: { grantId: string; status: string }) =>
      apiClient.put(`/crm/funders/grants/${vars.grantId}/status`, {
        status: vars.status,
      }),
    {
      invalidateKeys: [detailKey],
      onError: (e) =>
        notify({ title: e.message || 'Erro inesperado', intent: 'danger' }),
    },
  );

  // POST /crm/funders/:id/reports — existia no backend sem nenhum consumidor
  // no frontend (a secção "Relatórios" só listava, nunca criava).
  const reportMut = useApiMutation(
    () =>
      apiClient.post(`/crm/funders/${id}/reports`, {
        title: reportForm.title,
        period: reportForm.period,
        dueDate: reportForm.dueDate,
        ...(reportForm.grantId && { grantId: reportForm.grantId }),
      }),
    {
      invalidateKeys: [detailKey],
      onSuccess: () => {
        setShowReportForm(false);
        setReportForm(EMPTY_REPORT_FORM);
      },
      onError: (e) =>
        notify({ title: e.message || 'Erro inesperado', intent: 'danger' }),
    },
  );

  // PUT /crm/funders/reports/:reportId/submit — existia no backend sem
  // nenhum consumidor no frontend (nunca era possível anexar o ficheiro e
  // avançar um relatório de PENDING para SUBMITTED pela UI).
  const submitReportMut = useApiMutation(
    (vars: { reportId: string; fileUrl: string }) =>
      apiClient.put(`/crm/funders/reports/${vars.reportId}/submit`, {
        fileUrl: vars.fileUrl,
      }),
    {
      invalidateKeys: [detailKey],
      onSuccess: () => {
        setSubmittingReportId(null);
        setReportFileUrl('');
        notify({ title: 'Relatório submetido.', intent: 'success' });
      },
      onError: (e) =>
        notify({ title: e.message || 'Erro inesperado', intent: 'danger' }),
    },
  );

  function updateGrantStatus(grantId: string, status: string) {
    grantStatusMut.mutate({ grantId, status });
  }

  function submitReportForm(e: React.FormEvent) {
    e.preventDefault();
    reportMut.mutate(undefined);
  }

  function confirmReportSubmission(reportId: string) {
    if (!reportFileUrl.trim()) return;
    submitReportMut.mutate({ reportId, fileUrl: reportFileUrl.trim() });
  }

  const saving = grantMut.isPending || intMut.isPending;

  function submitGrant(e: React.FormEvent) {
    e.preventDefault();
    grantMut.mutate(undefined);
  }

  function submitInteraction(e: React.FormEvent) {
    e.preventDefault();
    intMut.mutate(undefined);
  }

  function addDisbursement(grantId: string) {
    const amountStr = window.prompt('Valor do desembolso (AOA):');
    if (!amountStr) return;
    const amount = Number(amountStr);
    if (!amount || amount <= 0) {
      notify({ title: 'Valor inválido', intent: 'danger' });
      return;
    }
    disbMut.mutate({ grantId, amount });
  }

  // Eliminar financiador — só ADMIN/RH (espelha @Roles(ADMIN, RH) do
  // DELETE /crm/funders/:id, que faz soft delete). Ver useResourceDelete.
  const { canDelete, onDelete, isDeleting } = useResourceDelete({
    basePath: '/crm/funders',
    id,
    invalidateKey: queryKeys.funders.all,
    confirmTitle: `Eliminar "${funder?.name ?? 'financiador'}"?`,
    confirmMessage:
      'O financiador deixa de aparecer nas listagens. Esta acção não pode ser desfeita pela interface.',
    successMessage: 'Financiador eliminado.',
    redirectTo: '/crm/funders',
  });

  return {
    funder,
    loading,
    error,
    showGrantForm,
    setShowGrantForm,
    grantForm,
    setGrantForm,
    submitGrant,
    showIntForm,
    setShowIntForm,
    intForm,
    setIntForm,
    submitInteraction,
    addDisbursement,
    updateGrantStatus,
    showReportForm,
    setShowReportForm,
    reportForm,
    setReportForm,
    submitReportForm,
    savingReport: reportMut.isPending,
    submittingReportId,
    setSubmittingReportId,
    reportFileUrl,
    setReportFileUrl,
    confirmReportSubmission,
    submittingReport: submitReportMut.isPending,
    saving,
    canDelete,
    onDelete,
    isDeleting,
  };
}

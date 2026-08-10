// hooks/useFunderDetail.ts
// Detalhe de um financiador + mutações (grants, interacções, desembolsos).
// Extraído de app/(platform)/crm/funders/[id]/page.tsx.

'use client';

import { useState } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type {
  FunderDetail,
  GrantForm,
  InteractionForm,
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
  const [showGrantForm, setShowGrantForm] = useState(false);
  const [grantForm, setGrantForm] = useState<GrantForm>(EMPTY_GRANT_FORM);

  const [showIntForm, setShowIntForm] = useState(false);
  const [intForm, setIntForm] = useState<InteractionForm>(
    EMPTY_INTERACTION_FORM,
  );

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
      onError: (e) => alert(e.message || 'Erro inesperado'),
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
      onError: (e) => alert(e.message || 'Erro inesperado'),
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
      onError: (e) => alert(e.message || 'Erro inesperado'),
    },
  );

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
      alert('Valor inválido');
      return;
    }
    disbMut.mutate({ grantId, amount });
  }

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
    saving,
  };
}

// hooks/useBeneficiaryDetail.ts
// Extraído de app/(platform)/crm/beneficiaries/[id]/page.tsx.
// Detalhe, extras (sub-recursos dos separadores) e eliminação. As mutações de
// interacções (optimista) e necessidades vivem em hooks/useBeneficiaryActions.ts,
// usadas pelas secções da vista que têm os respectivos formulários.

'use client';

import { useState } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { useResourceDelete } from '@/hooks/useResourceDelete';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type {
  BeneficiaryDetail,
  BeneficiaryHistoryEntry,
} from '@/components/crm/beneficiaries/types';

export function useBeneficiaryDetail(id: string) {
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

  // ─── Extras (docs/modulo_crm_beneficiario.md) ─────────────────────────────
  // Mutações genéricas: cada separador do detalhe chama `post`/`put`/`remove`
  // com o sub-recurso e invalida o detalhe. `patchProfile` edita campos do
  // próprio beneficiário (acompanhamento, consentimentos).
  const detailKey = queryKeys.beneficiaries.detail(id);
  const onMutationError = (err: Error) =>
    notify({ title: err.message || 'Erro ao guardar', intent: 'danger' });

  const addSub = useApiMutation<unknown, { path: string; body: unknown }>(
    ({ path, body }) => apiClient.post(`/crm/beneficiaries/${path}`, body),
    { invalidateKeys: [detailKey], onError: onMutationError },
  );
  const putSub = useApiMutation<unknown, { path: string; body: unknown }>(
    ({ path, body }) => apiClient.put(`/crm/beneficiaries/${path}`, body),
    { invalidateKeys: [detailKey], onError: onMutationError },
  );
  const removeSub = useApiMutation<unknown, { path: string }>(
    ({ path }) => apiClient.delete(`/crm/beneficiaries/${path}`),
    { invalidateKeys: [detailKey], onError: onMutationError },
  );
  const patchProfile = useApiMutation<unknown, Record<string, unknown>>(
    (body) => apiClient.put(`/crm/beneficiaries/${id}`, body),
    {
      invalidateKeys: [detailKey, queryKeys.beneficiaries.lists()],
      onSuccess: () =>
        notify({ title: 'Alterações guardadas.', intent: 'success' }),
      onError: onMutationError,
    },
  );

  // Histórico de alterações (carregado só quando o separador abre).
  const [historyEnabled, setHistoryEnabled] = useState(false);
  const history = useApiQuery<{ data: BeneficiaryHistoryEntry[] }>(
    [...detailKey, 'history'],
    `/crm/beneficiaries/${id}/history?limit=50`,
    { enabled: !!id && historyEnabled, staleTime: STALE_TIME.DYNAMIC },
  );

  const extras = {
    id,
    addSub,
    putSub,
    removeSub,
    patchProfile,
    history,
    setHistoryEnabled,
  };

  // Eliminar beneficiário — só ADMIN/RH (espelha @Roles(ADMIN, RH) do
  // DELETE /crm/beneficiaries/:id, que faz soft delete). Ver useResourceDelete.
  const { canDelete, onDelete, isDeleting } = useResourceDelete({
    basePath: '/crm/beneficiaries',
    id,
    invalidateKey: queryKeys.beneficiaries.all,
    confirmTitle: `Eliminar "${beneficiary?.fullName ?? 'beneficiário'}"?`,
    confirmMessage:
      'O beneficiário deixa de aparecer nas listagens. Esta acção não pode ser desfeita pela interface.',
    successMessage: 'Beneficiário eliminado.',
    redirectTo: '/crm/beneficiaries',
  });

  return {
    beneficiary,
    isLoading,
    isError,
    errorMessage: error?.message || 'Beneficiário não encontrado',
    canDelete,
    onDelete,
    isDeleting,
    extras,
  };
}

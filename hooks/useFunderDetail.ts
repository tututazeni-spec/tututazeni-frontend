// hooks/useFunderDetail.ts
// Detalhe de um financiador + eliminação. Extraído de
// app/(platform)/crm/funders/[id]/page.tsx.
//
// As mutações de grants, relatórios e interacções (e o estado dos respectivos
// formulários) vivem nas secções da vista — ver hooks/useFunderActions.ts e
// components/crm/funders/*Section.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useResourceDelete } from '@/hooks/useResourceDelete';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { FunderDetail } from '@/components/crm/funders/types';

export function useFunderDetail(id: string) {
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

  return { funder, loading, error, canDelete, onDelete, isDeleting };
}

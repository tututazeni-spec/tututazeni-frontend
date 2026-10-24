// hooks/usePartnerDetail.ts
// Detalhe de um parceiro + eliminação. Extraído de
// app/(platform)/crm/partners/[id]/page.tsx.
//
// As mutações de marcos e interacções (e o estado dos respectivos
// formulários) vivem nas secções da vista — ver hooks/usePartnerActions.ts e
// components/crm/partners/*Section.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useResourceDelete } from '@/hooks/useResourceDelete';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { PartnerDetail } from '@/components/crm/partners/types';

export function usePartnerDetail(id: string) {
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

  return { partner, loading, error, canDelete, onDelete, isDeleting };
}

// hooks/useCrmDetailMutation.ts
// Mutation de uma secção do detalhe CRM (financiador, parceiro, beneficiário):
// invalida a query do detalhe e mostra o erro num toast. O que acontece em
// caso de sucesso (fechar o formulário, limpar campos) fica a cargo de quem
// chama, via `mutate(vars, { onSuccess })`.

'use client';

import type { QueryKey } from '@tanstack/react-query';
import { useApiMutation } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';

export function useCrmDetailMutation<TVars>(
  detailKey: QueryKey,
  mutationFn: (vars: TVars) => Promise<unknown>,
) {
  const notify = useToast();
  return useApiMutation(mutationFn, {
    invalidateKeys: [detailKey],
    onError: (e) =>
      notify({ title: e.message || 'Erro inesperado', intent: 'danger' }),
  });
}

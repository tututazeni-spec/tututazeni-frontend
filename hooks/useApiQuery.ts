// hooks/useApiQuery.ts
// Wrappers finos sobre o React Query, ligados ao apiClient único.
//
// Vantagens que isto traz de borla a todas as páginas:
// - Cancelamento: o `signal` do React Query é passado ao fetch; ao desmontar o
//   componente (ou ao mudar a key), o pedido em curso é abortado.
// - Caching, dedup, retry com backoff e loading/error states vêm do QueryClient.
// - Optimistic UI: `useOptimisticMutation` aplica a UI antes da resposta e faz
//   rollback automático em caso de erro.

'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { apiClient, type RequestOptions } from '../lib/apiClient';

// ─── GET ───────────────────────────────────────────────────────────────────

type ApiQueryOptions<T> = Omit<
  UseQueryOptions<T, Error, T, QueryKey>,
  'queryKey' | 'queryFn'
> & {
  /** Query string params enxutos (null/'' são omitidos pelo apiClient). */
  params?: RequestOptions['params'];
};

/**
 * GET tipado e cacheado. O path é a fonte de verdade do endpoint; a key controla
 * cache/dedup/invalidação.
 *
 * @example
 *   const { data, isLoading, error } = useApiQuery(
 *     queryKeys.beneficiaries.list(params), '/crm/beneficiaries',
 *     { params, staleTime: STALE_TIME.DYNAMIC },
 *   );
 */
export function useApiQuery<T>(
  key: QueryKey,
  path: string,
  options?: ApiQueryOptions<T>,
) {
  const { params, ...queryOptions } = options ?? {};
  return useQuery<T, Error, T, QueryKey>({
    queryKey: key,
    queryFn: ({ signal }) => apiClient.get<T>(path, { params, signal }),
    ...queryOptions,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/**
 * Mutação simples. Por defeito invalida as keys indicadas em `invalidateKeys`
 * após sucesso, para refrescar listas/detalhes afectados.
 */
export function useApiMutation<TData, TVariables>(
  mutationFn: (vars: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, Error, TVariables> & {
    invalidateKeys?: QueryKey[];
  },
) {
  const qc = useQueryClient();
  const { invalidateKeys, onSuccess, ...rest } = options ?? {};
  return useMutation<TData, Error, TVariables>({
    mutationFn,
    ...rest,
    // Forward de todos os args que o React Query passar (assinatura varia entre versões).
    onSuccess: (...args: Parameters<NonNullable<typeof onSuccess>>) => {
      invalidateKeys?.forEach((k) => qc.invalidateQueries({ queryKey: k }));
      onSuccess?.(...args);
    },
  });
}

/**
 * Mutação com Optimistic UI: actualiza a cache da `key` ANTES da API responder
 * e reverte automaticamente se falhar. Re-sincroniza no fim (settled).
 *
 * @example
 *   const add = useOptimisticMutation<Detail, NewItem>({
 *     key: queryKeys.beneficiaries.detail(id),
 *     mutationFn: (item) => apiClient.post(`/.../interactions`, item),
 *     applyOptimistic: (prev, item) => prev && { ...prev,
 *       interactions: [optimistic(item), ...prev.interactions] },
 *   });
 */
export function useOptimisticMutation<TData, TVariables>(config: {
  key: QueryKey;
  mutationFn: (vars: TVariables) => Promise<TData>;
  applyOptimistic: (previous: TData | undefined, vars: TVariables) => TData | undefined;
  onError?: (error: Error, vars: TVariables) => void;
  onSuccess?: (data: TData, vars: TVariables) => void;
}) {
  const qc = useQueryClient();
  return useMutation<TData, Error, TVariables, { previous: TData | undefined }>({
    mutationFn: config.mutationFn,
    onMutate: async (vars) => {
      // Cancela refetches em curso para não sobreporem o optimistic update.
      await qc.cancelQueries({ queryKey: config.key });
      const previous = qc.getQueryData<TData>(config.key);
      qc.setQueryData<TData>(config.key, (prev) =>
        config.applyOptimistic(prev, vars),
      );
      return { previous };
    },
    onError: (error, vars, ctx) => {
      // Rollback.
      if (ctx) qc.setQueryData(config.key, ctx.previous);
      config.onError?.(error, vars);
    },
    onSuccess: (data, vars) => config.onSuccess?.(data, vars),
    onSettled: () => {
      // Garante consistência com o servidor.
      qc.invalidateQueries({ queryKey: config.key });
    },
  });
}

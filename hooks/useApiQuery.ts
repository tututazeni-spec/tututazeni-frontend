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

/** Actualização optimista da cache de `key` antes de a API responder. */
export interface OptimisticConfig<TVariables, TCache> {
  key: QueryKey;
  /** Devolve o novo valor da cache; `prev` é `undefined` se a query não estiver carregada. */
  update: (prev: TCache | undefined, vars: TVariables) => TCache | undefined;
}

/**
 * Mutação simples. Por defeito invalida as keys indicadas em `invalidateKeys`
 * após sucesso, para refrescar listas/detalhes afectados.
 *
 * Com `optimistic`, a cache da key é actualizada ANTES da API responder; em
 * erro faz rollback automático ao snapshot. Para acções de um clique
 * (activar/desactivar, publicar) em que o resultado é previsível.
 */
export function useApiMutation<TData, TVariables, TCache = unknown>(
  mutationFn: (vars: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, Error, TVariables> & {
    invalidateKeys?: QueryKey[];
    optimistic?: OptimisticConfig<TVariables, TCache>;
  },
) {
  const qc = useQueryClient();
  const {
    invalidateKeys,
    onSuccess,
    optimistic,
    onMutate,
    onError,
    ...rest
  } = options ?? {};
  return useMutation<
    TData,
    Error,
    TVariables,
    { snapshot?: TCache; custom?: unknown }
  >({
    mutationFn,
    ...rest,
    onMutate: async (vars, ...more) => {
      const custom = await onMutate?.(vars, ...more);
      if (!optimistic) return { custom };
      // Cancela refetches em curso para não sobreporem a UI optimista.
      await qc.cancelQueries({ queryKey: optimistic.key });
      const snapshot = qc.getQueryData<TCache>(optimistic.key);
      qc.setQueryData<TCache>(optimistic.key, (prev) =>
        optimistic.update(prev, vars),
      );
      return { snapshot, custom };
    },
    onError: (error, vars, ctx, ...more) => {
      if (optimistic && ctx) qc.setQueryData(optimistic.key, ctx.snapshot);
      (onError as any)?.(error, vars, ctx?.custom, ...more);
    },
    // Forward de todos os args que o React Query passar (assinatura varia entre versões).
    onSuccess: (...args: Parameters<NonNullable<typeof onSuccess>>) => {
      invalidateKeys?.forEach((k) => qc.invalidateQueries({ queryKey: k }));
      onSuccess?.(...args);
    },
    onSettled: () => {
      // Garante consistência com o servidor mesmo após rollback.
      if (optimistic) qc.invalidateQueries({ queryKey: optimistic.key });
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
  applyOptimistic: (
    previous: TData | undefined,
    vars: TVariables,
  ) => TData | undefined;
  onError?: (error: Error, vars: TVariables) => void;
  onSuccess?: (data: TData, vars: TVariables) => void;
}) {
  const qc = useQueryClient();
  return useMutation<TData, Error, TVariables, { previous: TData | undefined }>(
    {
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
    },
  );
}

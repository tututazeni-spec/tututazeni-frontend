// lib/queryClient.ts
// QueryClient configurado para o INNOVA.
//
// Regras de optimização aplicadas:
// - Caching estratégico por "camadas" de frescura (STATIC / SEMI_STATIC /
//   DYNAMIC / REALTIME) — ver STALE_TIME. Dados estáticos ficam em cache por
//   tempo determinado e não são re-pedidos a cada montagem.
// - Retry com exponential backoff, mas SEM repetir erros 4xx (cliente).
// - Deduplicação automática: pedidos iguais simultâneos partilham a mesma
//   resposta (resolve os waterfalls/duplicados, ex: /dashboard/alerts pedido 3×).

import { QueryClient, type DefaultOptions } from '@tanstack/react-query';
import { ApiError } from './apiClient';

/** Camadas de frescura (staleTime) em milissegundos. */
export const STALE_TIME = {
  /** Quase imutável durante a sessão: roles, departamentos, catálogos. */
  STATIC: 60 * 60 * 1000, // 1h
  /** Muda com pouca frequência: listas de cursos, competências. */
  SEMI_STATIC: 5 * 60 * 1000, // 5min
  /** Dados de negócio normais: listagens, detalhes. */
  DYNAMIC: 30 * 1000, // 30s
  /** Sempre fresco; tipicamente combinado com polling. */
  REALTIME: 0,
} as const;

const MAX_RETRIES = 3;

const defaultOptions: DefaultOptions = {
  queries: {
    // Frescura por defeito: dados de negócio. Override por query conforme a camada.
    staleTime: STALE_TIME.DYNAMIC,
    // Mantém em cache 5min após deixar de ser usado (navegação rápida sem refetch).
    gcTime: 5 * 60 * 1000,
    // Retry inteligente: nunca repetir 4xx; até 3 tentativas para 5xx/rede.
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.isClientError) return false;
      return failureCount < MAX_RETRIES;
    },
    // Exponential backoff com tecto de 30s: 1s, 2s, 4s, 8s...
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
    // Evita tempestade de refetch ao alternar de separador; reconnect sim.
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },
  mutations: {
    // Mutações repetem uma vez em falha de rede/servidor (não em 4xx).
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.isClientError) return false;
      return failureCount < 1;
    },
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
  },
};

export function makeQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions });
}

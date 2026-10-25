// hooks/useSearch.ts
// Extraído de app/(platform)/search/page.tsx — estado da pesquisa
// (query/results/activeType/autocomplete) e a mutação parametrizada que
// serve tanto a pesquisa geral como a pesquisa filtrada por tipo.

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { apiClient } from '@/lib/apiClient';
import { STALE_TIME } from '@/lib/queryClient';
import { queryKeys } from '@/lib/queryKeys';
import type {
  AutocompleteResponse,
  AutocompleteSuggestion,
  ByTypeSearchResponse,
  SearchResponse,
} from '@/components/search/types';

type SearchAction =
  | { kind: 'full'; q: string }
  | { kind: 'byType'; key: string; path: string; q: string };

export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [activeType, setActiveType] = useState('all');
    const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 200);

  // Autocomplete: query com cache, dedup e cancelamento (o pedido em curso é
  // abortado quando o texto muda). `hiddenFor` esconde as sugestões do texto
  // já submetido/limpo sem as apagar da cache. Falhar não incomoda o
  // utilizador (meta.silent), mas o erro fica registado pelo QueryCache.
  const [hiddenFor, setHiddenFor] = useState<string | null>(null);
  const autocomplete = useApiQuery<AutocompleteResponse>(
    queryKeys.search.autocomplete(debouncedQuery),
    '/search/autocomplete',
    {
      params: { q: debouncedQuery, limit: 6 },
      enabled: debouncedQuery.length >= 2,
      staleTime: STALE_TIME.SEMI_STATIC,
      retry: false,
      meta: { silent: true },
    },
  );
  const suggestions: AutocompleteSuggestion[] =
    debouncedQuery.length >= 2 && hiddenFor !== debouncedQuery
      ? (autocomplete.data?.suggestions ?? [])
      : [];

  // Pesquisa geral (todos os tipos) e pesquisa filtrada por um único tipo
  // partilhavam `results`/`loading`/`activeType` mas eram dois blocos
  // setLoading/then/finally separados. Consolidados numa única mutação
  // parametrizada por "acção" — cada uma sabe como moldar o SearchResponse.
  const searchAction = useApiMutation(
    async (action: SearchAction) => {
      if (action.kind === 'full') {
        const data = await apiClient.get<SearchResponse>('/search', {
          params: { q: action.q, limit: 10 },
        });
        return { activeType: 'all', results: data };
      }
      const d = await apiClient.get<ByTypeSearchResponse>(
        `/search/${action.path}`,
        { params: { q: action.q, limit: 20 } },
      );
      return {
        activeType: action.key,
        results: {
          query: action.q,
          grouped: { [action.key]: d.results },
          counts: { [action.key]: d.count },
        } as SearchResponse,
      };
    },
    {
      onSuccess: ({ activeType: t, results: r }) => {
        setResults(r);
        setActiveType(t);
      },
    },
  );
  const loading = searchAction.isPending;

  // `mutate` é estável (React Query v5), logo `doSearch` também.
  const { mutate: runSearch } = searchAction;
  const doSearch = useCallback(
    (q: string) => {
      if (!q.trim()) return;
      setHiddenFor(q);
      runSearch({ kind: 'full', q });
    },
    [runSearch],
  );

  const searchByType = (key: string, path: string) => {
    if (query) runSearch({ kind: 'byType', key, path, q: query });
  };

  const clear = () => {
    setQuery('');
    setResults(null);
    setHiddenFor(null);
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Seed a partir de ?q= no URL (ex.: pesquisa iniciada na Topbar) — corre a
  // pesquisa uma vez à chegada. `window.location` em vez de useSearchParams
  // para não exigir uma <Suspense> boundary no prerender da página.
  useEffect(() => {
    const seeded =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('q')?.trim()
        : undefined;
    if (seeded) {
      setQuery(seeded);
      doSearch(seeded);
    }
  }, [doSearch]);

  return {
    query,
    setQuery,
    results,
    activeType,
    setActiveType,
    suggestions,
    inputRef,
    loading,
    doSearch,
    searchByType,
    clear,
  };
}

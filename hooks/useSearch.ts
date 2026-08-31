// hooks/useSearch.ts
// Extraído de app/(platform)/search/page.tsx — estado da pesquisa
// (query/results/activeType/autocomplete) e a mutação parametrizada que
// serve tanto a pesquisa geral como a pesquisa filtrada por tipo.

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
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
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 200);

  // Autocomplete
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    apiClient
      .get<AutocompleteResponse>('/search/autocomplete', {
        params: { q: debouncedQuery, limit: 6 },
      })
      .then((d) => setSuggestions(d.suggestions ?? []))
      .catch((e) => {
        // Autocomplete é acessório — falhar não deve incomodar o
        // utilizador com um toast, mas o erro fica registado.
        reportError(e, { source: 'useSearch.autocomplete' });
      });
  }, [debouncedQuery]);

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

  const doSearch = useCallback((q: string) => {
    if (!q.trim()) return;
    setSuggestions([]);
    searchAction.mutate({ kind: 'full', q });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `mutate` do useMutation é estável entre renders (React Query), por isso omitir `searchAction` das deps não cria closure stale. Consequência: o React Compiler salta este hook por não conseguir verificar a omissão à volta de uma regra desligada.
  }, []);

  const searchByType = (key: string, path: string) => {
    if (query) searchAction.mutate({ kind: 'byType', key, path, q: query });
  };

  const clear = () => {
    setQuery('');
    setResults(null);
    setSuggestions([]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só no mount; `doSearch` é estável (useCallback [] + mutate estável do React Query).
  }, []);

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

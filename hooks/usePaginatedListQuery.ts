// hooks/usePaginatedListQuery.ts
// Motor partilhado das listagens paginadas do CRM (funders / partners /
// beneficiaries). Antes desta extracção, useFundersList / usePartnersList /
// useBeneficiariesList repetiam o mesmo bloco: `page` + `search` + N filtros
// em useState, useDebounce(search), o objecto `params` (`{ page, limit: 20,
// search, ...filtros }`), a query com `placeholderData: keepPreviousData`, e
// um handler por filtro que faz `setX(v); setPage(1)`.
//
// Este hook NÃO é consumido directamente por componentes — cada hook
// específico continua a existir como adaptador fino que mapeia este resultado
// para a forma exacta que a sua *ListView espera (data vs rows, loading vs
// isLoading, etc.). Assim os componentes de apresentação não mudam.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import type { QueryKey } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { STALE_TIME } from '@/lib/queryClient';

interface PaginatedListConfig {
  /** Constrói a queryKey a partir do objecto `params` (ex.: queryKeys.funders.list). */
  queryKey: (params: Record<string, unknown>) => QueryKey;
  /** Path REST da listagem — ex.: '/crm/funders'. */
  path: string;
  /** Nomes dos filtros de dropdown, na ordem em que entram em `params`. */
  filterKeys: readonly string[];
  /** Itens por página (default 20, como nas 3 listagens actuais). */
  limit?: number;
}

export function usePaginatedListQuery<Resp>(config: PaginatedListConfig) {
  const { queryKey, path, filterKeys, limit = 20 } = config;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>(() =>
    Object.fromEntries(filterKeys.map((k) => [k, ''])),
  );

  // Pesquisa com debounce: 1 pedido depois de parar de escrever, não 1 por tecla.
  const debouncedSearch = useDebounce(search);

  // params enxutos — o apiClient omite os vazios (optimização de payload).
  const params: Record<string, string | number> = {
    page,
    limit,
    search: debouncedSearch,
    ...filters,
  };

  const query = useApiQuery<Resp>(queryKey(params), path, {
    params,
    staleTime: STALE_TIME.DYNAMIC,
    // Mantém a página anterior visível enquanto a próxima carrega (sem flash).
    placeholderData: keepPreviousData,
  });

  // Mudar pesquisa ou qualquer filtro volta sempre à página 1.
  function onSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function setFilter(key: string, value: string) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  }

  return {
    page,
    setPage,
    search,
    onSearchChange,
    filters,
    setFilter,
    query,
  };
}

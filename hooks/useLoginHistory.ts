// hooks/useLoginHistory.ts
// Histórico de logins paginado, com filtro de resultado (só na organização).
// Extraído de components/settings/TabSeguranca.tsx.

'use client';

import { useState } from 'react';
import { queryKeys } from '@/lib/queryKeys';
import { useApiQuery } from './useApiQuery';
import {
  loginHistoryParams,
  loginHistoryScope,
  type LoginOutcome,
} from '@/components/settings/seguranca/logic';
import type { LoginHistoryPage } from '@/components/settings/types';

export function useLoginHistory(basePath: string) {
  const [page, setPage] = useState(1);
  const [outcome, setOutcomeState] = useState<LoginOutcome>('ALL');
  const scope = loginHistoryScope(basePath);

  const history = useApiQuery<LoginHistoryPage>(
    queryKeys.settings.loginHistory(scope, page),
    basePath,
    { params: loginHistoryParams(page, outcome) },
  );

  /** Mudar o filtro volta à primeira página. */
  const setOutcome = (o: LoginOutcome) => {
    setOutcomeState(o);
    setPage(1);
  };

  return {
    scope,
    outcome,
    setOutcome,
    setPage,
    isLoading: history.isLoading,
    rows: history.data?.data ?? [],
    meta: history.data?.meta,
  };
}

export type LoginHistoryController = ReturnType<typeof useLoginHistory>;

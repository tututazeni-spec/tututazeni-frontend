// hooks/useAssignSession.ts
// Atribuição de uma sessão a colaboradores: procura por nome/email/nº/ID,
// seleção, prazo e pedido (POST /avatar-training/sessions/:id/assign).
// Extraído de components/avatar-training/BuilderTab.tsx (AssignBox).

'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { useApiMutation, useApiQuery } from './useApiQuery';
import { useDebounce } from './useDebounce';
import {
  MIN_SEARCH_LENGTH,
  assignErrorMessage,
  buildAssignPayload,
  idFromQuery,
} from '@/components/avatar-training/builder/logic';

interface FoundUser {
  id: number;
  fullName: string;
  email?: string | null;
}

export function useAssignSession(sessionId: number) {
  const notify = useToast();
  // Colaboradores escolhidos (id → nome); procura por nome, email, nº de
  // colaborador ou, se for só um número, também pelo ID.
  const [picked, setPicked] = useState<Record<number, string>>({});
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query.trim());
  const [dueDate, setDueDate] = useState('');
  const [mandatory, setMandatory] = useState(true);
  const userIds = Object.keys(picked).map(Number);

  const found = useApiQuery<{ data: FoundUser[] }>(
    ['avatar-training', 'assign-user-search', debounced],
    '/users',
    {
      params: { search: debounced, limit: 8 },
      enabled: debounced.length >= MIN_SEARCH_LENGTH,
      staleTime: STALE_TIME.SEMI_STATIC,
    },
  );

  const assign = useApiMutation(
    () =>
      apiClient.post(
        `/avatar-training/sessions/${sessionId}/assign`,
        buildAssignPayload(userIds, dueDate, mandatory),
      ),
    {
      onSuccess: () => {
        notify({ title: 'Sessão atribuída', intent: 'success' });
        setPicked({});
      },
      onError: (e) =>
        notify({
          title: 'Não foi possível atribuir',
          description: assignErrorMessage(e.message),
          intent: 'danger',
        }),
    },
  );

  return {
    query,
    setQuery,
    /** A lista de resultados só aparece com 2+ caracteres ou um ID. */
    showResults:
      debounced.length >= MIN_SEARCH_LENGTH || idFromQuery(query) !== null,
    idQuery: idFromQuery(query),
    isSearching: found.isLoading,
    results: (found.data?.data ?? []).filter((u) => !(u.id in picked)),
    hasResults: (found.data?.data ?? []).length > 0,
    picked,
    userIds,
    pick: (id: number, name: string) => {
      setPicked((p) => ({ ...p, [id]: name }));
      setQuery('');
    },
    unpick: (id: number) =>
      setPicked((p) => {
        const { [id]: _removed, ...rest } = p;
        return rest;
      }),
    dueDate,
    setDueDate,
    mandatory,
    setMandatory,
    assign: () => assign.mutate(undefined),
    isAssigning: assign.isPending,
  };
}

export type AssignSessionController = ReturnType<typeof useAssignSession>;

// hooks/useProgramsList.ts
// Lista de formações com avatar (Catálogo/Gestão): filtros, query e acções do
// ciclo de vida (submeter a revisão, publicar, arquivar).
// Extraído de components/avatar-training/ProgramsTab.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { useApiMutation, useApiQuery } from './useApiQuery';
import { useHasRole } from './useCurrentRole';
import {
  ADMIN_ROLES,
  AUTHOR_ROLES,
} from '@/components/avatar-training/constants';
import {
  ALL,
  programListParams,
} from '@/components/avatar-training/programs/logic';
import type { AvatarProgram } from '@/components/avatar-training/types';

export type ProgramsMode = 'catalog' | 'manage';
export type ProgramVerb = 'submit-review' | 'publish' | 'archive';

export function useProgramsList() {
  const notify = useToast();
  const isAuthor = useHasRole(AUTHOR_ROLES);
  const isAdmin = useHasRole(ADMIN_ROLES);
  const [mode, setMode] = useState<ProgramsMode>('catalog');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState(ALL);
  const manage = isAuthor && mode === 'manage';

  const params = programListParams({ search, category, status, manage });
  const { data, isLoading, error, refetch } = useApiQuery<AvatarProgram[]>(
    queryKeys.avatarTraining.programs(params),
    '/avatar-training/programs',
    {
      params,
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );

  const action = useApiMutation(
    (v: { id: number; verb: ProgramVerb }) =>
      apiClient.post(`/avatar-training/programs/${v.id}/${v.verb}`),
    {
      invalidateKeys: [queryKeys.avatarTraining.all],
      onSuccess: () =>
        notify({ title: 'Formação actualizada', intent: 'success' }),
      onError: (e) =>
        notify({
          title: 'Não foi possível actualizar',
          description: e.message,
          intent: 'danger',
        }),
    },
  );

  return {
    isAuthor,
    isAdmin,
    /** Vista «Gestão» activa (só para quem tem autoria). */
    manage,
    mode,
    setMode,
    search,
    setSearch,
    category,
    setCategory,
    status,
    setStatus,
    programs: data,
    isLoading,
    error,
    refetch,
    runAction: (id: number, verb: ProgramVerb) => action.mutate({ id, verb }),
  };
}

export type ProgramsListController = ReturnType<typeof useProgramsList>;

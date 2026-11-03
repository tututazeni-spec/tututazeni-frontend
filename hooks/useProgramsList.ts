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
import { useConfirm } from '@/providers/ConfirmProvider';
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

export type ProgramsMode = 'catalog' | 'manage' | 'recycle';
export type ProgramVerb = 'submit-review' | 'publish' | 'archive';

export function useProgramsList() {
  const notify = useToast();
  const confirm = useConfirm();
  const isAuthor = useHasRole(AUTHOR_ROLES);
  const isAdmin = useHasRole(ADMIN_ROLES);
  // Predefinição: autores abrem em «Gestão»; os restantes só têm o catálogo.
  // Derivado (não useState inicial) porque o papel pode chegar depois do 1.º render.
  const [chosenMode, setMode] = useState<ProgramsMode | null>(null);
  const mode: ProgramsMode = chosenMode ?? (isAuthor ? 'manage' : 'catalog');
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

  const remove = useApiMutation(
    (id: number) => apiClient.delete(`/avatar-training/programs/${id}`),
    {
      invalidateKeys: [queryKeys.avatarTraining.all],
      onSuccess: () =>
        notify({
          title: 'Formação movida para a reciclagem',
          description: 'Pode restaurá-la durante 30 dias.',
          intent: 'success',
        }),
      onError: (e) =>
        notify({
          title: 'Não foi possível eliminar',
          description: e.message,
          intent: 'danger',
        }),
    },
  );
  const removeProgram = async (p: Pick<AvatarProgram, 'id' | 'title'>) => {
    const ok = await confirm({
      title: 'Eliminar formação',
      message: `"${p.title}" vai para a reciclagem e pode ser restaurada durante 30 dias. Depois é apagada em definitivo.`,
      destructive: true,
    });
    if (ok) remove.mutate(p.id);
  };

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
    removeProgram,
  };
}

export type ProgramsListController = ReturnType<typeof useProgramsList>;

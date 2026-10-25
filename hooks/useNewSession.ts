// hooks/useNewSession.ts
// Criação de uma sessão numa formação (POST /avatar-training/sessions).
// Extraído de components/avatar-training/BuilderTab.tsx (NewSession).

'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { useApiMutation, useApiQuery } from './useApiQuery';
import {
  buildNewSessionPayload,
  canCreateSession,
} from '@/components/avatar-training/builder/logic';
import type { AvatarProgram } from '@/components/avatar-training/types';

export function useNewSession(onCreated: (id: number) => void) {
  const notify = useToast();
  const [programId, setProgramId] = useState<string>();
  const [title, setTitle] = useState('');
  const programs = useApiQuery<AvatarProgram[]>(
    queryKeys.avatarTraining.programs({}),
    '/avatar-training/programs',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const create = useApiMutation(
    () =>
      apiClient.post<{ id: number }>(
        '/avatar-training/sessions',
        buildNewSessionPayload(programId ?? '', title),
      ),
    {
      invalidateKeys: [queryKeys.avatarTraining.sessions()],
      onSuccess: (s) => {
        setTitle('');
        onCreated(s.id);
      },
      onError: (e) =>
        notify({
          title: 'Não foi possível criar a sessão',
          description: e.message,
          intent: 'danger',
        }),
    },
  );

  return {
    programId,
    setProgramId,
    title,
    setTitle,
    programItems: (programs.data ?? []).map((p) => ({
      value: String(p.id),
      label: p.title,
    })),
    canCreate: canCreateSession(programId, title),
    create: () => create.mutate(undefined),
    isCreating: create.isPending,
  };
}

export type NewSessionController = ReturnType<typeof useNewSession>;

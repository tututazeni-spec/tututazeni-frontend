// hooks/useTrainingAssignments.ts
// Sessões de formação virtual atribuídas ao utilizador e o arranque de uma
// tentativa (POST /avatar-training/sessions/:id/start).
// Extraído de components/avatar-training/RoomTab.tsx.

'use client';

import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { useApiMutation, useApiQuery } from './useApiQuery';
import { filterAssignments } from '@/components/avatar-training/room/logic';
import type {
  ExperienceType,
  MyAssignment,
  Room,
} from '@/components/avatar-training/types';

export function useTrainingAssignments(
  onStarted: (attemptId: number) => void,
  only?: readonly ExperienceType[],
) {
  const notify = useToast();
  const { data, isLoading, error, refetch } = useApiQuery<MyAssignment[]>(
    queryKeys.avatarTraining.myAssignments(),
    '/avatar-training/my/assignments',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const start = useApiMutation(
    (sessionId: number) =>
      apiClient.post<Room>(`/avatar-training/sessions/${sessionId}/start`, {
        textOnly: true,
      }),
    {
      onSuccess: (room) => onStarted(room.attempt.id),
      onError: (e) =>
        notify({
          title: 'Não foi possível iniciar a sessão',
          description: e.message,
          intent: 'danger',
        }),
    },
  );

  return {
    /** Já filtrada por `only`; undefined enquanto não há dados. */
    list: data ? filterAssignments(data, only) : undefined,
    isLoading,
    error,
    refetch,
    start: (sessionId: number) => start.mutate(sessionId),
    /** A iniciar precisamente esta sessão (desativa só o seu botão). */
    isStarting: (sessionId: number) =>
      start.isPending && start.variables === sessionId,
  };
}

export type TrainingAssignmentsController = ReturnType<
  typeof useTrainingAssignments
>;

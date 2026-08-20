// hooks/useAcademicProgramDetail.ts
// Extraído de app/(platform)/academic/programs/[id]/page.tsx.

'use client';

import { useRouter } from 'next/navigation';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { ProgramDetail } from '@/components/academic/types';

export function useAcademicProgramDetail(id: string) {
  const router = useRouter();
  const notify = useToast();

  const {
    data: program,
    isLoading: loading,
    error: queryError,
  } = useApiQuery<ProgramDetail>(
    queryKeys.academic.program(id),
    `/academic/programs/${id}`,
    { enabled: !!id, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const error = queryError?.message ?? '';

  const { data: currentUser } = useCurrentUser();

  const enrollMut = useApiMutation(
    async (classId: string | undefined) => {
      // Reusa a mesma cache de /auth/me partilhada pelo resto da app (useCurrentUser)
      // em vez de refazer o fetch a cada matrícula.
      const userId = currentUser?.id;
      if (!userId) throw new Error('Utilizador sem ID');
      return apiClient.post('/academic/enrollments', {
        userId: Number(userId),
        programId: id,
        ...(classId && { classId }),
      });
    },
    {
      invalidateKeys: [
        queryKeys.academic.program(id),
        queryKeys.academic.transcript(),
      ],
      onSuccess: () => {
        notify({
          title: 'Matrícula submetida com sucesso!',
          intent: 'success',
        });
        router.push('/academic/transcript');
      },
      onError: (e) =>
        notify({ title: e.message || 'Erro inesperado', intent: 'danger' }),
    },
  );
  const enrolling = enrollMut.isPending;
  const enroll = (classId?: string) => enrollMut.mutate(classId);

  return { program, loading, error, enrolling, enroll };
}

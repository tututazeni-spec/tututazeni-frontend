// hooks/useProgramSheet.ts
// Ficha de uma formação com avatar (§4): detalhe, a minha elegibilidade ao
// certificado e as ligações a Trainings/Percursos (só para quem edita).
// Extraído de components/avatar-training/ProgramsTab.tsx.

'use client';

import { queryKeys } from '@/lib/queryKeys';
import { useApiQuery } from './useApiQuery';
import {
  shouldCheckEligibility,
  shouldLoadLinks,
} from '@/components/avatar-training/programs/logic';
import type {
  AvatarProgramDetail,
  CertificationStatus,
  ProgramLinks,
} from '@/components/avatar-training/types';

export function useProgramSheet(programId: number, canEdit: boolean) {
  const { data, error, refetch } = useApiQuery<AvatarProgramDetail>(
    queryKeys.avatarTraining.program(programId),
    `/avatar-training/programs/${programId}`,
    { staleTime: 0 },
  );
  const cert = useApiQuery<CertificationStatus>(
    [...queryKeys.avatarTraining.program(programId), 'certification'],
    `/avatar-training/programs/${programId}/certification`,
    { enabled: shouldCheckEligibility(data), staleTime: 0 },
  );
  const links = useApiQuery<ProgramLinks>(
    [...queryKeys.avatarTraining.program(programId), 'links'],
    `/avatar-training/programs/${programId}/links`,
    { enabled: shouldLoadLinks(canEdit, data), staleTime: 0 },
  );

  return {
    program: data,
    error,
    refetch,
    certification: cert.data,
    links: links.data,
  };
}

export type ProgramSheetController = ReturnType<typeof useProgramSheet>;

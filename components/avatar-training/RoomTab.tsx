// components/avatar-training/RoomTab.tsx
// Sala de Formação Virtual (docs/Avatar_Training.md §5). O formando vê as suas
// sessões atribuídas e entra na sala: avatar com imagem e animação sincronizada
// com a voz, interacção por texto (sempre disponível) e opcionalmente por voz
// sintetizada e microfone, legendas, recursos aprovados, pausar/retomar, repetir
// a explicação, ajuda do AI-Tutor ou de um formador humano, e conclusão. O
// interlocutor é sempre identificado como instrutor virtual.
//
// Container: liga os hooks de dados às vistas de apresentação em ./room/.
//   hooks/useTrainingAssignments.ts  lista de sessões atribuídas + arranque
//   hooks/useTrainingRoom.ts         estado, voz e mutações da sala
//   ./room/logic.ts                  regras puras (fase, tempo, textos, payloads)

'use client';

import { useState } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { QueryError } from '@/components/ui/QueryError';
import { useTrainingAssignments } from '@/hooks/useTrainingAssignments';
import { useTrainingRoom } from '@/hooks/useTrainingRoom';
import { AssignmentsView } from './room/AssignmentsView';
import { RoomSessionView } from './room/RoomSessionView';
import type { ExperienceType } from './types';

function RoomView({
  attemptId,
  onExit,
}: {
  attemptId: number;
  onExit: () => void;
}) {
  const ctl = useTrainingRoom(attemptId, onExit);
  const { room, error, refetch } = ctl;

  if (error) return <QueryError error={error} onRetry={() => refetch()} />;
  if (!room)
    return (
      <Skeleton
        rows={3}
        itemClassName="h-24 rounded-card bg-surface-sunken animate-pulse"
      />
    );
  return <RoomSessionView room={room} ctl={ctl} onExit={onExit} />;
}

export interface RoomTabProps {
  /** photo = design "cursos criados" (Sala); navy = design "inscrições" (Simulações). */
  variant?: 'photo' | 'navy';
  /** Restringe a lista a certos tipos de experiência (ex.: Simulações). */
  only?: readonly ExperienceType[];
  emptyTitle?: string;
}

export function RoomTab({
  only,
  emptyTitle = 'Sem sessões atribuídas',
  variant = 'photo',
}: RoomTabProps = {}) {
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const assignments = useTrainingAssignments(setAttemptId, only);

  if (attemptId !== null)
    return <RoomView attemptId={attemptId} onExit={() => setAttemptId(null)} />;
  return (
    <AssignmentsView
      ctl={assignments}
      variant={variant}
      emptyTitle={emptyTitle}
    />
  );
}

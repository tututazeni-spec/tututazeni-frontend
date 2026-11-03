// components/avatar-training/room/Transcript.tsx
// Conversa com o instrutor e legenda activa (apresentação).

import type { TrainingRoomController } from '@/hooks/useTrainingRoom';
import { BUBBLE } from '../constants';
import { ReinforcementNote } from './Notes';
import type { Room, RoomInteraction, TutorReply } from '../types';

interface TranscriptProps {
  room: Room;
  ctl: TrainingRoomController;
}

const TUTOR_STATUS_TEXT: Record<string, string> = {
  OK: 'Resposta do tutor de IA.',
  NO_SOURCE:
    'Não encontrei nas fontes aprovadas desta formação informação suficiente para responder. A dúvida foi encaminhada para um formador.',
  UNAVAILABLE:
    'O tutor de IA está temporariamente indisponível. Pode continuar a sessão ou pedir ajuda a um formador.',
  LIMIT_REACHED: 'Atingiu o limite de perguntas ao tutor de IA por agora.',
  ESCALATED: 'A dúvida foi encaminhada para um formador.',
};

/**
 * As interacções do tutor guardam só referências (sem o texto — privacidade).
 * O texto vem da resposta do pedido, na mesma ordem; depois de recarregar a
 * página mostra-se uma frase por estado em vez do código técnico.
 */
export function tutorBubbleText(
  i: RoomInteraction,
  replies: TutorReply[],
  nth: number,
): string {
  if (i.metadata?.channel !== 'AI_TUTOR') return i.content;
  const reply = nth >= 0 ? replies[nth] : undefined;
  if (i.interactionType === 'USER_MESSAGE') {
    return reply?.question || 'Pergunta ao tutor de IA';
  }
  return (
    reply?.message ?? TUTOR_STATUS_TEXT[i.metadata.status ?? ''] ?? i.content
  );
}

export function Transcript({ room, ctl }: TranscriptProps) {
  const { captions, voice, tutorReplies } = ctl;
  // Só as respostas desta visita têm texto: alinham-se com as últimas interacções do tutor.
  const tutorTotal = room.interactions.filter(
    (i) =>
      i.metadata?.channel === 'AI_TUTOR' &&
      i.interactionType === 'USER_MESSAGE',
  ).length;
  const offset = Math.max(0, tutorTotal - tutorReplies.length);
  const seen = { USER_MESSAGE: 0, AVATAR_MESSAGE: 0 };
  const bubbles = room.interactions
    .filter((i) => BUBBLE[i.interactionType])
    .map((i) => {
      const isTutor = i.metadata?.channel === 'AI_TUTOR';
      const kind =
        i.interactionType === 'USER_MESSAGE'
          ? 'USER_MESSAGE'
          : 'AVATAR_MESSAGE';
      const nth = isTutor ? seen[kind]++ : 0;
      return { i, text: tutorBubbleText(i, tutorReplies, nth - offset) };
    });

  return (
    <>
      <div
        className="flex max-h-80 flex-col gap-2 overflow-y-auto rounded-card border border-border bg-canvas p-3"
        aria-live="polite"
      >
        {bubbles.map(({ i, text }) => (
          <div
            key={i.id}
            className={`max-w-[85%] whitespace-pre-wrap rounded-card px-3 py-2 font-body text-sm ${BUBBLE[i.interactionType]}`}
          >
            {text}
            {i.metadata?.reinforcement && (
              <ReinforcementNote reinforcement={i.metadata.reinforcement} />
            )}
          </div>
        ))}
      </div>

      {captions && voice.activeCue && (
        <p
          role="status"
          className="rounded-card bg-ink px-3 py-2 text-center font-body text-sm text-canvas"
        >
          {voice.activeCue}
        </p>
      )}
    </>
  );
}

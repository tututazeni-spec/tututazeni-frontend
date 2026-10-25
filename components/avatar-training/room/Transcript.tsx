// components/avatar-training/room/Transcript.tsx
// Conversa com o instrutor e legenda activa (apresentação).

import type { TrainingRoomController } from '@/hooks/useTrainingRoom';
import { BUBBLE } from '../constants';
import { ReinforcementNote } from './Notes';
import type { Room } from '../types';

interface TranscriptProps {
  room: Room;
  ctl: TrainingRoomController;
}

export function Transcript({ room, ctl }: TranscriptProps) {
  const { captions, voice } = ctl;

  return (
    <>
      <div
        className="flex max-h-80 flex-col gap-2 overflow-y-auto rounded-card border border-border bg-canvas p-3"
        aria-live="polite"
      >
        {room.interactions
          .filter((i) => BUBBLE[i.interactionType])
          .map((i) => (
            <div
              key={i.id}
              className={`max-w-[85%] whitespace-pre-wrap rounded-card px-3 py-2 font-body text-sm ${BUBBLE[i.interactionType]}`}
            >
              {i.content}
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

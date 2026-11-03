// components/avatar-training/room/RoomSessionView.tsx
// Sala de Formação Virtual (apresentação): compõe cabeçalho, voz, resultado,
// conversa, etapa, pergunta e acções. Estado e mutações vivem em
// hooks/useTrainingRoom.ts; regras puras em ./logic.ts.

import { ArrowLeft, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { TrainingRoomController } from '@/hooks/useTrainingRoom';
import { ActionBar } from './ActionBar';
import { AvatarHeader } from './AvatarHeader';
import { QuestionBox } from './QuestionBox';
import { ResultPanel } from './ResultPanel';
import { StepPanel } from './StepPanel';
import { Transcript } from './Transcript';
import { VoiceControls } from './VoiceControls';
import type { Room } from '../types';

interface RoomSessionViewProps {
  room: Room;
  ctl: TrainingRoomController;
  onExit: () => void;
}

export function RoomSessionView({ room, ctl, onExit }: RoomSessionViewProps) {
  const {
    voice,
    elapsed,
    open,
    step,
    paused,
    language,
    answerStep,
    advanceStep,
    pending,
  } = ctl;

  return (
    <div className="overflow-hidden rounded-panel border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between gap-3 bg-[linear-gradient(115deg,#1F4FB8_0%,#0B2F7A_45%,#0F1F3D_100%)] px-6 py-5">
        <div className="min-w-0">
          <h2 className="truncate font-display text-2xl font-bold text-white">
            {room.session.title}
          </h2>
          <p className="truncate font-body text-sm text-white/80">
            {room.session.program.title}
          </p>
        </div>
        <Button size="sm" intent="onDarkGhost" onClick={onExit}>
          <ArrowLeft size={14} /> Voltar às sessões
        </Button>
      </div>

      <div className="space-y-4 px-6 py-5">
        <div
          role="note"
          className="flex items-center gap-3 rounded-card bg-info-subtle px-4 py-2.5 font-body text-sm text-info-ink"
        >
          <Info size={18} className="shrink-0 text-info-ink" aria-hidden />
          <span>
            {room.notice} A interacção por texto está sempre disponível.
          </span>
        </div>

        <AvatarHeader room={room} voice={voice} elapsed={elapsed} />
        <ProgressBar value={room.attempt.progress} />

        <VoiceControls ctl={ctl} />

        <ResultPanel ctl={ctl} />

        <Transcript room={room} ctl={ctl} />

        {open && step && (
          <StepPanel
            key={step.key}
            step={step}
            language={language}
            disabled={paused || pending.record}
            onAnswer={answerStep}
            onAdvance={advanceStep}
          />
        )}

        <QuestionBox ctl={ctl} />

        <ActionBar ctl={ctl} />
      </div>
    </div>
  );
}

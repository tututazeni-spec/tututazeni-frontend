// components/avatar-training/room/RoomSessionView.tsx
// Sala de Formação Virtual (apresentação): compõe cabeçalho, voz, resultado,
// conversa, etapa, pergunta e acções. Estado e mutações vivem em
// hooks/useTrainingRoom.ts; regras puras em ./logic.ts.

import { Bot } from 'lucide-react';
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">
            {room.session.title}
          </h2>
          <p className="font-body text-xs text-ink-muted">
            {room.session.program.title}
          </p>
        </div>
        <Button size="sm" intent="ghost" onClick={onExit}>
          Voltar às sessões
        </Button>
      </div>

      <div
        role="note"
        className="flex items-center gap-2 rounded-card border border-border bg-surface px-3 py-2 font-body text-xs text-ink-muted"
      >
        <Bot size={14} /> {room.notice} A interacção por texto está sempre
        disponível.
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
  );
}

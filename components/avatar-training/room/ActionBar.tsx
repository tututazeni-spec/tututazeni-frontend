// components/avatar-training/room/ActionBar.tsx
// Acções da sessão: pausar/retomar, repetir, ouvir, ajuda, concluir e terminar
// (apresentação).

import { HelpCircle, Pause, Play, RefreshCw, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { TrainingRoomController } from '@/hooks/useTrainingRoom';

export function ActionBar({ ctl }: { ctl: TrainingRoomController }) {
  const {
    open,
    paused,
    allDone,
    step,
    voiceOn,
    lastAvatar,
    resume,
    pause,
    explainDifferently,
    speakLast,
    requestHumanHelp,
    complete,
    endSession,
    pending,
  } = ctl;

  return (
    <>
      {open && (
        <div className="flex flex-wrap gap-2">
          {paused ? (
            <Button size="sm" intent="secondary" onClick={resume}>
              <Play size={14} /> Retomar
            </Button>
          ) : (
            <Button size="sm" intent="secondary" onClick={pause}>
              <Pause size={14} /> Pausar
            </Button>
          )}
          <Button
            size="sm"
            intent="secondary"
            disabled={paused || !step}
            loading={pending.explain}
            onClick={explainDifferently}
          >
            <RefreshCw size={14} /> Repetir explicação
          </Button>
          {voiceOn && lastAvatar && (
            <Button
              size="sm"
              intent="ghost"
              disabled={paused}
              onClick={speakLast}
            >
              <Volume2 size={14} /> Ouvir a última resposta
            </Button>
          )}
          <Button
            size="sm"
            intent="ghost"
            disabled={paused || pending.record}
            onClick={requestHumanHelp}
          >
            <HelpCircle size={14} /> Falar com um formador
          </Button>
          <Button
            size="sm"
            intent={allDone ? 'primary' : 'ghost'}
            loading={pending.complete}
            disabled={paused}
            onClick={complete}
          >
            Concluir sessão
          </Button>
          <Button
            size="sm"
            intent="ghost"
            loading={pending.abandon}
            onClick={endSession}
          >
            Terminar sessão
          </Button>
        </div>
      )}
    </>
  );
}

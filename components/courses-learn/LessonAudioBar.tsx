// components/courses-learn/LessonAudioBar.tsx
// Controlo compacto "Ouvir a aula" para lições de texto, montado no
// ContentPlayer. A geração de áudio (TTS) é feita pelo backend — ver
// hooks/useLessonAudio.

'use client';

import { Volume2, Pause, Square, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useLessonAudio } from '@/hooks/useLessonAudio';

interface LessonAudioBarProps {
  lessonId: number;
}

export function LessonAudioBar({ lessonId }: LessonAudioBarProps) {
  const { state, progress, error, play, pause, stop } = useLessonAudio(lessonId);

  // Card claro sobre a área escura do player, para os botões do design
  // system lerem com o contraste normal.
  return (
    <div className="mt-6 flex flex-col gap-2 rounded-lg border border-border bg-surface px-4 py-3">
      {state === 'error' ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-body text-sm text-ink-muted">{error}</span>
          <Button size="sm" intent="secondary" onClick={() => void play()}>
            <RotateCcw size={14} strokeWidth={1.75} /> Tentar de novo
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            {state === 'playing' ? (
              <>
                <Button size="sm" intent="secondary" onClick={pause}>
                  <Pause size={14} strokeWidth={1.75} /> Pausar
                </Button>
                <Button size="sm" intent="ghost" onClick={stop}>
                  <Square size={14} strokeWidth={1.75} /> Parar
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                intent="secondary"
                loading={state === 'loading'}
                onClick={() => void play()}
              >
                {state !== 'loading' && <Volume2 size={14} strokeWidth={1.75} />}
                {state === 'loading'
                  ? 'A gerar áudio…'
                  : state === 'paused'
                    ? 'Retomar'
                    : 'Ouvir aula'}
              </Button>
            )}
          </div>
          {(state === 'playing' || state === 'paused') && (
            <ProgressBar value={progress} />
          )}
        </>
      )}
    </div>
  );
}

// components/avatar-training/room/VoiceControls.tsx
// Voz do instrutor, legendas e aviso de IA (apresentação).

import { Square, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { TrainingRoomController } from '@/hooks/useTrainingRoom';

export function VoiceControls({ ctl }: { ctl: TrainingRoomController }) {
  const {
    open,
    voiceOn,
    step,
    paused,
    voice,
    captions,
    setCaptions,
    askNotice,
    setAskNotice,
    toggleVoice,
    toggleStepSpeech,
    confirmVoice,
    pending,
  } = ctl;

  return (
    <>
      {open && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-card border border-border bg-surface px-3 py-2 font-body text-sm text-ink">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={voiceOn}
              disabled={pending.media}
              onChange={(e) => toggleVoice(e.target.checked)}
            />
            Voz do instrutor
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={captions}
              onChange={(e) => setCaptions(e.target.checked)}
            />
            Legendas
          </label>
          {voiceOn && step && (
            <Button
              size="sm"
              intent="secondary"
              disabled={paused}
              onClick={toggleStepSpeech}
            >
              {voice.speaking ? (
                <>
                  <Square size={14} /> Parar
                </>
              ) : (
                <>
                  <Volume2 size={14} /> Ouvir a etapa
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {askNotice && (
        <div
          role="alertdialog"
          aria-label="Aviso de utilização de voz"
          className="space-y-2 rounded-card border border-warning bg-warning-subtle p-3 font-body text-sm text-warning-ink"
        >
          <p>
            A voz é sintetizada por IA. O microfone é opcional e só é usado se o
            activar; a sessão continua disponível por texto a qualquer momento.
          </p>
          <div className="flex gap-2">
            <Button size="sm" loading={pending.media} onClick={confirmVoice}>
              Compreendo e quero activar a voz
            </Button>
            <Button
              size="sm"
              intent="ghost"
              onClick={() => setAskNotice(false)}
            >
              Continuar só por texto
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

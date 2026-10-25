// components/avatar-training/room/DictateButton.tsx
// Ditado por voz (microfone opcional) para as caixas de texto da sala.

import { Mic } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useDictation } from '../useRoomVoice';

export function DictateButton({
  language,
  onText,
}: {
  language: string;
  onText: (t: string) => void;
}) {
  const { supported, listening, toggle } = useDictation(language, onText);
  if (!supported) return null;
  return (
    <Button
      size="sm"
      intent={listening ? 'primary' : 'ghost'}
      aria-pressed={listening}
      aria-label={
        listening ? 'Parar ditado por voz' : 'Ditar por voz (microfone)'
      }
      onClick={toggle}
    >
      <Mic size={14} /> {listening ? 'A ouvir…' : 'Ditar'}
    </Button>
  );
}

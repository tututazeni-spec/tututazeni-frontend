'use client';

// components/ai-tutor/MicButton.tsx
// Botão do microfone do chat do Ísis (entrada por voz).

import { Mic, Square } from 'lucide-react';

interface MicButtonProps {
  listening: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function MicButton({ listening, onClick, disabled }: MicButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={listening ? 'Terminar conversa' : 'Falar com o tutor'}
      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition disabled:opacity-50 ${
        listening
          ? 'animate-pulse bg-red-500 text-white'
          : 'bg-[#0F1F3D] text-[#D4A017] hover:opacity-90'
      }`}
    >
      {listening ? <Square size={16} /> : <Mic size={18} />}
    </button>
  );
}

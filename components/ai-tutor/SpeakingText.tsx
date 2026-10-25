'use client';

// components/ai-tutor/SpeakingText.tsx
// Texto da resposta que "acende" ao ritmo da voz do Ísis.

interface SpeakingTextProps {
  text: string; // texto já limpo (spokenText)
  charIndex: number; // posição actual da voz
}

export function SpeakingText({ text, charIndex }: SpeakingTextProps) {
  const spoken = text.slice(0, charIndex);
  const rest = text.slice(charIndex);

  return (
    <p className="font-body text-sm leading-relaxed">
      <span className="text-brand">{spoken}</span>
      <span className="text-gray-400">{rest}</span>
    </p>
  );
}

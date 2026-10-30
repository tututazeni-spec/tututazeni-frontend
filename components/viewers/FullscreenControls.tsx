// components/viewers/FullscreenControls.tsx
// Botão de ecrã inteiro de um palco: "Ecrã inteiro" no canto quando está
// normal; "Sair" sobreposto (esconde-se sem rato) quando está em ecrã inteiro.
// O pai deve ser `relative`.
'use client';

import { Maximize, Minimize } from 'lucide-react';

interface FullscreenControlsProps {
  isFs: boolean;
  visible: boolean;
  onToggle: () => void;
}

export function FullscreenControls({
  isFs,
  visible,
  onToggle,
}: FullscreenControlsProps) {
  if (!isFs) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-label="Ecrã inteiro"
        title="Ecrã inteiro (F)"
        className="absolute right-3 top-2 z-10 flex items-center gap-1 rounded-card border border-border bg-surface px-2 py-1 font-body text-xs font-semibold text-ink shadow-sm hover:bg-surface-sunken"
      >
        <Maximize size={14} strokeWidth={1.75} />
        Ecrã inteiro
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Sair do ecrã inteiro"
      title="Sair do ecrã inteiro (F ou Esc)"
      className={`fixed right-4 top-4 z-30 rounded-full bg-black/60 p-2 text-white transition-opacity duration-300 hover:bg-black/80 ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <Minimize size={20} strokeWidth={1.75} />
    </button>
  );
}

// components/courses-learn/MaximizableStage.tsx
// Contentor do leitor de uma lição (sala de aula e detalhe do curso). O ecrã
// inteiro é feito por cada leitor com a Fullscreen API (ver
// components/viewers/useFullscreen.ts), por isso já não há botão Maximizar.

'use client';

import type { ReactNode } from 'react';

interface MaximizableStageProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export function MaximizableStage({
  children,
  className = '',
  id,
}: MaximizableStageProps) {
  return (
    <div id={id} className={`relative ${className}`}>
      <div className="h-full">{children}</div>
    </div>
  );
}

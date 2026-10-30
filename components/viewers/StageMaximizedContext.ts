// components/viewers/StageMaximizedContext.ts
// Diz aos leitores (PDF, PPTX, vídeo, texto…) que estão num palco maximizado
// (MaximizableStage): aí devem ocupar o ecrã de ponta a ponta, sem margens,
// molduras nem limites de largura/altura.
'use client';

import { createContext, useContext } from 'react';

const StageMaximizedContext = createContext(false);

export const StageMaximizedProvider = StageMaximizedContext.Provider;

// Fecha o ecrã inteiro (só existe dentro de um MaximizableStage).
const StageMinimizeContext = createContext<(() => void) | null>(null);

export const StageMinimizeProvider = StageMinimizeContext.Provider;

export function useStageMinimize(): (() => void) | null {
  return useContext(StageMinimizeContext);
}

export function useStageMaximized(): boolean {
  return useContext(StageMaximizedContext);
}

// Permite a um leitor com ecrã inteiro próprio (ex.: PptxViewer) esconder o
// botão Maximizar/Minimizar do MaximizableStage enquanto está montado.
const StageToggleHiddenContext = createContext<
  ((hidden: boolean) => void) | null
>(null);

export const StageToggleHiddenProvider = StageToggleHiddenContext.Provider;

export function useHideStageToggle(): ((hidden: boolean) => void) | null {
  return useContext(StageToggleHiddenContext);
}

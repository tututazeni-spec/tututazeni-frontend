// components/courses-learn/MaximizableStage.tsx
// Envolve o leitor de uma lição com um botão Maximizar/Minimizar: maximizado,
// ocupa o ecrã inteiro (por cima do menu lateral, da estrutura do curso e do
// cabeçalho), mantendo o caminho Módulo › Lição e os botões Voltar/Minimizar;
// Esc minimiza. Usado na sala de aula e no detalhe do curso.

'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';
import {
  StageMaximizedProvider,
  StageMinimizeProvider,
  StageToggleHiddenProvider,
} from '@/components/viewers/StageMaximizedContext';

interface MaximizableStageProps {
  children: ReactNode;
  /** Classes do contentor quando NÃO está maximizado. */
  className?: string;
  id?: string;
}

export function MaximizableStage({
  children,
  className = '',
  id,
}: MaximizableStageProps) {
  const [maximized, setMaximized] = useState(false);
  // Leitores com ecrã inteiro próprio (PPTX) escondem o botão Maximizar.
  const [toggleHidden, setToggleHidden] = useState(false);
  const minimize = useCallback(() => setMaximized(false), []);

  useEffect(() => {
    if (!maximized) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMaximized(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [maximized]);

  return (
    <div
      id={id}
      className={
        maximized
          ? // Ecrã inteiro: z acima da Sidebar fixa (z-index 100), que também cobre.
            'fixed inset-0 z-[200] flex flex-col bg-canvas'
          : `relative ${className}`
      }
    >
      {(!toggleHidden || maximized) && (
        <button
          type="button"
          onClick={() => setMaximized((v) => !v)}
          aria-label={maximized ? 'Minimizar lição' : 'Maximizar lição'}
          title={maximized ? 'Minimizar (Esc)' : 'Maximizar'}
          className="absolute right-3 top-2 z-10 flex items-center gap-1 rounded-card border border-border bg-surface px-2 py-1 font-body text-xs font-semibold text-ink shadow-sm hover:bg-surface-sunken"
        >
          {maximized ? (
            <Minimize2 size={14} strokeWidth={1.75} />
          ) : (
            <Maximize2 size={14} strokeWidth={1.75} />
          )}
          {maximized ? 'Minimizar' : 'Maximizar'}
        </button>
      )}
      {maximized && (
        <div className="flex flex-shrink-0 items-center border-b border-border bg-surface px-3 py-2">
          <button
            type="button"
            onClick={() => setMaximized(false)}
            className="flex items-center gap-1.5 rounded-card px-2 py-1 font-body text-sm font-semibold text-ink hover:bg-surface-sunken"
          >
            <ArrowLeft size={16} strokeWidth={1.75} />
            Voltar
          </button>
        </div>
      )}
      <div
        className={
          maximized
            ? // Coluna com altura fixa: o leitor ocupa o resto e é ele que faz scroll.
              'flex min-h-0 flex-1 flex-col overflow-hidden [&>*]:min-h-0 [&>*]:flex-1'
            : 'h-full'
        }
      >
        <StageMaximizedProvider value={maximized}>
          <StageMinimizeProvider value={minimize}>
            <StageToggleHiddenProvider value={setToggleHidden}>
              {children}
            </StageToggleHiddenProvider>
          </StageMinimizeProvider>
        </StageMaximizedProvider>
      </div>
    </div>
  );
}

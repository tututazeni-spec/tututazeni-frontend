// components/courses-learn/MaximizableStage.tsx
// Envolve o leitor de uma lição com um botão Maximizar/Minimizar: maximizado,
// ocupa o ecrã todo (por cima do menu, da estrutura do curso e do cabeçalho);
// Esc minimiza. Usado na sala de aula e no detalhe do curso.

'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

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
          ? 'fixed inset-0 z-50 flex flex-col bg-canvas'
          : `relative ${className}`
      }
    >
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
      <div
        className={
          maximized
            ? // Coluna com altura fixa: o leitor ocupa o resto e é ele que faz scroll.
              'flex min-h-0 flex-1 flex-col overflow-hidden [&>*]:min-h-0 [&>*]:flex-1'
            : 'h-full'
        }
      >
        {children}
      </div>
    </div>
  );
}

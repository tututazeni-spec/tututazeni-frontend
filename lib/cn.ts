// lib/cn.ts
// Combina classNames condicionais (clsx) e resolve conflitos de utilitários
// Tailwind (tailwind-merge) — usado por todos os componentes de components/ui/
// para aceitarem um `className` de override sem duplicar/colidir utilitários.
//
// extendTailwindMerge ensina ao tailwind-merge a escala de radius customizada
// deste projecto (rounded-control/card/panel/pill) — sem isto, `cn('rounded-card',
// 'rounded-pill')` devolvia as duas classes em vez de deixar a última ganhar.

import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ['control', 'card', 'panel', 'pill'],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// lib/cn.ts
// Combina classNames condicionais (clsx) e resolve conflitos de utilitários
// Tailwind (tailwind-merge) — usado por todos os componentes de components/ui/
// para aceitarem um `className` de override sem duplicar/colidir utilitários.

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

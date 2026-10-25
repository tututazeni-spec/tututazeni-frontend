// components/ui/Checkbox.tsx
//
// Caixa de verificação nativa com o aspecto do design system: contorno e
// marca em navy (accent-brand), anel de foco visível. Substitui os ~190
// <input type="checkbox"> escritos à mão, cada um com a sua mistura de
// h-4/h-3.5, accent-primary, border-border-strong… Mantém o contrato nativo
// (checked/onChange/disabled/id/aria-*), por isso é uma troca directa.

import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size'
> {
  /** `sm` (14px) para listas densas e tabelas; `md` (16px) por omissão. */
  size?: 'sm' | 'md';
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, size = 'md', ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        'shrink-0 cursor-pointer rounded-control accent-brand',
        size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Checkbox.displayName = 'Checkbox';

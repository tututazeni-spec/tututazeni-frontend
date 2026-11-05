// components/ui/Textarea.tsx
'use client';

import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
  /** `underline` = design dos filtros (só linha por baixo). */
  variant?: 'box' | 'underline';
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, variant = 'box', ...props }, ref) => (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        variant === 'underline'
          ? 'min-h-[44px] rounded-none border-0 border-b border-brand-line bg-transparent px-1 pb-2.5 pt-3 font-body text-sm text-field-ink placeholder:text-ink-muted transition-colors hover:border-brand-muted focus:border-brand focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50'
          : [
              'rounded-control border-[1.5px] border-field bg-surface px-3 py-[9px] font-body text-sm text-field-ink',
              'placeholder:text-ink-muted',
              'focus:bg-field-soft focus:outline-none focus:ring-[3px] focus:ring-field-soft',
              'disabled:cursor-not-allowed disabled:opacity-50',
            ],
        invalid && 'border-danger focus:ring-danger-subtle',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

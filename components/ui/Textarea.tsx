// components/ui/Textarea.tsx
'use client';

import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'rounded-control border-[1.5px] border-border-strong bg-surface px-3 py-[9px] font-body text-sm text-ink',
        'placeholder:text-ink-faint',
        'focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent-subtle',
        invalid && 'border-danger focus:border-danger focus:ring-danger-subtle',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

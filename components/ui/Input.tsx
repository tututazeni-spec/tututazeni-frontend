// components/ui/Input.tsx
'use client';

import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { SearchInput } from './SearchInput';

// Campos de pesquisa são reconhecidos por type="search" ou pelo placeholder.
const SEARCH_PLACEHOLDER = /^\s*(pesquis|buscar|procurar)/i;

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  /** Só para campos de pesquisa: esconde a lupa. */
  showIcon?: boolean;
  /** `underline` = design dos filtros (pesquisa: ver SearchInput; texto: só linha por baixo). */
  variant?: 'capsule' | 'underline';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, showIcon, variant, ...props }, ref) => {
    const isSearch =
      props.type === 'search' ||
      ((props.type === undefined || props.type === 'text') &&
        SEARCH_PLACEHOLDER.test(props.placeholder ?? ''));

    if (isSearch) {
      const { type: _type, ...rest } = props;
      return (
        <SearchInput
          ref={ref}
          invalid={invalid}
          showIcon={showIcon}
          variant={variant}
          className={className}
          historyKey={props.placeholder}
          {...rest}
        />
      );
    }

    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          variant === 'underline'
            ? 'min-h-[44px] rounded-none border-0 border-b border-brand-line bg-transparent px-1 pb-2.5 pt-3 font-body text-sm text-field-ink placeholder:text-ink-muted transition-colors hover:border-brand-muted focus:border-brand focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50'
            : [
                'min-h-[48px] rounded-control border-[1.5px] border-field bg-surface px-3 py-[9px] font-body text-sm text-field-ink',
                'placeholder:text-ink-muted',
                'focus:bg-field-soft focus:outline-none focus:ring-[3px] focus:ring-field-soft',
                'disabled:cursor-not-allowed disabled:opacity-50',
              ],
          invalid && 'border-danger focus:ring-danger-subtle',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

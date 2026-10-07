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
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => {
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
          'rounded-control border-[1.5px] border-border-strong bg-surface px-3 py-[9px] font-body text-sm text-ink',
          'placeholder:text-ink-faint',
          'focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent-subtle',
          invalid &&
            'border-danger focus:border-danger focus:ring-danger-subtle',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

// components/ui/NativeSelect.tsx
//
// <select> nativo com o aspecto de Input/Select (contorno navy 1,5px, raio de
// controlo, anel de foco, chevron próprio). Para filtros e formulários onde a
// lista é curta ou dinâmica e o contrato nativo (value/onChange(e)) compensa;
// para listas longas com pesquisa usar <Combobox>, e <Select> para o desenho
// com rótulo flutuante. O `className` aplica-se ao wrapper (largura, margens).

import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface NativeSelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'size'
> {
  invalid?: boolean;
  /** `sm` (36px) para barras de filtros densas; `md` (48px) alinha com <Input>. */
  density?: 'sm' | 'md';
}

export const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, invalid, density = 'md', children, ...props }, ref) => (
    <div className={cn('relative inline-block max-w-full', className)}>
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          'w-full appearance-none rounded-control border-[1.5px] border-field bg-surface py-[9px] pl-3 pr-9 font-body text-sm text-field-ink',
          density === 'sm' ? 'min-h-[36px]' : 'min-h-[48px]',
          'focus:bg-field-soft focus:outline-none focus:ring-[3px] focus:ring-field-soft',
          'disabled:cursor-not-allowed disabled:opacity-50',
          invalid && 'border-danger focus:ring-danger-subtle',
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        size={16}
        strokeWidth={1.75}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted"
      />
    </div>
  ),
);
NativeSelect.displayName = 'NativeSelect';

// components/ui/Button.tsx
'use client';

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-body font-semibold ' +
    'transition-[color,background-color,border-color,transform] duration-150 active:translate-y-px ' +
    'disabled:pointer-events-none disabled:opacity-50 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ' +
    'focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
  {
    variants: {
      intent: {
        primary:
          'bg-brand text-white hover:bg-brand-hover active:bg-brand-active',
        secondary:
          'border-[1.5px] border-brand bg-surface text-brand hover:bg-brand-soft',
        ghost:
          'bg-transparent text-ink-muted hover:bg-surface-sunken hover:text-ink',
        // Acção destrutiva discreta (eliminar/remover): cinzento, vermelho ao pairar.
        ghostDanger:
          'bg-transparent text-ink-muted hover:bg-danger-subtle hover:text-danger-ink',
        danger: 'bg-danger text-white hover:brightness-95 active:brightness-90',
        success:
          'bg-success text-white hover:brightness-95 active:brightness-90',
        warning:
          'bg-warning text-white hover:brightness-95 active:brightness-90',
        // Botões sobre cartões escuros (navy/foto): em pílula, com anel de foco
        // branco. `onDark` é a acção principal; `onDarkGhost` a secundária.
        onDark:
          'bg-white/90 text-brand hover:bg-white focus-visible:ring-white focus-visible:ring-offset-brand',
        onDarkGhost:
          'bg-brand/70 text-white/90 hover:bg-white/25 hover:text-white focus-visible:ring-white focus-visible:ring-offset-brand',
      },
      size: {
        xs: 'rounded-control px-2 py-1 text-xs',
        sm: 'rounded-control px-3 py-1.5 text-xs',
        compact: 'h-8 rounded-control px-3 text-sm',
        md: 'rounded-control px-[18px] py-[9px] text-sm',
        // Só ícone, 32px (acções de cartão). Para 36px com ícone tipado usar <IconButton>.
        icon: 'h-8 w-8 rounded-control p-0',
      },
    },
    // O raio vem do `size`; sobre fundo escuro os botões são sempre em pílula.
    compoundVariants: [
      { intent: ['onDark', 'onDarkGhost'], class: 'rounded-pill' },
    ],
    defaultVariants: { intent: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, intent, size, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ intent, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (
        <Loader2 size={16} strokeWidth={1.75} className="animate-spin" />
      )}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';

export interface IconButtonProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  icon: LucideIcon;
  /** aria-label — obrigatório: botão só de ícone tem de ter nome acessível. */
  label: string;
}

// Caixa e ícone andam juntos: o tamanho decide os dois, para que os botões de
// ícone tenham sempre a mesma proporção e uma área de clique confortável.
// `sm` e `md` ficam a 36px (como sempre foi); `xs` e `compact` são as caixas
// de 28px e 32px para tabelas e cartões densos.
const ICON_BOX = {
  xs: { box: 'h-7 w-7', px: 14 },
  compact: { box: 'h-8 w-8', px: 16 },
  icon: { box: 'h-8 w-8', px: 16 },
  sm: { box: 'h-9 w-9', px: 18 },
  md: { box: 'h-9 w-9', px: 18 },
} as const;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, intent, size, icon: Icon, label, ...props }, ref) => {
    const dims = ICON_BOX[size ?? 'md'];
    return (
      <button
        ref={ref}
        aria-label={label}
        className={cn(
          buttonVariants({ intent, size }),
          'aspect-square p-0',
          dims.box,
          className,
        )}
        {...props}
      >
        <Icon size={dims.px} strokeWidth={1.75} />
      </button>
    );
  },
);
IconButton.displayName = 'IconButton';

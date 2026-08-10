// components/ui/Button.tsx
'use client';

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-body font-semibold ' +
    'transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ' +
    'focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
  {
    variants: {
      intent: {
        primary: 'bg-primary text-canvas hover:bg-primary-hover active:bg-primary-active',
        secondary:
          'border-[1.5px] border-primary bg-surface text-primary hover:bg-primary-subtle',
        ghost: 'bg-transparent text-ink-muted hover:bg-surface-sunken hover:text-ink',
        danger: 'bg-danger text-white hover:brightness-95 active:brightness-90',
      },
      size: {
        sm: 'rounded-control px-3 py-1.5 text-xs',
        md: 'rounded-control px-[18px] py-[9px] text-sm',
      },
    },
    defaultVariants: { intent: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
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
      {loading && <Loader2 size={16} strokeWidth={1.75} className="animate-spin" />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  icon: LucideIcon;
  /** aria-label — obrigatório: botão só de ícone tem de ter nome acessível. */
  label: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, intent, size, icon: Icon, label, ...props }, ref) => (
    <button
      ref={ref}
      aria-label={label}
      className={cn(buttonVariants({ intent, size }), 'aspect-square h-9 w-9 p-0', className)}
      {...props}
    >
      <Icon size={18} strokeWidth={1.75} />
    </button>
  ),
);
IconButton.displayName = 'IconButton';

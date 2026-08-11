// components/ui/Badge.tsx
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const INTENT_CLASSES = {
  success: 'bg-success-subtle text-success-ink',
  warning: 'bg-warning-subtle text-warning-ink',
  danger: 'bg-danger-subtle text-danger-ink',
  info: 'bg-info-subtle text-info-ink',
  neutral: 'bg-surface-sunken text-ink-muted',
} as const;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  intent?: keyof typeof INTENT_CLASSES;
}

export function Badge({ intent = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 font-body text-xs font-semibold',
        INTENT_CLASSES[intent],
        className,
      )}
      {...props}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

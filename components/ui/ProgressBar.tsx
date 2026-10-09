// components/ui/ProgressBar.tsx
import { cn } from '@/lib/cn';

const INTENT_FILL: Record<NonNullable<ProgressBarProps['intent']>, string> = {
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

export interface ProgressBarProps {
  /** 0–100 */
  value: number;
  /** cor de preenchimento — por omissão `accent`, mantém o comportamento actual */
  intent?: 'accent' | 'success' | 'warning' | 'danger';
  /** cor CSS arbitrária — tem precedência sobre `intent` */
  color?: string;
  className?: string;
}

export function ProgressBar({
  value,
  intent = 'accent',
  color,
  className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-1.5 w-full rounded-pill bg-surface-sunken', className)}
    >
      <div
        className={cn(
          'h-full rounded-pill transition-[width] duration-300',
          !color && INTENT_FILL[intent],
        )}
        style={{
          width: `${clamped}%`,
          ...(color ? { backgroundColor: color } : {}),
        }}
      />
    </div>
  );
}

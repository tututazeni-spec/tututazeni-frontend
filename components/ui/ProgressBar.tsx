// components/ui/ProgressBar.tsx
import { cn } from '@/lib/cn';

export interface ProgressBarProps {
  /** 0–100 */
  value: number;
  className?: string;
}

export function ProgressBar({ value, className }: ProgressBarProps) {
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
        className="h-full rounded-pill bg-accent transition-[width] duration-300"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

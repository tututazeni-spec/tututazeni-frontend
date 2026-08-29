// components/ui/KpiCard.tsx
// Consolida os `KpiCard` locais (ex.: components/engagement/atoms.tsx).
import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Card } from './Card';

const INTENT_CLASSES = {
  primary: 'bg-primary-subtle text-primary',
  accent: 'bg-accent-subtle text-accent',
  success: 'bg-success-subtle text-success-ink',
  warning: 'bg-warning-subtle text-warning-ink',
  danger: 'bg-danger-subtle text-danger-ink',
  info: 'bg-info-subtle text-info-ink',
} as const;

export interface KpiCardProps {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  /** % — positivo mostra seta a subir a verde, negativo a descer a vermelho. */
  trend?: number;
  intent?: keyof typeof INTENT_CLASSES;
  className?: string;
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  intent = 'primary',
  className,
}: KpiCardProps) {
  return (
    <Card className={cn('w-48 p-4', className)}>
      <div className="mb-3 flex min-h-6 items-start justify-between">
        {Icon ? (
          <div className={cn('rounded-control p-2', INTENT_CLASSES[intent])}>
            <Icon size={18} strokeWidth={1.75} />
          </div>
        ) : (
          <div />
        )}

        {trend !== undefined && (
          <span
            className={cn(
              'flex items-center gap-0.5 font-body text-xs font-medium',
              trend >= 0 ? 'text-success' : 'text-danger',
            )}
          >
            {trend >= 0 ? (
              <TrendingUp size={12} strokeWidth={1.75} />
            ) : (
              <TrendingDown size={12} strokeWidth={1.75} />
            )}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="font-display text-2xl font-bold text-ink">{value}</p>
      <p className="mt-0.5 font-body text-xs text-ink-muted">{label}</p>
      {sub && (
        <p className="mt-0.5 font-body text-[10px] text-ink-faint">{sub}</p>
      )}
    </Card>
  );
}

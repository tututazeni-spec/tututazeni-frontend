// components/ui/KpiCard.tsx
// Consolida os `KpiCard` locais (ex.: components/engagement/atoms.tsx).
import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Card } from './Card';

const INTENTS = [
  'primary',
  'accent',
  'success',
  'warning',
  'danger',
  'info',
] as const;

export interface KpiCardProps {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  /** % — positivo mostra seta a subir a verde, negativo a descer a vermelho. */
  trend?: number;
  /** Mantido por compatibilidade: o ícone usa sempre o estilo #0F1F3D/60 branco. */
  intent?: (typeof INTENTS)[number];
  className?: string;
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  className,
}: KpiCardProps) {
  return (
    <Card className={cn('w-48 p-4', className)}>
      <div className="mb-3 flex min-h-6 items-start justify-between">
        {Icon ? (
          <div className="rounded-control bg-[#0F1F3D]/60 p-2 text-white">
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

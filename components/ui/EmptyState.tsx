import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  /**
   * `panel` (por omissão): caixa tracejada para um ecrã, tabela ou lista vazia.
   * `inline`: texto centrado e discreto, sem caixa — para dentro de cartões,
   * secções de detalhe e gráficos onde uma caixa seria pesada demais.
   */
  variant?: 'panel' | 'inline';
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'panel',
  className,
}: EmptyStateProps) {
  if (variant === 'inline') {
    return (
      <div
        className={cn(
          'flex flex-col items-center gap-1.5 py-4 text-center',
          className,
        )}
      >
        {Icon && (
          <Icon size={18} strokeWidth={1.75} className="text-ink-faint" />
        )}
        <p className="font-body text-sm font-medium text-ink-muted">{title}</p>
        {description && (
          <p className="max-w-xs font-body text-xs text-ink-faint">
            {description}
          </p>
        )}
        {action && (
          <Button size="sm" intent="secondary" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-card border border-dashed border-border-strong bg-surface p-10 text-center',
        className,
      )}
    >
      {Icon && (
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/60">
          <Icon size={20} strokeWidth={1.75} className="text-white" />
        </div>
      )}
      <div>
        <h3 className="font-display text-sm font-bold text-ink">{title}</h3>
        {description && (
          <p className="mt-1 max-w-xs font-body text-xs text-ink-muted">
            {description}
          </p>
        )}
      </div>
      {action && (
        <Button size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

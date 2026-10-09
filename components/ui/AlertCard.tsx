// components/ui/AlertCard.tsx
// Banner de alerta moderno: fundo claro, borda suave, ícone à esquerda,
// título em negrito, mensagem curta e CTA opcional. Responsivo (o CTA passa
// para baixo do texto em ecrãs estreitos). Partilhado por
// components/dashboard/AlertBanner.tsx e components/dashboard-rh/AlertStrip.tsx.

import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export type AlertCardVariant = 'warning' | 'danger' | 'info' | 'success';

const VARIANTS: Record<
  AlertCardVariant,
  {
    icon: LucideIcon;
    box: string;
    iconWrap: string;
    iconColor: string;
    title: string;
    message: string;
  }
> = {
  warning: {
    icon: AlertTriangle,
    box: 'border-[#FDBA74]/70 bg-[#FFFBEB]',
    iconWrap: 'bg-[#FEF3C7]',
    iconColor: 'text-[#D97706]',
    title: 'text-[#92400E]',
    message: 'text-[#78350F]',
  },
  danger: {
    icon: AlertTriangle,
    box: 'border-[#FCA5A5]/70 bg-[#FEF2F2]',
    iconWrap: 'bg-[#FEE2E2]',
    iconColor: 'text-[#DC2626]',
    title: 'text-[#991B1B]',
    message: 'text-[#7F1D1D]',
  },
  info: {
    icon: Info,
    box: 'border-[#93C5FD]/70 bg-[#EFF6FF]',
    iconWrap: 'bg-[#DBEAFE]',
    iconColor: 'text-[#2563EB]',
    title: 'text-[#1E40AF]',
    message: 'text-[#1E3A8A]',
  },
  success: {
    icon: CheckCircle,
    box: 'border-[#86EFAC]/70 bg-[#F0FDF4]',
    iconWrap: 'bg-[#DCFCE7]',
    iconColor: 'text-[#16A34A]',
    title: 'text-[#166534]',
    message: 'text-[#14532D]',
  },
};

export interface AlertCardProps {
  variant?: AlertCardVariant;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  /** versão baixa: ~50% da altura, título e mensagem na mesma linha */
  compact?: boolean;
  className?: string;
}

export function AlertCard({
  variant = 'warning',
  title,
  message,
  actionUrl,
  actionLabel = 'Ver →',
  compact = false,
  className,
}: AlertCardProps) {
  const v = VARIANTS[variant];
  const Icon = v.icon;
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col rounded-2xl border shadow-sm sm:flex-row sm:items-center',
        compact ? 'gap-2 px-3 py-2' : 'gap-3 p-4',
        v.box,
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span
          className={cn(
            'flex shrink-0 items-center justify-center rounded-full',
            compact ? 'h-6 w-6' : 'h-8 w-8',
            v.iconWrap,
          )}
        >
          <Icon
            size={compact ? 14 : 18}
            strokeWidth={1.75}
            className={v.iconColor}
          />
        </span>
        <div
          className={cn(
            'min-w-0',
            compact && 'flex flex-wrap items-baseline gap-x-2',
          )}
        >
          <p className={cn('font-body text-sm font-bold', v.title)}>{title}</p>
          <p
            className={cn(
              'font-body',
              compact ? 'text-xs' : 'text-sm',
              v.message,
            )}
          >
            {message}
          </p>
        </div>
      </div>
      {actionUrl && (
        <a
          href={actionUrl}
          className="shrink-0 self-start rounded-control bg-[#0F1F3D] px-3 py-1.5 font-body text-xs text-white hover:brightness-95 sm:self-center"
        >
          {actionLabel}
        </a>
      )}
    </div>
  );
}

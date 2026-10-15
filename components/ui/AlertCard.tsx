// components/ui/AlertCard.tsx
// PADRÃO ÚNICO de aviso/alerta em banner do projecto (não criar <div> soltos
// com bg-danger-subtle). Fundo claro, faixa lateral na cor da variante, ícone
// em círculo, título curto a negrito, mensagem numa frase, linha de detalhe
// discreta (dados técnicos, ex. última falha) e CTA opcional em navy #0F1F3D.
// Responsivo (o CTA passa para baixo do texto em ecrãs estreitos).
// Partilhado por components/dashboard/AlertBanner.tsx,
// components/dashboard-rh/AlertStrip.tsx e components/audit/OverviewView.tsx.
//
// Texto: título = o que aconteceu (sentença curta, sem ponto); mensagem = o
// efeito para o utilizador e o que fazer; detalhe = só diagnóstico. Nunca
// mostrar mensagens cruas de ORM/SQL — resumir e deixar o completo em `title`.

import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export type AlertCardVariant = 'warning' | 'danger' | 'info' | 'success';

const VARIANTS: Record<
  AlertCardVariant,
  {
    icon: LucideIcon;
    box: string;
    accent: string;
    iconWrap: string;
    iconColor: string;
    title: string;
    message: string;
    detail: string;
  }
> = {
  warning: {
    icon: AlertTriangle,
    box: 'border-[#FDBA74]/70 bg-[#FFFBEB]',
    accent: 'border-l-[#D97706]',
    iconWrap: 'bg-[#FEF3C7]',
    iconColor: 'text-[#D97706]',
    title: 'text-[#92400E]',
    message: 'text-[#78350F]',
    detail: 'text-[#92400E]/80',
  },
  danger: {
    icon: AlertTriangle,
    box: 'border-[#FCA5A5]/70 bg-[#FEF2F2]',
    accent: 'border-l-[#DC2626]',
    iconWrap: 'bg-[#FEE2E2]',
    iconColor: 'text-[#DC2626]',
    title: 'text-[#991B1B]',
    message: 'text-[#7F1D1D]',
    detail: 'text-[#991B1B]/80',
  },
  info: {
    icon: Info,
    box: 'border-[#93C5FD]/70 bg-[#EFF6FF]',
    accent: 'border-l-[#2563EB]',
    iconWrap: 'bg-[#DBEAFE]',
    iconColor: 'text-[#2563EB]',
    title: 'text-[#1E40AF]',
    message: 'text-[#1E3A8A]',
    detail: 'text-[#1E40AF]/80',
  },
  success: {
    icon: CheckCircle,
    box: 'border-[#86EFAC]/70 bg-[#F0FDF4]',
    accent: 'border-l-[#16A34A]',
    iconWrap: 'bg-[#DCFCE7]',
    iconColor: 'text-[#16A34A]',
    title: 'text-[#166534]',
    message: 'text-[#14532D]',
    detail: 'text-[#166534]/80',
  },
};

export interface AlertCardProps {
  variant?: AlertCardVariant;
  title: string;
  message: string;
  /** linha técnica discreta sob a mensagem (ex.: última falha) */
  detail?: string;
  actionUrl?: string;
  /** alternativa a actionUrl para navegação interna sem recarregar */
  onAction?: () => void;
  actionLabel?: string;
  /** versão baixa: ~50% da altura, título e mensagem na mesma linha */
  compact?: boolean;
  className?: string;
}

export function AlertCard({
  variant = 'warning',
  title,
  message,
  detail,
  actionUrl,
  onAction,
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
        'flex flex-col rounded-2xl border border-l-4 shadow-sm sm:flex-row sm:items-center',
        compact ? 'gap-2 px-3 py-2' : 'gap-3 p-4',
        v.box,
        v.accent,
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
          {detail && (
            <p
              title={detail}
              className={cn('mt-0.5 line-clamp-2 font-body text-xs', v.detail)}
            >
              {detail}
            </p>
          )}
        </div>
      </div>
      {onAction && !actionUrl && (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 self-start rounded-control bg-[#0F1F3D] px-3 py-1.5 font-body text-xs text-white hover:brightness-95 sm:self-center"
        >
          {actionLabel}
        </button>
      )}
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

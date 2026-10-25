// components/roi-impact/NavyPanel.tsx
// Painel navy do "Principais conclusões automáticas" (Executivo): cabeçalho
// com ícone + título, lista de linhas em cartões translúcidos. Partilhado
// para que resultados/conclusões de todo o módulo tenham o mesmo desenho.

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Variantes de cor do painel (a omissa é o navy das conclusões). */
export const NAVY_PANEL_VARIANTS = [
  'from-brand via-brand-mid to-brand-dark',
  'from-[#14532D] via-[#15803D] to-[#166534]',
  'from-[#7C2D12] via-[#C2410C] to-[#9A3412]',
  'from-[#4C1D95] via-[#6D28D9] to-[#5B21B6]',
  'from-[#134E4A] via-[#0F766E] to-[#115E59]',
  'from-[#831843] via-[#BE185D] to-[#9D174D]',
] as const;

/** Mesmas cores com 35% menos opacidade (cartões de análise). */
export const NAVY_PANEL_VARIANTS_SOFT = [
  'from-brand/65 via-brand-mid/65 to-brand-dark/65',
  'from-[#14532D]/65 via-[#15803D]/65 to-[#166534]/65',
  'from-[#7C2D12]/65 via-[#C2410C]/65 to-[#9A3412]/65',
  'from-[#4C1D95]/65 via-[#6D28D9]/65 to-[#5B21B6]/65',
  'from-[#134E4A]/65 via-[#0F766E]/65 to-[#115E59]/65',
  'from-[#831843]/65 via-[#BE185D]/65 to-[#9D174D]/65',
] as const;

interface NavyPanelProps {
  /** Índice na paleta NAVY_PANEL_VARIANTS (cíclico). */
  variant?: number;
  /** Usa a paleta com 35% menos opacidade. */
  soft?: boolean;
  title: string;
  icon: LucideIcon;
  /** Conteúdo à direita do cabeçalho (ex.: selo de confiança). */
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function NavyPanel({
  variant = 0,
  soft,
  title,
  icon: Icon,
  aside,
  className,
  children,
}: NavyPanelProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-panel bg-gradient-to-br p-4 text-white shadow-[0_8px_24px_rgba(15,31,61,0.25)]',
        (soft ? NAVY_PANEL_VARIANTS_SOFT : NAVY_PANEL_VARIANTS)[
          variant % NAVY_PANEL_VARIANTS.length
        ],
        className,
      )}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {soft ? (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/25">
              <Icon
                className="h-6 w-6 text-white"
                strokeWidth={2.5}
                aria-hidden
              />
            </span>
          ) : (
            <Icon className="h-6 w-6 text-on-brand-accent" aria-hidden />
          )}
          <h4 className="font-display text-base font-bold">{title}</h4>
        </div>
        {aside}
      </div>
      {children}
    </div>
  );
}

export interface NavyPanelRowProps {
  icon?: LucideIcon;
  iconClassName?: string;
  /** Ícone branco, mais forte, dentro de um círculo. */
  iconBadge?: boolean;
  children: ReactNode;
}

/** Linha em cartão translúcido dentro do NavyPanel. */
export function NavyPanelRow({
  icon: Icon,
  iconClassName = 'text-on-brand-accent',
  iconBadge,
  children,
}: NavyPanelRowProps) {
  return (
    <li className="flex items-start gap-3 rounded-card bg-white/10 px-4 py-2.5 font-body text-sm leading-snug">
      {Icon &&
        (iconBadge ? (
          <span
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/25',
              iconClassName,
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={2.5} aria-hidden />
          </span>
        ) : (
          <Icon
            className={cn('mt-0.5 h-5 w-5 shrink-0', iconClassName)}
            aria-hidden
          />
        ))}
      <span className="min-w-0 flex-1">{children}</span>
    </li>
  );
}

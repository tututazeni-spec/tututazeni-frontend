// components/evaluation/EvalTemplateCard.tsx
// Estrutura partilhada pelos cartões do módulo Avaliação (Avaliações, Ciclos,
// Avaliações formais, Avaliações pendentes) no desenho do cartão de template
// dos "Planos de Integração" (onboarding/TemplateCard): fundo em gradiente na
// cor própria, topo com imagem tingida + etiqueta de estado, métricas em
// grelha, linhas de informação e rodapé com barra de destaque, título e botão
// circular. Cada cartão passa a sua informação e a sua imagem; aqui só vive o
// desenho.

import type { KeyboardEvent, ReactNode } from 'react';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { CourseThumbnail } from '@/components/courses/CourseThumbnail';
import { PALETTE } from '@/components/onboarding/TemplateCard';

export type ChipTone =
  'success' | 'neutral' | 'warning' | 'danger' | 'info' | undefined;

const DOT: Record<NonNullable<ChipTone>, string> = {
  success: 'bg-[#16A765]',
  neutral: 'bg-white/50',
  warning: 'bg-[#F5A524]',
  danger: 'bg-[#FF6B7D]',
  info: 'bg-[#5AA9FF]',
};

export interface EvalCardMetric {
  icon: LucideIcon;
  text: ReactNode;
  danger?: boolean;
}

export interface EvalCardLine {
  icon?: LucideIcon;
  /** Substitui o ícone (ex.: avatar). */
  leading?: ReactNode;
  text: ReactNode;
}

export interface EvalTemplateCardProps {
  /** Escolhe a cor do cartão (id). */
  seed: number;
  /** Imagem do topo (URL ou data URL). */
  imageUrl?: string | null;
  imageAlt?: string;
  /** Mostrado no topo quando não há imagem. */
  fallback?: ReactNode;
  chip?: { label: string; tone?: ChipTone };
  /** Botões redondos sobre o canto superior direito (menu, duplicar…). */
  actions?: ReactNode;
  /** Selos extra por baixo do topo (finalidade, atraso…). */
  badges?: ReactNode;
  metrics: EvalCardMetric[];
  lines?: EvalCardLine[];
  /** Painel por baixo das linhas (progresso, botões de acção). */
  panel?: ReactNode;
  title: string;
  subtitle?: string;
  /** Clique no cartão. Sem valor, o cartão não é clicável. */
  onSelect?: () => void;
  /** Posição da imagem no cartão (por omissão, no topo). */
  imagePosition?: 'top' | 'bottom';
  /** Enquadramento da imagem (classe object-*; por omissão, ao centro). */
  imageClassName?: string;
}

export function EvalTemplateCard({
  seed,
  imageUrl,
  imageAlt = '',
  fallback,
  chip,
  actions,
  badges,
  metrics,
  lines = [],
  panel,
  title,
  subtitle,
  onSelect,
  imagePosition = 'top',
  imageClassName = 'object-center',
}: EvalTemplateCardProps) {
  const palette = PALETTE[Math.abs(seed) % PALETTE.length];
  const clickable = !!onSelect;
  const asButton = clickable && !actions;

  const bottom = imagePosition === 'bottom';
  const chipEl = chip ? (
    <span
      className={cn(
        'z-10 inline-flex items-center gap-2 rounded-full bg-[#0F1F3D]/80 px-4 py-1.5 text-sm font-semibold text-white',
        !bottom && 'absolute left-5 top-5',
      )}
    >
      <span
        aria-hidden
        className={cn('h-2.5 w-2.5 rounded-full', DOT[chip.tone ?? 'neutral'])}
      />
      {chip.label}
    </span>
  ) : null;
  const actionsEl = actions ? (
    <div
      className={cn(
        'z-20 flex items-center gap-1',
        !bottom && 'absolute right-3 top-3',
      )}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {actions}
    </div>
  ) : null;
  const imageBlock = (
    <div
      className={cn(
        'relative min-h-[170px] shrink-0 overflow-hidden',
        bottom && 'mt-2',
      )}
    >
      {imageUrl ? (
        <CourseThumbnail
          src={imageUrl}
          alt={imageAlt}
          className={cn('object-cover', imageClassName)}
          fallbackClassName="text-white/60"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white/60">
          {fallback}
        </div>
      )}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(160deg, ${palette[0]}26 0%, ${palette[1]}26 100%)`,
        }}
      />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 h-24',
          bottom ? 'top-0' : 'bottom-0',
        )}
        style={{
          background: `linear-gradient(${bottom ? 0 : 180}deg, transparent 0%, ${palette[2]} 100%)`,
        }}
      />
      {!bottom && chipEl}
      {!bottom && actionsEl}
    </div>
  );

  return (
    <div
      role={asButton ? 'button' : undefined}
      tabIndex={asButton ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
        if (!onSelect || e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        'relative flex h-full flex-col overflow-hidden rounded-panel border border-white/10 text-white shadow-[0_4px_14px_rgba(21,47,89,0.25)] transition-all duration-200 ease-out hover:scale-[1.03] hover:shadow-[0_10px_24px_rgba(21,47,89,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 motion-reduce:hover:scale-100',
        clickable && 'cursor-pointer',
      )}
      style={{
        background: `linear-gradient(165deg, ${palette[1]} 0%, ${palette[2]} 60%, ${palette[2]} 100%)`,
      }}
    >
      {!bottom && imageBlock}
      {bottom && (chip || actions) && (
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          {chipEl}
          {actionsEl}
        </div>
      )}

      {badges && (
        <div className="flex flex-wrap items-center gap-2 px-6 pt-1">
          {badges}
        </div>
      )}

      {/* Métricas */}
      {metrics.length > 0 && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 px-6 pb-2 pt-3">
          {metrics.map(({ icon: Icon, text, danger }, i) => (
            <div
              key={i}
              className="flex items-center gap-3 text-[15px] font-medium text-white"
            >
              <Icon
                size={22}
                strokeWidth={1.5}
                className="shrink-0 text-[#9DB8E0]"
              />
              <span
                className={cn(
                  'min-w-0 break-words',
                  danger && 'text-[#FF9AA8]',
                )}
              >
                {text}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Linhas de informação */}
      {lines.length > 0 && (
        <div className="px-6 pt-3">
          <ul className="space-y-1.5 text-sm text-white/80">
            {lines.map(({ icon: Icon, leading, text }, i) => (
              <li key={i} className="flex items-center gap-2">
                {leading ??
                  (Icon ? (
                    <Icon
                      size={16}
                      strokeWidth={1.75}
                      className="shrink-0 text-[#9DB8E0]"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#FFD28A]"
                    />
                  ))}
                <span className="min-w-0 break-words">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {panel && (
        <div className="mx-4 mt-4 space-y-3 rounded-panel bg-white/10 px-4 py-3">
          {panel}
        </div>
      )}

      {/* Rodapé: barra de destaque + título + botão circular */}
      <div className="mt-auto flex items-center gap-4 px-6 pb-6 pt-6">
        <span
          aria-hidden
          className="h-16 w-1 shrink-0 rounded-full"
          style={{ background: palette[3] }}
        />
        <div className="min-w-0 flex-1">
          <h3 className="break-words font-body text-2xl font-extrabold leading-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-1 line-clamp-2 break-words text-[15px] text-white/70">
              {subtitle}
            </p>
          )}
        </div>
        {clickable && (
          <span
            aria-hidden
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white"
            style={{ background: palette[0] }}
          >
            <ChevronRight size={22} strokeWidth={2.25} />
          </span>
        )}
      </div>

      {bottom && imageBlock}
    </div>
  );
}

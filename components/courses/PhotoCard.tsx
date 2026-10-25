// components/courses/PhotoCard.tsx
// Cartão genérico no desenho de "card para cursos criados" (public/images):
// o mesmo de CourseListCard, mas alimentado por dados soltos em vez de um
// curso — gradiente na cor própria (`seed`), título em maiúsculas com uma
// palavra longa por linha, imagem recortada no canto superior direito,
// badges, métricas empilhadas, linhas com seta e painel de progresso.
// Usado pelas sessões e gravações do módulo Aulas ao vivo.

'use client';

import { useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { GraduationCap } from 'lucide-react';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PALETTE } from '@/components/onboarding/TemplateCard';
import { InfoRow, Metric, titleLines } from './CourseListCard';

/** Classe dos botões redondos de acção sobre a imagem. */
export const PHOTO_CARD_ACTION =
  'inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand/70 text-white/90 hover:bg-white/25 hover:text-white disabled:opacity-50';

export interface PhotoCardMetric {
  icon: LucideIcon;
  text: ReactNode;
}

export interface PhotoCardRow {
  icon?: LucideIcon;
  /** Substitui o ícone (ex.: avatar). */
  leading?: ReactNode;
  text: ReactNode;
}

interface PhotoCardProps {
  /** Identificador que escolhe a cor própria do cartão. */
  seed: number;
  kicker: string;
  kickerIcon?: LucideIcon;
  title: string;
  subtitle?: string | null;
  /** URL da imagem; sem ela mostra `fallback`. */
  image?: string | null;
  fallback?: ReactNode;
  badges?: ReactNode;
  metrics?: PhotoCardMetric[];
  rows?: PhotoCardRow[];
  progress?: { value: number; label?: string };
  /** Versão baixa (~metade da altura): imagem e título menores, métricas e
   *  linhas em texto corrido, sem subtítulo. */
  compact?: boolean;
  /** Botões de acção (canto superior direito, sobre a imagem). */
  actions?: ReactNode;
  /** Botões por baixo das linhas (ex.: Publicar). */
  footer?: ReactNode;
  onSelect?: () => void;
}

export function PhotoCard({
  seed,
  kicker,
  kickerIcon: KickerIcon = GraduationCap,
  title,
  subtitle,
  image,
  fallback,
  badges,
  metrics = [],
  rows = [],
  progress,
  compact = false,
  actions,
  footer,
  onSelect,
}: PhotoCardProps) {
  const palette = PALETTE[Math.abs(seed) % PALETTE.length];
  const [imageFailed, setImageFailed] = useState(false);
  const clickable = !!onSelect;

  return (
    <div
      role={clickable && !actions ? 'button' : undefined}
      tabIndex={clickable && !actions ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={(ev) => {
        if (!onSelect || ev.target !== ev.currentTarget) return;
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          onSelect();
        }
      }}
      className={`relative flex h-full flex-col overflow-hidden rounded-panel border border-white/10 text-white shadow-[0_4px_14px_rgba(21,47,89,0.25)] transition-all duration-200 ease-out hover:shadow-[0_10px_24px_rgba(21,47,89,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${clickable ? 'cursor-pointer hover:scale-[1.02] motion-reduce:hover:scale-100' : ''}`}
      style={{
        background: `linear-gradient(165deg, ${palette[1]} 0%, ${palette[2]} 60%, ${palette[2]} 100%)`,
      }}
    >
      <div
        className={`relative shrink-0 ${compact ? 'min-h-[190px]' : 'min-h-[240px]'}`}
      >
        <div
          aria-hidden
          className={`absolute -right-6 -top-4 w-[62%] rotate-6 opacity-80 ${compact ? 'h-[182px] rounded-[40px]' : 'h-[231px] rounded-[48px]'}`}
          style={{ background: palette[0] }}
        />
        <div
          className={`absolute right-0 top-0 flex w-[57%] items-center justify-center overflow-hidden bg-white/10 text-white/60 ${compact ? 'h-[174px] rounded-bl-[44px] rounded-tl-[40px]' : 'h-[220px] rounded-bl-[56px] rounded-tl-[48px]'}`}
        >
          {image && !imageFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            fallback
          )}
        </div>
        {actions && (
          <div
            className="absolute right-3 top-3 z-20 flex items-center gap-1"
            onClick={(ev) => ev.stopPropagation()}
            onKeyDown={(ev) => ev.stopPropagation()}
          >
            {actions}
          </div>
        )}
        <div
          className={`relative z-10 w-[56%] px-5 ${compact ? 'pt-5' : 'pt-5'}`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`flex shrink-0 items-center justify-center rounded-full bg-white/15 ${compact ? 'h-7 w-7' : 'h-9 w-9'}`}
            >
              <KickerIcon size={compact ? 16 : 20} strokeWidth={1.75} />
            </span>
            <span
              className={`font-medium leading-tight ${compact ? 'line-clamp-1 text-xs' : 'line-clamp-2 text-sm'}`}
            >
              {kicker}
            </span>
          </div>
          <div className={compact ? 'pt-3' : 'pt-5'}>
            <h3
              className={`font-body font-extrabold uppercase leading-tight tracking-wide ${compact ? 'break-words text-base' : 'text-2xl'}`}
            >
              {compact
                ? title
                : titleLines(title).map((line, i) => (
                    <span key={i} className="block whitespace-nowrap">
                      {line}
                    </span>
                  ))}
            </h3>
            {subtitle && !compact && (
              <p className="line-clamp-2 pt-2 text-sm text-[#C7D4E8]">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {badges && (
        <div
          className={`flex flex-wrap items-center gap-2 px-5 ${compact ? 'pt-4' : 'min-h-[28px] pt-3'}`}
        >
          {badges}
        </div>
      )}

      {compact && (metrics.length > 0 || rows.length > 0) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 pt-4 text-xs font-medium text-white">
          {[...metrics, ...rows].map((m, i) => {
            const Icon = 'icon' in m ? m.icon : undefined;
            const leading = 'leading' in m ? m.leading : undefined;
            return (
              <span key={i} className="inline-flex items-center gap-1.5">
                {leading ??
                  (Icon && (
                    <Icon
                      size={14}
                      strokeWidth={1.75}
                      className="shrink-0 text-[#9DB8E0]"
                    />
                  ))}
                <span className="line-clamp-1">{m.text}</span>
              </span>
            );
          })}
        </div>
      )}

      {!compact && metrics.length > 0 && (
        <div className="space-y-3 px-5 pt-4">
          {metrics.map((m, i) => (
            <Metric key={i} icon={m.icon}>
              {m.text}
            </Metric>
          ))}
        </div>
      )}

      {!compact && rows.length > 0 && (
        <div className="mx-5 mt-4 flex-1 divide-y divide-white/10 border-t border-white/15">
          {rows.map((r, i) => (
            <InfoRow key={i} icon={r.icon} leading={r.leading}>
              <span className="line-clamp-1">{r.text}</span>
            </InfoRow>
          ))}
        </div>
      )}
      {(compact || rows.length === 0) && <div className="flex-1" />}

      {footer && (
        <div
          className="flex flex-wrap items-center gap-2 px-5 pt-3"
          onClick={(ev) => ev.stopPropagation()}
        >
          {footer}
        </div>
      )}

      {progress ? (
        <div className="m-4 mt-3 space-y-2 rounded-panel bg-white/10 px-4 py-3">
          {progress.label && (
            <p className="text-xs text-[#C7D4E8]">{progress.label}</p>
          )}
          <div className="flex items-center gap-3">
            <ProgressBar
              value={progress.value}
              color={palette[3]}
              className="flex-1"
            />
            <span className="text-xs tabular-nums text-[#C7D4E8]">
              {progress.value}%
            </span>
          </div>
        </div>
      ) : (
        <div className={compact ? 'h-7' : 'h-4'} />
      )}
    </div>
  );
}

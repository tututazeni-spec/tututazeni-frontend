// components/evaluation/PendingEvaluationCard.tsx
// Cartão de avaliação pendente — mesmo desenho do cartão de curso
// (courses/CourseListCard): gradiente na cor própria, título em maiúsculas,
// imagem recortada no canto superior direito, métricas empilhadas, linhas com
// seta e painel de progresso. Os dados é que mudam: avaliado, prazo, ciclo.

'use client';

import { Fragment, type ReactNode } from 'react';
import { ClipboardList, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Avatar } from '@/components/ui/Avatar';
import { PALETTE } from '@/components/onboarding/TemplateCard';
import { CourseThumbnail } from '@/components/courses/CourseThumbnail';
import {
  InfoRow,
  Metric,
  titleLines,
} from '@/components/courses/CourseListCard';

/** Foto do cartão (public/images/avaliações.jpg). */
const CARD_PHOTO = '/images/avalia%C3%A7%C3%B5es.jpg';

export interface PendingEvaluationCardProps {
  /** Escolhe a cor do cartão (como o id do curso). */
  seed: number;
  title: string;
  /** Linha ao lado do ícone, no topo (ex.: tipo de avaliação). */
  kicker?: string;
  subtitle?: string;
  /** Selos por baixo da zona de topo. */
  badges?: ReactNode;
  metrics: Array<{
    icon: LucideIcon;
    text: string;
    danger?: boolean;
  }>;
  /** Pessoa avaliada — linha com avatar. */
  evaluated: { name: string; avatarUrl?: string | null; role?: string };
  /** Linhas com seta (ciclo, departamento…). Vazias mostram "—". */
  rows: Array<{ icon: LucideIcon; text?: string | null }>;
  progress?: number;
  /** Botões de acção no fundo do cartão. */
  footer?: ReactNode;
}

export function PendingEvaluationCard({
  seed,
  title,
  kicker,
  subtitle,
  badges,
  metrics,
  evaluated,
  rows,
  progress,
  footer,
}: PendingEvaluationCardProps) {
  const palette = PALETTE[Math.abs(seed) % PALETTE.length];

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden rounded-panel border border-white/10 text-white shadow-[0_4px_14px_rgba(21,47,89,0.25)] transition-all duration-200 ease-out hover:scale-[1.03] hover:shadow-[0_10px_24px_rgba(21,47,89,0.4)] motion-reduce:hover:scale-100"
      style={{
        background: `linear-gradient(165deg, ${palette[1]} 0%, ${palette[2]} 60%, ${palette[2]} 100%)`,
      }}
    >
      <div className="relative min-h-[240px] shrink-0">
        <div
          aria-hidden
          className="absolute -right-6 -top-4 h-[231px] w-[62%] rotate-6 rounded-[48px] opacity-80"
          style={{ background: palette[0] }}
        />
        <div className="absolute right-0 top-0 h-[220px] w-[57%] overflow-hidden rounded-bl-[56px] rounded-tl-[48px] bg-white/10">
          <CourseThumbnail
            src={CARD_PHOTO}
            alt=""
            className="object-cover"
            fallbackClassName="text-white/60"
          />
        </div>
        <div className="relative z-10 w-[56%] px-5 pt-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
              <ClipboardList size={20} strokeWidth={1.75} />
            </span>
            <span className="line-clamp-2 text-sm font-medium leading-tight">
              {kicker || 'Avaliação'}
            </span>
          </div>
          <div className="pt-5">
            <h3 className="font-body text-2xl font-extrabold uppercase leading-tight tracking-wide">
              {titleLines(title).map((line, i) => (
                <Fragment key={i}>
                  {i > 0 && ' '}
                  <span className="block whitespace-nowrap">{line}</span>
                </Fragment>
              ))}
            </h3>
            {subtitle && (
              <p className="line-clamp-2 pt-2 text-sm text-on-brand-muted">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex min-h-[28px] flex-wrap items-center gap-2 px-5 pt-3">
        {badges}
      </div>

      <div className="space-y-3 px-5 pt-4">
        {metrics.map((m, i) => (
          <Metric key={i} icon={m.icon}>
            <span className={cn(m.danger && 'text-[#FF9AA8]')}>{m.text}</span>
          </Metric>
        ))}
      </div>

      <div className="mx-5 mt-4 flex-1 divide-y divide-white/10 border-t border-white/15">
        <InfoRow
          leading={
            <Avatar
              name={evaluated.name}
              url={evaluated.avatarUrl ?? undefined}
              size="sm"
            />
          }
        >
          <span className="line-clamp-1">{evaluated.name}</span>
        </InfoRow>
        {rows.map((r, i) => (
          <InfoRow key={i} icon={r.icon}>
            <span className="line-clamp-1">{r.text || '—'}</span>
          </InfoRow>
        ))}
      </div>

      {(progress !== undefined || footer) && (
        <div className="m-4 mt-2 space-y-3 rounded-panel bg-white/10 px-4 py-3">
          {progress !== undefined && (
            <div className="flex items-center gap-3">
              <ProgressBar
                value={progress}
                color={palette[3]}
                className="flex-1"
              />
              <span className="text-xs tabular-nums text-on-brand-muted">
                {progress}%
              </span>
            </div>
          )}
          {footer && <div className="flex flex-wrap gap-2">{footer}</div>}
        </div>
      )}
    </div>
  );
}

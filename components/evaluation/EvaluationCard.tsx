// components/evaluation/EvaluationCard.tsx
// Cartão de uma avaliação criada (separador "Avaliações") — mesmo desenho do
// cartão de curso criado (components/courses/CourseListCard.tsx): gradiente na
// cor própria de cada avaliação, título em maiúsculas, foto do avaliado
// recortada no canto, badges em pílula, métricas empilhadas, linhas com seta e
// painel de progresso.

import type { ReactNode } from 'react';
import {
  AlarmClock,
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Star,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  InfoRow,
  Metric,
  titleLines,
} from '@/components/courses/CourseListCard';
import { PALETTE } from '@/components/onboarding/TemplateCard';
import { PURPOSE_LABEL, REQUEST_STATUS_MAP } from './constants';
import type { EvaluationRequestRow } from './types';
import { getInitials, formatDateNumeric } from '@/lib/format';

/** Classe dos botões redondos de acção sobre a foto. */
export const EVAL_CARD_ACTION =
  'inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand/70 text-white/90 hover:bg-white/25 hover:text-white disabled:opacity-50';

interface EvaluationCardProps {
  row: EvaluationRequestRow;
  overdue?: boolean;
  /** Botões de acção (canto superior direito, sobre a foto). */
  actions?: ReactNode;
  onSelect: () => void;
}

export function EvaluationCard({
  row: r,
  overdue,
  actions,
  onSelect,
}: EvaluationCardProps) {
  // Cada avaliação mantém a sua cor própria, escolhida pelo id.
  const palette = PALETTE[Math.abs(r.id) % PALETTE.length];
  const evaluated = r.evaluated;

  return (
    <div
      role={actions ? undefined : 'button'}
      tabIndex={actions ? undefined : 0}
      onClick={onSelect}
      onKeyDown={(ev) => {
        if (ev.target !== ev.currentTarget) return;
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          onSelect();
        }
      }}
      className="relative flex h-full cursor-pointer flex-col overflow-hidden rounded-panel border border-white/10 text-white shadow-[0_4px_14px_rgba(21,47,89,0.25)] transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-[0_10px_24px_rgba(21,47,89,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 motion-reduce:hover:scale-100"
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
          {evaluated.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              loading="lazy"
              decoding="async"
              src={evaluated.avatarUrl}
              alt={`Foto de ${evaluated.fullName}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-6xl font-bold text-white/60">
              {getInitials(evaluated.fullName, '?')}
            </div>
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
        <div className="relative z-10 w-[56%] px-5 pt-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
              <ClipboardCheck size={20} strokeWidth={1.75} />
            </span>
            <span className="line-clamp-2 text-sm font-medium leading-tight">
              {evaluated.department?.name ?? 'Avaliação'}
            </span>
          </div>
          <div className="pt-5">
            <h3 className="font-body text-2xl font-extrabold uppercase leading-tight tracking-wide">
              {titleLines(evaluated.fullName).map((line, i) => (
                <span key={i} className="block whitespace-nowrap">
                  {line}
                </span>
              ))}
            </h3>
            {(r.name ?? r.cycle?.name) && (
              <p className="line-clamp-2 pt-2 text-sm text-on-brand-muted">
                {r.name ?? r.cycle?.name}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex min-h-[28px] flex-wrap items-center gap-2 px-5 pt-3">
        <StatusBadge value={r.status} map={REQUEST_STATUS_MAP} variant="pill" />
        {r.purpose && (
          <Badge intent="info">{PURPOSE_LABEL[r.purpose] ?? r.purpose}</Badge>
        )}
        {overdue && <Badge intent="danger">Atrasada</Badge>}
      </div>

      <div className="space-y-3 px-5 pt-4">
        <Metric icon={overdue ? AlarmClock : CalendarDays}>
          <span className={cn(overdue && 'text-[#FF9AA8]')}>
            {r.dueDate
              ? `Prazo: ${formatDateNumeric(r.dueDate)}`
              : 'Sem prazo'}
          </span>
        </Metric>
        <Metric icon={Star}>
          {r.result != null
            ? `Resultado: ${r.result.toFixed(1)}`
            : 'Sem resultado'}
        </Metric>
        <Metric icon={Users}>
          {r.evaluatorsCount}{' '}
          {r.evaluatorsCount === 1 ? 'avaliador' : 'avaliadores'}
        </Metric>
      </div>

      <div className="mx-5 mt-4 flex-1 divide-y divide-white/10 border-t border-white/15">
        <InfoRow
          leading={
            <Avatar
              name={r.evaluator?.fullName ?? '?'}
              url={r.evaluator?.avatarUrl}
              size="sm"
            />
          }
        >
          <span className="line-clamp-1">
            {r.evaluator?.fullName ?? 'Sem avaliador'}
          </span>
        </InfoRow>
        <InfoRow icon={Briefcase}>
          <span className="line-clamp-1">
            {evaluated.position?.name ?? '—'}
          </span>
        </InfoRow>
        <InfoRow icon={Building2}>
          <span className="line-clamp-1">
            {evaluated.department?.name ?? '—'}
          </span>
        </InfoRow>
        <InfoRow icon={ClipboardList}>
          <span className="line-clamp-1">{r.cycle?.name ?? '—'}</span>
        </InfoRow>
      </div>

      <div className="m-4 mt-2 space-y-2 rounded-panel bg-white/10 px-4 py-3">
        <p className="text-xs text-on-brand-muted">Progresso</p>
        <div className="flex items-center gap-3">
          <ProgressBar
            value={Math.round(r.progress)}
            color={palette[3]}
            className="flex-1"
          />
          <span className="text-xs tabular-nums text-on-brand-muted">
            {Math.round(r.progress)}%
          </span>
        </div>
      </div>
    </div>
  );
}

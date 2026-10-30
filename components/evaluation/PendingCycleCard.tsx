// components/evaluation/PendingCycleCard.tsx
// Cartão de uma avaliação (ciclo) criada que ainda não tem pedidos — separador
// "Avaliações". Mesmo desenho do FormalEvaluationCard (gradiente na cor própria,
// título em maiúsculas, painel recortado no canto, badge de estado, métricas,
// linhas e painel de acções por baixo); a informação é a do ciclo.

import { Fragment, type ReactNode } from 'react';
import {
  Building2,
  CalendarDays,
  ClipboardCheck,
  Landmark,
  Timer,
} from 'lucide-react';
import { Badge, type BadgeProps } from '@/components/ui/Badge';
import {
  InfoRow,
  Metric,
  titleLines,
} from '@/components/courses/CourseListCard';
import { CourseThumbnail } from '@/components/courses/CourseThumbnail';
import { PALETTE } from '@/components/onboarding/TemplateCard';
import { formatDateNumeric } from '@/lib/format';
import type { Cycle } from './types';

const STATUS: Record<string, { label: string; intent: BadgeProps['intent'] }> =
  {
    DRAFT: { label: 'Rascunho', intent: 'neutral' },
    PUBLISHED: { label: 'Publicada', intent: 'success' },
  };

interface PendingCycleCardProps {
  cycle: Cycle;
  /** Botões redondos sobre o canto superior direito (menu de 3 pontos). */
  actions?: ReactNode;
  /** Botões principais no painel inferior (publicar, ativar). */
  footer?: ReactNode;
}

export function PendingCycleCard({
  cycle: c,
  actions,
  footer,
}: PendingCycleCardProps) {
  // Cada avaliação mantém a sua cor própria, escolhida pelo id.
  const palette = PALETTE[Math.abs(c.id) % PALETTE.length];
  const status = STATUS[c.status] ?? STATUS.DRAFT;
  const deptCount = c.targetDeptIds?.length ?? 0;
  const unitCount = c.targetUnitIds?.length ?? 0;
  const due = c.managerEvalDueDate ?? c.selfEvalDueDate;

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden rounded-panel border border-white/10 text-white shadow-[0_4px_14px_rgba(21,47,89,0.25)]"
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
        <div
          aria-hidden={c.imageUrl ? undefined : true}
          className="absolute right-0 top-0 flex h-[220px] w-[57%] items-center justify-center overflow-hidden rounded-bl-[56px] rounded-tl-[48px] bg-white/10"
        >
          {c.imageUrl ? (
            <CourseThumbnail
              src={c.imageUrl}
              alt={`Imagem da avaliação ${c.name}`}
              className="object-cover"
              fallbackClassName="text-white/60"
            />
          ) : (
            <ClipboardCheck
              size={84}
              strokeWidth={1.25}
              className="text-white/60"
            />
          )}
        </div>
        {actions && (
          <div className="absolute right-3 top-3 z-20 flex items-center gap-1">
            {actions}
          </div>
        )}
        <div className="relative z-10 w-[56%] px-5 pt-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
              <ClipboardCheck size={20} strokeWidth={1.75} />
            </span>
            <span className="line-clamp-2 text-sm font-medium leading-tight">
              Avaliação
            </span>
          </div>
          <div className="pt-5">
            <h3 className="font-body text-2xl font-extrabold uppercase leading-tight tracking-wide">
              {titleLines(c.name).map((line, i) => (
                <Fragment key={i}>
                  {i > 0 && ' '}
                  <span className="block whitespace-nowrap">{line}</span>
                </Fragment>
              ))}
            </h3>
          </div>
        </div>
      </div>

      <div className="flex min-h-[28px] flex-wrap items-center gap-2 px-5 pt-3">
        <Badge intent={status.intent}>{status.label}</Badge>
      </div>

      <div className="space-y-3 px-5 pt-4">
        <Metric icon={CalendarDays}>
          {formatDateNumeric(c.startDate)} – {formatDateNumeric(c.endDate)}
        </Metric>
        {due && <Metric icon={Timer}>Prazo: {formatDateNumeric(due)}</Metric>}
      </div>

      <div className="mx-5 mt-4 flex-1 divide-y divide-white/10 border-t border-white/15">
        <InfoRow icon={Building2}>
          <span className="line-clamp-1">
            {deptCount === 0 && unitCount === 0
              ? 'Todos os departamentos'
              : deptCount > 0
                ? `${deptCount} departamento(s)`
                : '—'}
          </span>
        </InfoRow>
        {unitCount > 0 && (
          <InfoRow icon={Landmark}>
            <span className="line-clamp-1">{unitCount} unidade(s)</span>
          </InfoRow>
        )}
      </div>

      {footer && (
        <div className="m-4 mt-2 flex flex-wrap items-center justify-end gap-2 rounded-panel bg-white/10 px-4 py-3">
          {footer}
        </div>
      )}
    </div>
  );
}

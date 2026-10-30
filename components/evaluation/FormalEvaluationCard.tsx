// components/evaluation/FormalEvaluationCard.tsx
// Cartão de uma avaliação formal criada (separador "Avaliações Formais") — mesmo
// desenho do cartão de curso criado (components/courses/CourseListCard.tsx) e do
// cartão de avaliação 360° (EvaluationCard): gradiente na cor própria de cada
// avaliação, título em maiúsculas, painel recortado no canto, badge de estado,
// métricas empilhadas, linhas com seta e painel de acções por baixo. Só o desenho
// é do cartão de curso: a informação é a que a avaliação formal já mostrava.

import { Fragment, type ReactNode } from 'react';
import {
  Award,
  ClipboardCheck,
  ClipboardList,
  Building2,
  Timer,
  Users,
} from 'lucide-react';
import { Badge, type BadgeProps } from '@/components/ui/Badge';
import {
  InfoRow,
  Metric,
  titleLines,
} from '@/components/courses/CourseListCard';
import { CourseThumbnail } from '@/components/courses/CourseThumbnail';
import { PALETTE } from '@/components/onboarding/TemplateCard';
import { formatDateTimeNumeric } from '@/lib/format';
import type {
  FormalEvaluation,
  FormalEvaluationStatus,
} from './formalEvaluationTypes';

const STATUS: Record<
  FormalEvaluationStatus,
  { label: string; intent: BadgeProps['intent'] }
> = {
  DRAFT: { label: 'Rascunho', intent: 'neutral' },
  PUBLISHED: { label: 'Publicada', intent: 'success' },
  ARCHIVED: { label: 'Arquivada', intent: 'warning' },
};

interface FormalEvaluationCardProps {
  evaluation: FormalEvaluation;
  /** Clique no cartão (abrir resultados). Sem valor, o cartão não é clicável. */
  onSelect?: () => void;
  /** Botões redondos sobre o canto superior direito (duplicar, eliminar…). */
  actions?: ReactNode;
  /** Botões principais no painel inferior (resultados, publicar, arquivar). */
  footer?: ReactNode;
  /** Vista do colaborador: esconde estado, tentativas e departamentos (dados de gestão). */
  participant?: boolean;
}

export function FormalEvaluationCard({
  evaluation: e,
  onSelect,
  actions,
  footer,
  participant = false,
}: FormalEvaluationCardProps) {
  // Cada avaliação mantém a sua cor própria, escolhida pelo id.
  const palette = PALETTE[Math.abs(e.id) % PALETTE.length];
  const status = STATUS[e.status] ?? STATUS.DRAFT;
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
      className={`relative flex h-full flex-col overflow-hidden rounded-panel border border-white/10 text-white shadow-[0_4px_14px_rgba(21,47,89,0.25)] transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-[0_10px_24px_rgba(21,47,89,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 motion-reduce:hover:scale-100 ${clickable ? 'cursor-pointer' : ''}`}
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
          aria-hidden={e.imageUrl ? undefined : true}
          className="absolute right-0 top-0 flex h-[220px] w-[57%] items-center justify-center overflow-hidden rounded-bl-[56px] rounded-tl-[48px] bg-white/10"
        >
          {e.imageUrl ? (
            <CourseThumbnail
              src={e.imageUrl}
              alt={`Imagem da avaliação ${e.title}`}
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
              Avaliação formal
            </span>
          </div>
          <div className="pt-5">
            <h3 className="font-body text-2xl font-extrabold uppercase leading-tight tracking-wide">
              {titleLines(e.title).map((line, i) => (
                <Fragment key={i}>
                  {i > 0 && ' '}
                  <span className="block whitespace-nowrap">{line}</span>
                </Fragment>
              ))}
            </h3>
          </div>
        </div>
      </div>

      {!participant && (
        <div className="flex min-h-[28px] flex-wrap items-center gap-2 px-5 pt-3">
          <Badge intent={status.intent}>{status.label}</Badge>
        </div>
      )}

      <div className={`space-y-3 px-5 ${participant ? 'pt-3' : 'pt-4'}`}>
        <Metric icon={ClipboardList}>{e._count.questions} perguntas</Metric>
        {participant ? (
          <Metric icon={Award}>Nota máxima: {e.maxGrade}</Metric>
        ) : (
          <Metric icon={Users}>{e._count.attempts} tentativas</Metric>
        )}
        {e.availableUntil && (
          <Metric icon={Timer}>
            Até {formatDateTimeNumeric(e.availableUntil)}
          </Metric>
        )}
      </div>

      <div className="mx-5 mt-4 flex-1 divide-y divide-white/10 border-t border-white/15">
        {!participant && (
          <InfoRow icon={Building2}>
            <span className="line-clamp-1">
              {e.targetDepartmentIds.length === 0
                ? 'Todos os departamentos'
                : `${e.targetDepartmentIds.length} departamento(s)`}
            </span>
          </InfoRow>
        )}
      </div>

      {footer && (
        <div
          className="m-4 mt-2 flex flex-wrap items-center justify-end gap-2 rounded-panel bg-white/10 px-4 py-3"
          onClick={(ev) => ev.stopPropagation()}
          onKeyDown={(ev) => ev.stopPropagation()}
        >
          {footer}
        </div>
      )}
    </div>
  );
}

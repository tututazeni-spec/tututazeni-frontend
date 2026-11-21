// components/evaluation/FormalEvaluationCard.tsx
// Cartão de uma avaliação formal criada (separador "Avaliações Formais") —
// desenho do cartão de template dos Planos de Integração (EvalTemplateCard).
// Só o desenho muda: a informação é a que a avaliação formal já mostrava.

import type { ReactNode } from 'react';
import {
  Award,
  ClipboardCheck,
  ClipboardList,
  Building2,
  Timer,
  Users,
} from 'lucide-react';
import { EvalTemplateCard, type ChipTone } from './EvalTemplateCard';
import { formatDateTimeNumeric } from '@/lib/format';
import type {
  FormalEvaluation,
  FormalEvaluationStatus,
} from './formalEvaluationTypes';

const STATUS: Record<
  FormalEvaluationStatus,
  { label: string; tone: ChipTone }
> = {
  DRAFT: { label: 'Rascunho', tone: 'neutral' },
  PUBLISHED: { label: 'Publicada', tone: 'success' },
  ARCHIVED: { label: 'Arquivada', tone: 'warning' },
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
  const status = STATUS[e.status] ?? STATUS.DRAFT;

  return (
    <EvalTemplateCard
      seed={e.id}
      imageUrl={e.imageUrl}
      imageAlt={`Imagem da avaliação ${e.title}`}
      fallback={<ClipboardCheck size={84} strokeWidth={1.25} />}
      chip={{
        label: participant ? 'Avaliação formal' : status.label,
        tone: participant ? 'info' : status.tone,
      }}
      actions={actions}
      onSelect={onSelect}
      metrics={[
        { icon: ClipboardList, text: `${e._count.questions} perguntas` },
        participant
          ? {
              icon: Award,
              text: e.myAttempt
                ? e.myAttempt.needsManualReview && e.myAttempt.score == null
                  ? 'Aguarda revisão'
                  : `Nota: ${e.myAttempt.displayGrade ?? e.myAttempt.score ?? '—'} / ${e.maxGrade}`
                : `Nota máxima: ${e.maxGrade}`,
            }
          : { icon: Users, text: `${e._count.attempts} tentativas` },
        ...(e.availableUntil
          ? [
              {
                icon: Timer,
                text: `Até ${formatDateTimeNumeric(e.availableUntil)}`,
              },
            ]
          : []),
      ]}
      lines={
        participant
          ? []
          : [
              {
                icon: Building2,
                text:
                  e.targetDepartmentIds.length === 0
                    ? 'Todos os departamentos'
                    : `${e.targetDepartmentIds.length} departamento(s)`,
              },
            ]
      }
      panel={
        footer ? (
          <div
            className="flex flex-wrap items-center justify-end gap-2"
            onClick={(ev) => ev.stopPropagation()}
            onKeyDown={(ev) => ev.stopPropagation()}
          >
            {footer}
          </div>
        ) : undefined
      }
      title={e.title}
    />
  );
}

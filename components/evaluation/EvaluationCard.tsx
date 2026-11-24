// components/evaluation/EvaluationCard.tsx
// Cartão de uma avaliação criada (separador "Avaliações") — desenho do cartão
// de template dos Planos de Integração (EvalTemplateCard): foto do avaliado no
// topo, estado, métricas, linhas de informação e painel de progresso.

import type { ReactNode } from 'react';
import {
  AlarmClock,
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardList,
  Star,
  Users,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EvalTemplateCard, type ChipTone } from './EvalTemplateCard';
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

const STATUS_TONE: Record<string, ChipTone> = {
  PENDING: 'neutral',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  SKIPPED: 'neutral',
};

export function EvaluationCard({
  row: r,
  overdue,
  actions,
  onSelect,
}: EvaluationCardProps) {
  const evaluated = r.evaluated;
  const progress = Math.round(r.progress);

  return (
    <EvalTemplateCard
      seed={r.id}
      imageUrl={evaluated.avatarUrl}
      imageClassName="object-top"
      imageAlt={`Foto de ${evaluated.fullName}`}
      fallback={
        <span className="text-6xl font-bold">
          {getInitials(evaluated.fullName, '?')}
        </span>
      }
      chip={{
        label: REQUEST_STATUS_MAP[r.status]?.label ?? r.status,
        tone: STATUS_TONE[r.status],
      }}
      actions={actions}
      onSelect={onSelect}
      badges={
        <>
          {r.purpose && (
            <Badge intent="info">{PURPOSE_LABEL[r.purpose] ?? r.purpose}</Badge>
          )}
          {overdue && <Badge intent="danger">Atrasada</Badge>}
        </>
      }
      metrics={[
        {
          icon: overdue ? AlarmClock : CalendarDays,
          danger: overdue,
          text: r.dueDate
            ? `Prazo: ${formatDateNumeric(r.dueDate)}`
            : 'Sem prazo',
        },
        {
          icon: Star,
          text:
            r.result != null
              ? `Resultado: ${Number(r.result).toFixed(1)}`
              : 'Sem resultado',
        },
        {
          icon: Users,
          text: `${r.evaluatorsCount} ${r.evaluatorsCount === 1 ? 'avaliador' : 'avaliadores'}`,
        },
      ]}
      lines={[
        {
          leading: (
            <Avatar
              name={r.evaluator?.fullName ?? '?'}
              url={r.evaluator?.avatarUrl}
              size="sm"
            />
          ),
          text: r.evaluator?.fullName ?? 'Sem avaliador',
        },
        { icon: Briefcase, text: evaluated.position?.name ?? '—' },
        { icon: Building2, text: evaluated.department?.name ?? '—' },
        { icon: ClipboardList, text: r.cycle?.name ?? '—' },
      ]}
      panel={
        <>
          <p className="text-xs text-on-brand-muted">Progresso</p>
          <div className="flex items-center gap-3">
            <ProgressBar value={progress} className="flex-1" />
            <span className="text-xs tabular-nums text-on-brand-muted">
              {progress}%
            </span>
          </div>
        </>
      }
      title={evaluated.fullName}
      subtitle={r.name ?? r.cycle?.name ?? undefined}
    />
  );
}

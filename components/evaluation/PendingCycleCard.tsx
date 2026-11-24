// components/evaluation/PendingCycleCard.tsx
// Cartão de uma avaliação (ciclo) criada que ainda não tem pedidos — separador
// "Avaliações". Mesmo desenho dos restantes cartões do módulo
// (EvalTemplateCard); a informação é a do ciclo.

import type { ReactNode } from 'react';
import {
  Building2,
  CalendarDays,
  ClipboardCheck,
  Landmark,
  Timer,
} from 'lucide-react';
import { EvalTemplateCard, type ChipTone } from './EvalTemplateCard';
import { formatDateNumeric } from '@/lib/format';
import type { Cycle } from './types';

const STATUS: Record<string, { label: string; tone: ChipTone }> = {
  DRAFT: { label: 'Rascunho', tone: 'neutral' },
  PUBLISHED: { label: 'Publicada', tone: 'success' },
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
  const status = STATUS[c.status] ?? STATUS.DRAFT;
  const deptCount = c.targetDeptIds?.length ?? 0;
  const unitCount = c.targetUnitIds?.length ?? 0;
  const due = c.managerEvalDueDate ?? c.selfEvalDueDate;

  return (
    <EvalTemplateCard
      seed={c.id}
      imageUrl={c.imageUrl}
      imageAlt={`Imagem da avaliação ${c.name}`}
      fallback={<ClipboardCheck size={84} strokeWidth={1.25} />}
      chip={status}
      actions={actions}
      metrics={[
        {
          icon: CalendarDays,
          text: `${formatDateNumeric(c.startDate)} – ${formatDateNumeric(c.endDate)}`,
        },
        ...(due
          ? [{ icon: Timer, text: `Prazo: ${formatDateNumeric(due)}` }]
          : []),
      ]}
      lines={[
        {
          icon: Building2,
          text:
            deptCount === 0 && unitCount === 0
              ? 'Todos os departamentos'
              : deptCount > 0
                ? `${deptCount} departamento(s)`
                : '—',
        },
        ...(unitCount > 0
          ? [{ icon: Landmark, text: `${unitCount} unidade(s)` }]
          : []),
      ]}
      panel={
        footer ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {footer}
          </div>
        ) : undefined
      }
      title={c.name}
    />
  );
}

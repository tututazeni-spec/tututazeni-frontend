// components/development-plans/PlanCard.tsx
// Cartão de plano de desenvolvimento (lista "Os meus PDIs"). Usa o PhotoCard,
// o mesmo desenho do cartão do plano de formação.

'use client';

import {
  CalendarDays,
  ClipboardList,
  Target,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { NavyBadge, type NavyTone } from '@/components/courses/NavyCard';
import {
  PALETTE,
  headerBackground,
} from '@/components/onboarding/TemplateCard';
import { PhotoCard } from '@/components/courses/PhotoCard';
import { formatDate as fmtDate } from '@/lib/format';
import { STATUS_CFG, PRIORITY_CFG } from './constants';
import { isOverdue } from './utils';
import type { Plan } from './types';
import { Button } from '@/components/ui/Button';

// Cor própria do PDI (mesma do cartão e do detalhe), escolhida pelo
// utilizador e pelo id — estável entre renders.
export function planPalette(plan: Plan) {
  return PALETTE[Math.abs((plan.user?.id ?? 0) * 3 + plan.id) % PALETTE.length];
}

// Fundo em fachada de vidro — usado no cartão lateral do detalhe.
export function planHeaderBackground(plan: Plan) {
  return headerBackground(planPalette(plan));
}

interface PlanCardProps {
  plan: Plan;
  onClick: () => void;
  onDelete?: () => void;
}

const STATUS_TONE: Record<string, NavyTone> = {
  ACTIVE: 'success',
  DRAFT: 'neutral',
  COMPLETED: 'info',
  CANCELLED: 'danger',
  PENDING_APPROVAL: 'warning',
};
const PRIORITY_TONE: Record<string, NavyTone> = {
  LOW: 'neutral',
  MEDIUM: 'info',
  HIGH: 'warning',
  URGENT: 'danger',
};

export function PlanCard({ plan, onClick, onDelete }: PlanCardProps) {
  const pct = plan.actionProgress ?? plan.overallProgress;
  const overdue = plan.overdueActions ?? 0;
  const statusLabel = STATUS_CFG[plan.status]?.label ?? plan.status;
  const priorityLabel = PRIORITY_CFG[plan.priority]?.label ?? plan.priority;
  const endOverdue = !!plan.endDate && isOverdue(plan.endDate, plan.status);

  return (
    <PhotoCard
      seed={Math.abs((plan.user?.id ?? 0) * 3 + plan.id)}
      onSelect={onClick}
      kicker={plan.user?.fullName ?? 'PDI'}
      kickerIcon={Target}
      title={plan.name}
      subtitle={plan.goal}
      image={plan.imageUrl}
      fallback={<Target size={64} strokeWidth={1.25} />}
      badges={
        <>
          <NavyBadge tone={STATUS_TONE[plan.status] ?? 'neutral'}>
            {statusLabel}
          </NavyBadge>
          <NavyBadge tone={PRIORITY_TONE[plan.priority] ?? 'neutral'}>
            {priorityLabel}
          </NavyBadge>
        </>
      }
      metrics={[
        { icon: ClipboardList, text: `Acções: ${plan._count?.actions ?? 0}` },
        { icon: Target, text: `Metas: ${plan._count?.goals ?? 0}` },
        ...(plan.endDate
          ? [
              {
                icon: CalendarDays,
                text: `${endOverdue ? 'Atrasado · ' : ''}${fmtDate(plan.endDate)}`,
              },
            ]
          : []),
      ]}
      rows={[
        ...(plan.period ? [{ icon: CalendarDays, text: plan.period }] : []),
        ...(overdue > 0
          ? [{ icon: TriangleAlert, text: `${overdue} atrasada(s)` }]
          : []),
      ]}
      actions={
        onDelete ? (
          <Button
            type="button"
            intent="onDarkGhost"
            size="icon"
            aria-label="Apagar PDI"
            title="Apagar PDI"
            onClick={onDelete}
          >
            <Trash2 size={15} strokeWidth={1.75} />
          </Button>
        ) : undefined
      }
      progress={{ value: pct, label: 'Progresso' }}
    />
  );
}

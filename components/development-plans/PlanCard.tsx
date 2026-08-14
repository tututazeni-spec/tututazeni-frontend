// components/development-plans/PlanCard.tsx
// Cartão de plano de desenvolvimento (lista "Os meus PDIs"). Extraído
// de app/(platform)/development-plans/page.tsx.

'use client';

import { Calendar, ClipboardList, Target, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate as fmtDate } from '@/lib/format';
import { STATUS_CFG, PRIORITY_CFG } from './constants';
import { isOverdue, progressTextClass } from './utils';
import type { Plan } from './types';

interface PlanCardProps {
  plan: Plan;
  onClick: () => void;
}

export function PlanCard({ plan, onClick }: PlanCardProps) {
  const pct = plan.actionProgress ?? plan.overallProgress;
  const hasOverdue = (plan.overdueActions ?? 0) > 0;

  return (
    <Card
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'cursor-pointer p-5 transition-shadow duration-150 hover:shadow-hover',
        hasOverdue ? 'border-danger' : 'hover:border-primary',
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <StatusBadge value={plan.status} map={STATUS_CFG} />
            <StatusBadge value={plan.priority} map={PRIORITY_CFG} />
            {plan.period && (
              <span className="font-body text-xs text-ink-faint">
                {plan.period}
              </span>
            )}
          </div>
          <div className="truncate font-body text-sm font-semibold text-ink">
            {plan.name}
          </div>
          <p className="mt-0.5 line-clamp-2 font-body text-xs text-ink-muted">
            {plan.goal}
          </p>
        </div>
        <Avatar name={plan.user.fullName} url={plan.user.avatarUrl ?? undefined} size="sm" />
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1">
          <ProgressBar value={pct} />
        </div>
        <span
          className={cn(
            'w-9 shrink-0 text-right font-data text-xs font-semibold',
            progressTextClass(pct),
          )}
        >
          {pct}%
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between font-body text-xs text-ink-faint">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <ClipboardList size={14} strokeWidth={1.75} />
            {plan._count.actions} acções
          </span>
          <span className="flex items-center gap-1">
            <Target size={14} strokeWidth={1.75} />
            {plan._count.goals} metas
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasOverdue && (
            <span className="flex items-center gap-1 font-medium text-danger">
              <TriangleAlert size={14} strokeWidth={1.75} />
              {plan.overdueActions} atrasada(s)
            </span>
          )}
          {plan.endDate && (
            <span
              className={cn(
                'flex items-center gap-1',
                isOverdue(plan.endDate, plan.status) && 'text-danger',
              )}
            >
              <Calendar size={14} strokeWidth={1.75} />
              {fmtDate(plan.endDate)}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

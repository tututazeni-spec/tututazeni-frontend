// components/development-plans/PlanCard.tsx
// Cartão de plano de desenvolvimento (lista "Os meus PDIs"). Extraído
// de app/(platform)/development-plans/page.tsx.

'use client';

import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate as fmtDate } from '@/lib/format';
import { Avatar, ProgressBar } from './atoms';
import { STATUS_CFG, PRIORITY_CFG } from './constants';
import { isOverdue } from './utils';
import type { Plan } from './types';

interface PlanCardProps {
  plan: Plan;
  onClick: () => void;
}

export function PlanCard({ plan, onClick }: PlanCardProps) {
  const pct = plan.actionProgress ?? plan.overallProgress;
  const hasOverdue = (plan.overdueActions ?? 0) > 0;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`bg-white border rounded-xl p-5 cursor-pointer hover:shadow-md transition-all ${
        hasOverdue ? 'border-red-200' : 'border-gray-200 hover:border-blue-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <StatusBadge value={plan.status} map={STATUS_CFG} />
            <StatusBadge value={plan.priority} map={PRIORITY_CFG} />
            {plan.period && (
              <span className="text-xs text-gray-400">{plan.period}</span>
            )}
          </div>
          <div className="text-sm font-semibold text-gray-900 truncate">
            {plan.name}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
            {plan.goal}
          </p>
        </div>
        <Avatar
          name={plan.user.fullName}
          avatarUrl={plan.user.avatarUrl}
          size="sm"
        />
      </div>

      <ProgressBar
        pct={pct}
        color={
          pct >= 100
            ? 'bg-emerald-500'
            : pct >= 50
              ? 'bg-blue-500'
              : 'bg-amber-400'
        }
      />

      <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
        <div className="flex items-center gap-3">
          <span>📋 {plan._count.actions} acções</span>
          <span>🎯 {plan._count.goals} metas</span>
        </div>
        <div className="flex items-center gap-2">
          {hasOverdue && (
            <span className="text-red-600 font-medium">
              ⚠ {plan.overdueActions} atrasada(s)
            </span>
          )}
          {plan.endDate && (
            <span
              className={
                isOverdue(plan.endDate, plan.status) ? 'text-red-600' : ''
              }
            >
              📅 {fmtDate(plan.endDate)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

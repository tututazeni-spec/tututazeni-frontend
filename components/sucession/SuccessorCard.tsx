// components/sucession/SuccessorCard.tsx
// Cartão de sucessor usado no pipeline de um cargo crítico. Extraído
// de app/(platform)/sucession/page.tsx.

'use client';

import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { READINESS_CFG } from './constants';
import { MatchScore } from './MatchScore';
import type { SuccessionPlan, SuccessorPriority } from './types';

interface SuccessorCardProps {
  plan: SuccessionPlan;
  rank: number;
}

export function SuccessorCard({ plan, rank }: SuccessorCardProps) {
  const priorityLabel: Record<SuccessorPriority, string> = {
    PRIMARY: '1º',
    SECONDARY: '2º',
    TERTIARY: '3º',
  };

  return (
    <div className="flex items-center gap-3 rounded-card border border-border bg-surface p-3">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-control bg-primary-subtle text-xs font-bold text-primary">
        {priorityLabel[plan.priority]}
      </div>
      <Avatar
        name={plan.candidate.fullName}
        url={plan.candidate.avatarUrl ?? undefined}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate font-body text-xs font-medium text-ink">
          {plan.candidate.fullName}
        </div>
        <div className="truncate font-body text-xs text-ink-faint">
          {plan.candidate.position?.name ?? '—'}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <StatusBadge
          value={plan.readinessLevel}
          map={READINESS_CFG}
          variant="dot"
        />
        <MatchScore score={plan.matchScore} />
      </div>
    </div>
  );
}

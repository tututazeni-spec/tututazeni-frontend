// components/sucession/SuccessorCard.tsx
// Cartão de sucessor usado no pipeline de um cargo crítico. Extraído
// de app/(platform)/sucession/page.tsx.

'use client';

import { Avatar, MatchScore, ReadinessBadge } from './atoms';
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
    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3">
      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
        {priorityLabel[plan.priority]}
      </div>
      <Avatar
        name={plan.candidate.fullName}
        avatarUrl={plan.candidate.avatarUrl}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-900 truncate">
          {plan.candidate.fullName}
        </div>
        <div className="text-xs text-gray-400 truncate">
          {plan.candidate.position?.name ?? '—'}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <ReadinessBadge level={plan.readinessLevel} />
        <MatchScore score={plan.matchScore} />
      </div>
    </div>
  );
}

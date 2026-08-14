// components/career-plans/GoalCard.tsx
// Cartão de meta do PDI com slider de progresso. Extraído de
// app/(platform)/career-plans/page.tsx.

'use client';

import { CheckCircle2, Target } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Card } from '@/components/ui/Card';
import { GOAL_TYPE_ICONS, GOAL_TYPE_LABELS } from './constants';
import type { CareerGoal } from './types';

interface GoalCardProps {
  goal: CareerGoal;
  onUpdateProgress: (id: number, progress: number) => void;
}

const STATUS_COLORS: Record<CareerGoal['status'], string> = {
  PENDING: 'bg-surface-sunken text-ink-muted',
  IN_PROGRESS: 'bg-primary-subtle text-primary',
  COMPLETED: 'bg-success-subtle text-success-ink',
  CANCELLED: 'bg-danger-subtle text-danger-ink',
};

export function GoalCard({ goal, onUpdateProgress }: GoalCardProps) {
  const Icon = GOAL_TYPE_ICONS[goal.type] ?? Target;
  const isOverdue =
    goal.dueDate &&
    new Date(goal.dueDate) < new Date() &&
    goal.status !== 'COMPLETED';

  return (
    <Card className={cn('p-4', isOverdue && 'border-danger/40')}>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex-shrink-0 rounded-control p-2',
            goal.status === 'COMPLETED'
              ? 'bg-success-subtle text-success-ink'
              : 'bg-primary-subtle text-primary',
          )}
        >
          {goal.status === 'COMPLETED' ? (
            <CheckCircle2 size={15} strokeWidth={1.75} />
          ) : (
            <Icon size={15} strokeWidth={1.75} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <p className="truncate font-body text-sm font-medium text-ink">
              {goal.title}
            </p>
            <span
              className={cn(
                'ml-2 flex-shrink-0 rounded-full px-2 py-0.5 font-body text-xs',
                STATUS_COLORS[goal.status],
              )}
            >
              {goal.status === 'PENDING'
                ? 'Pendente'
                : goal.status === 'IN_PROGRESS'
                  ? 'Em curso'
                  : goal.status === 'COMPLETED'
                    ? 'Concluído'
                    : 'Cancelado'}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="font-body text-xs text-ink-faint">
              {GOAL_TYPE_LABELS[goal.type]}
            </span>
            {goal.dueDate && (
              <span
                className={cn(
                  'font-body text-xs',
                  isOverdue ? 'font-medium text-danger' : 'text-ink-faint',
                )}
              >
                · {new Date(goal.dueDate).toLocaleDateString('pt-PT')}
                {isOverdue && ' ⚠️'}
              </span>
            )}
          </div>
          {goal.status !== 'COMPLETED' && goal.status !== 'CANCELLED' && (
            <div className="mt-2">
              <div className="mb-1 flex justify-between font-body text-xs text-ink-faint">
                <span>Progresso</span>
                <span>{goal.progress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={goal.progress}
                onChange={(e) => onUpdateProgress(goal.id, +e.target.value)}
                className="h-1.5 w-full rounded-full accent-primary"
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

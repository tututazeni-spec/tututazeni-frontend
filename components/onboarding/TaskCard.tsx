// components/onboarding/TaskCard.tsx
// Cartão de tarefa do plano de onboarding. Extraído de
// app/(platform)/onboarding/page.tsx. Migrado para a fundação de
// design: Card + Button substituem os elementos bespoke.

'use client';

import { formatDate as fmtDate } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CATEGORY_CFG, TASK_STATUS_CFG } from './constants';
import { isOverdue } from './utils';
import type { TaskInstance } from './types';

interface TaskCardProps {
  task: TaskInstance;
  onComplete: (taskId: number) => void;
}

export function TaskCard({ task, onComplete }: TaskCardProps) {
  const statusCfg = TASK_STATUS_CFG[task.status];
  const catCfg = CATEGORY_CFG[task.templateTask.category];
  const overdue = isOverdue(task.dueDate) && task.status !== 'COMPLETED';

  return (
    <Card
      className={`flex items-start gap-3 p-4 ${
        task.status === 'COMPLETED'
          ? 'border-success opacity-70'
          : task.status === 'BLOCKED'
            ? 'opacity-50'
            : overdue
              ? 'border-danger'
              : 'hover:shadow-hover'
      }`}
    >
      <div className={`text-xl flex-shrink-0 mt-0.5 ${statusCfg.cls}`}>
        {statusCfg.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div
              className={`text-sm font-medium ${task.status === 'COMPLETED' ? 'line-through text-ink-faint' : 'text-ink'}`}
            >
              {task.templateTask.title}
            </div>
            {task.templateTask.description && (
              <p className="text-xs text-ink-muted mt-0.5 line-clamp-2">
                {task.templateTask.description}
              </p>
            )}
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded flex-shrink-0 font-medium ${catCfg.cls}`}
          >
            {catCfg.icon} {catCfg.label}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-2 text-xs text-ink-faint">
          {task.dueDate && (
            <span className={overdue ? 'text-danger font-medium' : ''}>
              {overdue ? '⚠ ' : ''}Prazo: {fmtDate(task.dueDate)}
            </span>
          )}
          {task.templateTask.xpReward > 0 && (
            <span className="text-warning-ink">
              ⚡ {task.templateTask.xpReward} XP
            </span>
          )}
          {task.templateTask.requiresApproval && (
            <span className="text-info">✎ Requer aprovação</span>
          )}
          {task.completedAt && (
            <span className="text-success-ink">
              ✓ {fmtDate(task.completedAt)}
            </span>
          )}
        </div>
      </div>

      {task.status === 'PENDING' || task.status === 'IN_PROGRESS' ? (
        <Button
          size="sm"
          onClick={() => onComplete(task.id)}
          disabled={(task.status as string) === 'BLOCKED'}
          className="flex-shrink-0"
        >
          Executar
        </Button>
      ) : null}
    </Card>
  );
}

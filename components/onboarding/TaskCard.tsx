// components/onboarding/TaskCard.tsx
// Cartão de tarefa do plano de onboarding. Extraído de
// app/(platform)/onboarding/page.tsx.

'use client';

import { formatDate as fmtDate } from '@/lib/format';
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
    <div
      className={`flex items-start gap-3 bg-white border rounded-xl p-4 transition-all ${
        task.status === 'COMPLETED'
          ? 'border-emerald-200 opacity-70'
          : task.status === 'BLOCKED'
            ? 'border-gray-200 opacity-50'
            : overdue
              ? 'border-red-200'
              : 'border-gray-200 hover:shadow-sm'
      }`}
    >
      <div className={`text-xl flex-shrink-0 mt-0.5 ${statusCfg.cls}`}>
        {statusCfg.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div
              className={`text-sm font-medium ${task.status === 'COMPLETED' ? 'line-through text-gray-400' : 'text-gray-900'}`}
            >
              {task.templateTask.title}
            </div>
            {task.templateTask.description && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
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

        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
          {task.dueDate && (
            <span className={overdue ? 'text-red-600 font-medium' : ''}>
              {overdue ? '⚠ ' : ''}Prazo: {fmtDate(task.dueDate)}
            </span>
          )}
          {task.templateTask.xpReward > 0 && (
            <span className="text-amber-600">
              ⚡ {task.templateTask.xpReward} XP
            </span>
          )}
          {task.templateTask.requiresApproval && (
            <span className="text-blue-500">✎ Requer aprovação</span>
          )}
          {task.completedAt && (
            <span className="text-emerald-600">
              ✓ {fmtDate(task.completedAt)}
            </span>
          )}
        </div>
      </div>

      {task.status === 'PENDING' || task.status === 'IN_PROGRESS' ? (
        <button
          onClick={() => onComplete(task.id)}
          disabled={(task.status as string) === 'BLOCKED'}
          className="flex-shrink-0 px-3 py-1.5 bg-blue-700 text-white text-xs font-medium rounded-lg hover:bg-blue-800 disabled:opacity-30"
        >
          Executar
        </button>
      ) : null}
    </div>
  );
}

// components/onboarding/TaskCard.tsx
// Cartão de tarefa do plano de onboarding. Extraído de
// app/(platform)/onboarding/page.tsx. Migrado para a fundação de
// design: Card + Button substituem os elementos bespoke.

'use client';

import { AlertTriangle } from 'lucide-react';
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
  const StatusIcon = statusCfg.icon;
  const catCfg = CATEGORY_CFG[task.templateTask.category];
  const CatIcon = catCfg.icon;
  const overdue = isOverdue(task.dueDate) && task.status !== 'COMPLETED';

  return (
    <Card
      className={`flex items-start gap-3 p-4 font-body ${
        task.status === 'COMPLETED'
          ? 'border-success opacity-70'
          : task.status === 'BLOCKED'
            ? 'opacity-50'
            : overdue
              ? 'border-danger'
              : 'hover:shadow-hover'
      }`}
    >
      <div className={`flex-shrink-0 mt-0.5 ${statusCfg.cls}`}>
        <StatusIcon size={18} strokeWidth={1.75} />
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
        </div>

        <div className="flex items-center gap-3 mt-2 text-xs text-ink-faint">
          {task.dueDate && (
            <span
              className={
                overdue
                  ? 'inline-flex items-center gap-1 text-danger font-medium'
                  : ''
              }
            >
              {overdue && <AlertTriangle size={12} strokeWidth={1.75} />}
              Prazo: {fmtDate(task.dueDate)}
            </span>
          )}
          {task.templateTask.requiresApproval && (
            <span className="text-info"> Requer aprovação</span>
          )}
          {task.completedAt && (
            <span className="text-[#0F1F3D]">
              ✓ {fmtDate(task.completedAt)}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-shrink-0 flex-col items-end gap-2">
        {task.status === 'PENDING' || task.status === 'IN_PROGRESS' ? (
          <Button
            size="sm"
            intent="secondary"
            onClick={() => onComplete(task.id)}
            disabled={(task.status as string) === 'BLOCKED'}
            style={{
              backgroundColor: '#0F1F3D',
              color: '#FFFFFF',
              borderColor: '#0F1F3D',
            }}
          >
            Executar
          </Button>
        ) : null}
        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#0F1F3D]">
          <CatIcon size={12} strokeWidth={1.75} /> {catCfg.label}
        </span>
      </div>
    </Card>
  );
}

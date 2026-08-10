// components/career-plans/GoalCard.tsx
// Cartão de meta do PDI com slider de progresso. Extraído de
// app/(platform)/career-plans/page.tsx.

'use client';

import { CheckCircle2, Target } from 'lucide-react';
import { GOAL_TYPE_ICONS, GOAL_TYPE_LABELS } from './constants';
import type { CareerGoal } from './types';

interface GoalCardProps {
  goal: CareerGoal;
  onUpdateProgress: (id: number, progress: number) => void;
}

export function GoalCard({ goal, onUpdateProgress }: GoalCardProps) {
  const Icon = GOAL_TYPE_ICONS[goal.type] ?? Target;
  const isOverdue =
    goal.dueDate &&
    new Date(goal.dueDate) < new Date() &&
    goal.status !== 'COMPLETED';

  const statusColors = {
    PENDING: 'bg-gray-100 text-gray-600',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    CANCELLED: 'bg-red-100 text-red-500',
  };

  return (
    <div
      className={`bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow ${isOverdue ? 'border-red-100' : 'border-gray-100'}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`p-2 rounded-xl flex-shrink-0 ${goal.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}
        >
          {goal.status === 'COMPLETED' ? (
            <CheckCircle2 size={15} />
          ) : (
            <Icon size={15} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-gray-900 truncate">
              {goal.title}
            </p>
            <span
              className={`ml-2 text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${statusColors[goal.status]}`}
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
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-400">
              {GOAL_TYPE_LABELS[goal.type]}
            </span>
            {goal.dueDate && (
              <span
                className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}
              >
                · {new Date(goal.dueDate).toLocaleDateString('pt-PT')}
                {isOverdue && ' ⚠️'}
              </span>
            )}
          </div>
          {goal.status !== 'COMPLETED' && goal.status !== 'CANCELLED' && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Progresso</span>
                <span>{goal.progress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={goal.progress}
                onChange={(e) => onUpdateProgress(goal.id, +e.target.value)}
                className="w-full h-1.5 rounded-full accent-blue-600"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

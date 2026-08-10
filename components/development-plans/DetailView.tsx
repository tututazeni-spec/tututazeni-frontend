// components/development-plans/DetailView.tsx
// Vista de detalhe do PDI: header, progresso geral e tabs de
// acções/metas/checkpoints. Extraído de
// app/(platform)/development-plans/page.tsx.

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate as fmtDate } from '@/lib/format';
import { Avatar, ProgressBar, Skeleton } from './atoms';
import {
  ACTION_CFG,
  ACTION_STATUS,
  PRIORITY_CFG,
  STATUS_CFG,
} from './constants';
import { isOverdue } from './utils';
import type { Plan } from './types';

interface DetailViewProps {
  planId: number;
  onBack: () => void;
}

export function DetailView({ planId, onBack }: DetailViewProps) {
  const [updatingAction, setUpdatingAction] = useState<number | null>(null);
  const [updatingGoal, setUpdatingGoal] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<
    'actions' | 'goals' | 'checkpoints'
  >('actions');

  const {
    data: plan,
    isLoading: loading,
    refetch,
  } = useApiQuery<Plan>(
    queryKeys.developmentPlans.detail(planId),
    `/development-plans/${planId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const handleCompleteAction = async (actionId: number, xpReward: number) => {
    setUpdatingAction(actionId);
    try {
      await apiClient.put(`/development-plans/actions/${actionId}`, {
        status: 'COMPLETED',
        progress: 100,
      });
      await refetch();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setUpdatingAction(null);
    }
  };

  const handleGoalProgress = async (goalId: number, progress: number) => {
    setUpdatingGoal(goalId);
    try {
      await apiClient.patch('/development-plans/goals/progress', {
        goalId,
        progress,
      });
      await refetch();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setUpdatingGoal(null);
    }
  };

  const handleSubmit = async () => {
    try {
      await apiClient.patch(`/development-plans/${planId}/submit`, {});
      await refetch();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  if (loading || !plan) return <Skeleton rows={5} />;

  const pct = plan.actionProgress ?? plan.overallProgress;

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5"
      >
        ← Voltar
      </button>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <StatusBadge value={plan.status} map={STATUS_CFG} />
              <StatusBadge value={plan.priority} map={PRIORITY_CFG} />
              {plan.period && (
                <span className="text-xs text-gray-400">{plan.period}</span>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">
              {plan.name}
            </h1>
            <p className="text-sm text-gray-600">{plan.goal}</p>
          </div>
          <div className="flex-shrink-0">
            {plan.status === 'DRAFT' && (
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800"
              >
                Submeter para aprovação →
              </button>
            )}
          </div>
        </div>

        {/* Progresso geral */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progresso geral</span>
            <span className="font-mono">{pct}%</span>
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
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-400">
          <span>📅 Início: {fmtDate(plan.startDate)}</span>
          <span>📅 Fim: {fmtDate(plan.endDate)}</span>
          <span>📋 {plan._count.actions} acções</span>
          <span>🎯 {plan._count.goals} metas</span>
          {plan.manager && (
            <span className="flex items-center gap-1">
              <Avatar name={plan.manager.fullName} size="sm" />
              Gestor: {plan.manager.fullName}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {(['actions', 'goals', 'checkpoints'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === t
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {
              {
                actions: '✅ Acções',
                goals: '🎯 Metas',
                checkpoints: '📍 Checkpoints',
              }[t]
            }
          </button>
        ))}
      </div>

      {/* Actions */}
      {activeTab === 'actions' && (
        <div className="space-y-3">
          {plan.actions?.map((action) => {
            const typeCfg = ACTION_CFG[action.type];
            const statusCfg = ACTION_STATUS[action.status];
            const overdue = isOverdue(action.dueDate, action.status);
            return (
              <div
                key={action.id}
                className={`bg-white border rounded-xl p-4 ${overdue ? 'border-red-200' : 'border-gray-200'}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${typeCfg.cls}`}
                  >
                    {typeCfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-lg ${statusCfg.cls}`}>
                        {statusCfg.icon}
                      </span>
                      <span
                        className={`text-sm font-medium ${action.status === 'COMPLETED' ? 'line-through text-gray-400' : 'text-gray-900'}`}
                      >
                        {action.title}
                      </span>
                      {action.mandatory && (
                        <span className="text-xs text-red-600">
                          Obrigatória
                        </span>
                      )}
                    </div>
                    {action.description && (
                      <p className="text-xs text-gray-500 mb-2">
                        {action.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{typeCfg.label}</span>
                      {action.workloadHours && (
                        <span>⏱ {action.workloadHours}h</span>
                      )}
                      {action.dueDate && (
                        <span
                          className={overdue ? 'text-red-600 font-medium' : ''}
                        >
                          {overdue ? '⚠ ' : ''}📅 {fmtDate(action.dueDate)}
                        </span>
                      )}
                      <span className="text-amber-600">
                        +{action.xpReward} XP
                      </span>
                      {action.evidence && action.evidence.length > 0 && (
                        <span className="text-blue-600">
                          📎 {action.evidence.length} evidência(s)
                        </span>
                      )}
                    </div>
                    {action.status !== 'COMPLETED' && (
                      <div className="mt-2">
                        <ProgressBar pct={action.progress} />
                      </div>
                    )}
                  </div>
                  {action.status !== 'COMPLETED' &&
                    action.status !== 'CANCELLED' && (
                      <button
                        onClick={() =>
                          handleCompleteAction(action.id, action.xpReward)
                        }
                        disabled={updatingAction === action.id}
                        className="flex-shrink-0 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {updatingAction === action.id ? '…' : 'Concluir'}
                      </button>
                    )}
                </div>
              </div>
            );
          })}
          {(!plan.actions || plan.actions.length === 0) && (
            <div className="py-8 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Sem acções adicionadas
            </div>
          )}
        </div>
      )}

      {/* Goals */}
      {activeTab === 'goals' && (
        <div className="space-y-3">
          {plan.goals?.map((goal) => (
            <div
              key={goal.id}
              className="bg-white border border-gray-200 rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900 mb-0.5">
                    {goal.title}
                  </div>
                  {goal.successIndicator && (
                    <div className="text-xs text-gray-500">
                      📊 {goal.successIndicator}
                    </div>
                  )}
                  {goal.dueDate && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      📅 {fmtDate(goal.dueDate)}
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-bold font-mono text-blue-700">
                    {goal.progress}%
                  </div>
                  {goal.completedAt && (
                    <div className="text-xs text-emerald-600">✓ Concluída</div>
                  )}
                </div>
              </div>
              <ProgressBar pct={goal.progress} />
              {goal.progress < 100 && (
                <div className="flex gap-2 mt-3">
                  {[25, 50, 75, 100].map((v) => (
                    <button
                      key={v}
                      onClick={() => handleGoalProgress(goal.id, v)}
                      disabled={updatingGoal === goal.id || goal.progress >= v}
                      className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                        goal.progress >= v
                          ? 'bg-gray-100 text-gray-300'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      } disabled:opacity-50`}
                    >
                      {v}%
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {(!plan.goals || plan.goals.length === 0) && (
            <div className="py-8 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Sem metas adicionadas
            </div>
          )}
        </div>
      )}

      {/* Checkpoints */}
      {activeTab === 'checkpoints' && (
        <div className="space-y-3">
          {plan.checkpoints?.map((cp) => (
            <div
              key={cp.id}
              className={`flex items-center gap-4 bg-white border rounded-xl p-4 ${
                cp.status === 'COMPLETED'
                  ? 'border-emerald-200'
                  : 'border-gray-200'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                  cp.status === 'COMPLETED' ? 'bg-emerald-50' : 'bg-blue-50'
                }`}
              >
                {cp.status === 'COMPLETED'
                  ? '✅'
                  : cp.type === 'STRUCTURED'
                    ? '📋'
                    : '💬'}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {cp.title}
                </div>
                <div className="text-xs text-gray-400">
                  📅 {fmtDate(cp.scheduledAt)}
                  {cp.selfScore && (
                    <span className="ml-2">⭐ {cp.selfScore}/5</span>
                  )}
                </div>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded font-medium ${
                  cp.status === 'COMPLETED'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {cp.status === 'COMPLETED' ? 'Concluído' : 'Pendente'}
              </span>
            </div>
          ))}
          {(!plan.checkpoints || plan.checkpoints.length === 0) && (
            <div className="py-8 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Sem checkpoints agendados
            </div>
          )}
        </div>
      )}
    </div>
  );
}

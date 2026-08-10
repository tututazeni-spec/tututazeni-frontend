// components/career/PlanView.tsx
// Separador "Meu Plano" — criação de plano, objetivos e actualização de
// progresso. Dados próprios + apresentação. Extraído de
// app/(platform)/career/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import type { CareerPlan } from './types';

export function PlanView() {
  const [title, setTitle] = useState('');

  const { data: plan, isLoading: loading } = useApiQuery<CareerPlan>(
    queryKeys.career.plan(),
    '/career/me/plan',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const createPlanMutation = useApiMutation(
    () => apiClient.post('/career/me/plan', { title }),
    {
      invalidateKeys: [queryKeys.career.plan()],
      onSuccess: () => setTitle(''),
      onError: (e) => alert(e.message),
    },
  );
  const creating = createPlanMutation.isPending;
  const createPlan = () => {
    if (title.trim()) createPlanMutation.mutate(undefined);
  };

  const updateGoalMutation = useApiMutation(
    ({ goalId, progress }: { goalId: number; progress: number }) =>
      apiClient.patch(`/career/me/goals/${goalId}/progress`, { progress }),
    { invalidateKeys: [queryKeys.career.plan()] },
  );
  const updatingGoal = updateGoalMutation.isPending
    ? (updateGoalMutation.variables?.goalId ?? null)
    : null;
  const updateGoalProgress = (goalId: number, progress: number) =>
    updateGoalMutation.mutate({ goalId, progress });

  if (loading) return <Skeleton />;

  if (!plan) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <div className="text-5xl mb-4">📋</div>
        <div className="text-base font-semibold text-gray-900 mb-2">
          Sem plano de carreira activo
        </div>
        <p className="text-sm text-gray-500 mb-5">
          Define os teus objetivos de carreira e acompanha o teu progresso
        </p>
        <div className="flex gap-2 justify-center">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do plano (ex: Tornar-me Tech Lead até 2027)"
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={createPlan}
            disabled={creating || !title.trim()}
            className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 disabled:opacity-60"
          >
            {creating ? '…' : 'Criar plano'}
          </button>
        </div>
      </div>
    );
  }

  const goals = plan.goals ?? [];
  const completed = goals.filter((g) => g.status === 'COMPLETED').length;

  return (
    <div className="space-y-5">
      {/* Header do plano */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-base font-bold text-gray-900">
              {plan.title}
            </div>
            {plan.description && (
              <p className="text-sm text-gray-500 mt-0.5">{plan.description}</p>
            )}
            <div className="flex gap-3 mt-2 text-xs text-gray-400">
              {plan.targetDate && (
                <span>
                  🎯 Alvo:{' '}
                  {new Date(plan.targetDate).toLocaleDateString('pt-AO', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              )}
              {plan.mentor && <span>👥 Mentor: {plan.mentor.fullName}</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold font-mono text-blue-700">
              {completed}/{goals.length}
            </div>
            <div className="text-xs text-gray-400">objetivos concluídos</div>
          </div>
        </div>
        {goals.length > 0 && (
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{
                width: `${goals.length > 0 ? Math.round((completed / goals.length) * 100) : 0}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Objetivos */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-gray-900">
          Objetivos do Plano
        </div>
        {goals.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">
            Sem objetivos. Adiciona o primeiro objetivo ao plano.
          </div>
        ) : (
          goals.map((g) => (
            <div
              key={g.id}
              className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-100 last:border-0"
            >
              <div
                className={`w-4 h-4 rounded-full flex-shrink-0 border-2 ${
                  g.status === 'COMPLETED'
                    ? 'bg-emerald-500 border-emerald-500'
                    : g.status === 'IN_PROGRESS'
                      ? 'border-blue-500'
                      : 'border-gray-300'
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {g.title}
                </div>
                {g.description && (
                  <div className="text-xs text-gray-400 truncate">
                    {g.description}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${g.progress >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                      style={{ width: `${g.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{g.progress}%</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {[0, 25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => updateGoalProgress(g.id, pct)}
                    disabled={updatingGoal === g.id}
                    className={`text-xs px-1.5 py-0.5 rounded font-mono ${g.progress === pct ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    {pct}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

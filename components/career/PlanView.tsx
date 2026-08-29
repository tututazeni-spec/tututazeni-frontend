// components/career/PlanView.tsx
// Separador "Meu Plano" — criação de plano, objetivos e actualização de
// progresso. Dados próprios + apresentação. Extraído de
// app/(platform)/career/page.tsx.

'use client';

import { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import type { CareerPlan } from './types';

export function PlanView() {
  const notify = useToast();
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
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
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
      <Card className="p-8 text-center">
        <EmptyState
          title="Sem plano de carreira activo"
          description="Define os teus objetivos de carreira e acompanha o teu progresso"
          className="border-none bg-transparent p-0"
        />
        <div className="mt-5 flex justify-center gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do plano (ex: Tornar-me Tech Lead até 2027)"
            className="w-80"
          />
          <Button
            onClick={createPlan}
            disabled={!title.trim()}
            loading={creating}
          >
            Criar plano
          </Button>
        </div>
      </Card>
    );
  }

  const goals = plan.goals ?? [];
  const completed = goals.filter((g) => g.status === 'COMPLETED').length;

  return (
    <div className="space-y-5">
      {/* Header do plano */}
      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-display text-base font-bold text-ink">
              {plan.title}
            </div>
            {plan.description && (
              <p className="mt-0.5 font-body text-sm text-ink-muted">
                {plan.description}
              </p>
            )}
            <div className="mt-2 flex gap-3 font-body text-xs text-ink-faint">
              {plan.targetDate && (
                <span>
                   Alvo:{' '}
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
            <div className="font-data text-2xl font-bold text-primary">
              {completed}/{goals.length}
            </div>
            <div className="font-body text-xs text-ink-faint">
              objetivos concluídos
            </div>
          </div>
        </div>
        {goals.length > 0 && (
          <ProgressBar
            value={
              goals.length > 0
                ? Math.round((completed / goals.length) * 100)
                : 0
            }
            className="mt-3"
          />
        )}
      </Card>

      {/* Objetivos */}
      <Card className="overflow-hidden p-0">
        <div className="border-b border-border px-4 py-3 font-body text-sm font-semibold text-ink">
          Objetivos do Plano
        </div>
        {goals.length === 0 ? (
          <div className="px-4 py-8 text-center font-body text-sm text-ink-faint">
            Sem objetivos. Adiciona o primeiro objetivo ao plano.
          </div>
        ) : (
          goals.map((g) => (
            <div
              key={g.id}
              className="flex items-center gap-4 border-b border-border px-4 py-3.5 last:border-0"
            >
              <div
                className={cn(
                  'h-4 w-4 flex-shrink-0 rounded-full border-2',
                  g.status === 'COMPLETED'
                    ? 'border-success bg-success'
                    : g.status === 'IN_PROGRESS'
                      ? 'border-primary'
                      : 'border-border-strong',
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-body text-sm font-medium text-ink">
                  {g.title}
                </div>
                {g.description && (
                  <div className="truncate font-body text-xs text-ink-faint">
                    {g.description}
                  </div>
                )}
                <div className="mt-1 flex items-center gap-2">
                  <ProgressBar value={g.progress} className="w-32" />
                  <span className="font-body text-xs text-ink-faint">
                    {g.progress}%
                  </span>
                </div>
              </div>
              <div className="flex flex-shrink-0 items-center gap-1">
                {[0, 25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => updateGoalProgress(g.id, pct)}
                    disabled={updatingGoal === g.id}
                    className={cn(
                      'rounded px-1.5 py-0.5 font-data text-xs',
                      g.progress === pct
                        ? 'bg-primary text-canvas'
                        : 'bg-surface-sunken text-ink-muted hover:bg-border-strong',
                    )}
                  >
                    {pct}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

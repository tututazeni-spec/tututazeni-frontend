// components/performance/MyDashboard.tsx
// Separador "O meu desempenho" — ciclo activo, reviews pendentes,
// goals e feedback. Dados próprios + apresentação. Extraído de
// app/(platform)/performance/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar, ProgressBar, Skeleton } from './atoms';
import { GOAL_STATUS_MAP, REVIEW_STATUS_MAP } from './constants';
import { isOverdue } from './utils';
import type {
  Cycle,
  Feedback,
  Goal,
  MyPerformanceHistory,
  Review,
} from './types';

// Formulário "criar goal" — sub-domínio independente do formulário de
// feedback abaixo (não partilham estado, apenas coexistiam no mesmo
// componente). Cada hook expõe os seus campos + `submit`/`submitting` via
// useApiMutation, eliminando o setLoading/try/catch/finally manual.
function useGoalForm(cycle: Cycle | null, onCreated: () => void) {
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');

  const createGoal = useApiMutation(
    () =>
      apiClient.post('/performance/goals', {
        userId: 0,
        cycleId: cycle!.id,
        title,
        targetValue: parseFloat(target),
      }),
    {
      onSuccess: () => {
        setTitle('');
        setTarget('');
        onCreated();
      },
      onError: (e) => alert(e.message),
    },
  );

  const submit = () => {
    if (!title || !target || !cycle) return;
    createGoal.mutate(undefined);
  };

  return {
    title,
    setTitle,
    target,
    setTarget,
    submitting: createGoal.isPending,
    submit,
  };
}

// Formulário "enviar feedback" — sub-domínio independente do de goals acima.
function useFeedbackForm(cycleId: number | undefined, onSent: () => void) {
  const [message, setMessage] = useState('');
  const [targetUserId, setTargetUserId] = useState('');

  const sendFeedback = useApiMutation(
    () =>
      apiClient.post('/performance/feedback', {
        targetUserId: parseInt(targetUserId),
        type: 'PRAISE',
        message,
        cycleId,
      }),
    {
      onSuccess: () => {
        setMessage('');
        setTargetUserId('');
        onSent();
        alert('Feedback enviado!');
      },
      onError: (e) => alert(e.message),
    },
  );

  const submit = () => {
    if (!message || !targetUserId) return;
    sendFeedback.mutate(undefined);
  };

  return {
    message,
    setMessage,
    targetUserId,
    setTargetUserId,
    submitting: sendFeedback.isPending,
    submit,
  };
}

export function MyDashboard() {
  const historyQ = useApiQuery<MyPerformanceHistory>(
    queryKeys.performance.my(),
    '/performance/my',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const cycleQ = useApiQuery<Cycle | null>(
    queryKeys.performance.currentCycle(),
    '/performance/cycles/current',
    { staleTime: STALE_TIME.SEMI_STATIC, retry: false },
  );
  const history = historyQ.data ?? null;
  const cycle = cycleQ.data ?? null;
  const loading = historyQ.isLoading;

  const goalForm = useGoalForm(cycle, () => historyQ.refetch());
  const feedbackForm = useFeedbackForm(cycle?.id, () => historyQ.refetch());

  const updateProgress = useApiMutation(
    ({ goalId, currentValue }: { goalId: number; currentValue: number }) =>
      apiClient.patch(`/performance/goals/${goalId}/progress`, {
        currentValue,
      }),
    {
      onSuccess: () => historyQ.refetch(),
      onError: (e) => alert(e.message),
    },
  );
  const handleUpdateProgress = (goalId: number, currentValue: number) =>
    updateProgress.mutate({ goalId, currentValue });

  if (loading) return <Skeleton />;
  if (!history) return null;

  const pendingReviews = history.reviews.filter((r: Review) =>
    ['PENDING_SELF', 'PENDING_MANAGER'].includes(r.status),
  );

  return (
    <div className="space-y-6">
      {/* Ciclo activo */}
      {cycle && (
        <div className="bg-blue-700 text-white rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-blue-200 mb-1">Ciclo activo</div>
              <div className="text-lg font-semibold">{cycle.name}</div>
              <div className="text-xs text-blue-200 mt-1">
                {fmtDate(cycle.startDate)} → {fmtDate(cycle.endDate)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-blue-200">Score médio</div>
              <div className="text-3xl font-bold">{history.avgScore}</div>
            </div>
          </div>
          {cycle.selfEvalDeadline && (
            <div
              className={`mt-3 text-xs px-3 py-1.5 rounded-lg inline-block ${isOverdue(cycle.selfEvalDeadline) ? 'bg-red-500' : 'bg-blue-600'}`}
            >
              {isOverdue(cycle.selfEvalDeadline)
                ? '⚠ Autoavaliação em atraso'
                : `Autoavaliação: ${fmtDate(cycle.selfEvalDeadline)}`}
            </div>
          )}
        </div>
      )}

      {/* Reviews pendentes */}
      {pendingReviews.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="text-sm font-semibold text-amber-800 mb-2">
            ⏳ Avaliações pendentes
          </div>
          {pendingReviews.map((r: Review) => (
            <div
              key={r.id}
              className="flex items-center justify-between py-2 border-b border-amber-100 last:border-0"
            >
              <div>
                <div className="text-sm font-medium text-amber-900">
                  {r.cycle.name}
                </div>
                <StatusBadge
                  value={r.status}
                  map={REVIEW_STATUS_MAP}
                  variant="dot"
                />
              </div>
              <button className="px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700">
                Completar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Métricas */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Avaliações', value: history.reviews.length },
          { label: 'Goals activos', value: history.goals.length },
          {
            label: 'Score médio',
            value: history.avgScore,
            color: 'text-blue-600',
          },
          { label: 'Feedbacks recebidos', value: history.feedback.length },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div
              className={`text-2xl font-semibold font-mono ${color ?? 'text-gray-900'}`}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Goals */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-900">
              Os meus Goals
            </div>
          </div>
          <div className="space-y-2">
            {history.goals.map((g: Goal) => (
              <div
                key={g.id}
                className="bg-white border border-gray-200 rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {g.title}
                    </div>
                    <StatusBadge value={g.status} map={GOAL_STATUS_MAP} />
                  </div>
                  <div className="text-xs text-gray-400">
                    {g.currentValue}/{g.targetValue} {g.unit}
                  </div>
                </div>
                <ProgressBar
                  pct={g.progress}
                  color={
                    g.status === 'COMPLETED'
                      ? 'bg-emerald-500'
                      : g.status === 'OFF_TRACK'
                        ? 'bg-red-500'
                        : 'bg-blue-500'
                  }
                />
                {g.dueDate && (
                  <div
                    className={`text-xs mt-1 ${isOverdue(g.dueDate) ? 'text-red-600' : 'text-gray-400'}`}
                  >
                    {isOverdue(g.dueDate)
                      ? '⚠ Prazo expirado'
                      : `Prazo: ${fmtDate(g.dueDate)}`}
                  </div>
                )}
              </div>
            ))}
            {/* Criar goal */}
            {cycle && (
              <div className="bg-white border border-dashed border-gray-200 rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-2">Novo goal</div>
                <input
                  type="text"
                  placeholder="Título do goal"
                  value={goalForm.title}
                  onChange={(e) => goalForm.setTitle(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Valor alvo"
                    value={goalForm.target}
                    onChange={(e) => goalForm.setTarget(e.target.value)}
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={goalForm.submit}
                    disabled={
                      !goalForm.title || !goalForm.target || goalForm.submitting
                    }
                    className="px-3 py-2 bg-blue-700 text-white text-xs rounded-lg disabled:opacity-50"
                  >
                    {goalForm.submitting ? '…' : 'Criar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Feedback recebido */}
        <div>
          <div className="text-sm font-semibold text-gray-900 mb-3">
            Feedback recebido
          </div>
          <div className="space-y-2">
            {history.feedback.map((f: Feedback) => (
              <div
                key={f.id}
                className={`border rounded-xl p-4 ${f.type === 'PRAISE' ? 'border-emerald-200 bg-emerald-50' : f.type === 'IMPROVEMENT' ? 'border-amber-200 bg-amber-50' : 'border-gray-200'}`}
              >
                <div className="flex items-start gap-3">
                  <Avatar
                    name={f.giver.fullName}
                    avatarUrl={f.giver.avatarUrl}
                    size="sm"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-800">
                        {f.giver.fullName}
                      </span>
                      <span
                        className={`text-xs px-1.5 rounded ${f.type === 'PRAISE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                      >
                        {f.type === 'PRAISE'
                          ? '👏 Reconhecimento'
                          : '💡 Melhoria'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{f.message}</p>
                    <div className="text-xs text-gray-400 mt-1">
                      {fmtDate(f.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Dar feedback */}
            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-400 mb-2">
                Dar feedback a colega
              </div>
              <input
                type="number"
                placeholder="ID do colega"
                value={feedbackForm.targetUserId}
                onChange={(e) => feedbackForm.setTargetUserId(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Escreva o feedback…"
                value={feedbackForm.message}
                onChange={(e) => feedbackForm.setMessage(e.target.value)}
                rows={2}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              />
              <button
                onClick={feedbackForm.submit}
                disabled={
                  !feedbackForm.message ||
                  !feedbackForm.targetUserId ||
                  feedbackForm.submitting
                }
                className="w-full py-2 bg-blue-700 text-white text-xs font-medium rounded-lg disabled:opacity-50"
              >
                {feedbackForm.submitting ? 'A enviar…' : '📤 Enviar feedback'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

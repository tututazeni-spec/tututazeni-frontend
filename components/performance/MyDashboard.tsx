// components/performance/MyDashboard.tsx
// Separador "O meu desempenho" — ciclo activo, reviews pendentes,
// goals e feedback. Dados próprios + apresentação. Extraído de
// app/(platform)/performance/page.tsx.

'use client';

import { useState } from 'react';
import { useToast } from '@/providers/ToastProvider';
import {
  AlertTriangle,
  ClipboardCheck,
  MessageSquare,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Textarea } from '@/components/ui/Textarea';
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
  const notify = useToast();
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');

  const createGoal = useApiMutation(
    (cycleId: number) =>
      apiClient.post('/performance/goals', {
        userId: 0,
        cycleId,
        title,
        targetValue: parseFloat(target),
      }),
    {
      onSuccess: () => {
        setTitle('');
        setTarget('');
        onCreated();
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const submit = () => {
    // `cycle` pode ser null (sem ciclo activo) — o id é capturado aqui, já
    // depois do guard, e passado como variável da mutação. Nunca
    // desreferenciar `cycle` dentro do mutationFn (closure obsoleta).
    if (!title || !target || !cycle) return;
    createGoal.mutate(cycle.id);
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
  const notify = useToast();
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
        notify({ title: 'Feedback enviado!', intent: 'success' });
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
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
  const notify = useToast();
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
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
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
        <div className="bg-primary text-canvas rounded-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs opacity-80 mb-1">Ciclo activo</div>
              <div className="text-lg font-semibold">{cycle.name}</div>
              <div className="text-xs opacity-80 mt-1">
                {fmtDate(cycle.startDate)} → {fmtDate(cycle.endDate)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs opacity-80">Score médio</div>
              <div className="text-3xl font-bold">{history.avgScore}</div>
            </div>
          </div>
          {cycle.selfEvalDeadline && (
            <div
              className={`mt-3 text-xs px-3 py-1.5 rounded-control inline-block ${isOverdue(cycle.selfEvalDeadline) ? 'bg-danger' : 'bg-primary-hover'}`}
            >
              {isOverdue(cycle.selfEvalDeadline)
                ? 'Autoavaliação em atraso'
                : `Autoavaliação: ${fmtDate(cycle.selfEvalDeadline)}`}
            </div>
          )}
        </div>
      )}

      {/* Reviews pendentes */}
      {pendingReviews.length > 0 && (
        <div className="rounded-card border border-warning bg-warning-subtle p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-warning-ink">
            <AlertTriangle size={16} strokeWidth={1.75} />
            Avaliações pendentes
          </div>
          {pendingReviews.map((r: Review) => (
            <div
              key={r.id}
              className="flex items-center justify-between py-2 border-b border-warning/20 last:border-0"
            >
              <div>
                <div className="text-sm font-medium text-ink">
                  {r.cycle.name}
                </div>
                <StatusBadge
                  value={r.status}
                  map={REVIEW_STATUS_MAP}
                  variant="dot"
                />
              </div>
              <Button intent="warning" size="sm">
                Completar
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Avaliações"
          value={history.reviews.length}
          intent="primary"
        />
        <KpiCard
          label="Goals activos"
          value={history.goals.length}
          intent="accent"
        />
        <KpiCard
          label="Pontuação Média"
          value={history.avgScore}
          intent="info"
        />
        <KpiCard
          label="Feedbacks recebidos"
          value={history.feedback.length}
          intent="success"
        />
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Goals */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-ink">Os meus Goals</div>
          </div>
          <div className="space-y-2">
            {history.goals.map((g: Goal) => (
              <Card key={g.id}>
                <CardBody>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-medium text-ink">
                        {g.title}
                      </div>
                      <StatusBadge value={g.status} map={GOAL_STATUS_MAP} />
                    </div>
                    <div className="text-xs text-ink-faint">
                      {g.currentValue}/{g.targetValue} {g.unit}
                    </div>
                  </div>
                  <ProgressBar value={g.progress} />
                  {g.dueDate && (
                    <div
                      className={`text-xs mt-1 ${isOverdue(g.dueDate) ? 'text-danger' : 'text-ink-faint'}`}
                    >
                      {isOverdue(g.dueDate)
                        ? 'Prazo expirado'
                        : `Prazo: ${fmtDate(g.dueDate)}`}
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
            {/* Criar goal */}
            {cycle && (
              <Card className="border-dashed border-border-strong">
                <CardBody>
                  <div className="text-xs text-ink-faint mb-2">Novo goal</div>
                  <Input
                    type="text"
                    placeholder="Título do goal"
                    value={goalForm.title}
                    onChange={(e) => goalForm.setTitle(e.target.value)}
                    className="w-full mb-2"
                  />
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Valor alvo"
                      value={goalForm.target}
                      onChange={(e) => goalForm.setTarget(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={goalForm.submit}
                      disabled={
                        !goalForm.title ||
                        !goalForm.target ||
                        goalForm.submitting
                      }
                    >
                      {goalForm.submitting ? '…' : 'Criar'}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </div>

        {/* Feedback recebido */}
        <div>
          <div className="text-sm font-semibold text-ink mb-3">
            Feedback recebido
          </div>
          <div className="space-y-2">
            {history.feedback.map((f: Feedback) => (
              <Card
                key={f.id}
                className={
                  f.type === 'PRAISE'
                    ? 'border-success bg-success-subtle'
                    : f.type === 'IMPROVEMENT'
                      ? 'border-warning bg-warning-subtle'
                      : undefined
                }
              >
                <CardBody>
                  <div className="flex items-start gap-3">
                    <Avatar
                      name={f.giver.fullName}
                      url={f.giver.avatarUrl ?? undefined}
                      size="sm"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-ink">
                          {f.giver.fullName}
                        </span>
                        <Badge
                          intent={f.type === 'PRAISE' ? 'success' : 'warning'}
                        >
                          {f.type === 'PRAISE'
                            ? ' Reconhecimento'
                            : ' Melhoria'}
                        </Badge>
                      </div>
                      <p className="text-xs text-ink-muted">{f.message}</p>
                      <div className="text-xs text-ink-faint mt-1">
                        {fmtDate(f.createdAt)}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}

            {/* Dar feedback */}
            <Card className="border-dashed border-border-strong">
              <CardBody>
                <div className="text-xs text-ink-faint mb-2">
                  Dar feedback a colega
                </div>
                <Input
                  type="number"
                  placeholder="ID do colega"
                  value={feedbackForm.targetUserId}
                  onChange={(e) => feedbackForm.setTargetUserId(e.target.value)}
                  className="w-full mb-2"
                />
                <Textarea
                  placeholder="Escreva o feedback…"
                  value={feedbackForm.message}
                  onChange={(e) => feedbackForm.setMessage(e.target.value)}
                  rows={2}
                  className="w-full resize-none mb-2"
                />
                <Button
                  className="w-full"
                  onClick={feedbackForm.submit}
                  disabled={
                    !feedbackForm.message ||
                    !feedbackForm.targetUserId ||
                    feedbackForm.submitting
                  }
                >
                  {feedbackForm.submitting ? 'A enviar…' : 'Enviar feedback'}
                </Button>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

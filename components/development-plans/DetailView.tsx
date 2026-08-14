// components/development-plans/DetailView.tsx
// Vista de detalhe do PDI: header, progresso geral e tabs de
// acções/metas/checkpoints. Extraído de
// app/(platform)/development-plans/page.tsx.

'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  MessageCircle,
  Paperclip,
  Star,
  TriangleAlert,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate as fmtDate } from '@/lib/format';
import {
  ACTION_CFG,
  ACTION_STATUS,
  PRIORITY_CFG,
  STATUS_CFG,
} from './constants';
import { isOverdue, progressTextClass } from './utils';
import type { Plan } from './types';

interface DetailViewProps {
  planId: number;
  onBack: () => void;
}

const TABS = [
  { id: 'actions', label: '✅ Acções' },
  { id: 'goals', label: '🎯 Metas' },
  { id: 'checkpoints', label: '📍 Checkpoints' },
] as const;

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
      <Button intent="ghost" size="sm" onClick={onBack} className="mb-5">
        <ArrowLeft size={14} strokeWidth={1.75} />
        Voltar
      </Button>

      {/* Header */}
      <Card className="mb-5">
        <CardBody>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <StatusBadge value={plan.status} map={STATUS_CFG} />
                <StatusBadge value={plan.priority} map={PRIORITY_CFG} />
                {plan.period && (
                  <span className="font-body text-xs text-ink-faint">
                    {plan.period}
                  </span>
                )}
              </div>
              <h1 className="mb-1 font-display text-xl font-bold text-ink">
                {plan.name}
              </h1>
              <p className="font-body text-sm text-ink-muted">{plan.goal}</p>
            </div>
            <div className="flex-shrink-0">
              {plan.status === 'DRAFT' && (
                <Button size="sm" onClick={handleSubmit}>
                  Submeter para aprovação
                  <ArrowRight size={14} strokeWidth={1.75} />
                </Button>
              )}
            </div>
          </div>

          {/* Progresso geral */}
          <div className="mb-4">
            <div className="mb-1 flex justify-between font-body text-xs text-ink-faint">
              <span>Progresso geral</span>
              <span
                className={cn('font-data font-semibold', progressTextClass(pct))}
              >
                {pct}%
              </span>
            </div>
            <ProgressBar value={pct} />
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap gap-4 font-body text-xs text-ink-faint">
            <span className="flex items-center gap-1">
              <Calendar size={14} strokeWidth={1.75} />
              Início: {fmtDate(plan.startDate)}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={14} strokeWidth={1.75} />
              Fim: {fmtDate(plan.endDate)}
            </span>
            <span>📋 {plan._count.actions} acções</span>
            <span>🎯 {plan._count.goals} metas</span>
            {plan.manager && (
              <span className="flex items-center gap-1">
                <Avatar name={plan.manager.fullName} size="sm" />
                Gestor: {plan.manager.fullName}
              </span>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Tabs */}
      <div className="mb-5 flex w-fit gap-1 rounded-card bg-surface-sunken p-1">
        {TABS.map((t) => (
          <Button
            key={t.id}
            size="sm"
            intent={activeTab === t.id ? 'primary' : 'ghost'}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </Button>
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
              <Card
                key={action.id}
                className={overdue ? 'border-danger' : undefined}
              >
                <CardBody>
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-control text-lg',
                        typeCfg.cls,
                      )}
                    >
                      {typeCfg.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className={cn('text-lg', statusCfg.cls)}>
                          {statusCfg.icon}
                        </span>
                        <span
                          className={cn(
                            'font-body text-sm font-medium',
                            action.status === 'COMPLETED'
                              ? 'text-ink-faint line-through'
                              : 'text-ink',
                          )}
                        >
                          {action.title}
                        </span>
                        {action.mandatory && (
                          <span className="font-body text-xs text-danger">
                            Obrigatória
                          </span>
                        )}
                      </div>
                      {action.description && (
                        <p className="mb-2 font-body text-xs text-ink-muted">
                          {action.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 font-body text-xs text-ink-faint">
                        <span>{typeCfg.label}</span>
                        {action.workloadHours && (
                          <span className="flex items-center gap-1">
                            <Clock size={14} strokeWidth={1.75} />
                            {action.workloadHours}h
                          </span>
                        )}
                        {action.dueDate && (
                          <span
                            className={cn(
                              'flex items-center gap-1',
                              overdue && 'font-medium text-danger',
                            )}
                          >
                            {overdue && (
                              <TriangleAlert size={14} strokeWidth={1.75} />
                            )}
                            <Calendar size={14} strokeWidth={1.75} />
                            {fmtDate(action.dueDate)}
                          </span>
                        )}
                        <span className="text-accent">
                          +{action.xpReward} XP
                        </span>
                        {action.evidence && action.evidence.length > 0 && (
                          <span className="flex items-center gap-1 text-info">
                            <Paperclip size={14} strokeWidth={1.75} />
                            {action.evidence.length} evidência(s)
                          </span>
                        )}
                      </div>
                      {action.status !== 'COMPLETED' && (
                        <div className="mt-2">
                          <ProgressBar value={action.progress} />
                        </div>
                      )}
                    </div>
                    {action.status !== 'COMPLETED' &&
                      action.status !== 'CANCELLED' && (
                        <Button
                          size="sm"
                          intent="success"
                          loading={updatingAction === action.id}
                          onClick={() =>
                            handleCompleteAction(action.id, action.xpReward)
                          }
                          className="flex-shrink-0"
                        >
                          Concluir
                        </Button>
                      )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
          {(!plan.actions || plan.actions.length === 0) && (
            <div className="rounded-card border border-dashed border-border-strong py-8 text-center font-body text-sm text-ink-faint">
              Sem acções adicionadas
            </div>
          )}
        </div>
      )}

      {/* Goals */}
      {activeTab === 'goals' && (
        <div className="space-y-3">
          {plan.goals?.map((goal) => (
            <Card key={goal.id}>
              <CardBody>
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-0.5 font-body text-sm font-semibold text-ink">
                      {goal.title}
                    </div>
                    {goal.successIndicator && (
                      <div className="font-body text-xs text-ink-muted">
                        📊 {goal.successIndicator}
                      </div>
                    )}
                    {goal.dueDate && (
                      <div className="mt-0.5 flex items-center gap-1 font-body text-xs text-ink-faint">
                        <Calendar size={14} strokeWidth={1.75} />
                        {fmtDate(goal.dueDate)}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="font-data text-2xl font-bold text-info-ink">
                      {goal.progress}%
                    </div>
                    {goal.completedAt && (
                      <div className="flex items-center gap-1 font-body text-xs text-success">
                        <CheckCircle2 size={14} strokeWidth={1.75} />
                        Concluída
                      </div>
                    )}
                  </div>
                </div>
                <ProgressBar value={goal.progress} />
                {goal.progress < 100 && (
                  <div className="mt-3 flex gap-2">
                    {[25, 50, 75, 100].map((v) => {
                      const reached = goal.progress >= v;
                      return (
                        <Button
                          key={v}
                          size="sm"
                          intent={reached ? 'ghost' : 'secondary'}
                          disabled={reached || updatingGoal === goal.id}
                          onClick={() => handleGoalProgress(goal.id, v)}
                        >
                          {v}%
                        </Button>
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
          {(!plan.goals || plan.goals.length === 0) && (
            <div className="rounded-card border border-dashed border-border-strong py-8 text-center font-body text-sm text-ink-faint">
              Sem metas adicionadas
            </div>
          )}
        </div>
      )}

      {/* Checkpoints */}
      {activeTab === 'checkpoints' && (
        <div className="space-y-3">
          {plan.checkpoints?.map((cp) => (
            <Card
              key={cp.id}
              className={cp.status === 'COMPLETED' ? 'border-success' : undefined}
            >
              <CardBody className="flex items-center gap-4">
                <div
                  className={cn(
                    'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-control',
                    cp.status === 'COMPLETED'
                      ? 'bg-success-subtle text-success'
                      : 'bg-info-subtle text-info',
                  )}
                >
                  {cp.status === 'COMPLETED' ? (
                    <CheckCircle2 size={20} strokeWidth={1.75} />
                  ) : cp.type === 'STRUCTURED' ? (
                    <FileText size={20} strokeWidth={1.75} />
                  ) : (
                    <MessageCircle size={20} strokeWidth={1.75} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-body text-sm font-medium text-ink">
                    {cp.title}
                  </div>
                  <div className="flex items-center gap-2 font-body text-xs text-ink-faint">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} strokeWidth={1.75} />
                      {fmtDate(cp.scheduledAt)}
                    </span>
                    {cp.selfScore && (
                      <span className="flex items-center gap-1">
                        <Star size={14} strokeWidth={1.75} />
                        {cp.selfScore}/5
                      </span>
                    )}
                  </div>
                </div>
                <StatusBadge
                  value={cp.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING'}
                  map={{
                    COMPLETED: {
                      label: 'Concluído',
                      cls: 'bg-success-subtle text-success-ink',
                    },
                    PENDING: {
                      label: 'Pendente',
                      cls: 'bg-surface-sunken text-ink-muted',
                    },
                  }}
                />
              </CardBody>
            </Card>
          ))}
          {(!plan.checkpoints || plan.checkpoints.length === 0) && (
            <div className="rounded-card border border-dashed border-border-strong py-8 text-center font-body text-sm text-ink-faint">
              Sem checkpoints agendados
            </div>
          )}
        </div>
      )}
    </div>
  );
}

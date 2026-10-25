// components/development-plans/DetailView.tsx
// Vista de detalhe do PDI: header, progresso geral e tabs de
// acções/metas/checkpoints. Extraído de
// app/(platform)/development-plans/page.tsx.

'use client';

import { useState } from 'react';
import { useToast } from '@/providers/ToastProvider';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  MapPin,
  MessageCircle,
  Paperclip,
  Layers,
  type LucideIcon,
  Star,
  Target,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
import { EventBadge } from '@/components/events/EventBadges';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { GanttChart, type GanttRow } from '@/components/ui/charts/GanttChart';
import { formatDate as fmtDate } from '@/lib/format';
import {
  ACTION_CFG,
  ACTION_STATUS,
  FINAL_RESULT_CFG,
  GAP_PRIORITY_CFG,
  NEXT_STEPS_CFG,
  ORIGIN_CFG,
  OVERALL_RESULT_CFG,
  PRIORITY_ON_DARK_CFG,
  STATUS_ON_DARK_CFG,
} from './constants';
import { planPalette } from './PlanCard';
import { Metric } from '@/components/events/EventListCard';
import { isOverdue } from './utils';
import type { Action, Plan } from './types';
import { EmptyState } from '@/components/ui/EmptyState';

const MS_PER_DAY = 86_400_000;

// Cada linha do texto (opções escolhidas da lista ou escritas à mão) vira
// uma informação do cartão.
function textLines(text?: string | null): string[] {
  return (text ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

function dayOffset(dateStr: string, referenceStr: string): number {
  return Math.round(
    (new Date(dateStr).getTime() - new Date(referenceStr).getTime()) /
      MS_PER_DAY,
  );
}

// Não há uma data de início por acção (só `dueDate`) — o cronograma usa o
// início do próprio plano como início de todas as barras, mostrando "tempo
// disponível até ao prazo" a partir do arranque do PDI, não uma janela de
// execução real da acção.
function actionsToGanttRows(
  actions: Action[],
  planStartDate: string | null,
): GanttRow[] {
  if (!planStartDate) return [];
  return actions
    .filter((a) => a.dueDate != null)
    .map((a) => {
      const end = Math.max(0, dayOffset(a.dueDate as string, planStartDate));
      let status: GanttRow['status'];
      if (a.status === 'COMPLETED') status = 'done';
      else if (a.status === 'CANCELLED') status = 'pending';
      else if (isOverdue(a.dueDate, a.status)) status = 'overdue';
      else status = 'current';
      return {
        label: a.title,
        start: 0,
        end,
        status,
        detail: `${ACTION_STATUS[a.status].label} · ${a.progress}%`,
      };
    });
}

interface DetailViewProps {
  planId: number;
  onBack: () => void;
}

const TABS = [
  { id: 'actions', label: 'Acções', Icon: CheckCircle2 },
  { id: 'goals', label: 'Metas', Icon: Target },
  { id: 'checkpoints', label: 'Checkpoints', Icon: MapPin },
  { id: 'diagnosis', label: 'Diagnóstico', Icon: FileText },
] as const;

interface DiagnosisRow {
  icon: LucideIcon;
  value: string;
  label: string;
}

interface DiagnosisCardProps {
  palette: readonly string[];
  icon: LucideIcon;
  title: string;
  badge?: React.ReactNode;
  rows: DiagnosisRow[];
}

// Cartão claro do separador Diagnóstico: círculo com ícone na cor do PDI,
// título azul-marinho, etiqueta opcional e linhas com valor + legenda.
function DiagnosisCard({
  palette,
  icon: Icon,
  title,
  badge,
  rows,
}: DiagnosisCardProps) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-brand-line bg-white shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
      <div className="flex flex-wrap items-center gap-4 px-6 pt-6">
        <span
          aria-hidden
          className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full text-white"
          style={{ background: palette[3] }}
        >
          <Icon size={24} strokeWidth={1.75} />
        </span>
        <h3 className="min-w-0 flex-1 break-words font-display text-xl font-bold text-brand">
          {title}
        </h3>
        {badge}
      </div>
      {rows.length > 0 && (
        <div className="mt-4 divide-y divide-brand-line border-t border-brand-line">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-3 px-6 py-3.5">
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft"
                style={{ color: palette[0] }}
              >
                <r.icon size={18} strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <div className="break-words font-body text-[15px] font-medium text-brand">
                  {r.value}
                </div>
                {r.label && (
                  <div className="break-words font-body text-xs text-brand-muted">
                    {r.label}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {rows.length === 0 && <div className="pb-6" />}
    </section>
  );
}

export function DetailView({ planId, onBack }: DetailViewProps) {
  const notify = useToast();
  const [updatingAction, setUpdatingAction] = useState<number | null>(null);
  const [updatingGoal, setUpdatingGoal] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<
    'actions' | 'goals' | 'checkpoints' | 'diagnosis'
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
      reportError(e, {
        source: 'DevelopmentPlanDetailView.handleCompleteAction',
      });
      notify({
        title: e instanceof Error ? e.message : String(e),
        intent: 'danger',
      });
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
      reportError(e, {
        source: 'DevelopmentPlanDetailView.handleGoalProgress',
      });
      notify({
        title: e instanceof Error ? e.message : String(e),
        intent: 'danger',
      });
    } finally {
      setUpdatingGoal(null);
    }
  };

  const handleSubmit = async () => {
    try {
      await apiClient.patch(`/development-plans/${planId}/submit`, {});
      await refetch();
    } catch (e) {
      reportError(e, { source: 'DevelopmentPlanDetailView.handleSubmit' });
      notify({
        title: e instanceof Error ? e.message : String(e),
        intent: 'danger',
      });
    }
  };

  if (loading || !plan) return <Skeleton rows={5} />;

  const pct = plan.actionProgress ?? plan.overallProgress;
  // Mesma cor-base do PDI; cada cartão do diagnóstico avança na paleta.
  const hasDiagnosis =
    !!plan.origin ||
    !!plan.strengths ||
    !!plan.developmentNeeds ||
    !!plan.originJustification ||
    (plan.competencyGaps?.length ?? 0) > 0;
  const palette = planPalette(plan);
  const diagSeed = Math.abs((plan.user?.id ?? 0) * 3 + plan.id);

  return (
    <div>
      <Button intent="ghost" size="sm" onClick={onBack} className="mb-5">
        <ArrowLeft size={14} strokeWidth={1.75} />
        Voltar
      </Button>

      {/* Header — desenho de "workshop de inovação.jpeg": cartão claro com
          etiquetas, ícone + título, dados, gestor e acção; a imagem do PDI
          num recorte inclinado no canto superior direito. */}
      <div className="relative mb-5 overflow-hidden rounded-[24px] border border-brand-line bg-white shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
        <div
          aria-hidden
          className="absolute right-0 top-0 hidden h-[58%] w-[34%] items-center justify-center text-white/70 sm:flex"
          style={{
            clipPath: 'polygon(16% 0, 100% 0, 100% 100%, 0 76%)',
            background: plan.imageUrl
              ? undefined
              : `linear-gradient(160deg, ${palette[0]} 0%, ${palette[2]} 100%)`,
          }}
        >
          {plan.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={plan.imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <Target size={48} strokeWidth={1.25} />
          )}
        </div>

        <div className="relative space-y-5 p-6 sm:pr-[36%]">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              value={plan.status}
              map={STATUS_ON_DARK_CFG}
              variant="pill"
            />
            <StatusBadge
              value={plan.priority}
              map={PRIORITY_ON_DARK_CFG}
              variant="pill"
            />
            {plan.period && (
              <span className="font-body text-xs font-semibold text-brand-muted">
                {plan.period}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span
              aria-hidden
              className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full text-white"
              style={{ background: palette[3] }}
            >
              <Target size={28} strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <h1 className="break-words font-display text-[28px] font-bold leading-tight text-brand">
                {plan.name}
              </h1>
              {plan.user && (
                <p className="mt-0.5 break-words text-base text-brand-muted">
                  {plan.user.fullName}
                </p>
              )}
            </div>
          </div>

          <p className="whitespace-pre-line font-body text-sm leading-relaxed text-ink-muted">
            {plan.goal}
          </p>

          <div className="flex flex-wrap items-center gap-y-3 divide-x divide-brand-line">
            <Metric icon={Calendar}>Início: {fmtDate(plan.startDate)}</Metric>
            <Metric icon={Calendar}>Fim: {fmtDate(plan.endDate)}</Metric>
            <Metric icon={ClipboardList}>{plan._count.actions} Acções</Metric>
            <Metric icon={Target}>{plan._count.goals} Metas</Metric>
          </div>

          <div className="border-t border-brand-line pt-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {plan.manager ? (
                <span className="inline-flex items-center gap-3 text-[15px] text-brand-muted">
                  <Avatar
                    name={plan.manager.fullName}
                    url={plan.manager.avatarUrl ?? undefined}
                    size="sm"
                  />
                  Gestor: {plan.manager.fullName}
                </span>
              ) : (
                <span />
              )}
              {plan.status === 'DRAFT' && (
                <Button size="sm" onClick={handleSubmit}>
                  Submeter para aprovação
                  <ArrowRight size={14} strokeWidth={1.75} />
                </Button>
              )}
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between font-body text-xs text-brand-muted">
                <span>Progresso geral</span>
                <span className="font-data font-semibold text-brand">
                  {pct}%
                </span>
              </div>
              <ProgressBar value={pct} color={palette[0]} />
            </div>
          </div>
        </div>
      </div>

      {/* Fecho do PDI (secção 19-20) — só depois de concluído */}
      {(plan.finalResult || plan.overallResult || plan.nextSteps) && (
        <Card className="mb-5">
          <CardBody>
            <div className="mb-3 font-body text-sm font-semibold text-ink">
              Avaliação final
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              {plan.finalResult && (
                <span className="rounded-full bg-info-subtle px-2.5 py-1 font-body text-xs text-info-ink">
                  {FINAL_RESULT_CFG[plan.finalResult]}
                </span>
              )}
              {plan.overallResult && (
                <span className="rounded-full bg-success-subtle px-2.5 py-1 font-body text-xs text-success-ink">
                  {OVERALL_RESULT_CFG[plan.overallResult]}
                </span>
              )}
              {plan.nextSteps && (
                <span className="rounded-full bg-surface-sunken px-2.5 py-1 font-body text-xs text-ink-muted">
                  Próximo passo: {NEXT_STEPS_CFG[plan.nextSteps]}
                </span>
              )}
            </div>
            <div className="space-y-1.5 font-body text-sm text-ink-muted">
              {plan.employeeComment && (
                <p>Colaborador: {plan.employeeComment}</p>
              )}
              {plan.managerComment && <p>Gestor: {plan.managerComment}</p>}
              {plan.rhComment && <p>RH: {plan.rhComment}</p>}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Tabs */}
      <div className="mb-5 flex gap-2">
        {TABS.map((t) => (
          <Button
            key={t.id}
            size="sm"
            intent={activeTab === t.id ? 'primary' : 'ghost'}
            aria-pressed={activeTab === t.id}
            onClick={() => setActiveTab(t.id)}
          >
            <t.Icon size={14} strokeWidth={1.75} />
            {t.label}
          </Button>
        ))}
      </div>

      {/* Actions */}
      {activeTab === 'actions' && (
        <div className="space-y-6">
          {plan.actions &&
            plan.actions.length > 0 &&
            actionsToGanttRows(plan.actions, plan.startDate).length > 0 && (
              <GanttChart
                rows={actionsToGanttRows(plan.actions, plan.startDate)}
                todayValue={
                  plan.startDate
                    ? Math.max(
                        0,
                        dayOffset(new Date().toISOString(), plan.startDate),
                      )
                    : undefined
                }
                unitLabel="dias desde o início do PDI"
              />
            )}
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
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span
                            className={cn('flex items-center', statusCfg.cls)}
                          >
                            <statusCfg.icon size={16} strokeWidth={1.75} />
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
                            <ProgressBar
                              value={action.progress}
                              intent={overdue ? 'danger' : 'accent'}
                            />
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
              <EmptyState variant="inline" title="Sem acções adicionadas" />
            )}
          </div>
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
                      <div className="flex items-center gap-1 font-body text-xs text-ink-muted">
                        <BarChart3 size={13} strokeWidth={1.75} />
                        {goal.successIndicator}
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
                <ProgressBar
                  value={goal.progress}
                  intent={
                    goal.progress >= 100
                      ? 'success'
                      : goal.dueDate &&
                          isOverdue(
                            goal.dueDate,
                            goal.completedAt ? 'COMPLETED' : 'ACTIVE',
                          )
                        ? 'danger'
                        : 'accent'
                  }
                />
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
            <EmptyState variant="inline" title="Sem metas adicionadas" />
          )}
        </div>
      )}

      {/* Checkpoints */}
      {activeTab === 'checkpoints' && (
        <div className="space-y-3">
          {plan.checkpoints?.map((cp) => (
            <Card
              key={cp.id}
              className={
                cp.status === 'COMPLETED' ? 'border-success' : undefined
              }
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
            <EmptyState variant="inline" title="Sem checkpoints agendados" />
          )}
        </div>
      )}

      {/* Diagnóstico (origem, pontos fortes/necessidades, competências, carreira)
          — cartões claros, o mesmo desenho do cartão principal do PDI
          (workshop de inovação.jpeg). */}
      {activeTab === 'diagnosis' && (
        <div className="space-y-4">
          {hasDiagnosis && (
            <DiagnosisCard
              palette={palette}
              icon={FileText}
              title="Diagnóstico"
              badge={
                plan.origin ? (
                  <EventBadge color="#1267B8">
                    {ORIGIN_CFG[plan.origin]}
                  </EventBadge>
                ) : undefined
              }
              rows={[
                ...textLines(plan.originJustification).map((l) => ({
                  icon: FileText,
                  value: l,
                  label: 'Justificação',
                })),
                ...textLines(plan.strengths).map((l) => ({
                  icon: Star,
                  value: l,
                  label: 'Ponto forte',
                })),
                ...textLines(plan.developmentNeeds).map((l) => ({
                  icon: Target,
                  value: l,
                  label: 'Necessidade de desenvolvimento',
                })),
                ...(plan.competencyGaps ?? []).map((g) => ({
                  icon: Layers,
                  value: g.competency?.name ?? `Competência #${g.competencyId}`,
                  label: `Nível ${g.currentLevel ?? '—'} → ${g.targetLevel ?? '—'} · ${GAP_PRIORITY_CFG[g.priority]}`,
                })),
              ]}
            />
          )}
          {plan.careerPlan && (
            <DiagnosisCard
              palette={palette}
              icon={TrendingUp}
              title="Objectivo de carreira associado"
              rows={[
                {
                  icon: TrendingUp,
                  value: plan.careerPlan.title,
                  label:
                    plan.careerPlan.currentRole && plan.careerPlan.targetRole
                      ? `${plan.careerPlan.currentRole.name} → ${plan.careerPlan.targetRole.name}`
                      : '',
                },
                ...(plan.careerReadinessPercent != null
                  ? [
                      {
                        icon: BarChart3,
                        value: `${plan.careerReadinessPercent}%`,
                        label: 'Prontidão actual',
                      },
                    ]
                  : []),
              ]}
            />
          )}
          {!hasDiagnosis && !plan.careerPlan && (
            <div className="rounded-card border border-dashed border-border-strong py-6 text-center font-body text-sm text-ink-faint">
              Sem diagnóstico registado.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

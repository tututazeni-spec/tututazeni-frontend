// components/onboarding/MyPlanView.tsx
// Separador "O meu onboarding" — header do plano, tarefas por fase,
// documentos, equipa de apoio e pesquisa de feedback. Dados próprios +
// apresentação. Extraído de app/(platform)/onboarding/page.tsx.
// Migrado para a fundação de design: Card/Avatar/ProgressBar/Skeleton/
// EmptyState/Badge/Textarea/Button/Tabs substituem os elementos
// bespoke. `ProgressBar` é mono-cor (bg-accent) — a informação de ritmo
// que antes vinha da cor da barra (emerald/blue/amber) passa para um
// texto adjacente, mesmo padrão usado em AnalyticsTab/OverviewTab do
// engagement.

'use client';

import { useState } from 'react';
import { Clapperboard } from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonVariants } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Textarea } from '@/components/ui/Textarea';
import {
  PHASE_LABELS,
  PHASE_ORDER,
  SURVEY_MILESTONES,
  SURVEY_MILESTONE_LABELS,
} from './constants';
import { OnboardingDocUploadForm } from './OnboardingDocUploadForm';
import { TaskCard } from './TaskCard';
import {
  availableSurveyMilestones,
  nextLockedSurveyMilestone,
  resolveActiveMilestone,
} from './utils';
import type {
  DocStatus,
  OnboardingPlan,
  SurveyMilestone,
  TaskInstance,
} from './types';

const SUB_TABS = [
  { id: 'tasks', label: ' Tarefas' },
  { id: 'docs', label: ' Documentos' },
  { id: 'team', label: ' Equipa' },
  { id: 'survey', label: ' Feedback' },
] as const;

const DOC_STATUS_LABEL: Record<DocStatus, string> = {
  APPROVED: '✓ Aprovado',
  REJECTED: '✗ Rejeitado',
  PENDING: 'Pendente',
};

function paceLabel(pct: number): string {
  if (pct >= 100) return 'Concluído';
  if (pct >= 50) return 'Em bom ritmo';
  return 'Início do percurso';
}

export function MyPlanView() {
  const notify = useToast();
  const [surveyScore, setSurveyScore] = useState(0);
  const [surveyComment, setSurveyComment] = useState('');
  // Marco escolhido no Select; '' = usar o mais recente disponível.
  const [milestoneChoice, setMilestoneChoice] = useState<SurveyMilestone | ''>(
    '',
  );
  const [activeTab, setActiveTab] =
    useState<(typeof SUB_TABS)[number]['id']>('tasks');

  const {
    data: plans = [],
    isLoading: loading,
    refetch,
  } = useApiQuery<OnboardingPlan[]>(
    queryKeys.onboarding.my(),
    '/onboarding/my',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const handleComplete = async (taskId: number) => {
    try {
      await apiClient.post('/onboarding/tasks/complete', {
        taskInstanceId: taskId,
      });
      await refetch();
    } catch (e) {
      reportError(e, { source: 'MyPlanView.handleComplete' });
      notify({
        title: e instanceof Error ? e.message : String(e),
        intent: 'danger',
      });
    }
  };

  const surveyMutation = useApiMutation(
    (vars: { planId: number; milestone: SurveyMilestone }) =>
      apiClient.post('/onboarding/surveys', {
        planId: vars.planId,
        milestone: vars.milestone,
        score: surveyScore,
        comment: surveyComment,
      }),
    {
      onSuccess: async () => {
        await refetch();
        setSurveyScore(0);
        setSurveyComment('');
        setMilestoneChoice('');
        notify({
          title: 'Pesquisa submetida! Obrigado pelo feedback.',
          intent: 'success',
        });
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const submittingSurvey = surveyMutation.isPending;
  const handleSurvey = (planId: number, milestone: SurveyMilestone | '') => {
    if (!milestone) return;
    if (!surveyScore) {
      notify({ title: 'Seleccione uma nota', intent: 'danger' });
      return;
    }
    surveyMutation.mutate({ planId, milestone });
  };

  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-3 animate-pulse"
        itemClassName="h-16 bg-surface-sunken rounded-card"
      />
    );
  if (plans.length === 0) {
    return (
      <EmptyState
        title="Sem plano de onboarding"
        description="Ainda não tens nenhum plano de integração atribuído"
      />
    );
  }

  const plan = plans[0];
  const pct = plan.progress ?? 0;

  // Calcular tarefas por fase
  const tasksByPhase: Record<string, TaskInstance[]> = {};
  for (const t of plan.taskInstances) {
    const phase = t.templateTask.phase;
    if (!tasksByPhase[phase]) tasksByPhase[phase] = [];
    tasksByPhase[phase].push(t);
  }

  // Pesquisa de feedback: qual o marco a responder. Ver utils —
  // availableSurveyMilestones / nextLockedSurveyMilestone.
  const answered = plan.surveys.map((s) => s.milestone);
  const answeredCount = new Set(answered).size;
  const availableMilestones = availableSurveyMilestones(
    plan.startDate,
    answered,
  );
  const activeMilestone = resolveActiveMilestone(
    availableMilestones,
    milestoneChoice,
  );
  const nextLockedMilestone = nextLockedSurveyMilestone(
    plan.startDate,
    answered,
  );

  return (
    <div className="space-y-5">
      {/* Welcome */}
      {plan.template.welcomeVideoUrl && (
        <div className="bg-primary text-canvas rounded-card p-5 flex items-center gap-4">
          <Clapperboard size={36} strokeWidth={1.5} className="shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-semibold mb-1">
              Vídeo de boas-vindas
            </div>
            <div className="text-xs opacity-80">
              Assiste ao vídeo de apresentação da empresa
            </div>
          </div>
          <a
            href={plan.template.welcomeVideoUrl}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ intent: 'secondary', size: 'sm' })}
          >
            Assistir
          </a>
        </div>
      )}

      {/* Header */}
      <Card>
        <CardBody>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="text-sm text-ink-faint mb-0.5">
                Plano de integração
              </div>
              <div className="text-xl font-bold text-ink">
                {plan.template.name}
              </div>
              <div className="text-xs text-ink-muted mt-1">
                Início: {fmtDate(plan.startDate)} · {plan.template.durationDays}{' '}
                dias
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold font-mono text-primary">
                {pct}%
              </div>
              <div className="text-xs text-ink-faint">
                {plan.completedTasks}/{plan.totalTasks} tarefas
              </div>
              {plan.xpEarned > 0 && (
                <div className="text-xs text-warning-ink font-medium mt-1">
                  {plan.xpEarned} Ponto de Experiência ganho
                </div>
              )}
            </div>
          </div>
          <ProgressBar value={pct} />
          <div className="mt-1 text-right text-xs text-ink-faint">
            {paceLabel(pct)}
          </div>
        </CardBody>
      </Card>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) =>
          setActiveTab(v as (typeof SUB_TABS)[number]['id'])
        }
      >
        <TabsList>
          {SUB_TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tarefas por fase */}
        <TabsContent value="tasks">
          <div className="space-y-5">
            {PHASE_ORDER.map((phase) => {
              const phaseTasks = tasksByPhase[phase] ?? [];
              if (!phaseTasks.length) return null;
              const phaseCompleted = phaseTasks.filter(
                (t) => t.status === 'COMPLETED',
              ).length;
              return (
                <div key={phase}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
                      {PHASE_LABELS[phase]}
                    </div>
                    <div className="text-xs text-ink-faint">
                      {phaseCompleted}/{phaseTasks.length}
                    </div>
                    <ProgressBar
                      value={
                        phaseTasks.length > 0
                          ? (phaseCompleted / phaseTasks.length) * 100
                          : 0
                      }
                      className="flex-1"
                    />
                  </div>
                  <div className="space-y-2">
                    {phaseTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={handleComplete}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Documentos */}
        <TabsContent value="docs">
          <div className="space-y-3">
            <OnboardingDocUploadForm planId={plan.id} onUploaded={refetch} />

            {plan.documents.map((doc) => (
              <div
                key={doc.id}
                className={`flex items-center gap-4 border rounded-card p-4 ${
                  doc.status === 'APPROVED'
                    ? 'border-success bg-success-subtle'
                    : doc.status === 'REJECTED'
                      ? 'border-danger bg-danger-subtle'
                      : 'border-border bg-surface'
                }`}
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-ink">
                    {doc.documentType}
                  </div>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    Abrir documento
                  </a>
                  {doc.rejectionReason && (
                    <div className="text-xs text-danger-ink mt-0.5">
                      Motivo: {doc.rejectionReason}
                    </div>
                  )}
                </div>
                <Badge
                  intent={
                    doc.status === 'APPROVED'
                      ? 'success'
                      : doc.status === 'REJECTED'
                        ? 'danger'
                        : 'warning'
                  }
                >
                  {DOC_STATUS_LABEL[doc.status]}
                </Badge>
              </div>
            ))}
            {plan.documents.length === 0 && (
              <p className="px-1 py-2 text-xs text-ink-faint">
                Ainda não submeteu documentos.
              </p>
            )}
          </div>
        </TabsContent>

        {/* Equipa de apoio */}
        <TabsContent value="team">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Gestor directo', person: plan.manager },
              { label: 'Amigável / Mentor', person: plan.buddy },
              { label: 'RH Responsável', person: plan.hrResponsible },
            ].map(({ label, person }) => (
              <Card key={label} className="p-5 text-center">
                <div className="text-xs text-ink-faint mb-3">{label}</div>
                {person ? (
                  <div className="flex flex-col items-center gap-2">
                    <Avatar
                      name={person.fullName}
                      url={person.avatarUrl ?? undefined}
                      size="lg"
                    />
                    <div className="text-sm font-medium text-ink">
                      {person.fullName}
                    </div>
                    {person.position && (
                      <div className="text-xs text-ink-faint">
                        {person.position.name}
                      </div>
                    )}
                    {person.email && (
                      <a
                        href={`mailto:${person.email}?subject=${encodeURIComponent(
                          `Onboarding — ${plan.template.name}`,
                        )}`}
                        className="text-xs text-primary hover:underline mt-1"
                      >
                        Enviar mensagem
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-ink-faint mt-4">
                    Não atribuído
                  </div>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Pesquisa de feedback */}
        <TabsContent value="survey">
          <div className="space-y-4">
            {/* Pesquisas anteriores */}
            {plan.surveys.length > 0 && (
              <Card className="p-4">
                <div className="text-xs font-medium text-ink-muted mb-3">
                  Feedbacks anteriores
                </div>
                {plan.surveys.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                  >
                    <Badge intent="info">
                      {SURVEY_MILESTONE_LABELS[s.milestone] ?? s.milestone}
                    </Badge>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${i < s.score ? 'text-accent' : 'text-border-strong'}`}
                        ></span>
                      ))}
                    </div>
                    {s.comment && (
                      <p className="text-xs text-ink-muted truncate">
                        {s.comment}
                      </p>
                    )}
                  </div>
                ))}
              </Card>
            )}

            {/* Nova pesquisa */}
            {availableMilestones.length > 0 ? (
              <Card>
                <CardBody>
                  <div className="text-sm font-semibold text-ink mb-4">
                    Como está a ser a tua experiência?
                  </div>

                  {availableMilestones.length > 1 && (
                    <div className="mb-4">
                      <div className="text-xs text-ink-faint mb-1">Marco</div>
                      <Select
                        items={availableMilestones.map((m) => ({
                          value: m.id,
                          label: m.label,
                        }))}
                        value={activeMilestone || undefined}
                        onValueChange={(v) =>
                          setMilestoneChoice(v as SurveyMilestone)
                        }
                        className="w-full"
                      />
                    </div>
                  )}

                  <div className="flex gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSurveyScore(s)}
                        className={`text-3xl transition-transform hover:scale-110 ${s <= surveyScore ? 'text-accent' : 'text-border-strong'}`}
                      ></button>
                    ))}
                  </div>
                  <Textarea
                    value={surveyComment}
                    onChange={(e) => setSurveyComment(e.target.value)}
                    rows={3}
                    placeholder="Comentário opcional…"
                    className="w-full resize-none mb-3"
                  />
                  <Button
                    onClick={() => handleSurvey(plan.id, activeMilestone)}
                    disabled={
                      !surveyScore || !activeMilestone || submittingSurvey
                    }
                    loading={submittingSurvey}
                    className="w-full"
                  >
                    {submittingSurvey ? 'A submeter…' : 'Enviar feedback'}
                  </Button>
                </CardBody>
              </Card>
            ) : (
              <Card>
                <CardBody>
                  <p className="text-sm text-ink-muted">
                    {answeredCount >= SURVEY_MILESTONES.length
                      ? 'Já respondeste a todas as pesquisas de satisfação.'
                      : nextLockedMilestone
                        ? `A próxima pesquisa (${nextLockedMilestone.label}) abre ao fim de ${nextLockedMilestone.day} dias de plano.`
                        : 'Sem pesquisas pendentes de momento.'}
                  </p>
                </CardBody>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

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

import { useState, type ReactNode } from 'react';
import {
  ClipboardList,
  Clapperboard,
  ShieldCheck,
  Star,
  User,
  Users,
} from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { Button, buttonVariants } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProfileRoiCard } from '@/components/ui/ProfileRoiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { PeriodPills } from '@/components/ui/Pills';
import { Textarea } from '@/components/ui/Textarea';
import {
  PHASE_LABELS,
  PHASE_ORDER,
  SURVEY_MILESTONES,
  SURVEY_MILESTONE_LABELS,
} from './constants';
import { DocumentLink } from './DocumentLink';
import { OnboardingDocUploadForm } from './OnboardingDocUploadForm';
import { TaskCard } from './TaskCard';
import { AssignTeamMemberModal } from './AssignTeamMemberModal';
import { TeamMemberCard, type TeamRole } from './TeamMemberCard';
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
import { safeHref } from '@/lib/safeHref';
import { cn } from '@/lib/cn';

const SUB_TABS = [
  { id: 'tasks', label: ' Tarefas' },
  { id: 'docs', label: ' Documentos' },
  { id: 'team', label: ' Equipa' },
  { id: 'survey', label: ' Feedback' },
] as const;

const DOC_STATUS_LABEL: Record<DocStatus, string> = {
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  PENDING: 'Pendente',
};

// Mesma grelha no cabeçalho e nas linhas (desenho da lista de Avaliados).
const DOC_GRID =
  'grid grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)] items-center gap-x-8 px-4';

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-brand-line bg-surface p-5 shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
      <h4 className="-mx-5 -mt-5 mb-4 bg-brand-dark px-5 py-3 font-body text-xs font-semibold uppercase tracking-wider text-white">
        {title}
      </h4>
      {children}
    </div>
  );
}

function paceLabel(pct: number): string {
  if (pct >= 100) return 'Concluído';
  if (pct >= 50) return 'Em bom ritmo';
  return 'Início do percurso';
}

export function MyPlanView() {
  const notify = useToast();
  const { data: me } = useCurrentUser();
  const [assigning, setAssigning] = useState<{
    role: TeamRole;
    label: string;
    hasPerson: boolean;
  } | null>(null);
  // PATCH /onboarding/:id/team é só ADMIN/RH.
  const canAssignTeam = me?.role?.code === 'ADMIN' || me?.role?.code === 'RH';
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
  // /onboarding/my não devolve `user` — o plano é sempre o do próprio.
  const owner = plan.user ?? me;

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
            href={safeHref(plan.template.welcomeVideoUrl)}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ intent: 'secondary', size: 'sm' })}
          >
            Assistir
          </a>
        </div>
      )}

      {/* Header — mesmo desenho do cartão da Visão Geral do evaluation360 */}
      <ProfileRoiCard
        kicker="Plano de integração"
        kickerIcon={ClipboardList}
        name={owner?.fullName ?? '—'}
        avatarUrl={owner?.avatarUrl}
        subtitle={plan.template.name}
        stats={[
          { label: 'Cargo', value: owner?.position?.name || '—' },
          { label: 'Departamento', value: owner?.department?.name || '—' },
          { label: 'Início', value: fmtDate(plan.startDate) },
          {
            label: 'Tarefas',
            value: `${plan.completedTasks ?? 0}/${plan.totalTasks ?? 0}`,
          },
        ]}
        note={`${paceLabel(pct)} · ${pct}% do plano concluído · ${plan.template.durationDays} dias${
          plan.xpEarned > 0 ? ` · ${plan.xpEarned} XP` : ''
        }`}
      />

      {/* Tabs */}
      <PeriodPills
        label="O meu plano"
        value={activeTab}
        onChange={setActiveTab}
        options={SUB_TABS.map((t) => ({ value: t.id, label: t.label.trim() }))}
      />

      {/* Tarefas por fase */}
      {activeTab === 'tasks' && (
        <SectionCard title="Tarefas">
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
        </SectionCard>
      )}

      {/* Documentos — lista no desenho da lista de Avaliados (evaluation360) */}
      {activeTab === 'docs' && (
        <div className="space-y-5">
          <OnboardingDocUploadForm planId={plan.id} onUploaded={refetch} />

          {plan.documents.length === 0 ? (
            <div className="overflow-hidden rounded-[24px] border border-brand-line bg-surface p-5 shadow-[0_8px_24px_rgba(21,47,89,0.10)] font-body text-sm text-brand">
              <h3 className="-mx-5 -mt-5 mb-3 bg-brand-dark px-5 py-3 font-body text-xs font-semibold uppercase tracking-wider text-white">
                Documentos
              </h3>
              Ainda não submeteste documentos.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <h2 className="m-0 text-lg font-bold text-ink">
                Documentos submetidos
              </h2>
              <div className="overflow-hidden rounded-[24px] border border-brand-line bg-surface shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
                <div
                  className={cn(
                    DOC_GRID,
                    'bg-brand-dark py-3 text-xs font-semibold uppercase tracking-wider text-white',
                  )}
                >
                  <div>Documento</div>
                  <div>Ficheiro</div>
                  <div>Submetido</div>
                  <div>Estado</div>
                  <div>Motivo</div>
                </div>
                {plan.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={cn(
                      DOC_GRID,
                      'border-b border-brand-line bg-surface py-3 font-body text-sm text-ink-muted last:border-0 hover:bg-surface-sunken',
                    )}
                  >
                    <div className="break-words font-semibold text-ink">
                      {doc.documentType}
                    </div>
                    <div>
                      <DocumentLink
                        fileUrl={doc.fileUrl}
                        className="text-sm font-semibold text-ink hover:underline"
                      />
                    </div>
                    <div>{doc.createdAt ? fmtDate(doc.createdAt) : '—'}</div>
                    <div>
                      <span className="text-xs font-bold text-ink">
                        {DOC_STATUS_LABEL[doc.status]}
                      </span>
                    </div>
                    <div className="break-words">
                      {doc.rejectionReason ?? '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Equipa de apoio */}
      {activeTab === 'team' && (
        <SectionCard title="Equipa de apoio">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              {
                role: 'manager' as const,
                label: 'Gestor directo',
                person: plan.manager,
                icon: User,
              },
              {
                role: 'buddy' as const,
                label: 'Buddy / Mentor',
                person: plan.buddy,
                icon: Users,
              },
              {
                role: 'hr' as const,
                label: 'RH responsável',
                person: plan.hrResponsible,
                icon: ShieldCheck,
              },
            ].map(({ role, label, person, icon }) => (
              <TeamMemberCard
                key={label}
                label={label}
                person={person}
                icon={icon}
                mailSubject={`Onboarding — ${plan.template.name}`}
                onAssign={
                  canAssignTeam
                    ? () => setAssigning({ role, label, hasPerson: !!person })
                    : undefined
                }
              />
            ))}
          </div>
        </SectionCard>
      )}
      {assigning && (
        <AssignTeamMemberModal
          planId={plan.id}
          role={assigning.role}
          label={assigning.label}
          hasPerson={assigning.hasPerson}
          onClose={() => setAssigning(null)}
        />
      )}

      {/* Pesquisa de feedback */}
      {activeTab === 'survey' && (
        <SectionCard title="Feedback">
          <div className="space-y-4">
            {/* Pesquisas anteriores */}
            {plan.surveys.length > 0 && (
              <div className="overflow-hidden rounded-[24px] border border-brand-line bg-surface shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
                {/* Cabeçalho — desenho do Feedback Contínuo, tamanho do Submeter documento */}
                <div className="relative flex items-center gap-3 overflow-hidden bg-brand-dark px-4 py-3 text-white">
                  <Star
                    size={16}
                    strokeWidth={1.75}
                    className="relative z-10 shrink-0 text-white"
                  />
                  <span
                    className="relative z-10 h-4 w-px bg-white/40"
                    aria-hidden="true"
                  />
                  <h3 className="relative z-10 m-0 font-body text-xs font-semibold uppercase tracking-wider text-white">
                    Feedbacks anteriores
                  </h3>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 200 80"
                    preserveAspectRatio="none"
                    className="pointer-events-none absolute right-0 top-0 h-full w-[22%]"
                  >
                    <defs>
                      <linearGradient
                        id="prev-fb-swoosh"
                        x1="0"
                        y1="1"
                        x2="1"
                        y2="0"
                      >
                        <stop offset="0%" stopColor="#16a34a" />
                        <stop offset="100%" stopColor="#4ade80" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M200 0v52C170 66 120 72 70 76 130 56 150 24 160 0z"
                      fill="url(#prev-fb-swoosh)"
                    />
                  </svg>
                </div>
                <ul className="m-0 list-none divide-y divide-border p-0">
                  {plan.surveys.map((s) => (
                    <li
                      key={s.id}
                      className="flex flex-wrap items-center gap-x-4 gap-y-1 px-6 py-3"
                    >
                      <span
                        className="rounded-full py-0.5 pl-3.5 pr-3 font-body text-xs font-bold"
                        style={{
                          background: '#dbeafe',
                          color: '#17408a',
                          boxShadow: 'inset 6px 0 0 #60a5fa',
                        }}
                      >
                        {SURVEY_MILESTONE_LABELS[s.milestone] ?? s.milestone}
                      </span>
                      <span className="h-4 w-px bg-ink/30" aria-hidden="true" />
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <span
                            key={i}
                            className={`text-sm ${i < s.score ? 'text-accent' : 'text-border-strong'}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      {s.comment && (
                        <p className="m-0 min-w-0 flex-1 truncate font-display text-base text-brand-dark">
                          {s.comment}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
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
                        type="button"
                        aria-label={`Nota ${s} de 5`}
                        className={`text-3xl transition-transform hover:scale-110 ${s <= surveyScore ? 'text-accent' : 'text-border-strong'}`}
                      >
                        ★
                      </button>
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
              <div className="overflow-hidden rounded-[24px] border border-brand-line bg-surface p-5 shadow-[0_8px_24px_rgba(21,47,89,0.10)] font-body text-sm text-brand">
                <h3 className="-mx-5 -mt-5 mb-3 bg-brand-dark px-5 py-3 font-body text-xs font-semibold uppercase tracking-wider text-white">
                  Pesquisas de satisfação
                </h3>
                {answeredCount >= SURVEY_MILESTONES.length
                  ? 'Já respondeste a todas as pesquisas de satisfação.'
                  : nextLockedMilestone
                    ? `A próxima pesquisa (${nextLockedMilestone.label}) abre ao fim de ${nextLockedMilestone.day} dias de plano.`
                    : 'Sem pesquisas pendentes de momento.'}
              </div>
            )}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

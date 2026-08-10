// components/onboarding/MyPlanView.tsx
// Separador "O meu onboarding" — header do plano, tarefas por fase,
// documentos, equipa de apoio e pesquisa de feedback. Dados próprios +
// apresentação. Extraído de app/(platform)/onboarding/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { Avatar, ProgressBar, Skeleton } from './atoms';
import { PHASE_LABELS, PHASE_ORDER } from './constants';
import { TaskCard } from './TaskCard';
import type { OnboardingPlan, TaskInstance } from './types';

export function MyPlanView() {
  const [surveyScore, setSurveyScore] = useState(0);
  const [surveyComment, setSurveyComment] = useState('');
  const [activeTab, setActiveTab] = useState<
    'tasks' | 'docs' | 'team' | 'survey'
  >('tasks');

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
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const surveyMutation = useApiMutation(
    (planId: number) =>
      apiClient.post('/onboarding/surveys', {
        planId,
        milestone: 'DAY_1',
        score: surveyScore,
        comment: surveyComment,
      }),
    {
      onSuccess: async () => {
        await refetch();
        setSurveyScore(0);
        setSurveyComment('');
        alert('Pesquisa submetida! Obrigado pelo feedback.');
      },
      onError: (e) => alert(e.message),
    },
  );
  const submittingSurvey = surveyMutation.isPending;
  const handleSurvey = (planId: number) => {
    if (!surveyScore) {
      alert('Seleccione uma nota');
      return;
    }
    surveyMutation.mutate(planId);
  };

  if (loading) return <Skeleton />;
  if (plans.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
        <div className="text-4xl mb-3">🎉</div>
        Sem plano de onboarding atribuído ainda
      </div>
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

  return (
    <div className="space-y-5">
      {/* Welcome */}
      {plan.template.welcomeVideoUrl && (
        <div className="bg-blue-700 text-white rounded-xl p-5 flex items-center gap-4">
          <div className="text-4xl">🎬</div>
          <div className="flex-1">
            <div className="text-sm font-semibold mb-1">
              Vídeo de boas-vindas
            </div>
            <div className="text-xs text-blue-200">
              Assiste ao vídeo de apresentação da empresa
            </div>
          </div>
          <a
            href={plan.template.welcomeVideoUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-white text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-50"
          >
            Assistir
          </a>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-400 mb-0.5">
              Plano de integração
            </div>
            <div className="text-xl font-bold text-gray-900">
              {plan.template.name}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Início: {fmtDate(plan.startDate)} · {plan.template.durationDays}{' '}
              dias
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold font-mono text-blue-700">
              {pct}%
            </div>
            <div className="text-xs text-gray-400">
              {plan.completedTasks}/{plan.totalTasks} tarefas
            </div>
            {plan.xpEarned > 0 && (
              <div className="text-xs text-amber-600 font-medium mt-1">
                ⚡ {plan.xpEarned} XP ganho
              </div>
            )}
          </div>
        </div>
        <ProgressBar
          pct={pct}
          color={
            pct >= 100
              ? 'bg-emerald-500'
              : pct >= 50
                ? 'bg-blue-500'
                : 'bg-amber-500'
          }
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['tasks', 'docs', 'team', 'survey'] as const).map((t) => (
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
                tasks: '✅ Tarefas',
                docs: '📄 Documentos',
                team: '👥 Equipa',
                survey: '💬 Feedback',
              }[t]
            }
          </button>
        ))}
      </div>

      {/* Tarefas por fase */}
      {activeTab === 'tasks' && (
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
                  <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    {PHASE_LABELS[phase]}
                  </div>
                  <div className="text-xs text-gray-400">
                    {phaseCompleted}/{phaseTasks.length}
                  </div>
                  <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-400 rounded-full"
                      style={{
                        width: `${phaseTasks.length > 0 ? (phaseCompleted / phaseTasks.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
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
      )}

      {/* Documentos */}
      {activeTab === 'docs' && (
        <div className="space-y-3">
          {plan.documents.map((doc) => (
            <div
              key={doc.id}
              className={`flex items-center gap-4 border rounded-xl p-4 ${
                doc.status === 'APPROVED'
                  ? 'border-emerald-200 bg-emerald-50'
                  : doc.status === 'REJECTED'
                    ? 'border-red-200 bg-red-50'
                    : 'border-gray-200 bg-white'
              }`}
            >
              <div className="text-2xl">📄</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {doc.documentType}
                </div>
                {doc.rejectionReason && (
                  <div className="text-xs text-red-600 mt-0.5">
                    Motivo: {doc.rejectionReason}
                  </div>
                )}
              </div>
              <div
                className={`text-xs font-medium px-2 py-0.5 rounded ${
                  doc.status === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : doc.status === 'REJECTED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                }`}
              >
                {
                  {
                    APPROVED: '✓ Aprovado',
                    REJECTED: '✗ Rejeitado',
                    PENDING: '⏳ Pendente',
                  }[doc.status]
                }
              </div>
            </div>
          ))}
          {plan.documents.length === 0 && (
            <div className="py-8 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Sem documentos submetidos
            </div>
          )}
        </div>
      )}

      {/* Equipa de apoio */}
      {activeTab === 'team' && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Gestor directo', person: plan.manager },
            { label: 'Buddy / Mentor', person: plan.buddy },
            { label: 'RH Responsável', person: plan.hrResponsible },
          ].map(({ label, person }) => (
            <div
              key={label}
              className="bg-white border border-gray-200 rounded-xl p-5 text-center"
            >
              <div className="text-xs text-gray-400 mb-3">{label}</div>
              {person ? (
                <div className="flex flex-col items-center gap-2">
                  <Avatar
                    name={person.fullName}
                    avatarUrl={person.avatarUrl}
                    size="lg"
                  />
                  <div className="text-sm font-medium text-gray-900">
                    {person.fullName}
                  </div>
                  {person.position && (
                    <div className="text-xs text-gray-400">
                      {person.position.name}
                    </div>
                  )}
                  <button className="text-xs text-blue-600 hover:underline mt-1">
                    💬 Enviar mensagem
                  </button>
                </div>
              ) : (
                <div className="text-xs text-gray-300 mt-4">Não atribuído</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pesquisa de feedback */}
      {activeTab === 'survey' && (
        <div className="space-y-4">
          {/* Pesquisas anteriores */}
          {plan.surveys.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs font-medium text-gray-600 mb-3">
                Feedbacks anteriores
              </div>
              {plan.surveys.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0"
                >
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                    {s.milestone}
                  </span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span
                        key={i}
                        className={`text-sm ${i < s.score ? 'text-amber-400' : 'text-gray-200'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  {s.comment && (
                    <p className="text-xs text-gray-500 truncate">
                      {s.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Nova pesquisa */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-sm font-semibold text-gray-900 mb-4">
              Como está a ser a tua experiência?
            </div>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setSurveyScore(s)}
                  className={`text-3xl transition-transform hover:scale-110 ${s <= surveyScore ? 'text-amber-400' : 'text-gray-200'}`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={surveyComment}
              onChange={(e) => setSurveyComment(e.target.value)}
              rows={3}
              placeholder="Comentário opcional…"
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />
            <button
              onClick={() => handleSurvey(plan.id)}
              disabled={!surveyScore || submittingSurvey}
              className="w-full py-2.5 bg-blue-700 text-white text-sm font-medium rounded-xl hover:bg-blue-800 disabled:opacity-50"
            >
              {submittingSurvey ? 'A submeter…' : 'Enviar feedback'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

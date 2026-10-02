// components/avatar-training/RoomTab.tsx
// Sala de Formação Virtual (docs/Avatar_Training.md §5). O formando vê as suas
// sessões atribuídas e entra na sala: interacção por texto (sempre disponível),
// pausar/retomar, perguntas, ajuda do AI-Tutor e conclusão. O interlocutor é
// sempre identificado como instrutor virtual.

'use client';

import { useState } from 'react';
import { Bot, Pause, Play, Send } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate } from '@/lib/format';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Textarea } from '@/components/ui/Textarea';
import { ASSIGNMENT_STATUS, EXPERIENCE_LABEL } from './constants';
import type { CompleteResult, MyAssignment, Room, RoomStep } from './types';

const BUBBLE: Record<string, string> = {
  AVATAR_MESSAGE: 'bg-primary-subtle text-ink self-start',
  FEEDBACK: 'bg-info-subtle text-info-ink self-start',
  USER_MESSAGE: 'bg-surface-sunken text-ink self-end',
  USER_ANSWER: 'bg-surface-sunken text-ink self-end',
  HELP_REQUEST: 'bg-surface-sunken text-ink self-end',
};

function StepPanel({
  step,
  disabled,
  onAnswer,
  onAdvance,
}: {
  step: RoomStep;
  disabled: boolean;
  onAnswer: (answer: string) => void;
  onAdvance: () => void;
}) {
  const [text, setText] = useState('');
  const q = step.question;
  const options =
    q?.kind === 'TRUE_FALSE' ? ['Verdadeiro', 'Falso'] : (q?.options ?? []);

  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <h3 className="font-display text-base font-semibold text-ink">
        {step.title}
      </h3>
      {step.content && (
        <p className="mt-2 whitespace-pre-wrap font-body text-sm text-ink-muted">
          {step.content}
        </p>
      )}
      {step.resourceUrl && (
        <a
          href={step.resourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block font-body text-sm text-primary underline"
        >
          Abrir recurso
        </a>
      )}
      {q ? (
        <div className="mt-3 space-y-2">
          {q.prompt && (
            <p className="font-body text-sm font-medium text-ink">{q.prompt}</p>
          )}
          {options.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {options.map((o) => (
                <Button
                  key={o}
                  size="sm"
                  intent="secondary"
                  disabled={disabled}
                  onClick={() => onAnswer(o)}
                >
                  {o}
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex gap-2">
              <Textarea
                rows={2}
                value={text}
                disabled={disabled}
                onChange={(e) => setText(e.target.value)}
                aria-label="A sua resposta"
              />
              <Button
                size="sm"
                disabled={disabled || !text.trim()}
                onClick={() => {
                  onAnswer(text.trim());
                  setText('');
                }}
              >
                <Send size={14} /> Responder
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Button
          className="mt-3"
          size="sm"
          disabled={disabled}
          onClick={onAdvance}
        >
          Continuar
        </Button>
      )}
    </div>
  );
}

function RoomView({
  attemptId,
  onExit,
}: {
  attemptId: number;
  onExit: () => void;
}) {
  const notify = useToast();
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<CompleteResult | null>(null);
  const key = queryKeys.avatarTraining.room(attemptId);
  const base = `/avatar-training/attempts/${attemptId}`;

  const {
    data: room,
    error,
    refetch,
  } = useApiQuery<Room>(key, `${base}/room`, { staleTime: 0 });

  const onError = (e: Error) =>
    notify({
      title: 'Não foi possível concluir a acção',
      description: e.message,
      intent: 'danger',
    });

  const record = useApiMutation(
    (v: { interactionType: string; content: string; stepKey?: string }) =>
      apiClient.post(`${base}/interactions`, v),
    { invalidateKeys: [key], onError },
  );
  const pause = useApiMutation(() => apiClient.post(`${base}/pause`), {
    invalidateKeys: [key],
    onError,
  });
  const resume = useApiMutation(() => apiClient.post(`${base}/resume`), {
    invalidateKeys: [key],
    onError,
  });
  const ask = useApiMutation(
    (q: string) =>
      apiClient.post(`${base}/tutor`, {
        question: q,
        stepKey: room?.currentStep?.key,
      }),
    {
      invalidateKeys: [key],
      // Falha do AI-Tutor nunca bloqueia a sessão — a sala continua por texto.
      onError: () =>
        notify({
          title: 'Tutor indisponível',
          description: 'Pode continuar a sessão; peça ajuda a um formador.',
          intent: 'info',
        }),
    },
  );
  const complete = useApiMutation(
    () => apiClient.post<CompleteResult>(`${base}/complete`),
    {
      invalidateKeys: [key, queryKeys.avatarTraining.myAssignments()],
      onSuccess: (r) => setResult(r),
      onError,
    },
  );

  if (error) return <QueryError error={error} onRetry={() => refetch()} />;
  if (!room)
    return (
      <Skeleton
        rows={3}
        itemClassName="h-24 rounded-card bg-surface-sunken animate-pulse"
      />
    );

  const paused = room.attempt.status === 'PAUSED';
  const open = room.attempt.status === 'IN_PROGRESS' || paused;
  const allDone = open && !room.currentStep;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">
            {room.session.title}
          </h2>
          <p className="font-body text-xs text-ink-muted">
            {room.session.program.title}
          </p>
        </div>
        <Button size="sm" intent="ghost" onClick={onExit}>
          Voltar às sessões
        </Button>
      </div>

      <div
        role="note"
        className="flex items-center gap-2 rounded-card border border-border bg-surface px-3 py-2 font-body text-xs text-ink-muted"
      >
        <Bot size={14} /> {room.notice} A interacção por texto está sempre
        disponível.
      </div>

      <ProgressBar value={room.attempt.progress} />

      {result && (
        <div className="rounded-card border border-border bg-surface p-4 font-body text-sm">
          <p className="font-medium text-ink">
            {result.passed === null
              ? 'Sessão concluída.'
              : result.passed
                ? 'Aprovado.'
                : 'Não atingiu a nota mínima.'}
          </p>
          {result.score !== null && (
            <p className="text-ink-muted">
              Nota: {result.score}
              {result.passingScore !== null &&
                ` (mínimo ${result.passingScore})`}
            </p>
          )}
          <p className="mt-1 text-xs text-ink-faint">
            Concluir a sessão não conclui automaticamente o curso.
          </p>
        </div>
      )}

      <div
        className="flex max-h-80 flex-col gap-2 overflow-y-auto rounded-card border border-border bg-canvas p-3"
        aria-live="polite"
      >
        {room.interactions
          .filter((i) => BUBBLE[i.interactionType])
          .map((i) => (
            <div
              key={i.id}
              className={`max-w-[85%] whitespace-pre-wrap rounded-card px-3 py-2 font-body text-sm ${BUBBLE[i.interactionType]}`}
            >
              {i.content}
            </div>
          ))}
      </div>

      {open && room.currentStep && (
        <StepPanel
          key={room.currentStep.key}
          step={room.currentStep}
          disabled={paused || record.isPending}
          onAnswer={(a) =>
            record.mutate({
              interactionType: 'USER_ANSWER',
              content: a,
              stepKey: room.currentStep?.key,
            })
          }
          onAdvance={() =>
            record.mutate({
              interactionType: 'STEP_ADVANCE',
              content: 'Continuar',
              stepKey: room.currentStep?.key,
            })
          }
        />
      )}

      {open && (
        <div className="flex gap-2">
          <Textarea
            rows={2}
            value={question}
            disabled={paused}
            placeholder="Pergunte ao instrutor virtual (responde só com fontes aprovadas)"
            onChange={(e) => setQuestion(e.target.value)}
            aria-label="Pergunta ao instrutor virtual"
          />
          <Button
            size="sm"
            loading={ask.isPending}
            disabled={paused || !question.trim()}
            onClick={() => {
              ask.mutate(question.trim());
              setQuestion('');
            }}
          >
            <Send size={14} /> Perguntar
          </Button>
        </div>
      )}

      {open && (
        <div className="flex flex-wrap gap-2">
          {paused ? (
            <Button
              size="sm"
              intent="secondary"
              onClick={() => resume.mutate(undefined)}
            >
              <Play size={14} /> Retomar
            </Button>
          ) : (
            <Button
              size="sm"
              intent="secondary"
              onClick={() => pause.mutate(undefined)}
            >
              <Pause size={14} /> Pausar
            </Button>
          )}
          <Button
            size="sm"
            intent={allDone ? 'primary' : 'ghost'}
            loading={complete.isPending}
            disabled={paused}
            onClick={() => complete.mutate(undefined)}
          >
            Concluir sessão
          </Button>
        </div>
      )}
    </div>
  );
}

export function RoomTab() {
  const notify = useToast();
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const { data, isLoading, error, refetch } = useApiQuery<MyAssignment[]>(
    queryKeys.avatarTraining.myAssignments(),
    '/avatar-training/my/assignments',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const start = useApiMutation(
    (sessionId: number) =>
      apiClient.post<Room>(`/avatar-training/sessions/${sessionId}/start`, {
        textOnly: true,
      }),
    {
      onSuccess: (room) => setAttemptId(room.attempt.id),
      onError: (e) =>
        notify({
          title: 'Não foi possível iniciar a sessão',
          description: e.message,
          intent: 'danger',
        }),
    },
  );

  if (attemptId !== null)
    return <RoomView attemptId={attemptId} onExit={() => setAttemptId(null)} />;
  if (error) return <QueryError error={error} onRetry={() => refetch()} />;
  if (isLoading || !data)
    return (
      <Skeleton
        rows={3}
        itemClassName="h-20 rounded-card bg-surface-sunken animate-pulse"
      />
    );
  if (data.length === 0)
    return (
      <EmptyState
        icon={Bot}
        title="Sem sessões atribuídas"
        description="Quando lhe for atribuída uma formação com avatar, ela aparece aqui."
      />
    );

  return (
    <div className="space-y-3">
      {data.map((a) => {
        const last = a.attempts[0];
        const done = a.status === 'COMPLETED';
        const resuming =
          last && (last.status === 'IN_PROGRESS' || last.status === 'PAUSED');
        return (
          <div
            key={a.id}
            className="flex items-center justify-between gap-4 rounded-card border border-border bg-surface p-4"
          >
            <div className="min-w-0">
              <div className="truncate font-display text-sm font-semibold text-ink">
                {a.session.title}
              </div>
              <div className="font-body text-xs text-ink-muted">
                {a.session.program.title} ·{' '}
                {EXPERIENCE_LABEL[a.session.experienceType]}
                {a.session.durationMinutes
                  ? ` · ${a.session.durationMinutes} min`
                  : ''}
                {a.dueDate ? ` · prazo ${formatDate(a.dueDate)}` : ''}
                {a.mandatory ? ' · obrigatória' : ''}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <StatusBadge
                value={a.status}
                map={ASSIGNMENT_STATUS}
                variant="dot"
              />
              {last?.score != null && (
                <span className="font-mono text-xs text-ink-muted">
                  {last.score}
                </span>
              )}
              {!done && (
                <Button
                  size="sm"
                  loading={start.isPending && start.variables === a.sessionId}
                  onClick={() => start.mutate(a.sessionId)}
                >
                  {resuming ? 'Retomar' : 'Iniciar'}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

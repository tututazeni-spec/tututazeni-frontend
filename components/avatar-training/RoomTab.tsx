// components/avatar-training/RoomTab.tsx
// Sala de Formação Virtual (docs/Avatar_Training.md §5). O formando vê as suas
// sessões atribuídas e entra na sala: avatar com imagem e animação sincronizada
// com a voz, interacção por texto (sempre disponível) e opcionalmente por voz
// sintetizada e microfone, legendas, recursos aprovados, pausar/retomar, repetir
// a explicação, ajuda do AI-Tutor ou de um formador humano, e conclusão. O
// interlocutor é sempre identificado como instrutor virtual.

'use client';

import { useEffect, useState } from 'react';
import {
  Bot,
  HelpCircle,
  Mic,
  Pause,
  Play,
  RefreshCw,
  Send,
  Square,
  Volume2,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate } from '@/lib/format';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Textarea } from '@/components/ui/Textarea';
import { ASSIGNMENT_STATUS, EXPERIENCE_LABEL } from './constants';
import { useDictation, useRoomVoice, type RoomVoice } from './useRoomVoice';
import type {
  CertificateRequestResult,
  CertificationStatus,
  CompleteResult,
  FailureReinforcement,
  ExperienceType,
  MyAssignment,
  Room,
  RoomStep,
  StepReinforcementPayload,
} from './types';

const BUBBLE: Record<string, string> = {
  AVATAR_MESSAGE: 'bg-primary-subtle text-ink self-start',
  FEEDBACK: 'bg-info-subtle text-info-ink self-start',
  USER_MESSAGE: 'bg-surface-sunken text-ink self-end',
  USER_ANSWER: 'bg-surface-sunken text-ink self-end',
  HELP_REQUEST: 'bg-surface-sunken text-ink self-end',
};

/** Reforço após uma resposta errada (§7): mensagem, etapa a rever e conteúdo complementar. */
function ReinforcementNote({ reinforcement }: { reinforcement: StepReinforcementPayload }) {
  return (
    <div className="mt-2 space-y-1 border-t border-border pt-2 text-xs">
      {reinforcement.message && <p>{reinforcement.message}</p>}
      {reinforcement.reviewStepTitle && <p>Reveja a etapa «{reinforcement.reviewStepTitle}».</p>}
      {reinforcement.resourceUrl && (
        <a
          href={reinforcement.resourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Abrir conteúdo complementar
        </a>
      )}
      {reinforcement.retry && (
        <p className="font-medium">
          Tente de novo para avançar ({reinforcement.retriesLeft}{' '}
          {reinforcement.retriesLeft === 1 ? 'tentativa restante' : 'tentativas restantes'}).
        </p>
      )}
    </div>
  );
}

/** Conteúdo complementar quando a nota fica abaixo da mínima. */
function FailureReinforcementNote({ data }: { data: FailureReinforcement }) {
  return (
    <div className="mt-2 space-y-1 rounded-card bg-surface-sunken p-3 text-xs text-ink">
      {data.message && <p>{data.message}</p>}
      {data.weakSteps.length > 0 && (
        <div>
          <p className="font-medium">Etapas a reforçar:</p>
          <ul className="list-disc pl-4">
            {data.weakSteps.map((w) => (
              <li key={w.stepKey}>
                {w.title}
                {w.message ? ` — ${w.message}` : ''}
                {w.resourceUrl && (
                  <>
                    {' '}
                    <a
                      href={w.resourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      conteúdo
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.resourceUrl && (
        <a
          href={data.resourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Abrir conteúdo complementar
        </a>
      )}
      {data.recommendSessionId && (
        <p>Sessão complementar recomendada (id {data.recommendSessionId}).</p>
      )}
    </div>
  );
}

const IMAGE_RE = /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i;
const VIDEO_RE = /\.(mp4|webm|ogg)(\?.*)?$/i;
const PDF_RE = /\.pdf(\?.*)?$/i;

/** Slide, imagem, vídeo ou documento aprovado associado à etapa. */
function ResourceView({ url, title }: { url: string; title: string }) {
  if (IMAGE_RE.test(url))
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={`Recurso da etapa: ${title}`}
        className="mt-3 max-h-72 w-full rounded-card border border-border object-contain"
      />
    );
  if (VIDEO_RE.test(url))
    return (
      <video
        src={url}
        controls
        aria-label={`Vídeo da etapa: ${title}`}
        className="mt-3 max-h-72 w-full rounded-card border border-border"
      />
    );
  if (PDF_RE.test(url))
    return (
      <iframe
        src={url}
        title={`Documento da etapa: ${title}`}
        className="mt-3 h-72 w-full rounded-card border border-border"
      />
    );
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-block font-body text-sm text-primary underline"
    >
      Abrir recurso
    </a>
  );
}

function DictateButton({
  language,
  onText,
}: {
  language: string;
  onText: (t: string) => void;
}) {
  const { supported, listening, toggle } = useDictation(language, onText);
  if (!supported) return null;
  return (
    <Button
      size="sm"
      intent={listening ? 'primary' : 'ghost'}
      aria-pressed={listening}
      aria-label={listening ? 'Parar ditado por voz' : 'Ditar por voz (microfone)'}
      onClick={toggle}
    >
      <Mic size={14} /> {listening ? 'A ouvir…' : 'Ditar'}
    </Button>
  );
}

function StepPanel({
  step,
  disabled,
  language,
  onAnswer,
  onAdvance,
}: {
  step: RoomStep;
  disabled: boolean;
  language: string;
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
        <ResourceView url={step.resourceUrl} title={step.title} />
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
              <div className="flex flex-col gap-1">
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
                <DictateButton
                  language={language}
                  onText={(t) => setText((prev) => `${prev} ${t}`.trim())}
                />
              </div>
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

/** Tempo efectivo de sessão (sem as pausas), actualizado de segundo a segundo. */
function useElapsed(attempt: Room['attempt']) {
  const [now, setNow] = useState(() => Date.now());
  const running = attempt.status === 'IN_PROGRESS';
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);
  const end = attempt.pausedAt ? new Date(attempt.pausedAt).getTime() : now;
  const secs = Math.max(
    0,
    Math.round((end - new Date(attempt.startedAt).getTime()) / 1000) -
      attempt.pausedSeconds,
  );
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function AvatarHeader({
  room,
  voice,
  elapsed,
}: {
  room: Room;
  voice: RoomVoice;
  elapsed: string;
}) {
  const avatar = room.session.avatar;
  return (
    <div className="flex items-center gap-3 rounded-card border border-border bg-surface p-3">
      {/* O anel pulsa enquanto o instrutor «fala» (animação sincronizada com a voz). */}
      <div
        className={`shrink-0 rounded-full p-1 ${
          voice.speaking ? 'animate-pulse ring-2 ring-primary' : 'ring-1 ring-border'
        }`}
      >
        {avatar?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar.imageUrl}
            alt={`Instrutor virtual ${avatar.name}`}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-sunken">
            <Bot size={28} className="text-ink-muted" aria-hidden />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-sm font-semibold text-ink">
          {avatar?.name ?? 'Instrutor virtual'}
        </div>
        <div className="font-body text-xs text-ink-muted">
          Instrutor virtual (IA)
          {voice.speaking
            ? voice.engine === 'SERVER'
              ? ' · a falar (voz do servidor)'
              : ' · a falar (voz do navegador)'
            : ''}
        </div>
      </div>
      <div className="text-right font-body text-xs text-ink-muted">
        <div>
          Etapa{' '}
          {Math.min(room.attempt.currentStep + 1, Math.max(room.steps.length, 1))} de{' '}
          {room.steps.length}
        </div>
        <div className="font-mono" aria-label={`Tempo de sessão ${elapsed}`}>
          {elapsed}
        </div>
      </div>
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
  const confirm = useConfirm();
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<CompleteResult | null>(null);
  const [captions, setCaptions] = useState(true);
  const [askNotice, setAskNotice] = useState(false);
  const key = queryKeys.avatarTraining.room(attemptId);
  const base = `/avatar-training/attempts/${attemptId}`;

  const {
    data: room,
    error,
    refetch,
  } = useApiQuery<Room>(key, `${base}/room`, { staleTime: 0 });

  const language = room?.session.avatar?.language ?? 'pt';
  const voiceOn = !!room && !room.attempt.textOnly;
  const voice = useRoomVoice({ attemptId, enabled: voiceOn, captions, language });
  const elapsed = useElapsed(
    room?.attempt ?? {
      id: attemptId,
      status: 'IN_PROGRESS',
      currentStep: 0,
      progress: 0,
      textOnly: true,
      startedAt: new Date().toISOString(),
      pausedAt: null,
      pausedSeconds: 0,
    },
  );

  const certification = useApiQuery<CertificationStatus>(
    [...queryKeys.avatarTraining.program(room?.session.program.id ?? 0), 'certification'],
    `/avatar-training/programs/${room?.session.program.id}/certification`,
    { enabled: !!result && result.passed !== false && !!room, staleTime: 0 },
  );

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
    onSuccess: () => voice.stop(),
    onError,
  });
  const resume = useApiMutation(() => apiClient.post(`${base}/resume`), {
    invalidateKeys: [key],
    onError,
  });
  const setMedia = useApiMutation(
    (voiceEnabled: boolean) =>
      apiClient.post(`${base}/media`, {
        voiceEnabled,
        acknowledgedNotice: voiceEnabled,
        captions,
      }),
    {
      invalidateKeys: [key],
      onSuccess: (_r, voiceEnabled) => {
        setAskNotice(false);
        if (!voiceEnabled) voice.stop();
      },
      onError,
    },
  );
  const ask = useApiMutation(
    (v: { question?: string; mode?: 'ASK' | 'EXPLAIN_DIFFERENTLY' }) =>
      apiClient.post(`${base}/tutor`, {
        ...v,
        stepKey: room?.currentStep?.key,
      }),
    {
      invalidateKeys: [key],
      // Falha do AI-Tutor nunca bloqueia a sessão — a sala continua por texto.
      onError: () =>
        notify({
          title: 'Tutor indisponível',
          description: 'Pode continuar a sessão ou pedir ajuda a um formador.',
          intent: 'info',
        }),
    },
  );
  const requestCertificate = useApiMutation(
    () =>
      apiClient.post<CertificateRequestResult>(
        `/avatar-training/programs/${room?.session.program.id}/certificate-request`,
      ),
    {
      onSuccess: (r) =>
        notify({
          title:
            r.status === 'ISSUED' || r.status === 'ALREADY_ISSUED'
              ? 'Certificado emitido'
              : 'Pedido de certificado registado',
          description:
            r.status === 'REQUESTED' || r.status === 'ALREADY_REQUESTED'
              ? 'O responsável pela formação foi avisado.'
              : undefined,
          intent: 'success',
        }),
      onError,
    },
  );
  const complete = useApiMutation(
    () => apiClient.post<CompleteResult>(`${base}/complete`),
    {
      invalidateKeys: [key, queryKeys.avatarTraining.myAssignments()],
      onSuccess: (r) => {
        voice.stop();
        setResult(r);
      },
      onError,
    },
  );
  const abandon = useApiMutation(() => apiClient.post(`${base}/abandon`), {
    invalidateKeys: [queryKeys.avatarTraining.myAssignments()],
    onSuccess: () => {
      voice.stop();
      onExit();
    },
    onError,
  });

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
  const step = room.currentStep;
  const stepText = step ? [step.title, step.content, step.question?.prompt].filter(Boolean).join('. ') : '';
  // Última resposta do instrutor — vem de interacções do tipo AVATAR_MESSAGE.
  const lastAvatar = [...room.interactions]
    .reverse()
    .find((i) => i.interactionType === 'AVATAR_MESSAGE' && i.metadata?.aiMessageId);

  async function endSession() {
    const ok = await confirm({
      title: 'Terminar a sessão sem concluir?',
      message: 'O progresso fica guardado, mas esta tentativa é encerrada.',
      confirmLabel: 'Terminar sessão',
      destructive: true,
    });
    if (ok) abandon.mutate(undefined);
  }

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

      <AvatarHeader room={room} voice={voice} elapsed={elapsed} />
      <ProgressBar value={room.attempt.progress} />

      {open && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-card border border-border bg-surface px-3 py-2 font-body text-sm text-ink">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={voiceOn}
              disabled={setMedia.isPending}
              onChange={(e) => {
                if (e.target.checked) setAskNotice(true);
                else setMedia.mutate(false);
              }}
            />
            Voz do instrutor
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={captions}
              onChange={(e) => setCaptions(e.target.checked)}
            />
            Legendas
          </label>
          {voiceOn && step && (
            <Button
              size="sm"
              intent="secondary"
              disabled={paused}
              onClick={() =>
                voice.speaking
                  ? voice.stop()
                  : void voice.speak(stepText, { stepKey: step.key })
              }
            >
              {voice.speaking ? (
                <>
                  <Square size={14} /> Parar
                </>
              ) : (
                <>
                  <Volume2 size={14} /> Ouvir a etapa
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {askNotice && (
        <div
          role="alertdialog"
          aria-label="Aviso de utilização de voz"
          className="space-y-2 rounded-card border border-warning bg-warning-subtle p-3 font-body text-sm text-warning-ink"
        >
          <p>
            A voz é sintetizada por IA. O microfone é opcional e só é usado se o
            activar; a sessão continua disponível por texto a qualquer momento.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              loading={setMedia.isPending}
              onClick={() => setMedia.mutate(true)}
            >
              Compreendo e quero activar a voz
            </Button>
            <Button size="sm" intent="ghost" onClick={() => setAskNotice(false)}>
              Continuar só por texto
            </Button>
          </div>
        </div>
      )}

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
          {result.reinforcement && <FailureReinforcementNote data={result.reinforcement} />}
          {certification.data?.enabled && (
            <p className="mt-1 text-ink-muted">
              {certification.data.eligible
                ? 'Cumpre as regras para pedir o certificado desta formação.'
                : `Certificado ainda não disponível: ${certification.data.reasons.join('; ')}.`}
            </p>
          )}
          {certification.data?.enabled && certification.data.eligible && (
            <Button
              size="sm"
              className="mt-2"
              loading={requestCertificate.isPending}
              disabled={requestCertificate.isSuccess}
              onClick={() => requestCertificate.mutate(undefined)}
            >
              Pedir certificado
            </Button>
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
              {i.metadata?.reinforcement && (
                <ReinforcementNote reinforcement={i.metadata.reinforcement} />
              )}
            </div>
          ))}
      </div>

      {captions && voice.activeCue && (
        <p
          role="status"
          className="rounded-card bg-ink px-3 py-2 text-center font-body text-sm text-canvas"
        >
          {voice.activeCue}
        </p>
      )}

      {open && step && (
        <StepPanel
          key={step.key}
          step={step}
          language={language}
          disabled={paused || record.isPending}
          onAnswer={(a) =>
            record.mutate({
              interactionType: 'USER_ANSWER',
              content: a,
              stepKey: step.key,
            })
          }
          onAdvance={() =>
            record.mutate({
              interactionType: 'STEP_ADVANCE',
              content: 'Continuar',
              stepKey: step.key,
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
          <div className="flex flex-col gap-1">
            <Button
              size="sm"
              loading={ask.isPending}
              disabled={paused || !question.trim()}
              onClick={() => {
                ask.mutate({ question: question.trim(), mode: 'ASK' });
                setQuestion('');
              }}
            >
              <Send size={14} /> Perguntar
            </Button>
            <DictateButton
              language={language}
              onText={(t) => setQuestion((prev) => `${prev} ${t}`.trim())}
            />
          </div>
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
            intent="secondary"
            disabled={paused || !step}
            loading={ask.isPending && ask.variables?.mode === 'EXPLAIN_DIFFERENTLY'}
            onClick={() => ask.mutate({ mode: 'EXPLAIN_DIFFERENTLY' })}
          >
            <RefreshCw size={14} /> Repetir explicação
          </Button>
          {voiceOn && lastAvatar && (
            <Button
              size="sm"
              intent="ghost"
              disabled={paused}
              onClick={() =>
                void voice.speak(lastAvatar.content, {
                  aiMessageId: lastAvatar.metadata?.aiMessageId,
                })
              }
            >
              <Volume2 size={14} /> Ouvir a última resposta
            </Button>
          )}
          <Button
            size="sm"
            intent="ghost"
            disabled={paused || record.isPending}
            onClick={() =>
              record.mutate(
                {
                  interactionType: 'HELP_REQUEST',
                  content: question.trim() || 'Pedido de ajuda de um formador humano.',
                  stepKey: step?.key,
                },
                {
                  onSuccess: () => {
                    setQuestion('');
                    notify({
                      title: 'Pedido enviado',
                      description: 'O formador responsável foi avisado.',
                      intent: 'success',
                    });
                  },
                },
              )
            }
          >
            <HelpCircle size={14} /> Falar com um formador
          </Button>
          <Button
            size="sm"
            intent={allDone ? 'primary' : 'ghost'}
            loading={complete.isPending}
            disabled={paused}
            onClick={() => complete.mutate(undefined)}
          >
            Concluir sessão
          </Button>
          <Button
            size="sm"
            intent="ghost"
            loading={abandon.isPending}
            onClick={() => void endSession()}
          >
            Terminar sessão
          </Button>
        </div>
      )}
    </div>
  );
}

export function RoomTab({
  only,
  emptyTitle = 'Sem sessões atribuídas',
}: {
  /** Restringe a lista a certos tipos de experiência (ex.: Simulações). */
  only?: readonly ExperienceType[];
  emptyTitle?: string;
} = {}) {
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
  const list = only
    ? data.filter((a) => only.includes(a.session.experienceType))
    : data;
  if (list.length === 0)
    return (
      <EmptyState
        icon={Bot}
        title={emptyTitle}
        description="Quando lhe for atribuída uma formação com avatar, ela aparece aqui."
      />
    );

  return (
    <div className="space-y-3">
      {list.map((a) => {
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

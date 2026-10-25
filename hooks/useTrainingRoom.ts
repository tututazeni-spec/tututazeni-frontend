// hooks/useTrainingRoom.ts
// Estado e acções da Sala de Formação Virtual (docs/Avatar_Training.md §5):
// query da sala, voz, tempo efectivo, resultado/certificação e as 8 mutações
// (interacções, pausa, retoma, média, tutor, conclusão, abandono, certificado).
// Extraído de components/avatar-training/RoomTab.tsx (RoomView).

'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { useApiMutation, useApiQuery } from './useApiQuery';
import { useRoomVoice } from '@/components/avatar-training/useRoomVoice';
import {
  buildAdvancePayload,
  buildAnswerPayload,
  buildHelpPayload,
  buildStepText,
  certificateRequestNotice,
  findLastAvatarMessage,
  formatElapsed,
  placeholderAttempt,
  roomPhase,
  shouldCheckCertification,
  type InteractionPayload,
} from '@/components/avatar-training/room/logic';
import type {
  CertificateRequestResult,
  CertificationStatus,
  CompleteResult,
  Room,
} from '@/components/avatar-training/types';

/** Tempo efectivo de sessão (sem as pausas), actualizado de segundo a segundo. */
function useElapsed(attempt: Room['attempt']) {
  const [now, setNow] = useState(() => Date.now());
  const running = attempt.status === 'IN_PROGRESS';
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);
  return formatElapsed(attempt, now);
}

export function useTrainingRoom(attemptId: number, onExit: () => void) {
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
  const voice = useRoomVoice({
    attemptId,
    enabled: voiceOn,
    captions,
    language,
  });
  const elapsed = useElapsed(room?.attempt ?? placeholderAttempt(attemptId));

  const certification = useApiQuery<CertificationStatus>(
    [
      ...queryKeys.avatarTraining.program(room?.session.program.id ?? 0),
      'certification',
    ],
    `/avatar-training/programs/${room?.session.program.id}/certification`,
    { enabled: shouldCheckCertification(result, !!room), staleTime: 0 },
  );

  const onError = (e: Error) =>
    notify({
      title: 'Não foi possível concluir a acção',
      description: e.message,
      intent: 'danger',
    });

  const record = useApiMutation(
    (v: InteractionPayload) => apiClient.post(`${base}/interactions`, v),
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
        notify({ ...certificateRequestNotice(r), intent: 'success' }),
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

  const step = room?.currentStep;
  const stepText = buildStepText(step);
  const lastAvatar = room
    ? findLastAvatarMessage(room.interactions)
    : undefined;

  return {
    room,
    error,
    refetch,
    voice,
    elapsed,
    language,
    voiceOn,
    step,
    ...roomPhase(room?.attempt, step),
    captions,
    setCaptions,
    question,
    setQuestion,
    askNotice,
    setAskNotice,
    result,
    certification: certification.data,
    certificateRequested: requestCertificate.isSuccess,

    // Voz
    /** Marcar pede primeiro o aviso de IA; desmarcar desliga logo. */
    toggleVoice: (checked: boolean) => {
      if (checked) setAskNotice(true);
      else setMedia.mutate(false);
    },
    confirmVoice: () => setMedia.mutate(true),
    toggleStepSpeech: () => {
      if (voice.speaking) voice.stop();
      else if (step) void voice.speak(stepText, { stepKey: step.key });
    },
    speakLast: () => {
      if (lastAvatar) {
        void voice.speak(lastAvatar.content, {
          aiMessageId: lastAvatar.metadata?.aiMessageId,
        });
      }
    },
    lastAvatar,

    // Etapa
    answerStep: (answer: string) => {
      if (step) record.mutate(buildAnswerPayload(step.key, answer));
    },
    advanceStep: () => {
      if (step) record.mutate(buildAdvancePayload(step.key));
    },

    // Instrutor e formador
    submitQuestion: () => {
      ask.mutate({ question: question.trim(), mode: 'ASK' });
      setQuestion('');
    },
    explainDifferently: () => ask.mutate({ mode: 'EXPLAIN_DIFFERENTLY' }),
    requestHumanHelp: () =>
      record.mutate(buildHelpPayload(question, step?.key), {
        onSuccess: () => {
          setQuestion('');
          notify({
            title: 'Pedido enviado',
            description: 'O formador responsável foi avisado.',
            intent: 'success',
          });
        },
      }),

    // Sessão
    pause: () => pause.mutate(undefined),
    resume: () => resume.mutate(undefined),
    complete: () => complete.mutate(undefined),
    requestCertificate: () => requestCertificate.mutate(undefined),
    endSession: async () => {
      const ok = await confirm({
        title: 'Terminar a sessão sem concluir?',
        message: 'O progresso fica guardado, mas esta tentativa é encerrada.',
        confirmLabel: 'Terminar sessão',
        destructive: true,
      });
      if (ok) abandon.mutate(undefined);
    },

    pending: {
      media: setMedia.isPending,
      ask: ask.isPending,
      explain: ask.isPending && ask.variables?.mode === 'EXPLAIN_DIFFERENTLY',
      record: record.isPending,
      complete: complete.isPending,
      abandon: abandon.isPending,
      certificate: requestCertificate.isPending,
    },
  };
}

export type TrainingRoomController = ReturnType<typeof useTrainingRoom>;

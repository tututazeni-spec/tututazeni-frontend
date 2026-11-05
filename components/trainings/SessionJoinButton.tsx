// components/trainings/SessionJoinButton.tsx
// Botão "Entrar" / "Iniciar" / "Registar presença" de uma sessão em que o
// utilizador está inscrito. A janela de entrada vem calculada do servidor
// (joinOpensAt / joinClosesAt) — aqui só se compara com o relógio.
// Usado em DetailView (sessões) e MyTrainingsView (cartões).

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { safeHref } from '@/lib/safeHref';
import { useToast } from '@/providers/ToastProvider';
import { AlertCard } from '@/components/ui/AlertCard';
import { Button } from '@/components/ui/Button';
import { fmtDate } from './utils';
import type { JoinSessionResult, ParticipantStatus } from './types';

/** Estados em que a inscrição dá direito a entrar (espelha o backend). */
const JOINABLE: ParticipantStatus[] = ['REGISTERED', 'ATTENDED', 'COMPLETED'];

export interface SessionJoinButtonProps {
  trainingId: number;
  sessionId: number;
  modality: string;
  meetingUrl: string | null;
  courseId: number | null;
  status: ParticipantStatus;
  joinedAt?: string | null;
  opensAt: string;
  closesAt: string;
  size?: 'sm' | 'md';
  className?: string;
}

/** Relógio que avança a cada 30 s, para o botão ligar sozinho quando a janela abre. */
function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function SessionJoinButton({
  trainingId,
  sessionId,
  modality,
  meetingUrl,
  courseId,
  status,
  joinedAt,
  opensAt,
  closesAt,
  size = 'sm',
  className,
}: SessionJoinButtonProps) {
  const router = useRouter();
  const notify = useToast();
  const now = useNow();
  const [error, setError] = useState<string | null>(null);
  const [blockedUrl, setBlockedUrl] = useState<string | null>(null);

  const joinMutation = useApiMutation(
    () =>
      apiClient.post<JoinSessionResult>(
        `/trainings/sessions/${sessionId}/join`,
        {},
      ),
    {
      invalidateKeys: [
        queryKeys.trainings.detail(trainingId),
        queryKeys.trainings.my(),
      ],
      onMutate: () => {
        setError(null);
        setBlockedUrl(null);
      },
      onSuccess: (res) => {
        const dest = res.destination;
        if (dest.type === 'MEETING') {
          const url = safeHref(dest.url);
          if (!url) {
            setError('O link desta sessão não é válido. Fala com o formador.');
            return;
          }
          const opened = window.open(url, '_blank', 'noopener,noreferrer');
          // Bloqueador de pop-ups: deixa um link para abrir à mão.
          if (!opened) setBlockedUrl(url);
        } else if (dest.type === 'COURSE') {
          router.push(dest.route);
        } else {
          notify({
            title: 'Presença pedida',
            description: 'O formador confirma a tua presença na sala.',
            intent: 'success',
          });
        }
      },
      onError: (e) => setError(e.message),
    },
  );

  if (!JOINABLE.includes(status)) return null;

  const isPresencial = modality === 'PRESENTIAL';
  const hasDestination = Boolean(meetingUrl?.trim()) || courseId != null;

  // Online sem link nem curso: nada para abrir (o servidor também recusa).
  if (modality === 'ONLINE' && !hasDestination) {
    return (
      <AlertCard
        variant="info"
        title="Link ainda não disponível"
        message="O formador ainda não publicou o link desta sessão. Volta mais perto da hora."
      />
    );
  }

  const opens = new Date(opensAt).getTime();
  const closes = new Date(closesAt).getTime();

  if (now > closes) {
    return (
      <span className="font-body text-xs text-ink-faint">Sessão terminada</span>
    );
  }

  if (now < opens) {
    return (
      <Button
        size={size}
        intent="secondary"
        disabled
        className={className}
        title="A entrada abre 15 minutos antes do início"
      >
        Abre a {fmtDate(opensAt)}
      </Button>
    );
  }

  const checkedIn = isPresencial && Boolean(joinedAt);
  const label = isPresencial
    ? checkedIn
      ? 'Presença pedida'
      : 'Registar presença'
    : meetingUrl?.trim()
      ? 'Entrar'
      : 'Iniciar';

  return (
    <div className={className}>
      <Button
        size={size}
        intent="primary"
        loading={joinMutation.isPending}
        disabled={joinMutation.isPending || checkedIn}
        onClick={(e) => {
          e.stopPropagation();
          joinMutation.mutate(undefined);
        }}
      >
        {label}
      </Button>
      {blockedUrl && (
        <a
          href={blockedUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 block font-body text-xs text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Abrir a reunião
        </a>
      )}
      {error && (
        <div
          role="presentation"
          className="mt-2"
          onClick={(e) => e.stopPropagation()}
        >
          <AlertCard
            variant="danger"
            title="Não foi possível entrar"
            message={error}
          />
        </div>
      )}
    </div>
  );
}

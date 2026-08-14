// components/events/DetailView.tsx
// Separador "Detalhe do Evento" — header, CTAs (inscrição/check-in/
// feedback), tabs (info/participantes). Dados próprios + apresentação.
// Extraído de app/(platform)/events/page.tsx. Migrado para a fundação
// de design: Card/Avatar/Button/StatusBadge/Textarea da fundação,
// tabs em grupo de Button (mesmo padrão do container e de
// components/development-plans/DetailView.tsx), Skeleton local
// (atoms.tsx) a Skeleton da fundação.

'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useConfirm } from '@/providers/ConfirmProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime as fmtDateTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Textarea } from '@/components/ui/Textarea';
import {
  MODALITY_CFG,
  PARTICIPANT_STATUS,
  STATUS_CFG,
  TYPE_CFG,
} from './constants';
import type {
  EventDetail,
  EventModalidade,
  EventStatus,
  EventType,
  ParticipantStatus,
} from './types';

interface DetailViewProps {
  eventId: number;
  onBack: () => void;
}

const TABS = [
  { id: 'info', label: 'ℹ️ Informações' },
  { id: 'participants', label: '👥 Participantes' },
] as const;

export function DetailView({ eventId, onBack }: DetailViewProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState({ nps: 8, rating: 4, comment: '' });
  const [tab, setTab] = useState<'info' | 'participants'>('info');

  const {
    data: event,
    isLoading: loading,
    refetch,
  } = useApiQuery<EventDetail>(
    queryKeys.events.detail(eventId),
    `/events/${eventId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  // Três acções mutuamente exclusivas do mesmo botão de utilizador — cada
  // useApiMutation já expõe o seu próprio `isPending`, substituindo os 3
  // useState booleanos + try/catch/finally manuais que existiam antes.
  const joinMutation = useApiMutation(
    () => apiClient.post(`/events/${eventId}/join`, {}),
    { onSuccess: () => refetch(), onError: (e) => alert(e.message) },
  );
  const handleJoin = () => joinMutation.mutate(undefined);

  const confirm = useConfirm();
  const handleLeave = async () => {
    if (
      !(await confirm({
        title: 'Cancelar inscrição neste evento?',
        confirmLabel: 'Cancelar inscrição',
        destructive: true,
      }))
    )
      return;
    try {
      await apiClient.post(`/events/${eventId}/leave`, {});
      await refetch();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const checkInMutation = useApiMutation(
    () => apiClient.post('/events/checkin', { eventId }),
    {
      onSuccess: async () => {
        await refetch();
        alert('✅ Check-in realizado! +20 XP');
      },
      onError: (e) => alert(e.message),
    },
  );
  const handleCheckIn = () => checkInMutation.mutate(undefined);

  const feedbackMutation = useApiMutation(
    (payload: typeof feedback) =>
      apiClient.post(`/events/${eventId}/feedback`, payload),
    {
      onSuccess: () => {
        setShowFeedback(false);
        alert('✅ Feedback enviado! Obrigado pela tua avaliação.');
      },
      onError: (e) => alert(e.message),
    },
  );
  const handleFeedback = () => feedbackMutation.mutate(feedback);

  if (loading || !event) return <Skeleton rows={6} />;

  const typeCfg = TYPE_CFG[event.type as EventType] ?? TYPE_CFG.TRAINING;
  const modalityCfg =
    MODALITY_CFG[event.modalidade as EventModalidade] ?? MODALITY_CFG.ONLINE;
  const isLive = event.status === 'LIVE';

  return (
    <div>
      <Button intent="ghost" size="sm" onClick={onBack} className="mb-4">
        <ArrowLeft size={14} strokeWidth={1.75} />
        Voltar
      </Button>

      {/* Header */}
      <Card className={cn('mb-5', isLive && 'border-danger')}>
        <CardBody>
          {isLive && (
            <div className="mb-3 flex items-center gap-2 text-danger">
              <span className="h-2 w-2 animate-pulse rounded-full bg-danger" />
              <span className="font-body text-sm font-semibold">
                Evento ao vivo agora
              </span>
            </div>
          )}

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'rounded px-2 py-0.5 font-body text-xs',
                    typeCfg.cls,
                  )}
                >
                  {typeCfg.icon} {typeCfg.label}
                </span>
                <StatusBadge
                  value={event.status as EventStatus}
                  map={STATUS_CFG}
                  fallback={STATUS_CFG.PUBLISHED}
                />
                <span className="font-body text-xs text-ink-faint">
                  {modalityCfg.icon} {modalityCfg.label}
                </span>
                {event.mandatory && (
                  <span className="font-body text-xs font-semibold text-danger">
                    Obrigatório
                  </span>
                )}
                {event.certificateEnabled && (
                  <span className="font-body text-xs text-success-ink">
                    🎓 Certificado
                  </span>
                )}
              </div>
              <h1 className="mb-1 font-display text-xl font-bold text-ink">
                {event.title}
              </h1>
              {event.description && (
                <p className="mt-2 font-body text-sm leading-relaxed text-ink-muted">
                  {event.description}
                </p>
              )}
            </div>

            {/* CTA */}
            <div className="flex flex-shrink-0 flex-col gap-2">
              {event.status === 'PUBLISHED' && (
                <Button
                  size="sm"
                  onClick={handleJoin}
                  disabled={joinMutation.isPending}
                  className={
                    event.isFull && !event.waitlistEnabled
                      ? 'bg-surface-sunken text-ink-faint hover:bg-surface-sunken'
                      : undefined
                  }
                >
                  {joinMutation.isPending
                    ? '…'
                    : event.isFull
                      ? event.waitlistEnabled
                        ? 'Entrar na lista de espera'
                        : 'Lotado'
                      : '+ Inscrever-me'}
                </Button>
              )}
              {(event.status === 'LIVE' || event.status === 'PUBLISHED') &&
                event.meetingUrl && (
                  <a
                    href={event.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-control bg-danger px-4 py-2 text-center font-body text-sm font-medium text-white hover:brightness-95"
                  >
                    🔴 Entrar no evento
                  </a>
                )}
              <Button
                intent="success"
                size="sm"
                onClick={handleCheckIn}
                disabled={checkInMutation.isPending}
              >
                {checkInMutation.isPending ? '…' : '✓ Check-in'}
              </Button>
              {event.status === 'ENDED' && (
                <Button
                  intent="warning"
                  size="sm"
                  onClick={() => setShowFeedback((s) => !s)}
                >
                  ⭐ Avaliar evento
                </Button>
              )}
            </div>
          </div>

          {/* Infos */}
          <div className="mt-4 flex flex-wrap gap-4 font-body text-xs text-ink-faint">
            <span>
              📅 {fmtDateTime(event.startAt)} → {fmtDateTime(event.endAt)}
            </span>
            {event.location && <span>📍 {event.location}</span>}
            <span>
              👥 {event._count.participants}/{event.maxCapacity} inscritos
            </span>
            {event.avgNps && <span>NPS: {event.avgNps}/10</span>}
            {event.avgRating && <span>⭐ {event.avgRating}/5</span>}
          </div>

          {event.tags?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {event.tags.map((t: string) => (
                <span
                  key={t}
                  className="rounded bg-surface-sunken px-2 py-0.5 font-body text-xs text-ink-muted"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Formulário de feedback */}
      {showFeedback && (
        <div className="mb-5 rounded-card border border-warning bg-warning-subtle p-5">
          <div className="mb-4 font-body text-sm font-semibold text-ink">
            Avalia este evento
          </div>
          <div className="space-y-4">
            <div>
              <div className="mb-1 font-body text-xs text-ink-muted">
                NPS — Recomendarias este evento a um colega? (1-10)
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <button
                    key={n}
                    onClick={() => setFeedback((f) => ({ ...f, nps: n }))}
                    className={cn(
                      'h-8 w-8 rounded-control font-data text-xs transition-colors',
                      feedback.nps === n
                        ? 'bg-primary text-canvas'
                        : 'border border-border-strong bg-surface text-ink-muted hover:bg-surface-sunken',
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1 font-body text-xs text-ink-muted">
                Avaliação geral (1-5)
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setFeedback((f) => ({ ...f, rating: n }))}
                    className={cn(
                      'text-2xl transition-colors',
                      n <= feedback.rating
                        ? 'text-accent'
                        : 'text-border-strong hover:text-accent-hover',
                    )}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              rows={3}
              placeholder="Comentário (opcional)…"
              value={feedback.comment}
              onChange={(e) =>
                setFeedback((f) => ({ ...f, comment: e.target.value }))
              }
              className="w-full resize-none"
            />
            <Button
              intent="warning"
              size="sm"
              onClick={handleFeedback}
              disabled={feedbackMutation.isPending}
            >
              {feedbackMutation.isPending ? 'A enviar…' : '✓ Enviar avaliação'}
            </Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex w-fit gap-1 rounded-card bg-surface-sunken p-1">
        {TABS.map((t) => (
          <Button
            key={t.id}
            size="sm"
            intent={tab === t.id ? 'primary' : 'ghost'}
            onClick={() => setTab(t.id)}
          >
            {t.id === 'participants'
              ? `${t.label} (${event._count.participants})`
              : t.label}
          </Button>
        ))}
      </div>

      {tab === 'info' && (
        <Card>
          <CardBody>
            <div className="mb-4 flex items-center gap-3">
              <Avatar
                name={event.organizer.fullName}
                url={event.organizer.avatarUrl ?? undefined}
                size="md"
              />
              <div>
                <div className="font-body text-sm font-medium text-ink">
                  Organizado por
                </div>
                <div className="font-body text-sm text-ink-muted">
                  {event.organizer.fullName}
                </div>
              </div>
            </div>
            {event.meetingPassword && (
              <div className="rounded-control bg-info-subtle px-3 py-2 font-body text-xs text-info-ink">
                🔑 Senha do meeting:{' '}
                <span className="font-data font-bold">
                  {event.meetingPassword}
                </span>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {tab === 'participants' && (
        <Card className="overflow-hidden">
          {(event.participants ?? []).map((p) => (
            <div
              key={p.userId}
              className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0"
            >
              <Avatar
                name={p.user?.fullName ?? 'U'}
                url={p.user?.avatarUrl ?? undefined}
                size="sm"
              />
              <div className="flex-1 font-body text-sm text-ink">
                {p.user?.fullName}
              </div>
              <StatusBadge
                value={p.status as ParticipantStatus}
                map={PARTICIPANT_STATUS}
              />
            </div>
          ))}
          {(event.participants ?? []).length === 0 && (
            <div className="px-4 py-8 text-center font-body text-sm text-ink-faint">
              Sem participantes inscritos
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

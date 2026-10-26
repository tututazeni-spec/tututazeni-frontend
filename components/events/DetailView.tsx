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
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CalendarDays,
  GraduationCap,
  Info,
  KeyRound,
  MapPin,
  User,
  Users,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime as fmtDateTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { PALETTE } from '@/components/onboarding/TemplateCard';
import { Metric } from './EventListCard';
import { LogisticsSummaryCard } from './LogisticsSummaryCard';
import {
  EVENT_BADGE_COLORS,
  EVENT_STATUS_ON_DARK,
  EventBadge,
} from './EventBadges';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Textarea } from '@/components/ui/Textarea';
import { MODALITY_CFG, PARTICIPANT_STATUS, TYPE_CFG } from './constants';
import type {
  EventDetail,
  EventModalidade,
  EventStatus,
  EventType,
  ParticipantStatus,
} from './types';
import { safeHref } from '@/lib/safeHref';
import { EmptyState } from '@/components/ui/EmptyState';

interface DetailViewProps {
  eventId: number;
  onBack: () => void;
}

const TABS = [
  { id: 'info', label: 'Informações', Icon: Info },
  { id: 'participants', label: 'Participantes', Icon: Users },
] as const;

interface RatingRowProps {
  label: string;
  value: number;
  onChange: (n: number) => void;
}

// Linha de estrelas 1-5 reutilizada pelos vários aspectos do formulário de
// avaliação (docs/events.md #10: organização/conteúdo/local/oradores/
// logística/comunicação/participaria novamente) — evita repetir o markup
// de botões 8 vezes.
function RatingRow({ label, value, onChange }: RatingRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-body text-xs text-ink-muted">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              'text-xl transition-colors',
              n <= value
                ? 'text-accent'
                : 'text-border-strong hover:text-accent-hover',
            )}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

export function DetailView({ eventId, onBack }: DetailViewProps) {
  const notify = useToast();
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState({
    nps: 8,
    rating: 4,
    organizationRating: 4,
    contentRating: 4,
    locationRating: 4,
    speakersRating: 4,
    logisticsRating: 4,
    communicationRating: 4,
    wouldAttendAgain: 4,
    comment: '',
  });
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
    {
      onSuccess: () => refetch(),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
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
      reportError(e, { source: 'EventDetailView.handleLeave' });
      notify({
        title: e instanceof Error ? e.message : String(e),
        intent: 'danger',
      });
    }
  };

  const checkInMutation = useApiMutation(
    () => apiClient.post('/events/checkin', { eventId }),
    {
      onSuccess: async () => {
        await refetch();
        notify({ title: 'Check-in realizado! +20 XP', intent: 'success' });
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const handleCheckIn = () => checkInMutation.mutate(undefined);

  const feedbackMutation = useApiMutation(
    (payload: typeof feedback) =>
      apiClient.post(`/events/${eventId}/feedback`, payload),
    {
      onSuccess: () => {
        setShowFeedback(false);
        notify({
          title: 'Feedback enviado! Obrigado pela tua avaliação.',
          intent: 'success',
        });
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const handleFeedback = () => feedbackMutation.mutate(feedback);

  if (loading || !event) return <Skeleton rows={6} />;

  const typeCfg = TYPE_CFG[event.type as EventType] ?? TYPE_CFG.TRAINING;
  const TypeIcon = typeCfg.icon;
  const modalityCfg =
    MODALITY_CFG[event.modalidade as EventModalidade] ?? MODALITY_CFG.ONLINE;
  const isLive = event.status === 'LIVE';
  const palette = PALETTE[Math.abs(event.id) % PALETTE.length];
  const subtitle = [
    event.category ?? typeCfg.label,
    event.department?.name,
    event.unit?.name,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div>
      <Button intent="ghost" size="sm" onClick={onBack} className="mb-4">
        <ArrowLeft size={14} strokeWidth={1.75} />
        Voltar
      </Button>

      {/* Header — desenho de "workshop de inovação.jpeg": cartão claro com
          etiquetas, ícone + título, dados, organizador e botões; a imagem do
          evento num recorte inclinado no canto superior direito. */}
      <div
        className={cn(
          'relative mb-5 overflow-hidden rounded-[24px] border bg-white shadow-[0_8px_24px_rgba(21,47,89,0.10)]',
          isLive ? 'border-danger' : 'border-brand-line',
        )}
      >
        <div
          aria-hidden
          className="absolute right-0 top-0 hidden h-[58%] w-[34%] items-center justify-center text-white/70 sm:flex"
          style={{
            clipPath: 'polygon(16% 0, 100% 0, 100% 100%, 0 76%)',
            background: event.bannerUrl
              ? undefined
              : `linear-gradient(160deg, ${palette[0]} 0%, ${palette[2]} 100%)`,
          }}
        >
          {event.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              decoding="async"
              src={event.bannerUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <TypeIcon size={48} strokeWidth={1.25} />
          )}
        </div>

        <div className="relative space-y-5 p-6 sm:pr-[36%]">
          {isLive && (
            <div
              role="status"
              className="flex items-center gap-3 rounded-[14px] border border-danger/40 bg-danger/10 px-4 py-3 text-danger"
            >
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-danger" />
              </span>
              <span className="font-body text-sm font-semibold">
                Evento ao vivo agora
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <EventBadge color={EVENT_BADGE_COLORS.type} icon={TypeIcon}>
              {typeCfg.label}
            </EventBadge>
            <EventBadge
              color={
                (
                  EVENT_STATUS_ON_DARK[event.status as EventStatus] ??
                  EVENT_STATUS_ON_DARK.PUBLISHED
                ).color
              }
            >
              {
                (
                  EVENT_STATUS_ON_DARK[event.status as EventStatus] ??
                  EVENT_STATUS_ON_DARK.PUBLISHED
                ).label
              }
            </EventBadge>
            <EventBadge color={EVENT_BADGE_COLORS.modality}>
              {modalityCfg.label}
            </EventBadge>
            {event.mandatory && (
              <EventBadge
                color={EVENT_BADGE_COLORS.mandatory}
                icon={AlertCircle}
              >
                Obrigatório
              </EventBadge>
            )}
            {event.certificateEnabled && (
              <EventBadge
                color={EVENT_BADGE_COLORS.certificate}
                icon={GraduationCap}
              >
                Certificado
              </EventBadge>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span
              aria-hidden
              className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full text-white"
              style={{ background: palette[3] }}
            >
              <TypeIcon size={28} strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <h1 className="break-words font-display text-[28px] font-bold leading-tight text-brand">
                {event.title}
              </h1>
              <p className="mt-0.5 break-words text-base text-brand-muted">
                {subtitle}
              </p>
            </div>
          </div>

          {event.description && (
            <p className="font-body text-sm leading-relaxed text-ink-muted">
              {event.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-y-3 divide-x divide-brand-line">
            <Metric icon={CalendarDays}>
              {fmtDateTime(event.startAt)} → {fmtDateTime(event.endAt)}
            </Metric>
            <Metric icon={Users}>
              {event._count.participants}/{event.maxCapacity} inscritos
            </Metric>
            {event.avgNps && (
              <span className="px-3 font-body text-xs text-ink-faint">
                NPS: {event.avgNps}/10
              </span>
            )}
            {event.avgRating && (
              <span className="px-3 font-body text-xs text-ink-faint">
                {event.avgRating}/5
              </span>
            )}
          </div>
          {(event.location || event.department?.name) && (
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
              {event.location && (
                <Metric icon={MapPin}>{event.location}</Metric>
              )}
              {event.department?.name && (
                <Metric icon={Building2}>{event.department.name}</Metric>
              )}
            </div>
          )}

          {event.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
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

          <div className="border-t border-brand-line pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-3 text-[15px] text-brand-muted">
                <User size={22} strokeWidth={1.75} aria-hidden />
                {event.organizer.fullName}
              </span>
              {/* CTA */}
              <div className="flex flex-wrap items-center gap-2">
                {event.status === 'PUBLISHED' && (
                  <Button
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
                      href={safeHref(event.meetingUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-control bg-danger px-4 py-2 text-center font-body text-sm font-medium text-canvas hover:brightness-95"
                    >
                      Entrar no evento
                    </a>
                  )}
                <Button
                  intent="success"
                  onClick={handleCheckIn}
                  disabled={checkInMutation.isPending}
                >
                  {checkInMutation.isPending ? '…' : '✓ Check-in'}
                </Button>
                {event.status === 'ENDED' && (
                  <Button
                    intent="warning"
                    onClick={() => setShowFeedback((s) => !s)}
                  >
                    Avaliar evento
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulário de feedback */}
      {showFeedback && (
        <div className="mb-5 rounded-card border border-warning bg-warning-subtle p-5">
          <div className="mb-4 font-body text-sm font-semibold text-ink">
            Avalia este evento
          </div>
          <div className="space-y-4">
            <div>
              <div className="mb-1 font-body text-xs text-ink-muted">
                Índice de recomendação — Recomendarias este evento a um colega?
                (1-10)
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
            <div className="space-y-2 border-t border-border-strong/50 pt-3">
              <RatingRow
                label="Avaliação geral"
                value={feedback.rating}
                onChange={(n) => setFeedback((f) => ({ ...f, rating: n }))}
              />
              <RatingRow
                label="Organização"
                value={feedback.organizationRating}
                onChange={(n) =>
                  setFeedback((f) => ({ ...f, organizationRating: n }))
                }
              />
              <RatingRow
                label="Conteúdo"
                value={feedback.contentRating}
                onChange={(n) =>
                  setFeedback((f) => ({ ...f, contentRating: n }))
                }
              />
              <RatingRow
                label="Local"
                value={feedback.locationRating}
                onChange={(n) =>
                  setFeedback((f) => ({ ...f, locationRating: n }))
                }
              />
              <RatingRow
                label="Oradores"
                value={feedback.speakersRating}
                onChange={(n) =>
                  setFeedback((f) => ({ ...f, speakersRating: n }))
                }
              />
              <RatingRow
                label="Logística"
                value={feedback.logisticsRating}
                onChange={(n) =>
                  setFeedback((f) => ({ ...f, logisticsRating: n }))
                }
              />
              <RatingRow
                label="Comunicação"
                value={feedback.communicationRating}
                onChange={(n) =>
                  setFeedback((f) => ({ ...f, communicationRating: n }))
                }
              />
              <RatingRow
                label="Participarias novamente?"
                value={feedback.wouldAttendAgain}
                onChange={(n) =>
                  setFeedback((f) => ({ ...f, wouldAttendAgain: n }))
                }
              />
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
      <div className="mb-4 flex gap-2">
        {TABS.map((t) => (
          <Button
            key={t.id}
            size="sm"
            intent={tab === t.id ? 'primary' : 'ghost'}
            aria-pressed={tab === t.id}
            onClick={() => setTab(t.id)}
          >
            <t.Icon size={14} strokeWidth={1.75} />
            {t.id === 'participants'
              ? `${t.label} (${event._count.participants})`
              : t.label}
          </Button>
        ))}
      </div>

      {tab === 'info' && (
        <Card className="rounded-[24px] border-brand-line bg-white shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
          <CardBody>
            <div className="mb-4 flex items-center gap-3">
              <Avatar
                name={event.organizer.fullName}
                url={event.organizer.avatarUrl ?? undefined}
                size="md"
              />
              <div>
                <div className="font-body text-xs font-medium text-brand-muted">
                  Organizado por
                </div>
                <div className="font-body text-base font-semibold text-brand">
                  {event.organizer.fullName}
                </div>
              </div>
            </div>
            {event.meetingPassword && (
              <div className="inline-flex items-center gap-1 rounded-control bg-info-subtle px-3 py-2 font-body text-xs text-info-ink">
                <KeyRound size={12} strokeWidth={1.75} /> Senha do meeting:{' '}
                <span className="font-data font-bold">
                  {event.meetingPassword}
                </span>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {tab === 'info' && <LogisticsSummaryCard eventId={eventId} />}

      {tab === 'participants' && (
        <Card className="overflow-hidden rounded-[24px] border-brand-line bg-white shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
          {(event.participants ?? []).map((p) => (
            <div
              key={p.userId}
              className="flex items-center gap-3 border-b border-brand-line px-5 py-3.5 last:border-0"
            >
              <Avatar
                name={p.user?.fullName ?? 'U'}
                url={p.user?.avatarUrl ?? undefined}
                size="sm"
              />
              <div className="flex-1 font-body text-[15px] font-medium text-brand">
                {p.user?.fullName}
              </div>
              <StatusBadge
                value={p.status as ParticipantStatus}
                map={PARTICIPANT_STATUS}
              />
            </div>
          ))}
          {(event.participants ?? []).length === 0 && (
            <EmptyState variant="inline" title="Sem participantes inscritos" />
          )}
        </Card>
      )}
    </div>
  );
}

// components/trainings/DetailView.tsx
// Separador "Detalhe" — header, sessões disponíveis, avaliação e
// avaliações de outros. Dados próprios + apresentação. Extraído de
// app/(platform)/trainings/page.tsx.
//
// Estrelas interactivas (widget "Avaliar") e a lista de estrelas por
// avaliação ficam bespoke neste ficheiro (não exportadas) — StarRating
// (components/trainings/StarRating.tsx) só cobre o caso de leitura com
// fallback/label; mesmo padrão local de components/instructor/DashboardView.tsx.

'use client';

import { useState } from 'react';
import { useToast } from '@/providers/ToastProvider';
import {
  ArrowLeft,
  Clock,
  GraduationCap,
  Globe,
  Star,
  UserCheck,
  Users,
  MapPin,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { PALETTE } from '@/components/onboarding/TemplateCard';
import { EventBadge } from '@/components/events/EventBadges';
import { Metric } from '@/components/events/EventListCard';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import { LEVEL_CFG, TYPE_CFG } from './constants';
import { LEVEL_TONE, TONE_COLOR } from './trainingTones';
import { fmtDate, fmtHours } from './utils';
import type { Training, TrainingType } from './types';
import { safeHref } from '@/lib/safeHref';

interface DetailViewProps {
  trainingId: number;
  onBack: () => void;
}

function StarPicker({
  rating,
  onPick,
}: {
  rating: number;
  onPick: (n: number) => void;
}) {
  return (
    <div className="mb-3 flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          aria-label={`${s} estrela${s > 1 ? 's' : ''}`}
          onClick={() => onPick(s)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={24}
            strokeWidth={1.75}
            className={
              s <= rating ? 'fill-accent text-accent' : 'text-ink-faint'
            }
          />
        </button>
      ))}
    </div>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={12}
          strokeWidth={1.75}
          className={i < rating ? 'fill-accent text-accent' : 'text-ink-faint'}
        />
      ))}
    </div>
  );
}

export function DetailView({ trainingId, onBack }: DetailViewProps) {
  const notify = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const { data: training, isLoading: loading } = useApiQuery<Training>(
    queryKeys.trainings.detail(trainingId),
    `/trainings/${trainingId}`,
    { enabled: !!trainingId, staleTime: STALE_TIME.DYNAMIC },
  );

  const enrollMutation = useApiMutation(
    (sessionId: number) =>
      apiClient.post(`/trainings/sessions/${sessionId}/self-register`, {}),
    {
      invalidateKeys: [queryKeys.trainings.detail(trainingId)],
      onSuccess: () =>
        notify({ title: 'Inscrição realizada!', intent: 'success' }),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const enrolling = enrollMutation.isPending
    ? (enrollMutation.variables ?? null)
    : null;
  const handleEnroll = (sessionId: number) => enrollMutation.mutate(sessionId);

  const rateMutation = useApiMutation(
    () =>
      apiClient.post('/trainings/rate', {
        trainingId,
        rating,
        comment: comment || undefined,
      }),
    {
      onSuccess: () => {
        notify({ title: 'Avaliação enviada!', intent: 'success' });
        setRating(0);
        setComment('');
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const submittingRating = rateMutation.isPending;
  const handleRate = () => {
    if (rating) rateMutation.mutate(undefined);
  };

  if (loading || !training)
    return (
      <Skeleton
        rows={6}
        wrapperClassName="space-y-3"
        itemClassName="skeleton-shimmer h-16 rounded-card"
      />
    );

  const typeCfg = TYPE_CFG[training.type];
  const palette =
    PALETTE[Math.abs(training.colorIndex ?? training.id) % PALETTE.length];

  return (
    <div>
      <Button intent="ghost" size="sm" onClick={onBack} className="mb-5">
        <ArrowLeft size={14} strokeWidth={1.75} />
        Voltar ao catálogo
      </Button>

      {/* Header — desenho de "workshop de inovação.jpeg" (o mesmo do detalhe
          do plano de formação): cartão claro com etiquetas, ícone + título,
          dados e formador; a imagem da formação num recorte inclinado. */}
      <div className="relative mb-5 overflow-hidden rounded-[24px] border border-brand-line bg-white shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
        <div
          aria-hidden
          className="absolute right-0 top-0 hidden h-[58%] w-[34%] items-center justify-center text-white/70 sm:flex"
          style={{
            clipPath: 'polygon(16% 0, 100% 0, 100% 100%, 0 76%)',
            background: training.thumbnailUrl
              ? undefined
              : `linear-gradient(160deg, ${palette[0]} 0%, ${palette[2]} 100%)`,
          }}
        >
          {training.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              decoding="async"
              src={training.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <GraduationCap size={48} strokeWidth={1.25} />
          )}
        </div>

        <div className="relative space-y-5 p-6 sm:pr-[36%]">
          <div className="flex flex-wrap items-center gap-2">
            <EventBadge color={TONE_COLOR[LEVEL_TONE[training.level]]}>
              {LEVEL_CFG[training.level].label}
            </EventBadge>
            {typeCfg && (
              <EventBadge color={TONE_COLOR.neutral}>
                {typeCfg.label}
              </EventBadge>
            )}
            {training.mandatory && (
              <EventBadge color={TONE_COLOR.danger}>Obrigatório</EventBadge>
            )}
            {training.issueCertificate && (
              <EventBadge color={TONE_COLOR.warning}>Certificado</EventBadge>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span
              aria-hidden
              className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full text-white"
              style={{ background: palette[3] }}
            >
              <GraduationCap size={28} strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <h1 className="break-words font-display text-[28px] font-bold leading-tight text-brand">
                {training.title}
              </h1>
              <p className="mt-0.5 break-words text-base text-brand-muted">
                {training.category ?? typeCfg?.label}
              </p>
            </div>
          </div>

          {training.shortDescription && (
            <p className="font-body text-sm leading-relaxed text-ink-muted">
              {training.shortDescription}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-y-3 divide-x divide-brand-line">
            <Metric icon={Clock}>
              {fmtHours(training.workloadHours)}{' '}
              <span className="text-brand-muted">· Carga horária</span>
            </Metric>
            <Metric icon={Globe}>
              {training.language.toUpperCase()}{' '}
              <span className="text-brand-muted">· Idioma</span>
            </Metric>
          </div>
          <div className="flex flex-wrap items-center gap-y-3 divide-x divide-brand-line">
            <Metric icon={Users}>
              {training._count.participants}{' '}
              <span className="text-brand-muted">· Inscritos</span>
            </Metric>
            <Metric icon={Star}>
              {training.avgRating != null
                ? `${training.avgRating.toFixed(1)} / 5`
                : 'Sem avaliação'}{' '}
              <span className="text-brand-muted">· Avaliação</span>
            </Metric>
          </div>

          <div className="border-t border-brand-line pt-4">
            <span className="inline-flex items-center gap-3 text-[15px] text-brand-muted">
              <UserCheck size={22} strokeWidth={1.75} aria-hidden />
              {training.instructor?.fullName ?? 'Sem formador'}
              <span>
                · {training.instructor?.position?.name ?? 'Instrutor'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Sessões */}
      {training.sessions && training.sessions.length > 0 && (
        <Card className="mb-5 overflow-hidden">
          <div className="bg-brand/60 px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-white">
            Sessões disponíveis ({training.sessions.length})
          </div>
          {training.sessions.map((session) => {
            const vacancies =
              session.maxParticipants > 0
                ? session.maxParticipants - (session._count.participants ?? 0)
                : null;
            const isFull = vacancies !== null && vacancies <= 0;
            return (
              <div
                key={session.id}
                className="flex items-center gap-4 border-b border-border px-4 py-4 last:border-0"
              >
                <div className="flex-1">
                  <div className="font-body text-sm font-medium text-ink">
                    {fmtDate(session.sessionDate)}
                  </div>
                  <div className="mt-1 flex items-center gap-3 font-body text-xs text-ink-faint">
                    <span>
                      {TYPE_CFG[session.modality as TrainingType]?.icon}{' '}
                      {TYPE_CFG[session.modality as TrainingType]?.label}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} strokeWidth={1.75} />{' '}
                      {session.durationMinutes}min
                    </span>
                    {session.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} strokeWidth={1.75} />{' '}
                        {session.location}
                      </span>
                    )}
                    {session.meetingUrl && (
                      <a
                        href={safeHref(session.meetingUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Link
                      </a>
                    )}
                  </div>
                  {vacancies !== null && (
                    <div className="mt-1 font-body text-xs">
                      {isFull ? (
                        <span className="text-danger">
                          Vagas esgotadas{' '}
                          {session.waitlistEnabled &&
                            '(lista de espera disponível)'}
                        </span>
                      ) : (
                        <span className="text-success-ink">
                          {vacancies} vagas disponíveis
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  intent={
                    isFull && !session.waitlistEnabled
                      ? 'secondary'
                      : isFull
                        ? 'warning'
                        : 'primary'
                  }
                  onClick={() => handleEnroll(session.id)}
                  disabled={
                    (isFull && !session.waitlistEnabled) ||
                    enrolling === session.id
                  }
                  className="flex-shrink-0"
                >
                  {enrolling === session.id
                    ? '…'
                    : isFull && session.waitlistEnabled
                      ? 'Lista de espera'
                      : isFull
                        ? 'Esgotado'
                        : 'Inscrever-me'}
                </Button>
              </div>
            );
          })}
        </Card>
      )}

      {/* Avaliar */}
      <Card className="mb-5 overflow-hidden">
        <div className="bg-brand/60 px-4 py-3 font-body text-sm font-semibold text-white">
          Avaliar este treinamento
        </div>
        <div className="p-5">
          <StarPicker rating={rating} onPick={setRating} />
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Comentário (opcional)…"
            className="mb-3 w-full resize-none"
          />
          <Button
            onClick={handleRate}
            disabled={!rating || submittingRating}
            loading={submittingRating}
          >
            {submittingRating ? 'A enviar…' : 'Enviar avaliação'}
          </Button>
        </div>
      </Card>

      {/* Avaliações dos outros */}
      {training.ratings && training.ratings.length > 0 && (
        <Card className="p-5">
          <div className="mb-3 font-body text-sm font-semibold text-ink">
            Avaliações ({training._count.ratings})
          </div>
          <div className="space-y-3">
            {training.ratings.map((r) => (
              <div key={r.id} className="flex gap-3">
                <Avatar
                  name={r.user.fullName}
                  url={r.user.avatarUrl ?? undefined}
                  size="sm"
                />
                <div className="flex-1">
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className="font-body text-xs font-medium text-ink">
                      {r.user.fullName}
                    </span>
                    <StarRow rating={r.rating} />
                  </div>
                  {r.comment && (
                    <p className="font-body text-xs text-ink-muted">
                      {r.comment}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

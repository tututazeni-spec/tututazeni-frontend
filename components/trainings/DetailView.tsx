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
import Image from 'next/image';
import {
  ArrowLeft,
  Clock,
  Globe,
  Star,
  Trophy,
  Users,
  MapPin,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Textarea } from '@/components/ui/Textarea';
import { StarRating } from './StarRating';
import { LEVEL_CFG, TYPE_CFG } from './constants';
import { fmtDate, fmtHours } from './utils';
import type { Training, TrainingType } from './types';

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

  return (
    <div>
      <Button intent="ghost" size="sm" onClick={onBack} className="mb-5">
        <ArrowLeft size={14} strokeWidth={1.75} />
        Voltar ao catálogo
      </Button>

      {/* Header */}
      <Card className="mb-5 overflow-hidden">
        <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary to-primary-active">
          {training.thumbnailUrl && (
            <Image
              src={training.thumbnailUrl}
              alt=""
              fill
              className="object-cover opacity-40"
            />
          )}
          <div className="absolute inset-0 flex items-end p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded px-2 py-0.5 font-body text-xs font-medium ${typeCfg.cls}`}
              >
                {typeCfg.icon} {typeCfg.label}
              </span>
              <StatusBadge value={training.level} map={LEVEL_CFG} />
              {training.mandatory && (
                <span className="rounded bg-danger px-2 py-0.5 font-body text-xs text-canvas">
                  Obrigatório
                </span>
              )}
              {training.issueCertificate && (
                <span className="flex items-center gap-1 rounded bg-accent px-2 py-0.5 font-body text-xs text-canvas">
                  <Trophy size={12} strokeWidth={1.75} /> Certificado
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-5">
          <h1 className="mb-2 font-display text-xl font-bold text-ink">
            {training.title}
          </h1>
          {training.shortDescription && (
            <p className="mb-3 font-body text-sm text-ink-muted">
              {training.shortDescription}
            </p>
          )}

          <div className="mb-4 flex flex-wrap items-center gap-4 font-body text-xs text-ink-faint">
            <span className="flex items-center gap-1">
              <Clock size={14} strokeWidth={1.75} />
              {fmtHours(training.workloadHours)}
            </span>
            <span className="flex items-center gap-1">
              <Globe size={14} strokeWidth={1.75} />
              {training.language.toUpperCase()}
            </span>
            <span className="flex items-center gap-1">
              <Users size={14} strokeWidth={1.75} />
              {training._count.participants} inscritos
            </span>
            <StarRating value={training.avgRating ?? null} />
          </div>

          {training.instructor && (
            <div className="flex items-center gap-3 rounded-control bg-surface-sunken p-3">
              <Avatar
                name={training.instructor.fullName}
                url={training.instructor.avatarUrl ?? undefined}
                size="md"
              />
              <div>
                <div className="font-body text-sm font-medium text-ink">
                  {training.instructor.fullName}
                </div>
                <div className="font-body text-xs text-ink-faint">
                  {training.instructor.position?.name ?? 'Instrutor'}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Sessões */}
      {training.sessions && training.sessions.length > 0 && (
        <Card className="mb-5 overflow-hidden">
          <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
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
                        href={session.meetingUrl}
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
      <Card className="mb-5 p-5">
        <div className="mb-3 font-body text-sm font-semibold text-ink">
          Avaliar este treinamento
        </div>
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

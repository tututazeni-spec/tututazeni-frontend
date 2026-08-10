// components/trainings/DetailView.tsx
// Separador "Detalhe" — header, sessões disponíveis, avaliação e
// avaliações de outros. Dados próprios + apresentação. Extraído de
// app/(platform)/trainings/page.tsx.

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar, Skeleton, StarRating } from './atoms';
import { LEVEL_CFG, TYPE_CFG } from './constants';
import { fmtDate, fmtHours } from './utils';
import type { Training, TrainingType } from './types';

interface DetailViewProps {
  trainingId: number;
  onBack: () => void;
}

export function DetailView({ trainingId, onBack }: DetailViewProps) {
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
      onSuccess: () => alert('Inscrição realizada!'),
      onError: (e) => alert(e.message),
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
        alert('Avaliação enviada!');
        setRating(0);
        setComment('');
      },
      onError: (e) => alert(e.message),
    },
  );
  const submittingRating = rateMutation.isPending;
  const handleRate = () => {
    if (rating) rateMutation.mutate(undefined);
  };

  if (loading || !training) return <Skeleton rows={6} />;

  const typeCfg = TYPE_CFG[training.type];

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5"
      >
        ← Voltar ao catálogo
      </button>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-5">
        <div className="h-40 bg-gradient-to-br from-blue-700 to-blue-900 relative overflow-hidden">
          {training.thumbnailUrl && (
            <Image
              src={training.thumbnailUrl}
              alt=""
              fill
              className="object-cover opacity-40"
            />
          )}
          <div className="absolute inset-0 flex items-end p-5">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs px-2 py-0.5 rounded font-medium ${typeCfg.cls}`}
              >
                {typeCfg.icon} {typeCfg.label}
              </span>
              <StatusBadge value={training.level} map={LEVEL_CFG} />
              {training.mandatory && (
                <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded">
                  Obrigatório
                </span>
              )}
              {training.issueCertificate && (
                <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded">
                  🏆 Certificado
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-5">
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {training.title}
          </h1>
          {training.shortDescription && (
            <p className="text-sm text-gray-600 mb-3">
              {training.shortDescription}
            </p>
          )}

          <div className="flex flex-wrap gap-4 text-xs text-gray-400 mb-4">
            <span>⏱ {fmtHours(training.workloadHours)}</span>
            <span>🌍 {training.language.toUpperCase()}</span>
            <span>👥 {training._count.participants} inscritos</span>
            <StarRating value={training.avgRating ?? null} />
          </div>

          {training.instructor && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Avatar
                name={training.instructor.fullName}
                avatarUrl={training.instructor.avatarUrl}
                size="md"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {training.instructor.fullName}
                </div>
                <div className="text-xs text-gray-400">
                  {training.instructor.position?.name ?? 'Instrutor'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sessões */}
      {training.sessions && training.sessions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-5">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
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
                className="flex items-center gap-4 px-4 py-4 border-b border-gray-100 last:border-0"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {fmtDate(session.sessionDate)}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <span>
                      {TYPE_CFG[session.modality as TrainingType]?.icon}{' '}
                      {TYPE_CFG[session.modality as TrainingType]?.label}
                    </span>
                    <span>⏱ {session.durationMinutes}min</span>
                    {session.location && <span>📍 {session.location}</span>}
                    {session.meetingUrl && (
                      <a
                        href={session.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        🔗 Link
                      </a>
                    )}
                  </div>
                  {vacancies !== null && (
                    <div className="mt-1 text-xs">
                      {isFull ? (
                        <span className="text-red-600">
                          Vagas esgotadas{' '}
                          {session.waitlistEnabled &&
                            '(lista de espera disponível)'}
                        </span>
                      ) : (
                        <span className="text-emerald-600">
                          {vacancies} vagas disponíveis
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleEnroll(session.id)}
                  disabled={enrolling === session.id}
                  className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isFull && !session.waitlistEnabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : isFull
                        ? 'bg-amber-600 text-white hover:bg-amber-700'
                        : 'bg-blue-700 text-white hover:bg-blue-800'
                  } disabled:opacity-50`}
                >
                  {enrolling === session.id
                    ? '…'
                    : isFull && session.waitlistEnabled
                      ? 'Lista de espera'
                      : isFull
                        ? 'Esgotado'
                        : 'Inscrever-me'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Avaliar */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <div className="text-sm font-semibold text-gray-900 mb-3">
          ⭐ Avaliar este treinamento
        </div>
        <div className="flex gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onClick={() => setRating(s)}
              className={`text-2xl transition-transform hover:scale-110 ${s <= rating ? 'text-amber-400' : 'text-gray-200'}`}
            >
              ★
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          placeholder="Comentário (opcional)…"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
        />
        <button
          onClick={handleRate}
          disabled={!rating || submittingRating}
          className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 disabled:opacity-50"
        >
          {submittingRating ? 'A enviar…' : 'Enviar avaliação'}
        </button>
      </div>

      {/* Avaliações dos outros */}
      {training.ratings && training.ratings.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-sm font-semibold text-gray-900 mb-3">
            Avaliações ({training._count.ratings})
          </div>
          <div className="space-y-3">
            {training.ratings.map((r) => (
              <div key={r.id} className="flex gap-3">
                <Avatar
                  name={r.user.fullName}
                  avatarUrl={r.user.avatarUrl}
                  size="sm"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-gray-800">
                      {r.user.fullName}
                    </span>
                    <div className="flex">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span
                          key={i}
                          className={`text-xs ${i < r.rating ? 'text-amber-400' : 'text-gray-200'}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  {r.comment && (
                    <p className="text-xs text-gray-600">{r.comment}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

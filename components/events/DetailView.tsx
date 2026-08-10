// components/events/DetailView.tsx
// Separador "Detalhe do Evento" — header, CTAs (inscrição/check-in/
// feedback), tabs (info/participantes). Dados próprios + apresentação.
// Extraído de app/(platform)/events/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useConfirm } from '@/providers/ConfirmProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime as fmtDateTime } from '@/lib/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar, Skeleton } from './atoms';
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
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        ← Voltar
      </button>

      {/* Header */}
      <div
        className={`bg-white border rounded-xl p-6 mb-5 ${isLive ? 'border-red-300' : 'border-gray-200'}`}
      >
        {isLive && (
          <div className="flex items-center gap-2 mb-3 text-red-600">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-semibold">Evento ao vivo agora</span>
          </div>
        )}

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded ${typeCfg.cls}`}>
                {typeCfg.icon} {typeCfg.label}
              </span>
              <StatusBadge
                value={event.status as EventStatus}
                map={STATUS_CFG}
                fallback={STATUS_CFG.PUBLISHED}
              />
              <span className="text-xs text-gray-400">
                {modalityCfg.icon} {modalityCfg.label}
              </span>
              {event.mandatory && (
                <span className="text-xs text-red-600 font-semibold">
                  Obrigatório
                </span>
              )}
              {event.certificateEnabled && (
                <span className="text-xs text-emerald-600">🎓 Certificado</span>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">
              {event.title}
            </h1>
            {event.description && (
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                {event.description}
              </p>
            )}
          </div>

          {/* CTA */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            {event.status === 'PUBLISHED' && (
              <button
                onClick={handleJoin}
                disabled={joinMutation.isPending}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${event.isFull && !event.waitlistEnabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-60'}`}
              >
                {joinMutation.isPending
                  ? '…'
                  : event.isFull
                    ? event.waitlistEnabled
                      ? 'Entrar na lista de espera'
                      : 'Lotado'
                    : '+ Inscrever-me'}
              </button>
            )}
            {(event.status === 'LIVE' || event.status === 'PUBLISHED') &&
              event.meetingUrl && (
                <a
                  href={event.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 text-center"
                >
                  🔴 Entrar no evento
                </a>
              )}
            <button
              onClick={handleCheckIn}
              disabled={checkInMutation.isPending}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {checkInMutation.isPending ? '…' : '✓ Check-in'}
            </button>
            {event.status === 'ENDED' && (
              <button
                onClick={() => setShowFeedback((s) => !s)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700"
              >
                ⭐ Avaliar evento
              </button>
            )}
          </div>
        </div>

        {/* Infos */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-400">
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
          <div className="flex flex-wrap gap-1.5 mt-3">
            {event.tags.map((t: string) => (
              <span
                key={t}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Formulário de feedback */}
      {showFeedback && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-5">
          <div className="text-sm font-semibold text-gray-900 mb-4">
            Avalia este evento
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">
                NPS — Recomendarias este evento a um colega? (1-10)
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <button
                    key={n}
                    onClick={() => setFeedback((f) => ({ ...f, nps: n }))}
                    className={`w-8 h-8 text-xs rounded-lg font-mono transition-colors ${feedback.nps === n ? 'bg-blue-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">
                Avaliação geral (1-5)
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setFeedback((f) => ({ ...f, rating: n }))}
                    className={`text-2xl transition-colors ${n <= feedback.rating ? 'text-amber-400' : 'text-gray-200 hover:text-amber-200'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <textarea
              rows={3}
              placeholder="Comentário (opcional)…"
              value={feedback.comment}
              onChange={(e) =>
                setFeedback((f) => ({ ...f, comment: e.target.value }))
              }
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleFeedback}
              disabled={feedbackMutation.isPending}
              className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-60"
            >
              {feedbackMutation.isPending ? 'A enviar…' : '✓ Enviar avaliação'}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-4">
        {(
          [
            { id: 'info', label: 'ℹ️ Informações' },
            {
              id: 'participants',
              label: `👥 Participantes (${event._count.participants})`,
            },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <Avatar
              name={event.organizer.fullName}
              avatarUrl={event.organizer.avatarUrl}
              size="md"
            />
            <div>
              <div className="text-sm font-medium text-gray-900">
                Organizado por
              </div>
              <div className="text-sm text-gray-500">
                {event.organizer.fullName}
              </div>
            </div>
          </div>
          {event.meetingPassword && (
            <div className="text-xs bg-blue-50 text-blue-700 rounded-lg px-3 py-2">
              🔑 Senha do meeting:{' '}
              <span className="font-mono font-bold">
                {event.meetingPassword}
              </span>
            </div>
          )}
        </div>
      )}

      {tab === 'participants' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {(event.participants ?? []).map((p) => (
            <div
              key={p.userId}
              className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0"
            >
              <Avatar
                name={p.user?.fullName ?? 'U'}
                avatarUrl={p.user?.avatarUrl}
                size="sm"
              />
              <div className="flex-1 text-sm text-gray-800">
                {p.user?.fullName}
              </div>
              <StatusBadge
                value={p.status as ParticipantStatus}
                map={PARTICIPANT_STATUS}
              />
            </div>
          ))}
          {(event.participants ?? []).length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              Sem participantes inscritos
            </div>
          )}
        </div>
      )}
    </div>
  );
}

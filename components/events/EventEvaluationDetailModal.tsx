// components/events/EventEvaluationDetailModal.tsx
// Ficha (só leitura) da avaliação feita por um participante a um evento, aberta
// ao clicar no cartão em "Avaliação". Mesmo desenho do modal de logística
// (DetailHeader + duas colunas).

'use client';

import {
  CalendarDays,
  MessageSquareText,
  Repeat,
  Star,
  ThumbsUp,
  UserRound,
} from 'lucide-react';
import { Modal, ModalContent } from '@/components/ui/Modal';
import {
  DetailDivider,
  DetailHeader,
  DetailInfoRow,
  DetailSectionRow,
} from '@/components/ui/DetailCardParts';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDateTime } from '@/lib/format';
import { EVALUATION_STATUS_CFG } from './constants';
import type { EventEvaluationRow, EventFeedback } from './types';

const ASPECTS: Array<{ key: keyof EventFeedback; label: string }> = [
  { key: 'rating', label: 'Avaliação geral' },
  { key: 'organizationRating', label: 'Organização' },
  { key: 'contentRating', label: 'Conteúdo' },
  { key: 'locationRating', label: 'Local' },
  { key: 'speakersRating', label: 'Oradores' },
  { key: 'logisticsRating', label: 'Logística' },
  { key: 'communicationRating', label: 'Comunicação' },
];

function Stars({ value }: { value: number | null }) {
  if (value == null) return <span className="text-ink-faint">—</span>;
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={14}
          strokeWidth={1.75}
          className={
            n <= value ? 'fill-accent text-accent' : 'text-border-strong'
          }
        />
      ))}
    </span>
  );
}

export interface EventEvaluationDetailModalProps {
  row: EventEvaluationRow;
  onClose: () => void;
}

export function EventEvaluationDetailModal({
  row,
  onClose,
}: EventEvaluationDetailModalProps) {
  const ev = row.evaluation;
  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={`Avaliação — ${row.user.fullName} — ${row.event.title}`}
        hideHeading
        navyClose
        className="max-h-[90vh] max-w-4xl overflow-y-auto"
      >
        <DetailHeader
          name={row.user.fullName}
          subtitle={[row.user.department?.name, row.user.unit?.name]
            .filter(Boolean)
            .join(' · ')}
        >
          <StatusBadge
            value={row.evaluationStatus}
            map={EVALUATION_STATUS_CFG}
            variant="pill"
          />
        </DetailHeader>

        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto_1fr]">
          <div className="space-y-4">
            <DetailInfoRow icon={CalendarDays} label="Evento">
              {row.event.title}
            </DetailInfoRow>
            <DetailInfoRow icon={CalendarDays} label="Data do evento">
              {formatDateTime(row.event.startAt)}
            </DetailInfoRow>
            <DetailInfoRow icon={UserRound} label="Participante">
              {row.user.fullName}
            </DetailInfoRow>
            <DetailInfoRow icon={CalendarDays} label="Avaliado em">
              {ev?.createdAt ? formatDateTime(ev.createdAt) : '—'}
            </DetailInfoRow>
            <DetailInfoRow icon={ThumbsUp} label="Recomendaria (NPS)">
              {ev ? `${ev.nps}/10` : '—'}
            </DetailInfoRow>
            <DetailInfoRow icon={Repeat} label="Participaria novamente">
              {ev ? <Stars value={ev.wouldAttendAgain} /> : '—'}
            </DetailInfoRow>
          </div>

          <DetailDivider />

          <div className="space-y-5">
            {!ev && (
              <p className="text-sm text-ink-muted">
                Este participante ainda não avaliou o evento.
              </p>
            )}
            {ev && (
              <>
                <DetailSectionRow icon={Star} label="Avaliação por aspecto">
                  <ul className="space-y-2">
                    {ASPECTS.map(({ key, label }) => (
                      <li
                        key={key}
                        className="flex items-center justify-between gap-3"
                      >
                        <span>{label}</span>
                        <Stars value={(ev[key] as number | null) ?? null} />
                      </li>
                    ))}
                  </ul>
                </DetailSectionRow>
                <DetailSectionRow icon={MessageSquareText} label="Comentário">
                  <p className="whitespace-pre-wrap">{ev.comment || '—'}</p>
                </DetailSectionRow>
              </>
            )}
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}

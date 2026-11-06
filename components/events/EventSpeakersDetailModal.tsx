// components/events/EventSpeakersDetailModal.tsx
// Ficha (só leitura) de um orador/convidado, aberta ao clicar no cartão do
// orador em "Oradores & Convidados". Mesmo desenho do modal de logística
// (DetailHeader + duas colunas).

'use client';

import {
  Building2,
  CalendarDays,
  ClipboardList,
  Mic2,
  Phone,
  Truck,
  UserRound,
  Wallet,
} from 'lucide-react';
import { Modal, ModalContent } from '@/components/ui/Modal';
import {
  DetailDivider,
  DetailHeader,
  DetailInfoRow,
  DetailSectionRow,
} from '@/components/ui/DetailCardParts';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate, formatKz, formatTime } from '@/lib/format';
import { SPEAKER_STATUS_CFG, SPEAKER_TYPE_CFG } from './constants';
import type { EventSpeaker } from './types';

export interface EventSpeakersDetailModalProps {
  speaker: EventSpeaker;
  eventTitle?: string;
  onClose: () => void;
}

export function EventSpeakersDetailModal({
  speaker: s,
  eventTitle,
  onClose,
}: EventSpeakersDetailModalProps) {
  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={`${s.name}${eventTitle ? ` — ${eventTitle}` : ''}`}
        hideHeading
        navyClose
        className="max-h-[90vh] max-w-4xl overflow-y-auto"
      >
        <DetailHeader
          name={s.name}
          subtitle={[SPEAKER_TYPE_CFG[s.type].label, s.organization, s.position]
            .filter(Boolean)
            .join(' · ')}
        >
          <StatusBadge
            value={s.status}
            map={SPEAKER_STATUS_CFG}
            variant="pill"
          />
        </DetailHeader>

        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto_1fr]">
          <div className="space-y-4">
            <DetailInfoRow icon={UserRound} label="Tipo">
              {SPEAKER_TYPE_CFG[s.type].label}
            </DetailInfoRow>
            <DetailInfoRow icon={Building2} label="Organização / cargo">
              {[s.organization, s.position].filter(Boolean).join(' · ') || '—'}
            </DetailInfoRow>
            <DetailInfoRow icon={Phone} label="Contacto">
              {s.contact || '—'}
            </DetailInfoRow>
            <DetailInfoRow icon={Mic2} label="Tema">
              {s.topic || '—'}
            </DetailInfoRow>
            <DetailInfoRow icon={CalendarDays} label="Sessão / horário">
              {s.session
                ? `${s.session.title} · ${formatDate(s.session.startAt)} ${formatTime(s.session.startAt)}–${formatTime(s.session.endAt)}`
                : s.schedule || '—'}
            </DetailInfoRow>
            <DetailInfoRow icon={Wallet} label="Honorários">
              {s.fee != null ? formatKz(Number(s.fee)) : '—'}
            </DetailInfoRow>
          </div>

          <DetailDivider />

          <div className="space-y-5">
            <DetailSectionRow icon={ClipboardList} label="Biografia">
              {s.bio || '—'}
            </DetailSectionRow>
            <DetailSectionRow
              icon={ClipboardList}
              label="Necessidades especiais"
            >
              {s.specialNeeds || '—'}
            </DetailSectionRow>
            <DetailSectionRow icon={Truck} label="Transporte e alojamento">
              {s.transport || s.accommodation ? (
                <ul className="space-y-1">
                  {s.transport && (
                    <li>
                      <span className="font-medium">Transporte:</span>{' '}
                      {s.transport}
                    </li>
                  )}
                  {s.accommodation && (
                    <li>
                      <span className="font-medium">Alojamento:</span>{' '}
                      {s.accommodation}
                    </li>
                  )}
                </ul>
              ) : (
                '—'
              )}
            </DetailSectionRow>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}

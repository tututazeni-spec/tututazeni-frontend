// components/events/EventCommunicationDetailModal.tsx
// Ficha (só leitura) de uma comunicação do evento, aberta ao clicar no cartão
// em "Comunicação". Mesmo desenho do modal de logística (DetailHeader + duas
// colunas).

'use client';

import {
  CalendarDays,
  MessageSquare,
  Radio,
  Send,
  Tag,
  UserRound,
  Users,
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
import {
  COMMUNICATION_CHANNEL_CFG,
  COMMUNICATION_STATUS_CFG,
  COMMUNICATION_TYPE_CFG,
} from './constants';
import type { EventCommunication } from './types';

export interface EventCommunicationDetailModalProps {
  communication: EventCommunication;
  onClose: () => void;
}

export function EventCommunicationDetailModal({
  communication: c,
  onClose,
}: EventCommunicationDetailModalProps) {
  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={`${c.subject} — ${c.event.title}`}
        hideHeading
        navyClose
        className="max-h-[90vh] max-w-4xl overflow-y-auto"
      >
        <DetailHeader name={c.subject} subtitle={c.event.title}>
          <StatusBadge
            value={c.status}
            map={COMMUNICATION_STATUS_CFG}
            variant="pill"
          />
        </DetailHeader>

        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto_1fr]">
          <div className="space-y-4">
            <DetailInfoRow icon={Tag} label="Tipo">
              {COMMUNICATION_TYPE_CFG[c.type].label}
            </DetailInfoRow>
            <DetailInfoRow icon={Radio} label="Canal">
              {COMMUNICATION_CHANNEL_CFG[c.channel].label}
            </DetailInfoRow>
            <DetailInfoRow icon={Users} label="Destinatários">
              {c.recipientCount}
            </DetailInfoRow>
            <DetailInfoRow icon={Send} label="Enviada em">
              {c.sentAt ? formatDateTime(c.sentAt) : '—'}
            </DetailInfoRow>
            <DetailInfoRow icon={UserRound} label="Criada por">
              {c.createdBy?.fullName ?? '—'}
            </DetailInfoRow>
            <DetailInfoRow icon={CalendarDays} label="Data do evento">
              {c.event.startAt ? formatDateTime(c.event.startAt) : '—'}
            </DetailInfoRow>
          </div>

          <DetailDivider />

          <div className="space-y-5">
            <DetailSectionRow icon={MessageSquare} label="Mensagem">
              <p className="whitespace-pre-wrap">{c.message || '—'}</p>
            </DetailSectionRow>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}

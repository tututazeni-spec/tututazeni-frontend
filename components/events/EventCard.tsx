// components/events/EventCard.tsx
// Cartão de evento (catálogo/os meus eventos). Extraído de
// app/(platform)/events/page.tsx. Migrado para a fundação de design:
// Card + Avatar + StatusBadge/ProgressBar da fundação. A cor da barra
// de ocupação (antes vermelho/âmbar/esmeralda por limiar) passa para um
// ponto de estado junto ao número de inscritos — mesmo padrão de
// `ENPS_ROWS` em components/engagement/OverviewTab.tsx — já que
// ProgressBar da fundação é mono-cor (bg-accent).

'use client';

import { formatDateTime as fmtDateTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  MODALITY_CFG,
  occupancyDotCls,
  PARTICIPANT_STATUS,
  STATUS_CFG,
  TYPE_CFG,
} from './constants';
import type { Event, ParticipantStatus } from './types';

interface EventCardProps {
  event: Event;
  onSelect: () => void;
  myStatus?: ParticipantStatus;
}

export function EventCard({ event, onSelect, myStatus }: EventCardProps) {
  const typeCfg = TYPE_CFG[event.type] ?? TYPE_CFG.TRAINING;
  const modalityCfg = MODALITY_CFG[event.modalidade] ?? MODALITY_CFG.ONLINE;

  return (
    <Card
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        'cursor-pointer overflow-hidden transition-shadow duration-150 hover:shadow-hover',
        event.status === 'LIVE' ? 'border-danger' : 'hover:border-primary',
      )}
    >
      {/* Banner / Header */}
      <div className={cn('h-2', typeCfg.barCls)} />

      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded px-1.5 py-0.5 font-body text-xs',
                typeCfg.cls,
              )}
            >
              {typeCfg.icon} {typeCfg.label}
            </span>
            <StatusBadge
              value={event.status}
              map={STATUS_CFG}
              fallback={STATUS_CFG.PUBLISHED}
            />
            {event.mandatory && (
              <span className="font-body text-xs font-medium text-danger">
                Obrigatório
              </span>
            )}
          </div>
        </div>

        <div className="mb-1 line-clamp-2 font-body text-sm font-semibold text-ink">
          {event.title}
        </div>

        <div className="mb-3 flex items-center gap-3 font-body text-xs text-ink-faint">
          <span>
            {modalityCfg.label}
          </span>
          <span>{fmtDateTime(event.startAt)}</span>
          {event.location && <span>{event.location}</span>}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar
              name={event.organizer.fullName}
              url={event.organizer.avatarUrl ?? undefined}
              size="sm"
            />
            <span className="font-body text-xs text-ink-muted">
              {event.organizer.fullName}
            </span>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 font-body text-xs">
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  occupancyDotCls(event.occupancyRate),
                )}
              />
              <span
                className={cn(
                  'font-medium',
                  event.isFull ? 'text-danger' : 'text-ink-muted',
                )}
              >
                {event._count.participants}/{event.maxCapacity}
              </span>
              {event.isFull && (
                <span className="text-danger">• Lotado</span>
              )}
            </div>
            {myStatus && (
              <StatusBadge value={myStatus} map={PARTICIPANT_STATUS} />
            )}
          </div>
        </div>

        {/* Barra de ocupação */}
        {event.occupancyRate !== null && (
          <ProgressBar
            value={Math.min(event.occupancyRate, 100)}
            className="mt-2"
          />
        )}
      </div>
    </Card>
  );
}

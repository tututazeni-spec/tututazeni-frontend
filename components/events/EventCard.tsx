// components/events/EventCard.tsx
// Cartão de evento (catálogo/os meus eventos). Extraído de
// app/(platform)/events/page.tsx.

'use client';

import { formatDateTime as fmtDateTime } from '@/lib/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from './atoms';
import {
  MODALITY_CFG,
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
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`bg-white border rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-all ${
        event.status === 'LIVE'
          ? 'border-red-300'
          : 'border-gray-200 hover:border-blue-200'
      }`}
    >
      {/* Banner / Header */}
      <div
        className={`h-2 ${typeCfg.cls.includes('blue') ? 'bg-blue-500' : typeCfg.cls.includes('amber') ? 'bg-amber-500' : typeCfg.cls.includes('emerald') ? 'bg-emerald-500' : typeCfg.cls.includes('purple') ? 'bg-purple-500' : 'bg-gray-400'}`}
      />

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-1.5 py-0.5 rounded ${typeCfg.cls}`}>
              {typeCfg.icon} {typeCfg.label}
            </span>
            <StatusBadge
              value={event.status}
              map={STATUS_CFG}
              fallback={STATUS_CFG.PUBLISHED}
            />
            {event.mandatory && (
              <span className="text-xs text-red-600 font-medium">
                Obrigatório
              </span>
            )}
          </div>
        </div>

        <div className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
          {event.title}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
          <span>
            {modalityCfg.icon} {modalityCfg.label}
          </span>
          <span>📅 {fmtDateTime(event.startAt)}</span>
          {event.location && <span>📍 {event.location}</span>}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar
              name={event.organizer.fullName}
              avatarUrl={event.organizer.avatarUrl}
              size="sm"
            />
            <span className="text-xs text-gray-500">
              {event.organizer.fullName}
            </span>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-xs">
              <span
                className={`font-medium ${event.isFull ? 'text-red-600' : 'text-gray-500'}`}
              >
                {event._count.participants}/{event.maxCapacity}
              </span>
              {event.isFull && <span className="text-red-600">• Lotado</span>}
            </div>
            {myStatus && (
              <StatusBadge value={myStatus} map={PARTICIPANT_STATUS} />
            )}
          </div>
        </div>

        {/* Barra de ocupação */}
        {event.occupancyRate !== null && (
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${event.occupancyRate >= 90 ? 'bg-red-500' : event.occupancyRate >= 70 ? 'bg-amber-400' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(event.occupancyRate, 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

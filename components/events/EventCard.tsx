// components/events/EventCard.tsx
// Cartão de evento (catálogo/os meus eventos) — o que aparece depois de o
// evento ser publicado. Desenho dos cartões do módulo evaluation360 (borda
// `rounded-card`, faixa de título no topo, corpo por baixo), mas a faixa usa a
// cor do cartão de rascunho (EventListCard → PALETTE/headerBackground) e
// mantém toda a informação desse cartão: imagem, estado, data, inscritos,
// organizador, local, título, referência e subtítulo.

'use client';

import { Building2, CalendarDays, MapPin, Users } from 'lucide-react';
import { formatDate as fmtDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/Avatar';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  headerBackground,
  PALETTE,
} from '@/components/onboarding/TemplateCard';
import {
  occupancyDotCls,
  PARTICIPANT_STATUS,
  STATUS_CFG,
  TYPE_CFG,
} from './constants';
import { InfoRow, Metric } from './EventListCard';
import type { Event, ParticipantStatus } from './types';

interface EventCardProps {
  event: Event;
  onSelect: () => void;
  myStatus?: ParticipantStatus;
}

export function EventCard({ event: e, onSelect, myStatus }: EventCardProps) {
  const palette = PALETTE[Math.abs(e.id) % PALETTE.length];
  const typeCfg = TYPE_CFG[e.type] ?? TYPE_CFG.CORPORATE;
  const TypeIcon = typeCfg.icon;
  const reference = e.code
    ? `#${e.code}`
    : `#EVT-${String(e.id).padStart(4, '0')}`;
  const place = e.location ?? (e.modalidade === 'ONLINE' ? 'Online' : null);
  const subtitle = [
    e.category ?? typeCfg.label,
    e.department?.name,
    e.unit?.name,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(ev) => {
        if (ev.target !== ev.currentTarget) return;
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        'relative flex cursor-pointer flex-col overflow-hidden rounded-panel border bg-white shadow-[0_4px_14px_rgba(21,47,89,0.08)] transition-all duration-200 ease-out hover:scale-[1.03] hover:shadow-[0_10px_24px_rgba(21,47,89,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 motion-reduce:hover:scale-100',
        e.status === 'LIVE' ? 'border-danger' : 'border-[#D8E2F0]',
      )}
    >
      {/* Faixa de título (desenho NavyStatCard) — cor do cartão de rascunho */}
      <div
        className="flex min-h-[60px] shrink-0 items-center py-2 pl-[80px] pr-3 text-white"
        style={{ background: headerBackground(palette) }}
      >
        <div className="min-w-0">
          <h3 className="line-clamp-2 font-body text-[15px] font-semibold leading-tight">
            {e.title}
          </h3>
          <p className="mt-0.5 line-clamp-2 text-xs text-white/80">
            {subtitle}
          </p>
        </div>
      </div>
      <span
        aria-hidden
        className="absolute left-4 top-[32px] z-10 flex h-[58px] w-[58px] items-center justify-center rounded-full border-[3px] border-white text-white shadow-sm"
        style={{ background: palette[3] }}
      >
        <TypeIcon size={26} strokeWidth={1.75} />
      </span>

      {/* Imagem do evento (ou ícone do tipo) */}
      <div className="relative h-[140px] shrink-0 bg-brand-line">
        {e.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={e.bannerUrl}
            alt={`Imagem do evento ${e.title}`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-brand-muted">
            <TypeIcon size={40} strokeWidth={1.5} aria-hidden />
          </div>
        )}
        <div className="absolute right-3 top-3 flex items-center gap-2">
          {e.mandatory && (
            <span className="rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-danger">
              Obrigatório
            </span>
          )}
          <StatusBadge
            value={e.status}
            map={STATUS_CFG}
            fallback={STATUS_CFG.PUBLISHED}
          />
        </div>
        <p className="absolute bottom-2 left-3 font-mono text-xs text-brand/70">
          {reference}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-y-2 divide-x divide-brand-line px-5 pt-4">
        <Metric icon={CalendarDays}>{fmtDate(e.startAt)}</Metric>
        <Metric icon={Users}>
          {e.confirmedCount ?? 0}/{e._count.participants} · {e.maxCapacity}
        </Metric>
      </div>

      <div className="flex-1 space-y-2 px-5 py-4">
        <InfoRow
          accent={palette[3]}
          leading={
            <Avatar
              name={e.organizer.fullName}
              url={e.organizer.avatarUrl ?? undefined}
              size="sm"
            />
          }
        >
          {e.organizer.fullName}
        </InfoRow>
        {e.department?.name && (
          <InfoRow icon={Building2} accent={palette[3]}>
            {e.department.name}
          </InfoRow>
        )}
        {place && (
          <InfoRow icon={MapPin} accent={palette[3]}>
            {place}
          </InfoRow>
        )}

        <div className="flex items-center justify-between pt-1 font-body text-xs">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                occupancyDotCls(e.occupancyRate),
              )}
            />
            <span
              className={cn(
                'font-medium',
                e.isFull ? 'text-danger' : 'text-ink-muted',
              )}
            >
              {e._count.participants}/{e.maxCapacity}
            </span>
            {e.isFull && <span className="text-danger">• Lotado</span>}
          </div>
          {myStatus && (
            <StatusBadge value={myStatus} map={PARTICIPANT_STATUS} />
          )}
        </div>
        {e.occupancyRate !== null && (
          <ProgressBar value={Math.min(e.occupancyRate, 100)} />
        )}
      </div>
    </div>
  );
}

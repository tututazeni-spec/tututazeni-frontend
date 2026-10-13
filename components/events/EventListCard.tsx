// components/events/EventListCard.tsx
// Cartão de evento da aba "Eventos". Mesmo desenho do TemplateCard do
// onboarding ("Planos de Integração"), mas com a cor na parte de baixo e,
// no topo, a imagem do evento (Event.bannerUrl, carregada no CreateEventModal).
// Sem imagem, o topo mostra um fundo neutro com o ícone do tipo de evento.

'use client';

import {
  CalendarDays,
  ChevronRight,
  MapPin,
  MoreVertical,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { formatDate as fmtDate } from '@/lib/format';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  headerBackground,
  PALETTE,
} from '@/components/onboarding/TemplateCard';
import { STATUS_CFG, TYPE_CFG } from './constants';
import type { Event } from './types';

export function Metric({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 px-3 text-[15px] text-[#0F1F3D] first:pl-0 last:pr-0">
      <Icon size={22} strokeWidth={1.75} className="shrink-0 text-[#49658A]" />
      <span>{children}</span>
    </div>
  );
}

export function InfoRow({
  icon: Icon,
  leading,
  accent,
  children,
}: {
  icon?: LucideIcon;
  /** Substitui o ícone (ex.: avatar do utilizador). */
  leading?: React.ReactNode;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] bg-[#EEF4FD] px-4 py-3 text-[15px] text-[#0F1F3D]">
      {leading ??
        (Icon && (
          <Icon
            size={20}
            strokeWidth={1.75}
            className="shrink-0"
            style={{ color: accent }}
          />
        ))}
      <span className="min-w-0 flex-1 break-words">{children}</span>
      <ChevronRight
        size={18}
        strokeWidth={1.75}
        className="shrink-0"
        style={{ color: accent }}
      />
    </div>
  );
}

export function EventListCard({
  event: e,
  onOpen,
  menu,
}: {
  event: Event;
  onOpen: () => void;
  /** Itens do menu de acções (DropdownMenuItem); omitido = sem menu. */
  menu?: React.ReactNode;
}) {
  const palette = PALETTE[Math.abs(e.id) % PALETTE.length];
  const typeCfg = TYPE_CFG[e.type] ?? TYPE_CFG.CORPORATE;
  const TypeIcon = typeCfg.icon;
  // Referência visível: código interno ou, se não houver, o id do evento
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
      onClick={onOpen}
      onKeyDown={(ev) => {
        if (ev.target !== ev.currentTarget) return;
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          onOpen();
        }
      }}
      className="flex cursor-pointer flex-col overflow-hidden rounded-[20px] border border-[#D8E2F0] bg-white shadow-[0_4px_14px_rgba(21,47,89,0.08)] transition-shadow duration-150 hover:shadow-[0_10px_24px_rgba(21,47,89,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
    >
      {/* Topo: imagem do evento */}
      <div className="relative h-[190px] shrink-0 bg-[#E3EAF4]">
        {e.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={e.bannerUrl}
            alt={`Imagem do evento ${e.title}`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#49658A]">
            <TypeIcon size={48} strokeWidth={1.5} aria-hidden />
          </div>
        )}
        <div className="absolute right-4 top-4 flex items-center gap-2">
          <StatusBadge value={e.status} map={STATUS_CFG} />
          {menu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Acções do evento"
                  onClick={(ev) => ev.stopPropagation()}
                  onKeyDown={(ev) => ev.stopPropagation()}
                  className="rounded-full bg-white/90 p-1.5 text-[#0F1F3D] shadow-sm hover:bg-white"
                >
                  <MoreVertical size={16} strokeWidth={1.75} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">{menu}</DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-y-2 divide-x divide-[#E6ECF4] px-7 py-6">
        <Metric icon={CalendarDays}>{fmtDate(e.startAt)}</Metric>
        <Metric icon={Users}>
          {e.confirmedCount ?? 0}/{e._count.participants} · {e.maxCapacity}
        </Metric>
      </div>

      <div className="mx-7 border-t border-[#E6ECF4]" />

      <div className="flex-1 space-y-2 px-7 py-6">
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
        {place && (
          <InfoRow icon={MapPin} accent={palette[3]}>
            {place}
          </InfoRow>
        )}
      </div>

      {/* Base: cor do cartão */}
      <div
        className="h-[180px] shrink-0 overflow-hidden p-6 text-white"
        style={{ background: headerBackground(palette) }}
      >
        <h3 className="line-clamp-2 font-display text-[22px] font-semibold leading-tight">
          {e.title}
        </h3>
        <p className="mt-1 min-h-5 font-mono text-sm text-white/70">
          {e.status !== 'PUBLISHED' ? reference : null}
        </p>
        <p className="mt-1 line-clamp-2 text-[17px] text-white/80">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

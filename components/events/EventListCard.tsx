// components/events/EventListCard.tsx
// Cartão de evento da aba "Eventos", no desenho de public/images/card para
// cursos criados.jpeg: a imagem do evento (Event.bannerUrl) ocupa o topo e
// desvanece para azul-marinho; por baixo, data/participantes e
// organizador/local, e o título com barra azul e botão redondo de abrir.
// Sem imagem, o topo mostra o ícone do tipo de evento.

'use client';

import {
  CalendarDays,
  ChevronRight,
  MapPin,
  MoreVertical,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { formatDate as fmtDate } from '@/lib/format';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PALETTE } from '@/components/onboarding/TemplateCard';
import { STATUS_CFG, TYPE_CFG } from './constants';
import type { Event } from './types';

export interface MetricProps {
  icon: LucideIcon;
  iconClassName?: string;
  children: React.ReactNode;
}

export function Metric({
  icon: Icon,
  iconClassName = 'text-[#49658A]',
  children,
}: MetricProps) {
  return (
    <div className="flex items-center gap-2 px-3 text-[15px] text-[#0F1F3D] first:pl-0 last:pr-0">
      <Icon
        size={22}
        strokeWidth={1.75}
        className={`shrink-0 ${iconClassName}`}
      />
      <span>{children}</span>
    </div>
  );
}

export interface InfoRowProps {
  icon?: LucideIcon;
  /** Substitui o ícone (ex.: avatar do utilizador). */
  leading?: React.ReactNode;
  accent: string;
  children: React.ReactNode;
}

export function InfoRow({
  icon: Icon,
  leading,
  accent,
  children,
}: InfoRowProps) {
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

function Fact({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 text-[15px] font-medium text-white">
      <Icon size={22} strokeWidth={1.5} className="shrink-0" aria-hidden />
      <span className="line-clamp-1 break-words">{children}</span>
    </div>
  );
}

export interface EventListCardProps {
  event: Event;
  onOpen: () => void;
  /** Itens do menu de acções (DropdownMenuItem); omitido = sem menu. */
  menu?: React.ReactNode;
}

export function EventListCard({ event: e, onOpen, menu }: EventListCardProps) {
  const palette = PALETTE[Math.abs(e.id) % PALETTE.length];
  const typeCfg = TYPE_CFG[e.type] ?? TYPE_CFG.CORPORATE;
  const TypeIcon = typeCfg.icon;
  const place = e.location ?? (e.modalidade === 'ONLINE' ? 'Online' : null);
  const subtitle = [
    e.category ?? typeCfg.label,
    e.department?.name,
    e.unit?.name,
  ]
    .filter(Boolean)
    .join(' - ');

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
      className="relative flex cursor-pointer flex-col overflow-hidden rounded-[20px] text-white shadow-[0_4px_14px_rgba(21,47,89,0.25)] transition-all duration-200 ease-out hover:shadow-[0_10px_24px_rgba(21,47,89,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      style={{
        background: `linear-gradient(180deg, ${palette[1]} 0%, ${palette[2]} 60%, ${palette[2]} 100%)`,
      }}
    >
      {/* Topo: imagem do evento a desvanecer para o azul-marinho */}
      <div className="relative h-[230px] shrink-0">
        {e.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={e.bannerUrl}
            alt={`Imagem do evento ${e.title}`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/50">
            <TypeIcon size={56} strokeWidth={1.25} aria-hidden />
          </div>
        )}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, ${palette[2]}00 40%, ${palette[2]}D9 80%, ${palette[1]} 100%)`,
          }}
        />
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
                  className="rounded-full bg-[#0F1F3D] p-2.5 text-white shadow-sm hover:bg-[#162B52]"
                >
                  <MoreVertical size={18} strokeWidth={1.75} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">{menu}</DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-4 px-6 pt-1">
        <Fact icon={CalendarDays}>{fmtDate(e.startAt)}</Fact>
        <Fact icon={Users}>
          {e.confirmedCount ?? 0}/{e._count.participants} - {e.maxCapacity}
        </Fact>
        <Fact icon={User}>{e.organizer.fullName}</Fact>
        {place ? <Fact icon={MapPin}>{place}</Fact> : <span />}
      </div>

      <div className="mt-6 flex flex-1 items-center gap-4 px-6 pb-6">
        <span
          aria-hidden
          className="h-16 w-1 shrink-0 self-stretch rounded-full"
          style={{ background: palette[0] }}
        />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-display text-[24px] font-semibold leading-tight">
            {e.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-[15px] text-[#C7D4E8]">
            {subtitle}
          </p>
        </div>
        <span
          aria-hidden
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white"
          style={{ background: palette[0] }}
        >
          <ChevronRight size={26} strokeWidth={2} />
        </span>
      </div>
    </div>
  );
}

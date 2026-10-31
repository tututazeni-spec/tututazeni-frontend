// components/live-classes/ClassCard.tsx
// Cartão de aula ao vivo no separador "Aulas" — desenho de
// public/images/cardaulasaovivo.jpeg: fundo azul-escuro com onda, imagem
// grande de contorno curvo no canto superior direito, título em maiúsculas,
// selos de estado, métricas com ícone, linhas com seta e botão laranja.

'use client';

import { Fragment, type ReactNode } from 'react';
import {
  Ban,
  BookOpen,
  CalendarClock,
  CalendarDays,
  ChevronRight,
  Clapperboard,
  Clock,
  Copy,
  Hourglass,
  MonitorPlay,
  MoreVertical,
  Play,
  Radio,
  Trash2,
  UserPlus,
  UserRound,
  Users,
  Video,
  type LucideIcon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { CourseThumbnail } from '@/components/courses/CourseThumbnail';
import { titleLines } from '@/components/courses/CourseListCard';
import { getStatus } from './utils';
import { MODALITY_CFG, STATUS_CFG, TYPE_CFG } from './constants';
import { formatDateNumeric, formatTime as fmtTime } from '@/lib/format';
import type { LiveClass } from './types';

export interface ClassCardProps {
  lc: LiveClass;
  canManage: boolean;
  onOpen: (id: number) => void;
  onViewRecording: (lc: LiveClass) => void;
  onDelete: (lc: LiveClass) => void;
  onStart: (lc: LiveClass) => void;
  onPostpone: (lc: LiveClass) => void;
  onCancel: (lc: LiveClass) => void;
  onDuplicate: (lc: LiveClass) => void;
  onAddInstructor: (lc: LiveClass) => void;
}

/** Tamanho do título: cabe a linha mais comprida em ~46% da largura do cartão. */
function titleFontSize(lines: string[]): string {
  const longest = Math.max(1, ...lines.map((l) => l.length));
  return `min(28px, calc((46cqw - 20px) / ${(longest * 0.74).toFixed(2)}))`;
}

/** "sábado, 31/10/2026" */
function weekdayDate(iso: string): string {
  const weekday = new Date(iso).toLocaleDateString('pt-PT', {
    weekday: 'long',
  });
  return `${weekday}, ${formatDateNumeric(iso)}`;
}

function Metric({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3.5 text-[15px] font-semibold text-white">
      <Icon
        size={24}
        strokeWidth={1.5}
        className="shrink-0 text-white"
        aria-hidden
      />
      <span>{children}</span>
    </div>
  );
}

function Row({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3.5 py-1.5 text-[15px] text-white">
      <Icon
        size={22}
        strokeWidth={1.5}
        className="shrink-0 text-white"
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <ChevronRight
        size={18}
        strokeWidth={1.75}
        className="shrink-0 text-white/80"
        aria-hidden
      />
    </div>
  );
}

export function ClassCard({
  lc,
  canManage,
  onOpen,
  onViewRecording,
  onDelete,
  onStart,
  onPostpone,
  onCancel,
  onDuplicate,
  onAddInstructor,
}: ClassCardProps) {
  const status = getStatus(lc.scheduledAt, lc.duration);
  const isLive = status === 'live';
  const lines = titleLines(lc.topic);
  const typeLabel = TYPE_CFG[lc.type]?.label ?? lc.type;
  const statusLabel =
    status === 'upcoming'
      ? 'Agendada'
      : status === 'past'
        ? 'Concluída'
        : (STATUS_CFG[lc.status]?.label ?? 'Em curso');

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(lc.id)}
      onKeyDown={(ev) => {
        if (ev.target !== ev.currentTarget) return;
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          onOpen(lc.id);
        }
      }}
      className="relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[28px] border border-white/10 text-white shadow-[0_6px_18px_rgba(10,30,90,0.35)] transition-shadow duration-200 ease-out hover:shadow-[0_12px_28px_rgba(10,30,90,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      style={{
        background:
          'linear-gradient(160deg, #0B3FA8 0%, #0A2F86 45%, #071E5C 100%)',
        containerType: 'inline-size',
      }}
    >
      {/* Onda decorativa atrás da imagem */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 top-0 h-[300px] w-[85%] rounded-bl-[200px] opacity-60"
        style={{
          background:
            'linear-gradient(200deg, rgba(60,130,255,0.55) 0%, rgba(30,80,200,0) 80%)',
        }}
      />

      {/* Topo: texto à esquerda, imagem de contorno curvo à direita */}
      <div className="relative min-h-[300px] shrink-0">
        <div className="absolute right-0 top-0 h-[250px] w-[50%] overflow-hidden rounded-bl-[130px] rounded-tl-[130px] rounded-tr-[28px] bg-white/10">
          <CourseThumbnail
            src={lc.thumbnailUrl}
            alt={`Imagem da aula ${lc.topic}`}
            className="object-cover"
            fallbackClassName="text-white/60"
          />
        </div>

        {canManage && (
          <div
            role="presentation"
            className="absolute right-3 top-3 z-20 rounded-full bg-black/40"
            onClick={(ev) => ev.stopPropagation()}
            onKeyDown={(ev) => ev.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Mais ações"
                  className="rounded-full p-2 text-white hover:bg-white/15"
                >
                  <MoreVertical size={18} strokeWidth={2} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onStart(lc)}>
                  <Play size={13} strokeWidth={1.75} className="mr-2 inline" />
                  Iniciar aula
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onAddInstructor(lc)}>
                  <UserPlus
                    size={13}
                    strokeWidth={1.75}
                    className="mr-2 inline"
                  />
                  Adicionar formador
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onPostpone(lc)}>
                  <CalendarClock
                    size={13}
                    strokeWidth={1.75}
                    className="mr-2 inline"
                  />
                  Adiar
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onDuplicate(lc)}>
                  <Copy size={13} strokeWidth={1.75} className="mr-2 inline" />
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onCancel(lc)}>
                  <Ban size={13} strokeWidth={1.75} className="mr-2 inline" />
                  Cancelar
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onDelete(lc)}>
                  <Trash2
                    size={13}
                    strokeWidth={1.75}
                    className="mr-2 inline"
                  />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <div className="relative z-10 w-[52%] pl-5 pt-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1E5BD8] shadow-inner">
              <Video size={22} strokeWidth={1.75} />
            </span>
            <span className="line-clamp-2 text-lg font-semibold leading-tight">
              {typeLabel}
            </span>
          </div>
          <h3
            className="pt-5 font-body font-extrabold uppercase leading-[1.1] tracking-wide"
            // A letra encolhe para que a linha mais comprida caiba sempre ao
            // lado da imagem (≈ 46% da largura do cartão), sem passar por baixo.
            style={{ fontSize: titleFontSize(lines) }}
          >
            {lines.map((line, i) => (
              <Fragment key={i}>
                {i > 0 && ' '}
                <span className="block whitespace-nowrap">{line}</span>
              </Fragment>
            ))}
          </h3>
        </div>

        {lc.course && (
          <p className="relative z-10 line-clamp-2 px-5 pt-3 text-lg leading-snug text-white/90">
            {lc.course.title}
          </p>
        )}
      </div>

      {/* Selos de estado */}
      <div className="flex flex-wrap items-center gap-2.5 px-5">
        {isLive && (
          <span className="inline-flex items-center gap-2 rounded-full bg-[#FFE3C7] px-3.5 py-1.5 text-sm font-bold text-[#C2410C]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#F97316]" />
            Ao vivo
          </span>
        )}
        <span className="inline-flex items-center gap-2 rounded-full bg-[#DCE9FF] px-3.5 py-1.5 text-sm font-bold text-[#0B3FA8]">
          <CalendarDays size={16} strokeWidth={1.75} />
          {statusLabel}
        </span>
        {lc.recordingUrl && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold">
            <Clapperboard size={14} strokeWidth={1.75} /> Gravação
          </span>
        )}
      </div>

      {/* Métricas */}
      <div className="space-y-3.5 px-5 pt-5">
        <Metric icon={CalendarDays}>{weekdayDate(lc.scheduledAt)}</Metric>
        <Metric icon={Clock}>{fmtTime(lc.scheduledAt)}</Metric>
        <Metric icon={Hourglass}>{lc.duration} min</Metric>
        <Metric icon={Users}>Presenças: {lc._count?.attendances ?? 0}</Metric>
      </div>

      {/* Linhas com seta */}
      <div className="mx-5 mt-5 flex-1 border-t border-white/20 pt-2.5">
        <Row icon={UserRound}>{lc.instructor?.name ?? 'Sem formador'}</Row>
        <Row icon={BookOpen}>{lc.course?.title ?? '—'}</Row>
        <Row icon={MonitorPlay}>
          {MODALITY_CFG[lc.modality]?.label ?? lc.modality}
        </Row>
      </div>

      {/* Ações */}
      <div
        role="presentation"
        className="flex gap-2 p-4 pt-3"
        onClick={(ev) => ev.stopPropagation()}
        onKeyDown={(ev) => ev.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onOpen(lc.id)}
          className="inline-flex flex-[2] items-center justify-center gap-2 rounded-full px-5 py-3.5 text-base font-bold text-white shadow-[0_4px_12px_rgba(249,115,22,0.45)] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          style={{
            background: 'linear-gradient(90deg, #F97316 0%, #EA580C 100%)',
          }}
        >
          <Radio size={18} strokeWidth={2} />
          {isLive ? 'Entrar agora' : 'Abrir sala'}
        </button>
        {lc.recordingUrl && (
          <button
            type="button"
            onClick={() => onViewRecording(lc)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white/15 px-4 py-3.5 text-sm font-semibold text-white hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Clapperboard size={16} strokeWidth={1.75} /> Ver
          </button>
        )}
      </div>
    </div>
  );
}

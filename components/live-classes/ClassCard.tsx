// components/live-classes/ClassCard.tsx
// Cartão de aula ao vivo no separador "Todas as Aulas" — mesmo desenho do
// cartão de curso criado (CourseListCard): fundo em gradiente na cor da
// paleta, título em maiúsculas, imagem recortada no canto superior direito,
// métricas empilhadas e linhas com seta. Mantém a informação própria da aula
// (estado, data/hora, duração, presenças, formador, modalidade) e as ações.

'use client';

import { Fragment } from 'react';
import {
  AlarmClock,
  Ban,
  BookOpen,
  Calendar,
  CalendarClock,
  Clapperboard,
  Copy,
  MonitorPlay,
  MoreVertical,
  Play,
  Radio,
  Timer,
  Trash2,
  UserRound,
  Users,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { PALETTE } from '@/components/onboarding/TemplateCard';
import { CourseThumbnail } from '@/components/courses/CourseThumbnail';
import {
  InfoRow,
  Metric,
  titleLines,
} from '@/components/courses/CourseListCard';
import { fmtDate, getStatus } from './utils';
import { MODALITY_CFG, STATUS_CFG, TYPE_CFG } from './constants';
import { formatTime as fmtTime } from '@/lib/format';
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
}: ClassCardProps) {
  const status = getStatus(lc.scheduledAt, lc.duration);
  const isLive = status === 'live';
  const palette = PALETTE[Math.abs(lc.id) % PALETTE.length];
  const typeLabel = TYPE_CFG[lc.type]?.label ?? lc.type;

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
      className={cn(
        'relative flex h-full cursor-pointer flex-col overflow-hidden rounded-panel border text-white shadow-[0_4px_14px_rgba(21,47,89,0.25)] transition-all duration-200 ease-out hover:scale-[1.03] hover:shadow-[0_10px_24px_rgba(21,47,89,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 motion-reduce:hover:scale-100',
        isLive ? 'border-danger ring-2 ring-danger/60' : 'border-white/10',
      )}
      style={{
        background: `linear-gradient(165deg, ${palette[1]} 0%, ${palette[2]} 60%, ${palette[2]} 100%)`,
      }}
    >
      {/* Zona de topo: texto à esquerda, imagem recortada à direita */}
      <div className="relative min-h-[240px] shrink-0">
        <div
          aria-hidden
          className="absolute -right-6 -top-4 h-[231px] w-[62%] rotate-6 rounded-[48px] opacity-80"
          style={{ background: palette[0] }}
        />
        <div className="absolute right-0 top-0 h-[220px] w-[57%] overflow-hidden rounded-bl-[56px] rounded-tl-[48px] bg-white/10">
          <CourseThumbnail
            src={lc.thumbnailUrl}
            alt={`Imagem da aula ${lc.topic}`}
            className="object-cover"
            fallbackClassName="text-white/60"
          />
        </div>
        {canManage && (
          <div
            className="absolute right-3 top-3 z-20 rounded-full bg-brand/70"
            onClick={(ev) => ev.stopPropagation()}
            onKeyDown={(ev) => ev.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Mais ações"
                  className="rounded-control p-1.5 text-on-brand-muted hover:bg-white/10 hover:text-white"
                >
                  <MoreVertical size={16} strokeWidth={1.75} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onStart(lc)}>
                  <Play size={13} strokeWidth={1.75} className="mr-2 inline" />
                  Iniciar aula
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
        <div className="relative z-10 w-[56%] px-5 pt-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
              <Video size={20} strokeWidth={1.75} />
            </span>
            <span className="line-clamp-2 text-sm font-medium leading-tight">
              {typeLabel}
            </span>
          </div>
          <div className="pt-5">
            <h3 className="font-body text-2xl font-extrabold uppercase leading-tight tracking-wide">
              {titleLines(lc.topic).map((line, i) => (
                <Fragment key={i}>
                  {i > 0 && ' '}
                  <span className="block whitespace-nowrap">{line}</span>
                </Fragment>
              ))}
            </h3>
            {lc.course && (
              <p className="line-clamp-2 pt-2 text-sm text-on-brand-muted">
                {lc.course.title}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex min-h-[28px] flex-wrap items-center gap-2 px-5 pt-3">
        {isLive ? (
          <Badge intent="danger">Ao vivo</Badge>
        ) : (
          <Badge intent={status === 'upcoming' ? 'warning' : 'neutral'}>
            {status === 'upcoming' ? 'Agendada' : 'Concluída'}
          </Badge>
        )}
        <Badge intent="info" dot={false}>
          {STATUS_CFG[lc.status]?.label ?? lc.status}
        </Badge>
        {lc.recordingUrl && (
          <Badge intent="success" dot={false}>
            <Clapperboard size={11} strokeWidth={1.75} /> Gravação
          </Badge>
        )}
      </div>

      <div className="space-y-3 px-5 pt-4">
        <Metric icon={Calendar}>{fmtDate(lc.scheduledAt)}</Metric>
        <Metric icon={AlarmClock}>{fmtTime(lc.scheduledAt)}</Metric>
        <Metric icon={Timer}>{lc.duration} min</Metric>
        <Metric icon={Users}>Presenças: {lc._count?.attendances ?? 0}</Metric>
      </div>

      <div className="mx-5 mt-4 flex-1 divide-y divide-white/10 border-t border-white/15">
        <InfoRow icon={UserRound}>
          <span className="line-clamp-1">
            {lc.instructor?.name ?? 'Sem formador'}
          </span>
        </InfoRow>
        <InfoRow icon={BookOpen}>
          <span className="line-clamp-1">{lc.course?.title ?? '—'}</span>
        </InfoRow>
        <InfoRow icon={MonitorPlay}>
          <span className="line-clamp-1">
            {MODALITY_CFG[lc.modality]?.label ?? lc.modality}
          </span>
        </InfoRow>
      </div>

      <div
        className="m-4 mt-2 flex gap-2"
        onClick={(ev) => ev.stopPropagation()}
        onKeyDown={(ev) => ev.stopPropagation()}
      >
        <Button
          type="button"
          intent={isLive ? 'danger' : 'onDark'}
          className="flex-[2] rounded-pill"
          onClick={() => onOpen(lc.id)}
        >
          {isLive ? (
            <>
              <Radio size={14} strokeWidth={1.75} /> Entrar agora
            </>
          ) : (
            'Abrir sala'
          )}
        </Button>
        {lc.recordingUrl && (
          <Button
            type="button"
            intent="onDarkGhost"
            className="flex-1"
            onClick={() => onViewRecording(lc)}
          >
            <Clapperboard size={14} strokeWidth={1.75} /> Ver
          </Button>
        )}
      </div>
    </div>
  );
}

// components/live-classes/ClassCard.tsx
// Cartão de aula no separador "Todas as Aulas". Migrado para design tokens.

import {
  Circle,
  Video,
  Clapperboard,
  Calendar,
  AlarmClock,
  Timer,
  Users,
  Trash2,
  MoreVertical,
  Play,
  CalendarClock,
  Ban,
  Copy,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { CARD, fmtDate, getStatus } from './utils';
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

  const statusBg = isLive
    ? 'bg-danger-subtle'
    : status === 'upcoming'
      ? 'bg-warning-subtle'
      : 'bg-surface';
  const statusText = isLive
    ? 'text-danger'
    : status === 'upcoming'
      ? 'text-warning'
      : 'text-ink-muted';
  const iconBg = isLive ? 'bg-danger-subtle' : 'bg-surface';

  return (
    <div
      className={`${CARD} p-4.5 flex flex-col gap-3 ${isLive ? 'border-l-4 border-l-danger' : ''}`}
    >
      {/* Status + Topic */}
      <div className="flex items-start gap-2.5">
        <div
          className={`w-10.5 h-10.5 rounded-[11px] ${iconBg} ${statusText} flex items-center justify-center flex-shrink-0`}
        >
          {isLive ? (
            <Circle size={20} strokeWidth={1.75} className="fill-current" />
          ) : (
            <Video size={20} strokeWidth={1.75} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex gap-1.5 items-center mb-0.75 flex-wrap">
            <span
              className={`text-xs font-black px-1.75 py-0.5 rounded-full ${statusBg} ${statusText} uppercase tracking-tight`}
            >
              {isLive
                ? '● Ao Vivo'
                : status === 'upcoming'
                  ? 'Agendada'
                  : 'Concluída'}
            </span>
            {lc.recordingUrl && (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-1.75 py-0.5 rounded-full bg-accent-subtle text-accent">
                <Clapperboard size={11} strokeWidth={1.75} /> Gravação
              </span>
            )}
          </div>
          <h3 className="m-0 text-sm font-bold text-ink overflow-hidden text-ellipsis whitespace-nowrap">
            {lc.topic}
          </h3>
          {lc.course && (
            <p className="mt-0.5 text-xs text-ink-muted">{lc.course.title}</p>
          )}
          <div className="mt-1.5 flex flex-wrap gap-1">
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${TYPE_CFG[lc.type]?.cls ?? ''}`}>
              {TYPE_CFG[lc.type]?.label ?? lc.type}
            </span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${STATUS_CFG[lc.status]?.cls ?? ''}`}>
              {STATUS_CFG[lc.status]?.label ?? lc.status}
            </span>
            <span className="rounded bg-surface-sunken px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">
              {MODALITY_CFG[lc.modality]?.label ?? lc.modality}
            </span>
            {lc.instructor && (
              <span className="rounded bg-surface-sunken px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">
                {lc.instructor.name}
              </span>
            )}
          </div>
        </div>
        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Mais ações"
                className="flex-shrink-0 rounded-lg p-1.5 text-ink-faint hover:bg-surface-sunken"
              >
                <MoreVertical size={16} strokeWidth={1.75} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onStart(lc)}>
                <Play size={13} strokeWidth={1.75} className="mr-2 inline" /> Iniciar aula
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onPostpone(lc)}>
                <CalendarClock size={13} strokeWidth={1.75} className="mr-2 inline" /> Adiar
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onDuplicate(lc)}>
                <Copy size={13} strokeWidth={1.75} className="mr-2 inline" /> Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onCancel(lc)}>
                <Ban size={13} strokeWidth={1.75} className="mr-2 inline" /> Cancelar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Meta */}
      <div className="flex gap-2.5 flex-wrap">
        {[
          { v: fmtDate(lc.scheduledAt), Icon: Calendar, k: 'date' },
          { v: fmtTime(lc.scheduledAt), Icon: AlarmClock, k: 'time' },
          { v: `${lc.duration}min`, Icon: Timer, k: 'dur' },
          { v: String(lc._count?.attendances ?? 0), Icon: Users, k: 'att' },
        ].map((m) => (
          <span
            key={m.k}
            className="inline-flex items-center gap-1 text-xs text-ink-muted"
          >
            <m.Icon size={12} strokeWidth={1.75} /> {m.v}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t border-surface">
        <button
          onClick={() => onOpen(lc.id)}
          className={`flex-[2] py-2 px-2 rounded-lg border-none text-canvas text-xs font-bold cursor-pointer ${
            isLive ? 'bg-danger' : 'bg-ink'
          }`}
        >
          {isLive ? (
            <span className="inline-flex items-center justify-center gap-1.5">
              <Circle size={12} strokeWidth={1.75} className="fill-current" />{' '}
              Entrar Agora
            </span>
          ) : (
            'Abrir Sala'
          )}
        </button>
        {lc.recordingUrl && (
          <button
            onClick={() => onViewRecording(lc)}
            className="flex-1 inline-flex items-center justify-center gap-1 py-2 px-2 rounded-lg border border-accent bg-accent-subtle text-accent text-xs font-semibold cursor-pointer"
          >
            <Clapperboard size={12} strokeWidth={1.75} /> Ver
          </button>
        )}
        <button
          onClick={() => onDelete(lc)}
          className="py-2 px-2.5 rounded-lg border border-danger-subtle bg-danger-subtle text-danger text-xs cursor-pointer"
        >
          <Trash2 size={13} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

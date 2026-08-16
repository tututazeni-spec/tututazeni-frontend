// components/live-classes/ClassCard.tsx
// Cartão de aula no separador "Todas as Aulas". Migrado para design tokens.

import { CARD, fmtDate, getStatus } from './utils';
import { formatTime as fmtTime } from '@/lib/format';
import type { LiveClass } from './types';

export interface ClassCardProps {
  lc: LiveClass;
  onOpen: (id: number) => void;
  onViewRecording: (lc: LiveClass) => void;
  onDelete: (lc: LiveClass) => void;
}

export function ClassCard({
  lc,
  onOpen,
  onViewRecording,
  onDelete,
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
          className={`w-10.5 h-10.5 rounded-[11px] ${iconBg} flex items-center justify-center text-xl flex-shrink-0`}
        >
          {isLive ? '🔴' : status === 'upcoming' ? '🎥' : '📹'}
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
              <span className="text-xs font-bold px-1.75 py-0.5 rounded-full bg-accent-subtle text-accent">
                🎬 Gravação
              </span>
            )}
          </div>
          <h3 className="m-0 text-sm font-bold text-ink overflow-hidden text-ellipsis whitespace-nowrap">
            {lc.topic}
          </h3>
          {lc.course && (
            <p className="mt-0.5 text-xs text-ink-muted">
              📚 {lc.course.title}
            </p>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="flex gap-2.5 flex-wrap">
        {[
          { v: fmtDate(lc.scheduledAt), i: '📅' },
          { v: fmtTime(lc.scheduledAt), i: '⏰' },
          { v: `${lc.duration}min`, i: '⏱️' },
          { v: String(lc._count?.attendances ?? 0), i: '👥' },
        ].map((m) => (
          <span key={m.i} className="text-xs text-ink-muted">
            {m.i} {m.v}
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
          {isLive ? '🔴 Entrar Agora' : 'Abrir Sala'}
        </button>
        {lc.recordingUrl && (
          <button
            onClick={() => onViewRecording(lc)}
            className="flex-1 py-2 px-2 rounded-lg border border-accent bg-accent-subtle text-accent text-xs font-semibold cursor-pointer"
          >
            🎬 Ver
          </button>
        )}
        <button
          onClick={() => onDelete(lc)}
          className="py-2 px-2.5 rounded-lg border border-danger-subtle bg-danger-subtle text-danger text-xs cursor-pointer"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

// components/live-classes/RecordingCard.tsx
// Cartão de gravação no separador "Gravações". Migrado para design tokens.

import { CARD, fmtDate, getEmbedUrl } from './utils';
import { YoutubeThumbnail } from './YoutubeThumbnail';
import type { LiveClass } from './types';

export interface RecordingCardProps {
  lc: LiveClass;
  onView: (lc: LiveClass) => void;
}

export function RecordingCard({ lc, onView }: RecordingCardProps) {
  const embedUrl = lc.recordingUrl ? getEmbedUrl(lc.recordingUrl) : null;

  return (
    <div className={`${CARD} overflow-hidden flex flex-col`}>
      {/* Thumbnail / Preview */}
      <div
        onClick={() => onView(lc)}
        className="relative bg-slate-900 aspect-video cursor-pointer flex items-center justify-center"
      >
        {/* fundo escuro intencional: thumbnail de vídeo */}
        {embedUrl?.includes('youtube') ? (
          <YoutubeThumbnail
            src={`https://img.youtube.com/vi/${embedUrl.split('/embed/')[1]?.split('?')[0]}/hqdefault.jpg`}
            alt={lc.topic}
          />
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-13 h-13 rounded-full flex items-center justify-center text-2xl"
            style={{ background: 'rgba(220,38,38,0.9)' }}
          >
            ▶
          </div>
        </div>
        <div className="absolute bottom-2 left-2.5 bg-black/70 rounded px-2 py-0.5 text-xs text-canvas font-semibold">
          {lc.duration} min
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5 flex-1 flex flex-col gap-2">
        <h3 className="m-0 text-sm font-bold text-ink leading-snug">
          {lc.topic}
        </h3>
        {lc.course && (
          <p className="m-0 text-xs text-ink-muted">📚 {lc.course.title}</p>
        )}
        <p className="m-0 text-xs text-ink-faint">
          📅 {fmtDate(lc.scheduledAt)}
        </p>

        <div className="flex gap-1.5 mt-auto">
          <button
            onClick={() => onView(lc)}
            className="flex-1 py-2 px-2 rounded-lg border-none bg-surface-sunken text-ink text-xs font-bold cursor-pointer"
          >
            ▶ Ver Gravação
          </button>
          <a
            href={lc.recordingUrl!}
            target="_blank"
            rel="noreferrer"
            className="py-2 px-3 rounded-lg border border-border bg-transparent text-xs text-ink-muted text-decoration-none inline-flex items-center"
          >
            ↗
          </a>
        </div>
      </div>
    </div>
  );
}

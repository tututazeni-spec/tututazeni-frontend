// components/live-classes/RecordingModal.tsx
// Overlay de reprodução de gravação (embed YouTube/Vimeo/Drive, vídeo
// nativo, ou link externo como fallback). Migrado para design tokens.

import { fmtDate, getEmbedUrl, isVideoUrl } from './utils';
import type { LiveClass } from './types';

export interface RecordingModalProps {
  lc: LiveClass;
  onClose: () => void;
}

export function RecordingModal({ lc, onClose }: RecordingModalProps) {
  const embedUrl = lc.recordingUrl ? getEmbedUrl(lc.recordingUrl) : null;
  const isNative = lc.recordingUrl
    ? isVideoUrl(lc.recordingUrl) && !embedUrl
    : false;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ backdropFilter: 'blur(8px)' }}
    >
      <div
        className="bg-slate-900 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden"
        style={{ animation: 'lv-up 0.2s ease' }}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/8 flex items-center gap-3.5">
          <div className="flex-1">
            <p className="m-0 text-sm font-bold text-canvas">{lc.topic}</p>
            {lc.course && (
              <p className="mt-0.5 text-xs text-ink-muted">
                📚 {lc.course.title} · {fmtDate(lc.scheduledAt)}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <a
              href={lc.recordingUrl!}
              target="_blank"
              rel="noreferrer"
              className="py-1.5 px-3 bg-white/8 border border-white/12 rounded-lg text-ink-faint text-xs no-underline"
            >
              Abrir ↗
            </a>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="w-8 h-8 bg-white/8 border-none rounded-lg flex items-center justify-center cursor-pointer text-ink-faint"
            >
              ×
            </button>
          </div>
        </div>

        {/* Player */}
        <div className="relative bg-black aspect-video">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full h-full border-none"
              allowFullScreen
              allow="autoplay; fullscreen; picture-in-picture"
            />
          ) : isNative ? (
            <video src={lc.recordingUrl!} controls className="w-full h-full" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3.5 p-6">
              <p className="text-4xl m-0">🎬</p>
              <p className="text-ink-faint text-sm m-0">
                Este formato não suporta pré-visualização inline.
              </p>
              <a
                href={lc.recordingUrl!}
                target="_blank"
                rel="noreferrer"
                className="py-2.25 px-5 bg-danger border-none rounded-lg text-canvas text-sm font-bold no-underline"
              >
                Abrir Gravação ↗
              </a>
            </div>
          )}
        </div>

        {/* Info footer */}
        <div className="p-3 flex gap-5 border-t border-white/6">
          {[
            { label: 'Duração planeada', value: `${lc.duration} min` },
            { label: 'Participantes', value: lc._count?.attendances ?? 0 },
            {
              label: 'Avaliação',
              value: lc.postEvaluation
                ? `⭐ ${lc.postEvaluation.averageScore.toFixed(1)}/5`
                : 'Sem avaliação',
            },
          ].map((f) => (
            <div key={f.label}>
              <p className="m-0 text-xs text-ink-muted uppercase tracking-tight">
                {f.label}
              </p>
              <p className="mt-0.5 text-sm text-ink-faint font-semibold">
                {f.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

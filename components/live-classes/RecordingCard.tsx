// components/live-classes/RecordingCard.tsx
// Cartão de gravação no separador "Gravações". Extraído de
// app/(platform)/live-classes/page.tsx.

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
    <div
      style={{
        ...CARD,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Thumbnail / Preview */}
      <div
        onClick={() => onView(lc)}
        style={{
          position: 'relative',
          background: '#0f172a',
          aspectRatio: '16/9',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {embedUrl?.includes('youtube') ? (
          <YoutubeThumbnail
            src={`https://img.youtube.com/vi/${embedUrl.split('/embed/')[1]?.split('?')[0]}/hqdefault.jpg`}
            alt={lc.topic}
          />
        ) : null}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(220,38,38,0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
            }}
          >
            ▶
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 10,
            background: 'rgba(0,0,0,0.7)',
            borderRadius: 6,
            padding: '2px 8px',
            fontSize: 11,
            color: '#fff',
            fontWeight: 600,
          }}
        >
          {lc.duration} min
        </div>
      </div>

      {/* Info */}
      <div
        style={{
          padding: '14px 16px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 700,
            color: '#1e293b',
            lineHeight: 1.35,
          }}
        >
          {lc.topic}
        </h3>
        {lc.course && (
          <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
            📚 {lc.course.title}
          </p>
        )}
        <p style={{ margin: 0, fontSize: 11.5, color: '#94a3b8' }}>
          📅 {fmtDate(lc.scheduledAt)}
        </p>

        <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
          <button
            onClick={() => onView(lc)}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 8,
              border: 'none',
              background: '#0f172a',
              color: '#fff',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ▶ Ver Gravação
          </button>
          <a
            href={lc.recordingUrl!}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: 'transparent',
              fontSize: 12,
              color: '#64748b',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            ↗
          </a>
        </div>
      </div>
    </div>
  );
}

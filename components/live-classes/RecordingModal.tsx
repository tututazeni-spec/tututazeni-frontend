// components/live-classes/RecordingModal.tsx
// Overlay de reprodução de gravação (embed YouTube/Vimeo/Drive, vídeo
// nativo, ou link externo como fallback). Extraído de
// app/(platform)/live-classes/page.tsx.

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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: '#0f172a',
          borderRadius: 20,
          width: '100%',
          maxWidth: 800,
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          animation: 'lv-up 0.2s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div style={{ flex: 1 }}>
            <p
              style={{
                margin: 0,
                fontSize: 14.5,
                fontWeight: 700,
                color: '#f1f5f9',
              }}
            >
              {lc.topic}
            </p>
            {lc.course && (
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                📚 {lc.course.title} · {fmtDate(lc.scheduledAt)}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href={lc.recordingUrl!}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8,
                color: '#94a3b8',
                fontSize: 12,
                textDecoration: 'none',
              }}
            >
              Abrir ↗
            </a>
            <button
              onClick={onClose}
              aria-label="Fechar"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                borderRadius: 8,
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#94a3b8',
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Player */}
        <div
          style={{
            position: 'relative',
            background: '#000',
            aspectRatio: '16/9',
          }}
        >
          {embedUrl ? (
            <iframe
              src={embedUrl}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allowFullScreen
              allow="autoplay; fullscreen; picture-in-picture"
            />
          ) : isNative ? (
            <video
              src={lc.recordingUrl!}
              controls
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: 14,
                padding: 24,
              }}
            >
              <p style={{ fontSize: 40, margin: 0 }}>🎬</p>
              <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>
                Este formato não suporta pré-visualização inline.
              </p>
              <a
                href={lc.recordingUrl!}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '9px 20px',
                  background: '#dc2626',
                  border: 'none',
                  borderRadius: 9,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Abrir Gravação ↗
              </a>
            </div>
          )}
        </div>

        {/* Info footer */}
        <div
          style={{
            padding: '12px 22px',
            display: 'flex',
            gap: 20,
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
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
              <p
                style={{
                  margin: 0,
                  fontSize: 10,
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                }}
              >
                {f.label}
              </p>
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: 13,
                  color: '#94a3b8',
                  fontWeight: 600,
                }}
              >
                {f.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

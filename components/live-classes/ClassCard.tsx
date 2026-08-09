// components/live-classes/ClassCard.tsx
// Cartão de aula no separador "Todas as Aulas". Extraído de
// app/(platform)/live-classes/page.tsx.

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

  return (
    <div
      style={{
        ...CARD,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        borderLeft: isLive ? '4px solid #dc2626' : undefined,
      }}
    >
      {/* Status + Topic */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 11,
            background: isLive ? '#fef2f2' : '#f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          {isLive ? '🔴' : status === 'upcoming' ? '🎥' : '📹'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              gap: 6,
              alignItems: 'center',
              marginBottom: 3,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: 20,
                background: isLive
                  ? '#fef2f2'
                  : status === 'upcoming'
                    ? '#fffbeb'
                    : '#f1f5f9',
                color: isLive
                  ? '#dc2626'
                  : status === 'upcoming'
                    ? '#d97706'
                    : '#64748b',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {isLive
                ? '● Ao Vivo'
                : status === 'upcoming'
                  ? 'Agendada'
                  : 'Concluída'}
            </span>
            {lc.recordingUrl && (
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 20,
                  background: '#f5f3ff',
                  color: '#7c3aed',
                }}
              >
                🎬 Gravação
              </span>
            )}
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 700,
              color: '#1e293b',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {lc.topic}
          </h3>
          {lc.course && (
            <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#64748b' }}>
              📚 {lc.course.title}
            </p>
          )}
        </div>
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {[
          { v: fmtDate(lc.scheduledAt), i: '📅' },
          { v: fmtTime(lc.scheduledAt), i: '⏰' },
          { v: `${lc.duration}min`, i: '⏱️' },
          { v: String(lc._count?.attendances ?? 0), i: '👥' },
        ].map((m) => (
          <span key={m.i} style={{ fontSize: 11.5, color: '#64748b' }}>
            {m.i} {m.v}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          paddingTop: 4,
          borderTop: '1px solid #f1f5f9',
        }}
      >
        <button
          onClick={() => onOpen(lc.id)}
          style={{
            flex: 2,
            padding: '8px',
            borderRadius: 8,
            border: 'none',
            background: isLive ? '#dc2626' : '#1e293b',
            color: '#fff',
            fontSize: 12.5,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {isLive ? '🔴 Entrar Agora' : 'Abrir Sala'}
        </button>
        {lc.recordingUrl && (
          <button
            onClick={() => onViewRecording(lc)}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 8,
              border: '1px solid #e9d5ff',
              background: '#f5f3ff',
              color: '#7c3aed',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🎬 Ver
          </button>
        )}
        <button
          onClick={() => onDelete(lc)}
          style={{
            padding: '8px 10px',
            borderRadius: 8,
            border: '1px solid #fecaca',
            background: '#fef2f2',
            fontSize: 12,
            cursor: 'pointer',
            color: '#dc2626',
          }}
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

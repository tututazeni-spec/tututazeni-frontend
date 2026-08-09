// components/live-classes/UpcomingStrip.tsx
// Faixa horizontal "Próximas Sessões" (ao vivo agora + agendadas).
// Extraído de app/(platform)/live-classes/page.tsx.

import { fmtDate, getStatus } from './utils';
import { formatTime as fmtTime } from '@/lib/format';
import type { LiveClass } from './types';

export interface UpcomingStripProps {
  upcoming: LiveClass[];
  onOpen: (id: number) => void;
}

export function UpcomingStrip({ upcoming, onOpen }: UpcomingStripProps) {
  const visible = upcoming.filter(
    (lc) => getStatus(lc.scheduledAt, lc.duration) !== 'past',
  );
  if (visible.length === 0) return null;

  return (
    <div style={{ marginBottom: 22 }}>
      <p
        style={{
          margin: '0 0 10px',
          fontSize: 11,
          fontWeight: 700,
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}
      >
        📅 Próximas Sessões
      </p>
      <div
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          paddingBottom: 4,
        }}
      >
        {visible.map((lc) => {
          const status = getStatus(lc.scheduledAt, lc.duration);
          return (
            <div
              key={lc.id}
              onClick={() => onOpen(lc.id)}
              style={{
                flexShrink: 0,
                background: '#fff',
                border: `1px solid ${status === 'live' ? '#fca5a5' : '#e2e8f0'}`,
                borderRadius: 12,
                padding: '12px 16px',
                cursor: 'pointer',
                minWidth: 200,
                maxWidth: 240,
                borderLeft: status === 'live' ? '4px solid #dc2626' : undefined,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 5,
                }}
              >
                {status === 'live' && (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#dc2626',
                      display: 'inline-block',
                      animation: 'lv-ping 1.2s ease-in-out infinite',
                    }}
                  />
                )}
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: status === 'live' ? '#dc2626' : '#d97706',
                    textTransform: 'uppercase',
                  }}
                >
                  {status === 'live' ? 'Ao Vivo Agora' : 'Agendada'}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#1e293b',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {lc.topic}
              </p>
              <p
                style={{
                  margin: '3px 0 0',
                  fontSize: 11,
                  color: '#64748b',
                }}
              >
                {fmtDate(lc.scheduledAt)} · {fmtTime(lc.scheduledAt)}
              </p>
              <div style={{ marginTop: 8 }}>
                <span
                  style={{
                    padding: '4px 10px',
                    background: status === 'live' ? '#dc2626' : '#1e293b',
                    color: '#fff',
                    borderRadius: 7,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {status === 'live' ? '▶ Entrar Agora' : 'Ver Sala'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

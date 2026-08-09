// components/evaluation360/FeedbackTab.tsx
// Lista de feedback contínuo recebido fora dos ciclos formais. Extraído de
// app/(platform)/evaluation360/page.tsx.

'use client';

import type { ContinuousFeedback } from './types';
import { COLORS, timeAgo } from './colors';

export interface FeedbackTabProps {
  feedbacks: ContinuousFeedback[];
}

export function FeedbackTab({ feedbacks }: FeedbackTabProps) {
  const typeConfig: Record<
    string,
    { label: string; color: string; icon: string }
  > = {
    RECOGNITION: { label: 'Reconhecimento', color: '#22c55e', icon: '★' },
    DEVELOPMENT: { label: 'Desenvolvimento', color: '#818cf8', icon: '◎' },
    CHECK_IN: { label: 'Check-in 1:1', color: '#60a5fa', icon: '◆' },
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 800,
              color: COLORS.text,
            }}
          >
            Feedback Contínuo
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: COLORS.muted }}>
            Feedbacks recebidos fora dos ciclos formais
          </p>
        </div>
        <button
          style={{
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            border: 'none',
            borderRadius: 8,
            padding: '9px 18px',
            fontSize: 13,
            fontWeight: 700,
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          + Dar Feedback
        </button>
      </div>
      {feedbacks.map((fb) => {
        const cfg = typeConfig[fb.type];
        return (
          <div
            key={fb.id}
            style={{
              background: COLORS.surface,
              borderLeft: `3px solid ${cfg.color}`,
              border: `1px solid ${COLORS.border}`,
              borderLeftColor: cfg.color,
              borderRadius: '0 10px 10px 0',
              padding: '16px 20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 16,
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <span style={{ color: cfg.color, fontSize: 14 }}>
                    {cfg.icon}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: cfg.color,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {cfg.label}
                  </span>
                  {fb.competency && (
                    <span
                      style={{
                        fontSize: 11,
                        color: COLORS.muted,
                        background: '#1e2a3a',
                        padding: '2px 8px',
                        borderRadius: 10,
                      }}
                    >
                      {fb.competency}
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: '#374151' }}>
                    · {timeAgo(fb.createdAt)}
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: '#cbd5e1',
                    lineHeight: 1.6,
                  }}
                >
                  {fb.message}
                </p>
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: COLORS.muted }}>
              por <strong style={{ color: '#94a3b8' }}>{fb.fromName}</strong>
            </div>
          </div>
        );
      })}
    </div>
  );
}

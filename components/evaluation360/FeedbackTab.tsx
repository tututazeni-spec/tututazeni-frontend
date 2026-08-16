// components/evaluation360/FeedbackTab.tsx
// Lista de feedback contínuo recebido fora dos ciclos formais. Extraído de
// app/(platform)/evaluation360/page.tsx.
//
// NOTA: Os tipos de feedback (RECOGNITION, DEVELOPMENT, CHECK_IN) usam cores
// categóricas para codificação de tipo, não ordinal. Estas são data-viz exceptions.

'use client';

import type { ContinuousFeedback } from './types';
import { COLORS, timeAgo } from './colors';
import { Button } from '@/components/ui/Button';

export interface FeedbackTabProps {
  feedbacks: ContinuousFeedback[];
}

export function FeedbackTab({ feedbacks }: FeedbackTabProps) {
  const typeConfig: Record<
    string,
    { label: string; color: string; icon: string }
  > = {
    RECOGNITION: {
      label: 'Reconhecimento',
      color: 'rgb(34, 197, 94)',
      icon: '★',
    },
    DEVELOPMENT: {
      label: 'Desenvolvimento',
      color: 'rgb(129, 140, 248)',
      icon: '◎',
    },
    CHECK_IN: { label: 'Check-in 1:1', color: 'rgb(96, 165, 250)', icon: '◆' },
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="m-0 text-lg font-bold text-ink">
            Feedback Contínuo
          </h2>
          <p className="m-0 mt-1 text-sm text-ink-muted">
            Feedbacks recebidos fora dos ciclos formais
          </p>
        </div>
        <Button intent="primary" size="sm">
          + Dar Feedback
        </Button>
      </div>
      {feedbacks.map((fb) => {
        const cfg = typeConfig[fb.type];
        return (
          <div
            key={fb.id}
            className="rounded-r-lg border border-l-4 bg-surface p-4"
            style={{ borderLeftColor: cfg.color }}
          >
            <div className="flex justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm" style={{ color: cfg.color }}>
                    {cfg.icon}
                  </span>
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                  {fb.competency && (
                    <span className="text-xs text-ink-muted bg-surface-sunken px-2 py-0.5 rounded-full">
                      {fb.competency}
                    </span>
                  )}
                  <span className="text-xs text-ink-muted">
                    · {timeAgo(fb.createdAt)}
                  </span>
                </div>
                <p className="m-0 text-sm text-ink leading-relaxed">
                  {fb.message}
                </p>
              </div>
            </div>
            <div className="mt-2.5 text-xs text-ink-muted">
              por <strong className="text-ink-muted">{fb.fromName}</strong>
            </div>
          </div>
        );
      })}
    </div>
  );
}

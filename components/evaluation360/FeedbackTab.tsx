// components/evaluation360/FeedbackTab.tsx
// Lista de feedback contínuo recebido fora dos ciclos formais. Extraído de
// app/(platform)/evaluation360/page.tsx.
//
// NOTA: Os tipos de feedback (RECOGNITION, DEVELOPMENT, CHECK_IN) usam cores
// categóricas para codificação de tipo, não ordinal. Estas são data-viz exceptions.

'use client';

import { useState } from 'react';
import type { ContinuousFeedback } from './types';
import { timeAgo } from './colors';
import { GiveFeedbackModal } from './GiveFeedbackModal';
import { Button } from '@/components/ui/Button';

export interface FeedbackTabProps {
  feedbacks: ContinuousFeedback[];
}

export function FeedbackTab({ feedbacks }: FeedbackTabProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [added, setAdded] = useState<ContinuousFeedback[]>([]);
  const allFeedbacks = [...added, ...feedbacks];

  const typeConfig: Record<string, { label: string; color: string }> = {
    RECOGNITION: { label: 'Reconhecimento', color: 'rgb(34, 197, 94)' },
    DEVELOPMENT: { label: 'Desenvolvimento', color: 'rgb(129, 140, 248)' },
    CHECK_IN: { label: 'Check-in 1:1', color: 'rgb(96, 165, 250)' },
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="m-0 text-lg font-bold text-ink">Feedback Contínuo</h2>
          <p className="m-0 mt-1 text-sm text-ink-muted">
          </p>
        </div>
        <Button intent="primary" size="sm" onClick={() => setModalOpen(true)}>
          + Dar Feedback
        </Button>
      </div>
      {allFeedbacks.map((fb) => {
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
      {modalOpen && (
        <GiveFeedbackModal
          onClose={() => setModalOpen(false)}
          onCreate={(fb) => setAdded((prev) => [fb, ...prev])}
        />
      )}
    </div>
  );
}

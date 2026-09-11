// components/evaluation360/FeedbackTab.tsx
// Lista de feedback contínuo recebido fora dos ciclos formais, do
// participante actualmente visto na página (ver Evaluation360View.tsx).
// Dados reais (GET /evaluation360/feedback/continuous/:userId, ver
// hooks/useEvaluation360.ts) — "+ Dar Feedback" persiste via
// GiveFeedbackModal, que invalida esta lista ao ter sucesso.
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
  toUserId: string;
}

export function FeedbackTab({ feedbacks, toUserId }: FeedbackTabProps) {
  const [modalOpen, setModalOpen] = useState(false);

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
        </div>
        <Button intent="primary" size="sm" onClick={() => setModalOpen(true)}>
          + Dar Feedback
        </Button>
      </div>
      {feedbacks.length === 0 && (
        <div className="rounded-lg border border-border bg-surface p-5 text-sm text-ink-muted">
          Ainda sem feedback contínuo.
        </div>
      )}
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
                  <span className="text-xs text-ink-muted">· {timeAgo(fb.createdAt)}</span>
                </div>
                <p className="m-0 text-sm text-ink leading-relaxed">{fb.message}</p>
              </div>
            </div>
            <div className="mt-2.5 text-xs text-ink-muted">
              por <strong className="text-ink-muted">{fb.fromName}</strong>
            </div>
          </div>
        );
      })}
      {modalOpen && (
        <GiveFeedbackModal toUserId={toUserId} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}

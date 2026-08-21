// components/avatar-training/ResultsModal.tsx
// Overlay de resultado final da sessão (score, comportamental, pontos
// fortes/a melhorar, repetir/próximo). Extraído de
// app/(platform)/avatar-training/page.tsx.
//
// Backdrop+painel bespoke passam a Modal/ModalContent (Radix Dialog,
// components/ui/Modal) — mesmo padrão de ChatSession.tsx /
// components/documents/UploadModal.tsx.
//
// GRADE_CONFIG é uma rampa ordinal de 5 níveis (excepcional→a melhorar)
// contra só 4 tokens de severidade (success/info/warning/danger) — AVERAGE
// e BELOW_AVERAGE partilham `warning` (ambos "zona de atenção"), em vez de
// inventar um 5º tom. O ProgressBar da fundação é mono-cor: a cor que
// antes ia na barra (score comportamental) já está no texto acima dela
// via SCORE_COLOR — mesmo padrão de components/engagement/AnalyticsTab.tsx.

import { ArrowRight, Clock, RefreshCw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SCORE_COLOR } from './constants';
import type { SessionResult } from './types';

export interface ResultsModalProps {
  result: SessionResult;
  onClose: () => void;
  onRetry: () => void;
  onNext?: () => void;
}

const GRADE_CONFIG: Record<
  string,
  { emoji: string; color: string; label: string }
> = {
  EXCEPTIONAL: {
    emoji: '🏆',
    color: 'text-success',
    label: 'Excepcional',
  },
  ABOVE_AVERAGE: {
    emoji: '⭐',
    color: 'text-info',
    label: 'Acima da Média',
  },
  AVERAGE: { emoji: '👍', color: 'text-warning', label: 'Médio' },
  BELOW_AVERAGE: {
    emoji: '📈',
    color: 'text-warning',
    label: 'Abaixo da Média',
  },
  NEEDS_IMPROVEMENT: {
    emoji: '🎯',
    color: 'text-danger',
    label: 'Melhorar',
  },
};

export function ResultsModal({
  result,
  onClose,
  onRetry,
  onNext,
}: ResultsModalProps) {
  const score = result.finalScore ?? 0;
  const grade = result.grade ?? 'AVERAGE';
  const g = GRADE_CONFIG[grade] ?? GRADE_CONFIG.AVERAGE;

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent title="Resultado da Sessão" className="w-full max-w-md">
        {/* Score */}
        <div className="text-center mt-4 mb-6">
          <div className="text-5xl mb-2">{g.emoji}</div>
          <p className={`text-5xl font-black ${g.color}`}>{score}</p>
          <p className="text-lg font-semibold text-ink mt-1">{g.label}</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="flex items-center gap-1 text-accent font-bold text-sm">
              <Zap size={14} strokeWidth={1.75} />+{result.xpEarned} XP
            </span>
            {result.durationSeconds && (
              <span className="flex items-center gap-1 text-ink-faint text-xs">
                <Clock size={14} strokeWidth={1.75} />
                {Math.round(result.durationSeconds / 60)} min
              </span>
            )}
          </div>
        </div>

        {/* Behavioral scores */}
        {result.behavioral && Object.keys(result.behavioral).length > 0 && (
          <div className="mb-4 space-y-2">
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
              Comportamental
            </p>
            {Object.entries(result.behavioral as Record<string, number>).map(
              ([k, v]) => (
                <div key={k}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-ink-muted capitalize">{k}</span>
                    <span className={`font-bold ${SCORE_COLOR(+v)}`}>{+v}</span>
                  </div>
                  <ProgressBar value={+v} />
                </div>
              ),
            )}
          </div>
        )}

        {/* Strengths / Improvements */}
        {((result.strengths?.length ?? 0) > 0 ||
          (result.improvements?.length ?? 0) > 0) && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {(result.strengths?.length ?? 0) > 0 && (
              <div className="bg-success-subtle rounded-card p-3">
                <p className="text-xs font-bold text-success-ink mb-1">
                  Pontos Fortes
                </p>
                {result.strengths?.slice(0, 2).map((s, i) => (
                  <p key={i} className="text-[10px] text-success-ink">
                    • {s}
                  </p>
                ))}
              </div>
            )}
            {(result.improvements?.length ?? 0) > 0 && (
              <div className="bg-warning-subtle rounded-card p-3">
                <p className="text-xs font-bold text-warning-ink mb-1">
                  Melhorar
                </p>
                {result.improvements?.slice(0, 2).map((s, i) => (
                  <p key={i} className="text-[10px] text-warning-ink">
                    • {s}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button intent="secondary" onClick={onRetry} className="flex-1">
            <RefreshCw size={14} strokeWidth={1.75} />
            Repetir
          </Button>
          {result.nextScenario && (
            <Button onClick={onNext} className="flex-1">
              Próximo
              <ArrowRight size={14} strokeWidth={1.75} />
            </Button>
          )}
          <Button intent="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}

// components/avatar-training/ResultsModal.tsx
// Overlay de resultado final da sessão (score, comportamental, pontos
// fortes/a melhorar, repetir/próximo). Extraído de
// app/(platform)/avatar-training/page.tsx.

import { ArrowRight, Clock, RefreshCw, Zap } from 'lucide-react';
import { ProgressBar } from './atoms';
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
    color: 'text-emerald-600',
    label: 'Excepcional',
  },
  ABOVE_AVERAGE: {
    emoji: '⭐',
    color: 'text-teal-600',
    label: 'Acima Média',
  },
  AVERAGE: { emoji: '👍', color: 'text-amber-600', label: 'Médio' },
  BELOW_AVERAGE: {
    emoji: '📈',
    color: 'text-orange-600',
    label: 'Abaixo Média',
  },
  NEEDS_IMPROVEMENT: {
    emoji: '🎯',
    color: 'text-red-600',
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
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        {/* Score */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">{g.emoji}</div>
          <p className={`text-5xl font-black ${g.color}`}>{score}</p>
          <p className="text-lg font-semibold text-slate-700 mt-1">{g.label}</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="flex items-center gap-1 text-amber-500 font-bold text-sm">
              <Zap size={14} />+{result.xpEarned} XP
            </span>
            {result.durationSeconds && (
              <span className="flex items-center gap-1 text-slate-400 text-xs">
                <Clock size={12} />
                {Math.round(result.durationSeconds / 60)} min
              </span>
            )}
          </div>
        </div>

        {/* Behavioral scores */}
        {result.behavioral && Object.keys(result.behavioral).length > 0 && (
          <div className="mb-4 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Comportamental
            </p>
            {Object.entries(result.behavioral as Record<string, number>).map(
              ([k, v]) => (
                <div key={k}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-slate-600 capitalize">{k}</span>
                    <span className={`font-bold ${SCORE_COLOR(+v)}`}>{+v}</span>
                  </div>
                  <ProgressBar
                    value={+v}
                    color={
                      +v >= 70
                        ? 'bg-emerald-500'
                        : +v >= 50
                          ? 'bg-amber-400'
                          : 'bg-red-400'
                    }
                  />
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
              <div className="bg-emerald-50 rounded-xl p-3">
                <p className="text-xs font-bold text-emerald-700 mb-1">
                  💪 Pontos Fortes
                </p>
                {result.strengths?.slice(0, 2).map((s, i) => (
                  <p key={i} className="text-[10px] text-emerald-700">
                    • {s}
                  </p>
                ))}
              </div>
            )}
            {(result.improvements?.length ?? 0) > 0 && (
              <div className="bg-amber-50 rounded-xl p-3">
                <p className="text-xs font-bold text-amber-700 mb-1">
                  🎯 Melhorar
                </p>
                {result.improvements?.slice(0, 2).map((s, i) => (
                  <p key={i} className="text-[10px] text-amber-700">
                    • {s}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onRetry}
            className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm rounded-xl hover:bg-slate-50"
          >
            <RefreshCw size={13} className="inline mr-1" />
            Repetir
          </button>
          {result.nextScenario && (
            <button
              onClick={onNext}
              className="flex-1 py-2.5 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700"
            >
              Próximo
              <ArrowRight size={13} className="inline ml-1" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm rounded-xl hover:bg-slate-50"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

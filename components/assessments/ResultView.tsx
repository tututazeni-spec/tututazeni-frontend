// components/assessments/ResultView.tsx
// Ecrã de resultado da avaliação (score, aprovação/reprovação, revisão por
// pergunta). Extraído de app/(platform)/assessments/page.tsx.

import {
  Hourglass,
  PartyPopper,
  Frown,
  Lightbulb,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { Assessment, AttemptResult } from './types';

export interface ResultViewProps {
  result: AttemptResult;
  assessment: Assessment;
  onRetry: () => void;
  onBack: () => void;
}

export function ResultView({
  result,
  assessment,
  onRetry,
  onBack,
}: ResultViewProps) {
  const { score, passed, totalQuestions, correctAnswers, needsManualReview } =
    result;
  const isPass = passed === true;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Score card */}
      <div
        className={`rounded-panel p-8 text-center mb-6 border ${
          needsManualReview
            ? 'bg-warning-subtle border-warning'
            : isPass
              ? 'bg-success-subtle border-success'
              : 'bg-danger-subtle border-danger'
        }`}
      >
        <div className="text-5xl mb-3">
          {needsManualReview ? (
            <Hourglass size={44} strokeWidth={1.5} />
          ) : isPass ? (
            <PartyPopper size={44} strokeWidth={1.5} />
          ) : (
            <Frown size={44} strokeWidth={1.5} />
          )}
        </div>
        <div
          className={`text-4xl font-bold font-data mb-2 ${
            needsManualReview
              ? 'text-warning-ink'
              : isPass
                ? 'text-success-ink'
                : 'text-danger-ink'
          }`}
        >
          {score}%
        </div>
        <div
          className={`text-lg font-semibold mb-1 ${
            needsManualReview
              ? 'text-warning-ink'
              : isPass
                ? 'text-success-ink'
                : 'text-danger-ink'
          }`}
        >
          {needsManualReview
            ? 'Aguarda revisão manual'
            : isPass
              ? 'Aprovado!'
              : 'Reprovado'}
        </div>
        <div
          className={`text-sm ${
            needsManualReview
              ? 'text-warning-ink'
              : isPass
                ? 'text-success-ink'
                : 'text-danger-ink'
          }`}
        >
          {needsManualReview
            ? 'As tuas respostas abertas serão revistas pelo instrutor'
            : `${correctAnswers}/${totalQuestions} corretas · Mínimo: ${assessment.passingScore}%`}
        </div>
      </div>

      {/* Progress visual */}
      <Card className="p-5 mb-5">
        <div className="flex justify-between text-xs text-ink-faint mb-2">
          <span>Score obtido</span>
          <span>Mínimo: {assessment.passingScore}%</span>
        </div>
        <div className="relative">
          <ProgressBar value={score} className="h-4" />
          {/* Passing line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-ink-faint"
            style={{ left: `${assessment.passingScore}%` }}
          />
        </div>
      </Card>

      {/* Per-question feedback */}
      {result.results && result.results.length > 0 && (
        <div className="space-y-3 mb-5">
          <div className="text-sm font-semibold text-ink-muted">
            Revisão das respostas
          </div>
          {result.results.map((r) => (
            <div
              key={r.questionId}
              className={`border rounded-card p-4 ${
                r.isCorrect === null
                  ? 'border-warning bg-warning-subtle'
                  : r.isCorrect
                    ? 'border-success bg-success-subtle'
                    : 'border-danger bg-danger-subtle'
              }`}
            >
              <div className="flex items-start gap-2 mb-2">
                <span
                  className={`text-sm flex-shrink-0 ${
                    r.isCorrect === null
                      ? 'text-warning-ink'
                      : r.isCorrect
                        ? 'text-success-ink'
                        : 'text-danger-ink'
                  }`}
                >
                  {r.isCorrect === null ? (
                    <Hourglass
                      size={13}
                      strokeWidth={1.75}
                      className="inline"
                    />
                  ) : r.isCorrect ? (
                    '✓'
                  ) : (
                    '✗'
                  )}
                </span>
                <span className="text-sm font-medium text-ink">
                  {r.questionText}
                </span>
              </div>
              {r.explanation && (
                <div className="text-xs text-ink-muted mt-2 pl-5">
                  <Lightbulb
                    size={13}
                    strokeWidth={1.75}
                    className="inline align-[-2px]"
                  />{' '}
                  {r.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button intent="secondary" className="flex-1" onClick={onBack}>
          ← Voltar
        </Button>
        {!isPass && assessment.maxAttempts === 0 && (
          <Button intent="primary" className="flex-1" onClick={onRetry}>
            <RefreshCw
              size={14}
              strokeWidth={1.75}
              className="inline align-[-2px]"
            />{' '}
            Repetir avaliação
          </Button>
        )}
      </div>
    </div>
  );
}

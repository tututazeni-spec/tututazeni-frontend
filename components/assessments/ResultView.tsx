// components/assessments/ResultView.tsx
// Ecrã de resultado da avaliação (score, aprovação/reprovação, revisão por
// pergunta), no desenho de public/images/resultado do curso.jpeg (ResultPanel).
// Extraído de app/(platform)/assessments/page.tsx.

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ResultPanel } from './ResultPanel';
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
    <div className="mx-auto max-w-2xl">
      <ResultPanel
        tone={needsManualReview ? 'pending' : isPass ? 'pass' : 'fail'}
        headline={`${score}%`}
        detail={
          needsManualReview
            ? 'As tuas respostas abertas serão revistas pelo instrutor'
            : `${correctAnswers}/${totalQuestions} corretas · Mínimo: ${assessment.passingScore}%`
        }
        score={score}
        passingScore={assessment.passingScore}
        review={result.results?.map((r) => ({
          id: r.questionId,
          text: r.questionText,
          correct: r.isCorrect,
          explanation: r.explanation,
        }))}
      />

      <div className="mt-5 flex gap-3">
        <Button intent="secondary" className="flex-1" onClick={onBack}>
          ← Voltar
        </Button>
        {!isPass &&
          assessment.maxAttempts === 0 &&
          assessment.type !== 'EXAM' && (
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

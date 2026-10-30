// components/evaluation/FormalEvaluationMyResult.tsx
// "Ver resultado" do colaborador numa avaliação formal já submetida, no mesmo
// desenho do resultado logo após a avaliação (ResultPanel). Os dados vêm da
// tentativa devolvida por GET /assessments/available (não há repetição).

import { ResultPanel } from '@/components/assessments/ResultPanel';
import { formatDateTimeNumeric } from '@/lib/format';
import type { FormalEvaluation } from './formalEvaluationTypes';

export function FormalEvaluationMyResult({
  evaluation: e,
}: {
  evaluation: FormalEvaluation;
}) {
  const a = e.myAttempt;
  if (!a) return null;

  const pending = a.needsManualReview && a.score == null;
  const score = a.score ?? 0;
  const grade = `${a.displayGrade ?? score} / ${e.maxGrade}`;

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-4 font-body text-lg font-semibold text-ink">
        {e.title}
      </h2>
      <ResultPanel
        tone={pending ? 'pending' : a.passed ? 'pass' : 'fail'}
        headline={pending ? '—' : `${score}%`}
        detail={
          pending
            ? 'As tuas respostas abertas serão revistas.'
            : `Nota: ${grade} · Mínimo: ${e.passingScore}%${a.qualitativeLabel ? ` · ${a.qualitativeLabel}` : ''}`
        }
        score={pending ? undefined : score}
        passingScore={e.passingScore}
        footer={
          a.submittedAt
            ? `Submetida em ${formatDateTimeNumeric(a.submittedAt)}`
            : undefined
        }
      />
    </div>
  );
}

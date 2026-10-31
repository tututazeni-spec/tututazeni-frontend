// components/evaluation/FormalEvaluationMyResult.tsx
// "Ver resultado" do colaborador numa avaliação formal já submetida, no mesmo
// desenho do resultado logo após a avaliação (ResultPanel). Os dados vêm da
// tentativa devolvida por GET /assessments/available (não há repetição).

import { ResultPanel } from '@/components/assessments/ResultPanel';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { formatDateTimeNumeric } from '@/lib/format';
import type { FormalEvaluation } from './formalEvaluationTypes';

interface MyReview {
  items: {
    questionId: number;
    questionText: string;
    isCorrect: boolean | null;
    yourAnswer: string | null;
    correctAnswer: string | null;
    explanation: string | null;
    reviewComment: string | null;
    open?: boolean;
    manualScore?: number | null;
    fileUrl?: string | null;
  }[];
}

export function FormalEvaluationMyResult({
  evaluation: e,
}: {
  evaluation: FormalEvaluation;
}) {
  const a = e.myAttempt;
  // A correcção pode estar desligada na avaliação (allowReview/RESULT_ONLY):
  // nesse caso o pedido falha ou vem vazio e mostra-se só a nota.
  const { data: review } = useApiQuery<MyReview>(
    queryKeys.formalEvaluations.myReview(a?.id ?? 0),
    `/assessments/attempts/${a?.id}/my-review`,
    { enabled: !!a, retry: false },
  );
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
        review={review?.items.map((i) => ({
          id: i.questionId,
          text: i.questionText,
          correct: i.isCorrect,
          explanation: i.explanation,
          yourAnswer: i.yourAnswer,
          correctAnswer: i.correctAnswer,
          comment: i.reviewComment,
          open: i.open,
          grade: i.manualScore,
          fileUrl: i.fileUrl,
        }))}
        footer={
          a.submittedAt
            ? `Submetida em ${formatDateTimeNumeric(a.submittedAt)}`
            : undefined
        }
      />
    </div>
  );
}

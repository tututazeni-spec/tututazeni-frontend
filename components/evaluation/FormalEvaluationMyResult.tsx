// components/evaluation/FormalEvaluationMyResult.tsx
// "Ver resultado" do colaborador numa avaliação formal já submetida: nota,
// aprovação e rótulo qualitativo, a partir da tentativa devolvida por
// GET /assessments/available (não há repetição nas avaliações formais).

import { Frown, Hourglass, PartyPopper } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
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
  const passed = a.passed === true;
  const tone = pending
    ? 'border-warning bg-warning-subtle text-warning-ink'
    : passed
      ? 'border-success bg-success-subtle text-success-ink'
      : 'border-danger bg-danger-subtle text-danger-ink';
  const Icon = pending ? Hourglass : passed ? PartyPopper : Frown;
  const score = a.score ?? 0;

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-4 font-body text-lg font-semibold text-ink">
        {e.title}
      </h2>
      <div className={`mb-6 rounded-panel border p-8 text-center ${tone}`}>
        <Icon size={44} strokeWidth={1.5} className="mx-auto mb-3" />
        <div className="mb-2 font-data text-4xl font-bold">
          {pending ? '—' : `${a.displayGrade ?? score} / ${e.maxGrade}`}
        </div>
        <div className="mb-1 text-lg font-semibold">
          {pending
            ? 'Aguarda revisão manual'
            : passed
              ? 'Aprovado'
              : 'Reprovado'}
        </div>
        <div className="text-sm">
          {pending
            ? 'As tuas respostas abertas serão revistas.'
            : `${score}% · Mínimo: ${e.passingScore}%${a.qualitativeLabel ? ` · ${a.qualitativeLabel}` : ''}`}
        </div>
      </div>

      {!pending && (
        <Card className="mb-5 p-5">
          <div className="mb-2 flex justify-between text-xs text-ink-faint">
            <span>Pontuação obtida</span>
            <span>Mínimo: {e.passingScore}%</span>
          </div>
          <div className="relative">
            <ProgressBar value={score} className="h-4" />
            <div
              className="absolute bottom-0 top-0 w-0.5 bg-ink-faint"
              style={{ left: `${e.passingScore}%` }}
            />
          </div>
        </Card>
      )}

      {a.submittedAt && (
        <p className="text-center text-xs text-ink-faint">
          Submetida em {formatDateTimeNumeric(a.submittedAt)}
        </p>
      )}
    </div>
  );
}

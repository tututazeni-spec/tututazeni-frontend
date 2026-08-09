// components/assessments/ResultView.tsx
// Ecrã de resultado da avaliação (score, aprovação/reprovação, revisão por
// pergunta). Extraído de app/(platform)/assessments/page.tsx.

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
        className={`rounded-2xl p-8 text-center mb-6 ${
          needsManualReview
            ? 'bg-amber-50 border border-amber-200'
            : isPass
              ? 'bg-emerald-50 border border-emerald-200'
              : 'bg-red-50 border border-red-200'
        }`}
      >
        <div className="text-5xl mb-3">
          {needsManualReview ? '⏳' : isPass ? '🎉' : '😔'}
        </div>
        <div
          className={`text-4xl font-bold font-mono mb-2 ${
            needsManualReview
              ? 'text-amber-700'
              : isPass
                ? 'text-emerald-700'
                : 'text-red-700'
          }`}
        >
          {score}%
        </div>
        <div
          className={`text-lg font-semibold mb-1 ${
            needsManualReview
              ? 'text-amber-800'
              : isPass
                ? 'text-emerald-800'
                : 'text-red-800'
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
              ? 'text-amber-600'
              : isPass
                ? 'text-emerald-600'
                : 'text-red-600'
          }`}
        >
          {needsManualReview
            ? 'As tuas respostas abertas serão revistas pelo instrutor'
            : `${correctAnswers}/${totalQuestions} corretas · Mínimo: ${assessment.passingScore}%`}
        </div>
      </div>

      {/* Progress visual */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>Score obtido</span>
          <span>Mínimo: {assessment.passingScore}%</span>
        </div>
        <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${isPass ? 'bg-emerald-500' : 'bg-red-500'}`}
            style={{ width: `${score}%` }}
          />
          {/* Passing line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-gray-400"
            style={{ left: `${assessment.passingScore}%` }}
          />
        </div>
      </div>

      {/* Per-question feedback */}
      {result.results && result.results.length > 0 && (
        <div className="space-y-3 mb-5">
          <div className="text-sm font-semibold text-gray-700">
            Revisão das respostas
          </div>
          {result.results.map((r) => (
            <div
              key={r.questionId}
              className={`border rounded-xl p-4 ${
                r.isCorrect === null
                  ? 'border-amber-200 bg-amber-50'
                  : r.isCorrect
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-start gap-2 mb-2">
                <span
                  className={`text-sm flex-shrink-0 ${
                    r.isCorrect === null
                      ? 'text-amber-600'
                      : r.isCorrect
                        ? 'text-emerald-600'
                        : 'text-red-600'
                  }`}
                >
                  {r.isCorrect === null ? '⏳' : r.isCorrect ? '✓' : '✗'}
                </span>
                <span className="text-sm font-medium text-gray-800">
                  {r.questionText}
                </span>
              </div>
              {r.explanation && (
                <div className="text-xs text-gray-600 mt-2 pl-5">
                  💡 {r.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-2.5 border border-gray-200 text-sm rounded-xl hover:bg-gray-50"
        >
          ← Voltar
        </button>
        {!isPass && assessment.maxAttempts === 0 && (
          <button
            onClick={onRetry}
            className="flex-1 py-2.5 bg-blue-700 text-white text-sm font-medium rounded-xl hover:bg-blue-800"
          >
            🔄 Repetir avaliação
          </button>
        )}
      </div>
    </div>
  );
}

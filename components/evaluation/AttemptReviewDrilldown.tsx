// components/evaluation/AttemptReviewDrilldown.tsx
// Respostas completas de UM participante de uma avaliação formal —
// GET /assessments/attempts/:attemptId/review (EVAL_CREATOR_ROLES). Padrão
// de listagem de respostas reaproveitado de components/assessments/ReviewView.tsx.

'use client';

import { Hourglass } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Skeleton } from '@/components/assessments/Skeleton';
import type { AttemptReview } from './formalEvaluationTypes';

export interface AttemptReviewDrilldownProps {
  attemptId: number;
  onClose: () => void;
}

export function AttemptReviewDrilldown({ attemptId, onClose }: AttemptReviewDrilldownProps) {
  const { data: attempt, isLoading } = useApiQuery<AttemptReview>(
    queryKeys.formalEvaluations.attemptReview(attemptId),
    `/assessments/attempts/${attemptId}/review`,
  );

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={attempt?.user?.fullName ?? 'Respostas do participante'}
        description={attempt?.assessment.title}
        className="max-w-xl max-h-[85vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-3">
          {isLoading && <Skeleton rows={3} />}
          {attempt && (
            <>
              <Card className="flex items-center justify-between p-4">
                <div>
                  <div className="text-xs text-ink-faint">Nota</div>
                  <div className="text-lg font-bold text-ink font-data">
                    {attempt.displayGrade ?? '—'} / {attempt.assessment.maxGrade}
                  </div>
                </div>
                <Badge intent={attempt.qualitativeLabel === 'Excelente' || attempt.qualitativeLabel === 'Bom' ? 'success' : attempt.qualitativeLabel === 'Regular' ? 'warning' : 'danger'}>
                  {attempt.qualitativeLabel ?? attempt.status}
                </Badge>
              </Card>

              {attempt.answers.map((ans) => (
                <div
                  key={ans.id}
                  className={`rounded-card border p-4 ${
                    ans.isCorrect === null
                      ? 'border-warning bg-warning-subtle'
                      : ans.isCorrect
                        ? 'border-success bg-success-subtle'
                        : 'border-danger bg-danger-subtle'
                  }`}
                >
                  <div className="mb-1 flex items-start gap-2">
                    <span>
                      {ans.isCorrect === null ? (
                        <Hourglass size={13} strokeWidth={1.75} className="inline" />
                      ) : ans.isCorrect ? (
                        '✓'
                      ) : (
                        '✗'
                      )}
                    </span>
                    <p className="text-xs font-medium text-ink">{ans.question?.questionText}</p>
                  </div>
                  {ans.textAnswer && (
                    <p className="mt-1 pl-5 text-xs text-ink-muted">{ans.textAnswer}</p>
                  )}
                  {ans.reviewComment && (
                    <p className="mt-1 pl-5 text-xs text-primary">{ans.reviewComment}</p>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}

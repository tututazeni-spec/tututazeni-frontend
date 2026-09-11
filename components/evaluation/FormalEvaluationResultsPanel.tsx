// components/evaluation/FormalEvaluationResultsPanel.tsx
// Resultados totais de uma avaliação formal — nomes + nota gerada pela
// plataforma (GET /assessments/:id/results, EVAL_CREATOR_ROLES). Clique
// numa linha abre AttemptReviewDrilldown com as respostas completas.

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { Badge, type BadgeProps } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal, ModalContent } from '@/components/ui/Modal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { Skeleton } from '@/components/assessments/Skeleton';
import { AttemptReviewDrilldown } from './AttemptReviewDrilldown';
import type { ResultsRoster } from './formalEvaluationTypes';

export interface FormalEvaluationResultsPanelProps {
  assessmentId: number;
  onClose: () => void;
}

const LABEL_INTENT: Record<string, BadgeProps['intent']> = {
  Excelente: 'success',
  Bom: 'success',
  Regular: 'warning',
  Mau: 'danger',
};

export function FormalEvaluationResultsPanel({
  assessmentId,
  onClose,
}: FormalEvaluationResultsPanelProps) {
  const { data, isLoading } = useApiQuery<ResultsRoster>(
    queryKeys.formalEvaluations.results(assessmentId),
    `/assessments/${assessmentId}/results`,
  );
  const [reviewAttemptId, setReviewAttemptId] = useState<number | null>(null);

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={data?.assessment.title ?? 'Resultados'}
        description="Nota gerada pela plataforma para cada participante. Clica numa linha para ver as respostas completas."
        className="max-w-2xl max-h-[85vh] overflow-y-auto"
      >
        <div className="mt-5">
          {isLoading && <Skeleton rows={4} />}
          {data && data.roster.length === 0 && (
            <EmptyState
              title="Ainda sem resultados"
              description="Ninguém submeteu esta avaliação até ao momento."
            />
          )}
          {data && data.roster.length > 0 && (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Participante</TableHeaderCell>
                  <TableHeaderCell>Departamento</TableHeaderCell>
                  <TableHeaderCell>Nota</TableHeaderCell>
                  <TableHeaderCell>Resultado</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.roster.map((row) => (
                  <TableRow
                    key={row.attemptId}
                    className="cursor-pointer"
                    onClick={() => setReviewAttemptId(row.attemptId)}
                  >
                    <TableCell className="font-medium text-ink">{row.fullName}</TableCell>
                    <TableCell className="text-ink-muted">{row.department ?? '—'}</TableCell>
                    <TableCell className="font-data">
                      {row.displayGrade ?? '—'} / {data.assessment.maxGrade}
                    </TableCell>
                    <TableCell>
                      <Badge intent={LABEL_INTENT[row.qualitativeLabel ?? ''] ?? 'neutral'}>
                        {row.qualitativeLabel ?? row.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </ModalContent>

      {reviewAttemptId !== null && (
        <AttemptReviewDrilldown
          attemptId={reviewAttemptId}
          onClose={() => setReviewAttemptId(null)}
        />
      )}
    </Modal>
  );
}

// components/evaluation/FormalEvaluationResultsPanel.tsx
// Resultados totais de uma avaliação formal — nomes + nota gerada pela
// plataforma (GET /assessments/:id/results, EVAL_CREATOR_ROLES). Clique
// numa linha abre AttemptReviewDrilldown com as respostas completas.

'use client';

import { useMemo, useState } from 'react';
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
  // Da maior nota para a menor; sem nota (a aguardar revisão) no fim.
  const roster = useMemo(
    () =>
      [...(data?.roster ?? [])].sort((a, b) => {
        const ga = a.displayGrade ?? a.score;
        const gb = b.displayGrade ?? b.score;
        if (ga == null && gb == null)
          return a.fullName.localeCompare(b.fullName);
        if (ga == null) return 1;
        if (gb == null) return -1;
        return gb - ga || a.fullName.localeCompare(b.fullName);
      }),
    [data?.roster],
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
              <TableHead className="bg-brand/60">
                <TableRow className="hover:bg-transparent">
                  <TableHeaderCell className="text-white">
                    Participante
                  </TableHeaderCell>
                  <TableHeaderCell className="text-white">
                    Departamento
                  </TableHeaderCell>
                  <TableHeaderCell className="text-white">Nota</TableHeaderCell>
                  <TableHeaderCell className="text-white">
                    Resultado
                  </TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roster.map((row) => (
                  <TableRow
                    key={row.attemptId}
                    className="cursor-pointer"
                    onClick={() => setReviewAttemptId(row.attemptId)}
                  >
                    <TableCell className="font-medium text-ink">
                      {row.fullName}
                    </TableCell>
                    <TableCell className="text-ink-muted">
                      {row.department ?? '—'}
                    </TableCell>
                    <TableCell className="font-data">
                      {row.displayGrade ?? '—'} / {data.assessment.maxGrade}
                    </TableCell>
                    <TableCell>
                      <Badge
                        intent={
                          LABEL_INTENT[row.qualitativeLabel ?? ''] ?? 'neutral'
                        }
                      >
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

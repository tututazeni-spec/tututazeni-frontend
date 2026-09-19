// components/trainings/manage/AssessmentsTab.tsx
// Avaliação — associa Assessments já existentes (não cria um motor de
// avaliação novo) por papel: inicial, final, questionário de satisfação,
// avaliação do formador. Espelha TrainingAssessmentRole (trainings.dto.ts).

'use client';

import { useState } from 'react';
import { Link2, Unlink } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Combobox } from '@/components/ui/Combobox';
import type { Training, TrainingAssessmentRole } from '../types';

interface AssessmentsTabProps {
  training: Training;
}

interface AssessmentOption {
  id: number;
  title: string;
  type: string;
  status: string;
}

const ROLES: { id: TrainingAssessmentRole; label: string }[] = [
  { id: 'INITIAL', label: 'Avaliação de aprendizagem (inicial)' },
  { id: 'FINAL', label: 'Avaliação de aprendizagem (final)' },
  { id: 'SATISFACTION_SURVEY', label: 'Avaliação de reação / satisfação' },
  { id: 'INSTRUCTOR_EVALUATION', label: 'Avaliação do formador' },
  { id: 'ORGANIZATION_EVALUATION', label: 'Avaliação da organização' },
  { id: 'APPLICABILITY_EVALUATION', label: 'Avaliação de aplicabilidade' },
  { id: 'POST_TRAINING_EFFECTIVENESS', label: 'Avaliação de eficácia / pós-formação' },
];

export function AssessmentsTab({ training }: AssessmentsTabProps) {
  const toast = useToast();
  const [picked, setPicked] = useState<Record<string, string>>({});

  const { data: assessments = [] } = useApiQuery<AssessmentOption[]>(
    ['trainings', 'assessments-picker'],
    '/assessments',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const items = assessments.map((a) => ({ value: String(a.id), label: `${a.title} (${a.type})` }));

  const invalidateKeys = [queryKeys.trainings.detail(training.id)];
  const onErr = (e: Error) => toast({ title: e.message, intent: 'danger' });

  const link = useApiMutation(
    (role: TrainingAssessmentRole) =>
      apiClient.post(`/trainings/${training.id}/assessments`, {
        assessmentId: Number(picked[role]),
        role,
      }),
    {
      invalidateKeys,
      onSuccess: () => toast({ title: 'Avaliação associada.', intent: 'success' }),
      onError: onErr,
    },
  );

  const unlink = useApiMutation(
    (role: TrainingAssessmentRole) =>
      apiClient.delete(`/trainings/${training.id}/assessments/${role}`),
    {
      invalidateKeys,
      onSuccess: () => toast({ title: 'Avaliação desassociada.', intent: 'success' }),
      onError: onErr,
    },
  );

  return (
    <Card className="divide-y divide-border">
      {ROLES.map((r) => {
        const existing = (training.assessmentLinks ?? []).find((l) => l.role === r.id);
        return (
          <div key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-4">
            <div className="w-56 flex-shrink-0 font-body text-sm font-medium text-ink">
              {r.label}
            </div>
            {existing ? (
              <div className="flex flex-1 items-center justify-between gap-3">
                <span className="font-body text-sm text-ink-muted">
                  {existing.assessment.title}
                </span>
                <Button
                  intent="ghost"
                  size="sm"
                  onClick={() => unlink.mutate(r.id)}
                  loading={unlink.isPending && unlink.variables === r.id}
                >
                  <Unlink size={14} strokeWidth={1.75} />
                  Desassociar
                </Button>
              </div>
            ) : (
              <div className="flex flex-1 items-center gap-2">
                <Combobox
                  items={items}
                  value={picked[r.id]}
                  onValueChange={(v) => setPicked((p) => ({ ...p, [r.id]: v }))}
                  placeholder="Escolher avaliação existente"
                  className="max-w-sm flex-1"
                />
                <Button
                  size="sm"
                  disabled={!picked[r.id]}
                  loading={link.isPending && link.variables === r.id}
                  onClick={() => link.mutate(r.id)}
                >
                  <Link2 size={14} strokeWidth={1.75} />
                  Associar
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </Card>
  );
}

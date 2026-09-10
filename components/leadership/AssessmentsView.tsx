// components/leadership/AssessmentsView.tsx
// Separador "Avaliações": registar/actualizar a avaliação de uma etapa
// (INITIAL/MIDPOINT/FINAL/FOLLOW_UP) de um participante — uma linha por
// (participante, etapa) no backend, por isso o formulário é um upsert.

'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/providers/ToastProvider';
import { reportError } from '@/lib/errorReporting';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ASSESSMENT_STAGE_ITEMS, READINESS_ITEMS } from './constants';
import type { LeadershipProgramDetail } from './types';

export interface AssessmentsViewProps {
  programId: number;
  detail: LeadershipProgramDetail;
  canManage: boolean;
}

export function AssessmentsView({ programId, detail, canManage }: AssessmentsViewProps) {
  const notify = useToast();
  const [userId, setUserId] = useState('');
  const [stage, setStage] = useState('');
  const [status, setStatus] = useState('COMPLETED');
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [readiness, setReadiness] = useState('');
  const [feedback, setFeedback] = useState('');

  const record = useApiMutation(
    () =>
      apiClient.put(`/leadership/programs/${programId}/participants/${userId}/assessments`, {
        stage,
        status,
        score: score ? Number(score) : undefined,
        maxScore: maxScore ? Number(maxScore) : undefined,
        readinessLevel: readiness || undefined,
        feedback: feedback.trim() || undefined,
      }),
    {
      invalidateKeys: [
        queryKeys.leadership.participant(programId, Number(userId)),
        queryKeys.leadership.programDetail(programId),
      ],
      onSuccess: () => {
        notify({ title: 'Avaliação registada', intent: 'success' });
        setScore('');
        setFeedback('');
      },
      onError: (e) => {
        reportError(e, { source: 'AssessmentsView.record' });
        notify({ title: e.message, intent: 'danger' });
      },
    },
  );

  if (!canManage) {
    return (
      <p className="rounded-card bg-surface-sunken p-3 font-body text-xs text-ink-muted">
        Apenas gestores do programa registam avaliações.
      </p>
    );
  }

  if (detail.participants.length === 0) {
    return <EmptyState title="Sem participantes" description="Selecione participantes antes de registar avaliações." />;
  }

  const participantItems = detail.participants.map((p) => ({
    value: String(p.userId),
    label: p.user.fullName,
  }));
  const statusItems = [
    { value: 'PENDING', label: 'Pendente' },
    { value: 'IN_PROGRESS', label: 'Em curso' },
    { value: 'COMPLETED', label: 'Concluída' },
  ];
  const canSubmit = Boolean(userId && stage);

  return (
    <div className="max-w-xl space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Participante *" htmlFor="as-user">
          <Select
            items={participantItems}
            value={userId || undefined}
            onValueChange={setUserId}
            className="w-full"
            placeholder="Selecionar"
          />
        </FormField>
        <FormField label="Etapa *" htmlFor="as-stage">
          <Select
            items={ASSESSMENT_STAGE_ITEMS}
            value={stage || undefined}
            onValueChange={setStage}
            className="w-full"
            placeholder="Selecionar"
          />
        </FormField>
        <FormField label="Estado" htmlFor="as-status">
          <Select items={statusItems} value={status} onValueChange={setStatus} className="w-full" />
        </FormField>
        <FormField label="Readiness" htmlFor="as-readiness">
          <Select
            items={READINESS_ITEMS}
            value={readiness || undefined}
            onValueChange={setReadiness}
            className="w-full"
            placeholder="Sem alteração"
          />
        </FormField>
        <FormField label="Nota" htmlFor="as-score">
          <Input
            id="as-score"
            type="number"
            className="w-full"
            value={score}
            onChange={(e) => setScore(e.target.value)}
          />
        </FormField>
        <FormField label="Nota máxima" htmlFor="as-max">
          <Input
            id="as-max"
            type="number"
            className="w-full"
            value={maxScore}
            onChange={(e) => setMaxScore(e.target.value)}
          />
        </FormField>
      </div>
      <FormField label="Feedback" htmlFor="as-feedback">
        <Textarea
          id="as-feedback"
          rows={3}
          className="w-full"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />
      </FormField>
      <Button onClick={() => record.mutate(undefined)} loading={record.isPending} disabled={!canSubmit}>
        Registar avaliação
      </Button>
    </div>
  );
}

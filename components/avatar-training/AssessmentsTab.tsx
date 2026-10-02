// components/avatar-training/AssessmentsTab.tsx
// Avaliações (docs/Avatar_Training.md §10): nota mínima, tentativas, avaliação
// formal ligada (Assessments) e rubrica com pesos. A rubrica só é válida
// quando os pesos somam 100; é revista por um formador, nunca decide sozinha.

'use client';

import { useState } from 'react';
import { ClipboardCheck, Plus, Trash2 } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { formatDateTime } from '@/lib/format';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { QueryError } from '@/components/ui/QueryError';
import { SessionPicker, useSessionDetail } from './SessionPicker';
import type { RubricCriterion, SessionDetail } from './types';

function AssessmentForm({ session }: { session: SessionDetail }) {
  const notify = useToast();
  const a = session.assessment;
  const [passingScore, setPassingScore] = useState(a?.passingScore ?? 70);
  const [maxAttempts, setMaxAttempts] = useState(a?.maxAttempts ?? 0);
  const [formal, setFormal] = useState(a?.requireFormalAssessment ?? false);
  const [assessmentId, setAssessmentId] = useState(
    a?.assessmentId ? String(a.assessmentId) : '',
  );
  const [rubric, setRubric] = useState<RubricCriterion[]>(
    a?.rubricConfig ?? [],
  );

  const total = rubric.reduce((s, c) => s + (Number(c.weight) || 0), 0);
  const rubricOk = rubric.length === 0 || total === 100;

  const save = useApiMutation(
    () =>
      apiClient.put(`/avatar-training/sessions/${session.id}/assessment`, {
        passingScore,
        maxAttempts,
        requireFormalAssessment: formal,
        assessmentId: assessmentId.trim() ? Number(assessmentId) : undefined,
        rubric: rubric.length ? rubric : undefined,
      }),
    {
      invalidateKeys: [queryKeys.avatarTraining.session(session.id)],
      onSuccess: () => notify({ title: 'Avaliação guardada', intent: 'success' }),
      onError: (e) =>
        notify({
          title: 'Não foi possível guardar a avaliação',
          description: e.message,
          intent: 'danger',
        }),
    },
  );

  const validate = useApiMutation(
    () =>
      apiClient.post(
        `/avatar-training/sessions/${session.id}/assessment/validate-rubric`,
        {},
      ),
    {
      invalidateKeys: [queryKeys.avatarTraining.session(session.id)],
      onSuccess: () => notify({ title: 'Rubrica validada', intent: 'success' }),
      onError: (e) =>
        notify({
          title: 'Não foi possível validar a rubrica',
          description: e.message,
          intent: 'danger',
        }),
    },
  );
  const savedRubric = a?.rubricConfig ?? [];
  const validatedAt = a?.rubricValidatedAt;

  const setCrit = (i: number, patch: Partial<RubricCriterion>) =>
    setRubric((r) => r.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FormField label="Nota mínima (0–100)" htmlFor="as-pass">
          <Input
            id="as-pass"
            type="number"
            min={0}
            max={100}
            value={passingScore}
            onChange={(e) => setPassingScore(Number(e.target.value))}
          />
        </FormField>
        <FormField
          label="Tentativas máximas"
          htmlFor="as-max"
          hint="0 = ilimitadas"
        >
          <Input
            id="as-max"
            type="number"
            min={0}
            value={maxAttempts}
            onChange={(e) => setMaxAttempts(Number(e.target.value))}
          />
        </FormField>
        <FormField
          label="ID da avaliação formal"
          htmlFor="as-formal"
          hint="Opcional (módulo Avaliações)"
        >
          <Input
            id="as-formal"
            value={assessmentId}
            onChange={(e) => setAssessmentId(e.target.value)}
          />
        </FormField>
      </div>

      <label className="flex items-center gap-2 font-body text-sm text-ink">
        <input
          type="checkbox"
          checked={formal}
          onChange={(e) => setFormal(e.target.checked)}
        />
        Exigir aprovação na avaliação formal para concluir
      </label>

      <div className="space-y-2 rounded-card border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold text-ink">
            Rubrica de simulação
          </h3>
          <Button
            size="sm"
            intent="secondary"
            onClick={() =>
              setRubric((r) => [
                ...r,
                { key: `criterio-${r.length + 1}`, label: '', weight: 0 },
              ])
            }
          >
            <Plus size={14} /> Critério
          </Button>
        </div>
        {rubric.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              aria-label={`Critério ${i + 1}`}
              placeholder="Ex.: Cumprimento do procedimento"
              value={c.label}
              onChange={(e) => setCrit(i, { label: e.target.value })}
            />
            <Input
              aria-label={`Peso do critério ${i + 1}`}
              type="number"
              min={0}
              max={100}
              className="w-24"
              value={c.weight}
              onChange={(e) => setCrit(i, { weight: Number(e.target.value) })}
            />
            <Button
              size="sm"
              intent="ghost"
              aria-label="Remover critério"
              onClick={() => setRubric((r) => r.filter((_, idx) => idx !== i))}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        ))}
        {rubric.length > 0 && (
          <p
            className={`font-body text-xs ${rubricOk ? 'text-ink-muted' : 'text-danger-ink'}`}
          >
            Soma dos pesos: {total}% {rubricOk ? '' : '— tem de ser 100%'}
          </p>
        )}
        {savedRubric.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
            <p className="font-body text-xs text-ink-muted">
              {validatedAt
                ? `Rubrica validada pelo responsável pedagógico em ${formatDateTime(validatedAt)}.`
                : 'Rubrica por validar — o responsável pedagógico tem de a validar antes de a formação ser publicada. Guardar alterações invalida a validação.'}
            </p>
            {!validatedAt && (
              <Button
                size="sm"
                intent="secondary"
                loading={validate.isPending}
                onClick={() => validate.mutate(undefined)}
              >
                Validar rubrica
              </Button>
            )}
          </div>
        )}
      </div>

      <Button
        size="sm"
        loading={save.isPending}
        disabled={!rubricOk || rubric.some((c) => !c.label.trim())}
        onClick={() => save.mutate(undefined)}
      >
        Guardar avaliação
      </Button>
    </div>
  );
}

export function AssessmentsTab() {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const { data, error, refetch } = useSessionDetail(sessionId);

  return (
    <div className="space-y-4">
      <SessionPicker value={sessionId} onChange={setSessionId} />
      {sessionId === null ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Escolha uma sessão"
          description="Defina a nota mínima, as tentativas e a rubrica de avaliação de cada sessão."
        />
      ) : error ? (
        <QueryError error={error} onRetry={() => refetch()} />
      ) : (
        data && <AssessmentForm key={`${data.id}-${data.version}`} session={data} />
      )}
    </div>
  );
}

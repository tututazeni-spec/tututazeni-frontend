// components/evaluation/SubmitEvaluationModal.tsx
// Preenchimento de uma avaliação (POST /evaluations/submit) — a UI que
// faltava por completo no frontend: o backend já tinha GET /evaluations/
// forms/:id (perguntas) e POST /evaluations/submit prontos, mas nenhum
// componente os chamava. É o que faz "Continuar avaliação"
// (EvaluationsTab) e o antigo botão morto "Avaliar →" (PendingTab)
// funcionarem de facto. Ver docs/modulo_evaluation.md ponto 2.
//
// Fluxo: request → (se tiver cycleId) GET /evaluations/cycles/:cycleId
// para obter form.id → GET /evaluations/forms/:id para as perguntas. Sem
// ciclo/form associado, o formulário fica só com os campos qualitativos
// (pontos fortes/a melhorar/recomendações) — SubmitEvaluationDto aceita
// `answers` vazio.

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/cn';

export interface SubmitEvaluationModalProps {
  requestId: number;
  cycleId?: number | null;
  evaluatedName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormQuestion {
  id: number;
  text: string;
  type: 'SCALE' | 'TEXT' | 'NPS' | 'BOOLEAN' | 'NA_ALLOWED';
  required: boolean;
  scaleMax?: number | null;
}

interface AnswerState {
  score?: number;
  comment?: string;
  notApplicable?: boolean;
}

function ScoreButtons({
  max,
  value,
  onChange,
}: {
  max: number;
  value?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: max + 1 }, (_, n) => n).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={cn(
            'h-8 w-8 rounded-control border text-xs font-semibold transition-colors',
            value === n
              ? 'border-primary bg-primary text-primary-fg'
              : 'border-border bg-surface text-ink-muted hover:border-primary/50',
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

export function SubmitEvaluationModal({
  requestId,
  cycleId,
  evaluatedName,
  onClose,
  onSuccess,
}: SubmitEvaluationModalProps) {
  const notify = useToast();
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [submitError, setSubmitError] = useState('');

  const cycleQ = useApiQuery<{ form?: { id: number } | null }>(
    queryKeys.evaluation.requestDetail(`cycle-${cycleId}`),
    `/evaluations/cycles/${cycleId}`,
    { enabled: !!cycleId },
  );
  const formId = cycleQ.data?.form?.id;
  const formQ = useApiQuery<{ id: number; title: string; questions: FormQuestion[] }>(
    queryKeys.evaluation.requestDetail(`form-${formId}`),
    `/evaluations/forms/${formId}`,
    { enabled: !!formId },
  );
  const questions = formQ.data?.questions ?? [];
  const loading = (!!cycleId && cycleQ.isLoading) || (!!formId && formQ.isLoading);

  const setAnswer = (questionId: number, patch: Partial<AnswerState>) =>
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], ...patch } }));

  const missingRequired = questions.some((q) => {
    if (!q.required) return false;
    const a = answers[q.id];
    if (q.type === 'TEXT') return !a?.comment?.trim();
    return a?.score === undefined && !a?.notApplicable;
  });

  const submit = useApiMutation(
    (isDraft: boolean) =>
      apiClient.post('/evaluations/submit', {
        requestId,
        answers: questions.map((q) => ({
          questionId: q.id,
          score: answers[q.id]?.score,
          comment: answers[q.id]?.comment?.trim() || undefined,
          notApplicable: answers[q.id]?.notApplicable,
        })),
        ...(strengths.trim() ? { strengths: strengths.trim() } : {}),
        ...(improvements.trim() ? { improvements: improvements.trim() } : {}),
        ...(recommendations.trim() ? { recommendations: recommendations.trim() } : {}),
        isDraft,
      }),
    {
      invalidateKeys: [
        queryKeys.evaluation.pending(),
        queryKeys.evaluation.myProgress(),
        queryKeys.evaluation.requests(),
        queryKeys.evaluation.overview(),
      ],
      onSuccess: () => {
        notify({ title: 'Avaliação submetida', intent: 'success' });
        onSuccess?.();
        onClose();
      },
      onError: (e) => setSubmitError(e instanceof Error ? e.message : 'Erro ao submeter a avaliação.'),
    },
  );

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={`Avaliar ${evaluatedName}`}
        description="Preenche as perguntas do formulário e os comentários qualitativos."
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-5">
          {submitError && (
            <div className="flex items-center gap-2 p-3 bg-danger-subtle text-danger-ink rounded-card text-sm">
              <AlertCircle size={16} strokeWidth={1.75} />
              {submitError}
            </div>
          )}

          {loading ? (
            <Skeleton rows={3} wrapperClassName="space-y-3" itemClassName="skeleton-shimmer h-16 rounded-card" />
          ) : (
            questions.map((q) => (
              <FormField key={q.id} label={`${q.text}${q.required ? ' *' : ''}`} htmlFor={`q-${q.id}`}>
                <div className="space-y-2">
                  {q.type === 'TEXT' ? (
                    <Textarea
                      id={`q-${q.id}`}
                      value={answers[q.id]?.comment ?? ''}
                      onChange={(e) => setAnswer(q.id, { comment: e.target.value })}
                      rows={2}
                      className="w-full"
                    />
                  ) : (
                    <>
                      <ScoreButtons
                        max={q.type === 'NPS' ? 10 : q.type === 'BOOLEAN' ? 1 : (q.scaleMax ?? 5)}
                        value={answers[q.id]?.score}
                        onChange={(v) => setAnswer(q.id, { score: v, notApplicable: false })}
                      />
                      {q.type === 'BOOLEAN' && (
                        <p className="text-[11px] text-ink-faint">0 = Não · 1 = Sim</p>
                      )}
                      {q.type === 'NA_ALLOWED' && (
                        <label className="flex items-center gap-2 text-xs text-ink-muted">
                          <input
                            type="checkbox"
                            checked={!!answers[q.id]?.notApplicable}
                            onChange={(e) =>
                              setAnswer(q.id, { notApplicable: e.target.checked, score: undefined })
                            }
                          />
                          Não aplicável
                        </label>
                      )}
                      <Textarea
                        placeholder="Comentário (opcional)"
                        value={answers[q.id]?.comment ?? ''}
                        onChange={(e) => setAnswer(q.id, { comment: e.target.value })}
                        rows={1}
                        className="w-full"
                      />
                    </>
                  )}
                </div>
              </FormField>
            ))
          )}

          <FormField label="Pontos fortes" htmlFor="ev-strengths">
            <Textarea id="ev-strengths" value={strengths} onChange={(e) => setStrengths(e.target.value)} rows={2} className="w-full" />
          </FormField>
          <FormField label="Áreas de melhoria" htmlFor="ev-improvements">
            <Textarea id="ev-improvements" value={improvements} onChange={(e) => setImprovements(e.target.value)} rows={2} className="w-full" />
          </FormField>
          <FormField label="Recomendações" htmlFor="ev-recommendations">
            <Textarea id="ev-recommendations" value={recommendations} onChange={(e) => setRecommendations(e.target.value)} rows={2} className="w-full" />
          </FormField>
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button intent="secondary" className="flex-1 justify-center" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            intent="secondary"
            className="flex-1 justify-center"
            loading={submit.isPending}
            onClick={() => {
              setSubmitError('');
              submit.mutate(true);
            }}
          >
            Guardar rascunho
          </Button>
          <Button
            className="flex-1 justify-center"
            loading={submit.isPending}
            disabled={missingRequired}
            onClick={() => {
              setSubmitError('');
              submit.mutate(false);
            }}
          >
            Submeter
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}

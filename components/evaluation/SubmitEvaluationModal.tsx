// components/evaluation/SubmitEvaluationModal.tsx
// Preenchimento de uma avaliação de desempenho (POST /evaluations/submit).
// Por etapas — Critérios → Pontos fortes → Áreas de melhoria → Recomendações →
// Rever — conforme docs/avaliacao_desempenho_robusta_claude_code.md §14.
//
// Fluxo de dados: request → (se tiver cycleId) GET /evaluations/cycles/:cycleId
// para obter form.id → GET /evaluations/forms/:id para os critérios. A
// classificação ponderada é calculada e validada SÓ no servidor (§17): aqui
// mostra-se o progresso de preenchimento, nunca uma nota final provisória.
// Sem ciclo/form associado, o formulário fica só com as secções qualitativas.

'use client';

import { useMemo, useState } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { cn } from '@/lib/cn';
import { useToast } from '@/providers/ToastProvider';
import { useConfirm } from '@/providers/ConfirmProvider';
import { AlertCard } from '@/components/ui/AlertCard';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { FormField } from '@/components/ui/FormField';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import { RatingScale } from './performance/RatingScale';
import {
  ImprovementsSection,
  RecommendationsSection,
  StrengthsSection,
  type CompetencyOption,
  type ResponsibleOption,
} from './performance/StructuredSections';
import {
  buildStructuredPayload,
  completeItemsOnly,
  criteriaProgress,
  hasSectionErrors,
  missingRequiredCriteria,
  validateSections,
} from './performance/logic';
import {
  FALLBACK_RATING_LEVELS,
  type ImprovementDraft,
  type RatingScaleResponse,
  type RecommendationDraft,
  type StrengthDraft,
} from './performance/types';

export interface SubmitEvaluationModalProps {
  requestId: number;
  cycleId?: number | null;
  evaluatedName: string;
  /** Permite escolher o avaliado como responsável de uma recomendação. */
  evaluatedId?: number;
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

type Step =
  'criteria' | 'strengths' | 'improvements' | 'recommendations' | 'review';

const STEP_LABELS: Record<Step, string> = {
  criteria: 'Critérios',
  strengths: 'Pontos fortes',
  improvements: 'Áreas de melhoria',
  recommendations: 'Recomendações',
  review: 'Rever e submeter',
};

interface ScoreButtonsProps {
  min: number;
  max: number;
  value?: number;
  label: string;
  onChange: (v: number) => void;
}

/** Botões numéricos para perguntas NPS (0–10) e Sim/Não (0–1), que não usam a escala 1–5. */
function ScoreButtons({ min, max, value, label, onChange }: ScoreButtonsProps) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex flex-wrap gap-1.5"
    >
      {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
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
  evaluatedId,
  onClose,
  onSuccess,
}: SubmitEvaluationModalProps) {
  const notify = useToast();
  const confirm = useConfirm();
  const me = useCurrentUser();
  const [step, setStep] = useState<Step>('criteria');
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
  const [strengths, setStrengths] = useState<StrengthDraft[]>([]);
  const [improvements, setImprovements] = useState<ImprovementDraft[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationDraft[]>(
    [],
  );
  const [submitError, setSubmitError] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  const cycleQ = useApiQuery<{ form?: { id: number } | null }>(
    queryKeys.evaluation.requestDetail(`cycle-${cycleId}`),
    `/evaluations/cycles/${cycleId}`,
    { enabled: !!cycleId },
  );
  const formId = cycleQ.data?.form?.id;
  const formQ = useApiQuery<{
    id: number;
    title: string;
    questions: FormQuestion[];
  }>(
    queryKeys.evaluation.requestDetail(`form-${formId}`),
    `/evaluations/forms/${formId}`,
    { enabled: !!formId },
  );
  const scaleQ = useApiQuery<RatingScaleResponse>(
    queryKeys.evaluation.ratingScale(),
    '/evaluations/rating-scale',
  );
  const catalogQ = useApiQuery<{ data: { id: number; name: string }[] }>(
    queryKeys.competencies.catalog({ limit: 100, forEvaluation: true }),
    '/competencies',
    { params: { limit: 100 } },
  );

  const levels = scaleQ.data?.levels ?? FALLBACK_RATING_LEVELS;
  const questions = useMemo(() => formQ.data?.questions ?? [], [formQ.data]);
  const competencies: CompetencyOption[] = catalogQ.data?.data ?? [];
  const responsibles: ResponsibleOption[] = [
    ...(me.data ? [{ id: me.data.id, label: `${me.data.fullName} (eu)` }] : []),
    ...(evaluatedId && evaluatedId !== me.data?.id
      ? [{ id: evaluatedId, label: evaluatedName }]
      : []),
  ];
  const loading =
    (!!cycleId && cycleQ.isLoading) || (!!formId && formQ.isLoading);

  const steps: Step[] = [
    ...(questions.length ? (['criteria'] as Step[]) : []),
    'strengths',
    'improvements',
    'recommendations',
    'review',
  ];
  const currentStep = steps.includes(step) ? step : steps[0];
  const stepIndex = steps.indexOf(currentStep);

  const setAnswer = (questionId: number, patch: Partial<AnswerState>) =>
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], ...patch },
    }));

  const progress = criteriaProgress(questions, answers);
  const missing = missingRequiredCriteria(questions, answers);
  const errors = validateSections(strengths, improvements, recommendations);
  const sectionsInvalid = hasSectionErrors(errors);
  const canSubmit = missing.length === 0 && !sectionsInvalid;

  const submit = useApiMutation(
    (isDraft: boolean) => {
      const items = isDraft
        ? completeItemsOnly(strengths, improvements, recommendations)
        : { strengths, improvements, recommendations, dropped: 0 };
      return apiClient.post('/evaluations/submit', {
        requestId,
        answers: questions.map((q) => ({
          questionId: q.id,
          score: answers[q.id]?.score,
          comment: answers[q.id]?.comment?.trim() || undefined,
          notApplicable: answers[q.id]?.notApplicable,
        })),
        ...buildStructuredPayload(
          items.strengths,
          items.improvements,
          items.recommendations,
        ),
        isDraft,
      });
    },
    {
      invalidateKeys: [
        queryKeys.evaluation.pending(),
        queryKeys.evaluation.myProgress(),
        queryKeys.evaluation.requests(),
        queryKeys.evaluation.overview(),
      ],
      onSuccess: (_data, isDraft) => {
        notify({
          title: isDraft ? 'Rascunho guardado' : 'Avaliação submetida',
          intent: 'success',
        });
        onSuccess?.();
        onClose();
      },
      onError: (e) =>
        setSubmitError(
          e instanceof Error ? e.message : 'Erro ao submeter a avaliação.',
        ),
    },
  );

  const goNext = () =>
    setStep(steps[Math.min(stepIndex + 1, steps.length - 1)]);
  const goBack = () => setStep(steps[Math.max(stepIndex - 1, 0)]);

  const onSubmit = async () => {
    setSubmitError('');
    setShowErrors(true);
    if (!canSubmit) return;
    const ok = await confirm({
      title: 'Submeter avaliação?',
      message: `Depois de submeter, a avaliação de ${evaluatedName} deixa de poder ser editada.`,
      confirmLabel: 'Submeter',
    });
    if (ok) submit.mutate(false);
  };

  const onDraft = () => {
    setSubmitError('');
    submit.mutate(true);
  };

  const draftDropped = completeItemsOnly(
    strengths,
    improvements,
    recommendations,
  ).dropped;

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={`Avaliar ${evaluatedName}`}
        description="Avalie os critérios e registe pontos fortes, áreas de melhoria e recomendações."
        className="max-h-[90vh] max-w-3xl overflow-y-auto"
      >
        <nav aria-label="Etapas da avaliação" className="mt-4">
          <ol className="flex flex-wrap gap-1.5">
            {steps.map((s, i) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => setStep(s)}
                  aria-current={s === currentStep ? 'step' : undefined}
                  className={cn(
                    'rounded-pill border-[1.5px] px-3 py-1 text-xs font-semibold transition-colors',
                    s === currentStep
                      ? 'border-brand bg-brand text-white'
                      : 'border-border-strong bg-surface text-ink-muted hover:bg-surface-sunken',
                  )}
                >
                  {i + 1}. {STEP_LABELS[s]}
                </button>
              </li>
            ))}
          </ol>
          {questions.length > 0 && (
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs text-ink-muted">
                <span>Critérios avaliados</span>
                <span>
                  {progress.answered}/{progress.total} · {progress.pct}%
                </span>
              </div>
              <ProgressBar
                value={progress.pct}
                intent={progress.pct === 100 ? 'success' : 'accent'}
              />
            </div>
          )}
        </nav>

        <div className="mt-5 space-y-5">
          {submitError && (
            <AlertCard
              variant="danger"
              title="Não foi possível guardar a avaliação"
              message="Reveja os campos assinalados e tente novamente."
              detail={submitError}
            />
          )}

          {currentStep === 'criteria' &&
            (loading ? (
              <Skeleton
                rows={3}
                wrapperClassName="space-y-3"
                itemClassName="skeleton-shimmer h-16 rounded-card"
              />
            ) : (
              <section className="space-y-5" aria-label="Critérios">
                <details className="rounded-card bg-surface-sunken p-3 text-sm">
                  <summary className="cursor-pointer font-medium text-ink">
                    Legenda da escala de desempenho (1 a 5)
                  </summary>
                  <ul className="mt-2 space-y-1 text-xs text-ink-muted">
                    {levels.map((l) => (
                      <li key={l.value}>
                        <span className="font-semibold text-ink">
                          {l.value} — {l.label}:
                        </span>{' '}
                        {l.description}
                      </li>
                    ))}
                  </ul>
                </details>
                {questions.map((q) => (
                  <FormField
                    key={q.id}
                    label={`${q.text}${q.required ? ' *' : ''}`}
                    htmlFor={`q-${q.id}`}
                    error={
                      showErrors && missing.includes(q.id)
                        ? 'Resposta obrigatória'
                        : undefined
                    }
                  >
                    <div className="space-y-2">
                      {q.type === 'TEXT' ? (
                        <Textarea
                          id={`q-${q.id}`}
                          value={answers[q.id]?.comment ?? ''}
                          onChange={(e) =>
                            setAnswer(q.id, { comment: e.target.value })
                          }
                          rows={2}
                          className="w-full"
                        />
                      ) : (
                        <>
                          {q.type === 'NPS' || q.type === 'BOOLEAN' ? (
                            <>
                              <ScoreButtons
                                label={q.text}
                                min={q.type === 'NPS' ? 0 : 0}
                                max={q.type === 'NPS' ? 10 : 1}
                                value={answers[q.id]?.score}
                                onChange={(v) =>
                                  setAnswer(q.id, {
                                    score: v,
                                    notApplicable: false,
                                  })
                                }
                              />
                              {q.type === 'BOOLEAN' && (
                                <p className="text-micro text-ink-faint">
                                  0 = Não · 1 = Sim
                                </p>
                              )}
                            </>
                          ) : (
                            <RatingScale
                              label={q.text}
                              levels={levels}
                              value={answers[q.id]?.score}
                              disabled={!!answers[q.id]?.notApplicable}
                              onChange={(v) =>
                                setAnswer(q.id, {
                                  score: v,
                                  notApplicable: false,
                                })
                              }
                            />
                          )}
                          {q.type === 'NA_ALLOWED' && (
                            <label className="flex items-center gap-2 text-xs text-ink-muted">
                              <Checkbox
                                checked={!!answers[q.id]?.notApplicable}
                                onChange={(e) =>
                                  setAnswer(q.id, {
                                    notApplicable: e.target.checked,
                                    score: undefined,
                                  })
                                }
                              />
                              Não aplicável (fica fora do cálculo)
                            </label>
                          )}
                          <Textarea
                            placeholder="Comentário ou evidência (opcional)"
                            aria-label={`Comentário — ${q.text}`}
                            value={answers[q.id]?.comment ?? ''}
                            onChange={(e) =>
                              setAnswer(q.id, { comment: e.target.value })
                            }
                            rows={1}
                            className="w-full"
                          />
                        </>
                      )}
                    </div>
                  </FormField>
                ))}
              </section>
            ))}

          {currentStep === 'strengths' && (
            <StrengthsSection
              items={strengths}
              onChange={setStrengths}
              competencies={competencies}
              levels={levels}
              errors={showErrors ? errors.strengths : []}
            />
          )}
          {currentStep === 'improvements' && (
            <ImprovementsSection
              items={improvements}
              onChange={setImprovements}
              competencies={competencies}
              levels={levels}
              errors={showErrors ? errors.improvements : []}
            />
          )}
          {currentStep === 'recommendations' && (
            <RecommendationsSection
              items={recommendations}
              onChange={setRecommendations}
              improvements={improvements}
              responsibles={responsibles}
              errors={showErrors ? errors.recommendations : []}
            />
          )}

          {currentStep === 'review' && (
            <section className="space-y-3" aria-label="Rever e submeter">
              <ul className="space-y-1.5 text-sm text-ink">
                {questions.length > 0 && (
                  <li>
                    Critérios avaliados: {progress.answered}/{progress.total} (
                    {progress.pct}%)
                    {missing.length > 0 &&
                      ` — faltam ${missing.length} obrigatório${missing.length > 1 ? 's' : ''}`}
                  </li>
                )}
                <li>Pontos fortes: {strengths.length}</li>
                <li>Áreas de melhoria: {improvements.length}</li>
                <li>Recomendações: {recommendations.length}</li>
              </ul>
              <AlertCard
                variant="info"
                title="A classificação final é calculada ao submeter"
                message="O resultado ponderado só aparece com todos os critérios obrigatórios avaliados; 'Não aplicável' fica fora do cálculo."
              />
              {showErrors && !canSubmit && (
                <AlertCard
                  variant="warning"
                  title="Há campos por completar"
                  message="Volte às etapas assinaladas, corrija os avisos e submeta de novo."
                  detail={[
                    missing.length > 0 && 'Critérios obrigatórios em falta',
                    sectionsInvalid && 'Secções com campos inválidos',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                />
              )}
              {draftDropped > 0 && (
                <p className="text-xs text-ink-muted">
                  Ao guardar rascunho, {draftDropped} registo
                  {draftDropped > 1 ? 's' : ''} incompleto
                  {draftDropped > 1 ? 's' : ''} não será guardado.
                </p>
              )}
            </section>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-4">
          <Button intent="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            intent="secondary"
            loading={submit.isPending}
            onClick={onDraft}
          >
            Guardar rascunho
          </Button>
          <div className="ml-auto flex gap-3">
            {stepIndex > 0 && (
              <Button intent="secondary" onClick={goBack}>
                Anterior
              </Button>
            )}
            {currentStep !== 'review' ? (
              <Button onClick={goNext}>Seguinte</Button>
            ) : (
              <Button loading={submit.isPending} onClick={onSubmit}>
                Submeter
              </Button>
            )}
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}

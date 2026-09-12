// components/performance/SubmitReviewModal.tsx
// Formulário de submissão de avaliação (POST /performance/submit) — fecha um
// gap que não tinha NENHUMA UI: nem para os 6 novos sub-fatores de potencial
// (eixo Potencial do 9-box calculado, ver evaluation360.service.ts#getNineBox),
// nem para o potentialScore que já existia antes. Backend 100% funcional
// (SubmitReviewDto/submitReview), só faltava esta UI.
//
// Dois modos:
//   - mode="self": o próprio a completar a autoavaliação (review.type SELF).
//     Sem potentialScore/sub-fatores — são um julgamento do gestor, não do
//     avaliado.
//   - mode="manager": o gestor a avaliar um liderado (review.type MANAGER).
//     Inclui potentialScore + os 6 sub-fatores (learningAgility,
//     adaptability, ambition, responsibilityReadiness, mobilityFlexibility,
//     futureRoleReadiness) — os únicos campos que alimentam o eixo Potencial
//     além da Liderança (que vem de CompetencyEvaluation, não deste form).

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/providers/ToastProvider';

// Picker 1-5 reutilizável para potentialScore + sub-fatores — mesma
// convenção visual (★) do rating já usado em competencies/MyProfileView.tsx,
// mas esse componente é local àquele ficheiro (não exportado), daí repetir
// aqui em vez de importar.
function RatingPicker({
  value,
  onChange,
  id,
}: {
  value: number | null;
  onChange: (v: number) => void;
  id: string;
}) {
  return (
    <div className="flex gap-1" role="group" aria-labelledby={id}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          aria-label={`${s} de 5`}
          aria-pressed={value === s}
          className={`text-xl leading-none transition-transform hover:scale-110 ${
            value !== null && s <= value ? 'text-accent' : 'text-border-strong'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export interface SubmitReviewModalProps {
  reviewId: number;
  /** Nome de quem está a ser avaliado — só usado (no título) em mode="manager". */
  userName?: string;
  mode: 'self' | 'manager';
  /** cycle.scoreScale * 20 — escala esperada do campo `score` (ver performance.service.ts submitReview). Default 100 (scoreScale=5). */
  scoreMax?: number;
  onClose: () => void;
}

const SUB_FACTORS: Array<{ key: SubFactorKey; label: string }> = [
  { key: 'learningAgilityScore', label: 'Capacidade / agilidade de aprendizagem' },
  { key: 'adaptabilityScore', label: 'Adaptabilidade' },
  { key: 'ambitionScore', label: 'Ambição profissional' },
  { key: 'responsibilityReadinessScore', label: 'Capacidade p/ assumir responsabilidades maiores' },
  { key: 'mobilityFlexibilityScore', label: 'Mobilidade / flexibilidade' },
  { key: 'futureRoleReadinessScore', label: 'Readiness para funções futuras' },
];

type SubFactorKey =
  | 'learningAgilityScore'
  | 'adaptabilityScore'
  | 'ambitionScore'
  | 'responsibilityReadinessScore'
  | 'mobilityFlexibilityScore'
  | 'futureRoleReadinessScore';

export function SubmitReviewModal({
  reviewId,
  userName,
  mode,
  scoreMax = 100,
  onClose,
}: SubmitReviewModalProps) {
  const notify = useToast();
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [justification, setJustification] = useState('');
  const [potentialScore, setPotentialScore] = useState<number | null>(null);
  const [subFactors, setSubFactors] = useState<Record<SubFactorKey, number | null>>({
    learningAgilityScore: null,
    adaptabilityScore: null,
    ambitionScore: null,
    responsibilityReadinessScore: null,
    mobilityFlexibilityScore: null,
    futureRoleReadinessScore: null,
  });
  const [submitError, setSubmitError] = useState('');

  const submit = useApiMutation(
    (body: Record<string, unknown>) => apiClient.post('/performance/submit', body),
    {
      invalidateKeys: [
        queryKeys.performance.team(),
        queryKeys.performance.my(),
        queryKeys.performance.nineBox(),
      ],
      onSuccess: () => {
        notify({ title: 'Avaliação submetida', intent: 'success' });
        onClose();
      },
      onError: (e) =>
        setSubmitError(e.message || 'Erro ao submeter a avaliação. Tente novamente.'),
    },
  );

  const handleSubmit = () => {
    if (submit.isPending) return;
    setSubmitError('');
    const body: Record<string, unknown> = { reviewId };
    if (score.trim()) body.score = Number(score);
    if (feedback.trim()) body.feedback = feedback.trim();
    if (justification.trim()) body.justification = justification.trim();
    if (mode === 'manager') {
      if (potentialScore !== null) body.potentialScore = potentialScore;
      for (const { key } of SUB_FACTORS) {
        if (subFactors[key] !== null) body[key] = subFactors[key];
      }
    }
    submit.mutate(body);
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={
          mode === 'self'
            ? 'Completar autoavaliação'
            : `Avaliar — ${userName}`
        }
        className="max-w-lg"
      >
        <div className="mt-4 max-h-[70vh] space-y-5 overflow-y-auto pr-1">
          {submitError && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {submitError}
            </div>
          )}

          <FormField
            label={`Pontuação (0–${scoreMax})`}
            htmlFor="sr-score"
            hint="Deixe em branco para avaliar só por competências/objectivos noutro fluxo."
          >
            <Input
              id="sr-score"
              type="number"
              min={0}
              max={scoreMax}
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />
          </FormField>

          <FormField label="Feedback" htmlFor="sr-feedback" hint="Opcional.">
            <Textarea
              id="sr-feedback"
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </FormField>

          <FormField
            label="Justificativa"
            htmlFor="sr-justification"
            hint="Obrigatória se a pontuação for extrema (muito baixa ou no máximo da escala)."
          >
            <Textarea
              id="sr-justification"
              rows={2}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            />
          </FormField>

          {mode === 'manager' && (
            <div className="space-y-4 border-t border-border pt-4">
              <div>
                <div className="text-sm font-semibold text-ink">
                  Eixo Potencial (matriz 9-box)
                </div>
                <div className="mt-0.5 text-xs text-ink-faint">
                  Só o gestor preenche esta secção — alimenta a matriz 9-box de
                  análise de talento.
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span id="sr-potential-label" className="text-sm text-ink">
                  Potencial geral
                </span>
                <RatingPicker
                  id="sr-potential-label"
                  value={potentialScore}
                  onChange={setPotentialScore}
                />
              </div>

              {SUB_FACTORS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <span id={`sr-${key}-label`} className="text-sm text-ink">
                    {label}
                  </span>
                  <RatingPicker
                    id={`sr-${key}-label`}
                    value={subFactors[key]}
                    onChange={(v) => setSubFactors((prev) => ({ ...prev, [key]: v }))}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={submit.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={submit.isPending}>
            Submeter
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}

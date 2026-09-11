// components/evaluation360/EvaluationFormTab.tsx
// Formulário de avaliação (perguntas de frequência + comentário aberto).
// Usado tanto pela auto-avaliação como pela avaliação de colegas — o que
// muda é `evaluateeId`/`evaluatorRole` (ver Evaluation360View.tsx).
//
// Antes: "Guardar Rascunho"/"Submeter Avaliação" não tinham nenhum
// onClick — o formulário nunca persistia nada, e o comentário aberto não
// estava ligado a estado nenhum. Agora ambos chamam
// POST /evaluation360/cycles/:cycleId/responses?evaluateeId=... — sem isto,
// nenhuma avaliação 360º real seria alguma vez gerada na plataforma.

'use client';

import { useState } from 'react';
import type { EvaluationQuestion, EvaluatorRole } from './types';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';

const ROLE_LABEL: Record<EvaluatorRole, string> = {
  SELF: 'Autoavaliação',
  MANAGER: 'Gestor',
  PEER: 'Par',
  SUBORDINATE: 'Subordinado',
  EXTERNAL: 'Externo',
};

export interface EvaluationFormTabProps {
  questions: EvaluationQuestion[];
  participantName: string;
  evaluatorRole: EvaluatorRole;
  cycleId: string;
  evaluateeId: string;
  onSubmitted?: () => void;
}

export function EvaluationFormTab({
  questions,
  participantName,
  evaluatorRole,
  cycleId,
  evaluateeId,
  onSubmitted,
}: EvaluationFormTabProps) {
  const notify = useToast();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [openText, setOpenText] = useState<Record<string, string>>({});
  const freqLabels = ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Sempre'];
  const likertLabels = [
    'Insuficiente',
    'Abaixo do esperado',
    'Dentro do esperado',
    'Acima do esperado',
    'Excecional',
  ];

  const scaleQuestions = questions.filter((q) => q.type !== 'OPEN_TEXT');
  const openQuestions = questions.filter((q) => q.type === 'OPEN_TEXT');
  const requiredScale = scaleQuestions.filter((q) => q.isRequired);
  const answeredRequired = requiredScale.filter((q) => answers[q.id] !== undefined).length;
  const completion = requiredScale.length
    ? Math.round((answeredRequired / requiredScale.length) * 100)
    : 100;

  const buildAnswers = () => [
    ...Object.entries(answers).map(([questionId, numericValue]) => ({ questionId, numericValue })),
    ...Object.entries(openText)
      .filter(([, textValue]) => textValue.trim().length > 0)
      .map(([questionId, textValue]) => ({ questionId, textValue: textValue.trim() })),
  ];

  const submit = useApiMutation(
    (submitFinal: boolean) =>
      apiClient.post(
        `/evaluation360/cycles/${cycleId}/responses`,
        { answers: buildAnswers(), submit: submitFinal },
        { params: { evaluateeId } },
      ),
    {
      invalidateKeys: [
        queryKeys.evaluation360.form(cycleId, evaluateeId),
        queryKeys.evaluation360.result(cycleId, evaluateeId),
      ],
      onSuccess: (_data, submitFinal) => {
        notify({
          title: submitFinal ? 'Avaliação submetida' : 'Rascunho guardado',
          intent: 'success',
        });
        if (submitFinal) onSubmitted?.();
      },
      onError: () =>
        notify({ title: 'Erro ao guardar a avaliação. Tenta novamente.', intent: 'danger' }),
    },
  );

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h2 className="m-0 text-lg font-bold text-ink">Formulário de Avaliação</h2>
        <p className="m-0 mt-1 text-sm text-ink-muted">
          Avaliação de <strong className="text-ink">{participantName}</strong> · Papel:{' '}
          {ROLE_LABEL[evaluatorRole]}
        </p>
      </div>

      {/* Progress */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-ink-muted">Progresso</span>
          <span className="text-sm font-bold text-primary">
            {answeredRequired}/{requiredScale.length} respostas
          </span>
        </div>
        <div className="bg-surface-sunken rounded h-1.5 overflow-hidden">
          <div
            className="h-full rounded transition-all"
            style={{
              width: `${completion}%`,
              background: 'linear-gradient(90deg, rgb(99, 102, 241), rgb(124, 58, 237))',
            }}
          />
        </div>
      </div>

      {/* Questions */}
      {scaleQuestions.map((q, qi) => {
        const labels = q.type === 'FREQUENCY' ? freqLabels : likertLabels;
        const val = answers[q.id];
        return (
          <div
            key={q.id}
            className="rounded-lg border bg-surface p-5 transition-colors"
            style={{
              borderColor: val !== undefined ? 'rgba(79, 70, 229, 0.33)' : 'rgb(30, 42, 58)',
            }}
          >
            <div className="flex gap-2.5 mb-4">
              <div
                className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-canvas flex-shrink-0"
                style={{
                  background: val !== undefined ? 'rgb(79, 70, 229)' : 'rgb(30, 37, 55)',
                  color: val !== undefined ? 'rgb(255, 255, 255)' : 'rgb(55, 65, 81)',
                }}
              >
                {qi + 1}
              </div>
              <div className="flex-1">
                {q.competency && (
                  <div className="text-xs font-semibold text-primary mb-1.5">{q.competency}</div>
                )}
                <p className="m-0 text-sm text-ink leading-relaxed">{q.text}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {labels.map((label, i) => {
                const v = i + 1;
                const isSelected = val === v;
                return (
                  <button
                    key={v}
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                    className="flex-1 min-w-20 px-1.5 py-2.5 rounded-lg cursor-pointer flex flex-col items-center gap-1 transition-all border"
                    style={{
                      background: isSelected ? 'rgb(79, 70, 229)' : 'rgb(30, 37, 55)',
                      borderColor: isSelected ? 'rgb(99, 102, 241)' : 'rgb(30, 42, 58)',
                    }}
                  >
                    <span className="text-base font-bold" style={{ color: 'rgb(255, 255, 255)' }}>
                      {v}
                    </span>
                    <span
                      className="text-xs text-center leading-tight"
                      style={{ color: 'rgb(255, 255, 255)' }}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Open question(s) */}
      {(openQuestions.length > 0
        ? openQuestions
        : [{ id: '__general', text: 'Que feedback adicional gostaria de partilhar sobre este colaborador? (opcional)', type: 'OPEN_TEXT' as const, competency: '', isRequired: false }]
      ).map((q) => (
        <div key={q.id} className="rounded-lg border border-border bg-surface p-5">
          <p className="m-0 mb-3 text-sm text-ink leading-relaxed">{q.text}</p>
          <Textarea
            value={openText[q.id] ?? ''}
            onChange={(e) => setOpenText((prev) => ({ ...prev, [q.id]: e.target.value }))}
            placeholder="Partilhe exemplos concretos e construtivos..."
            className="bg-surface-sunken text-ink border-border"
          />
        </div>
      ))}

      {/* Submit */}
      <div className="flex gap-3">
        <Button
          intent="ghost"
          size="md"
          onClick={() => submit.mutate(false)}
          loading={submit.isPending}
        >
          Guardar Rascunho
        </Button>
        <Button
          intent={completion === 100 ? 'primary' : 'ghost'}
          size="md"
          disabled={completion < 100 || submit.isPending}
          loading={submit.isPending}
          onClick={() => submit.mutate(true)}
        >
          {completion < 100 ? `Responda todas as questões (${completion}%)` : 'Submeter Avaliação'}
        </Button>
      </div>
    </div>
  );
}

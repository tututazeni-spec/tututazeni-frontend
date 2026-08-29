// components/evaluation360/EvaluationFormTab.tsx
// Formulário de avaliação (perguntas de frequência/Likert + comentário
// aberto). Extraído de app/(platform)/evaluation360/page.tsx.

'use client';

import { useState } from 'react';
import type { EvaluationQuestion } from './types';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';

export interface EvaluationFormTabProps {
  questions: EvaluationQuestion[];
  participantName: string;
}

export function EvaluationFormTab({
  questions,
  participantName,
}: EvaluationFormTabProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const freqLabels = [
    'Nunca',
    'Raramente',
    'Às vezes',
    'Frequentemente',
    'Sempre',
  ];
  const likertLabels = [
    'Insuficiente',
    'Abaixo do esperado',
    'Dentro do esperado',
    'Acima do esperado',
    'Excecional',
  ];

  const completion = Math.round(
    (Object.keys(answers).length / questions.length) * 100,
  );

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h2 className="m-0 text-lg font-bold text-ink">
          Formulário de Avaliação
        </h2>
        <p className="m-0 mt-1 text-sm text-ink-muted">
          Avaliação de <strong className="text-ink">{participantName}</strong> ·
          Role: Par
        </p>
      </div>

      {/* Progress */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-ink-muted">Progresso</span>
          <span className="text-sm font-bold text-primary">
            {Object.keys(answers).length}/{questions.length} respostas
          </span>
        </div>
        <div className="bg-surface-sunken rounded h-1.5 overflow-hidden">
          <div
            className="h-full rounded transition-all"
            style={{
              width: `${completion}%`,
              background:
                'linear-gradient(90deg, rgb(99, 102, 241), rgb(124, 58, 237))',
            }}
          />
        </div>
      </div>

      {/* Questions */}
      {questions.map((q, qi) => {
        const labels = q.type === 'FREQUENCY' ? freqLabels : likertLabels;
        const val = answers[q.id];
        return (
          <div
            key={q.id}
            className="rounded-lg border bg-surface p-5 transition-colors"
            style={{
              borderColor:
                val !== undefined
                  ? 'rgba(79, 70, 229, 0.33)'
                  : 'rgb(30, 42, 58)',
            }}
          >
            <div className="flex gap-2.5 mb-4">
              <div
                className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-canvas flex-shrink-0"
                style={{
                  background:
                    val !== undefined ? 'rgb(79, 70, 229)' : 'rgb(30, 37, 55)',
                  color:
                    val !== undefined
                      ? 'rgb(255, 255, 255)'
                      : 'rgb(55, 65, 81)',
                }}
              >
                {qi + 1}
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-primary mb-1.5">
                  {q.competency}
                </div>
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
                    onClick={() =>
                      setAnswers((prev) => ({ ...prev, [q.id]: v }))
                    }
                    className="flex-1 min-w-20 px-1.5 py-2.5 rounded-lg cursor-pointer flex flex-col items-center gap-1 transition-all border"
                    style={{
                      background: isSelected
                        ? 'rgb(79, 70, 229)'
                        : 'rgb(30, 37, 55)',
                      borderColor: isSelected
                        ? 'rgb(99, 102, 241)'
                        : 'rgb(30, 42, 58)',
                    }}
                  >
                    <span
                      className="text-base font-bold"
                      style={{
                        color: isSelected
                          ? 'rgb(255, 255, 255)'
                          : 'rgb(107, 114, 128)',
                      }}
                    >
                      {v}
                    </span>
                    <span
                      className="text-xs text-center leading-tight"
                      style={{
                        color: isSelected
                          ? 'rgb(199, 210, 254)'
                          : 'rgb(71, 85, 105)',
                      }}
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

      {/* Open question */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <p className="m-0 mb-3 text-sm text-ink leading-relaxed">
          Que feedback adicional gostaria de partilhar sobre este colaborador?
          (opcional)
        </p>
        <Textarea
          placeholder="Partilhe exemplos concretos e construtivos..."
          className="bg-surface-sunken text-ink border-border"
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <Button intent="ghost" size="md">
          Guardar Rascunho
        </Button>
        <Button
          intent={completion === 100 ? 'primary' : 'ghost'}
          size="md"
          disabled={completion < 100}
        >
          {completion < 100
            ? `Responda todas as questões (${completion}%)`
            : 'Submeter Avaliação'}
        </Button>
      </div>
    </div>
  );
}

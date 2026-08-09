// components/evaluation360/EvaluationFormTab.tsx
// Formulário de avaliação (perguntas de frequência/Likert + comentário
// aberto). Extraído de app/(platform)/evaluation360/page.tsx.

'use client';

import { useState } from 'react';
import type { EvaluationQuestion } from './types';
import { COLORS } from './colors';

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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        maxWidth: 720,
      }}
    >
      <div>
        <h2
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 800,
            color: COLORS.text,
          }}
        >
          Formulário de Avaliação
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: COLORS.muted }}>
          Avaliação de{' '}
          <strong style={{ color: '#e2e8f0' }}>{participantName}</strong> ·
          Role: Par
        </p>
      </div>

      {/* Progress */}
      <div
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          padding: '14px 20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 13, color: COLORS.muted }}>Progresso</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#818cf8' }}>
            {Object.keys(answers).length}/{questions.length} respostas
          </span>
        </div>
        <div style={{ background: '#1e2537', borderRadius: 4, height: 6 }}>
          <div
            style={{
              width: `${completion}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
              borderRadius: 4,
              transition: 'width 0.3s',
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
            style={{
              background: COLORS.surface,
              border: `1px solid ${val !== undefined ? '#4f46e555' : COLORS.border}`,
              borderRadius: 10,
              padding: '20px 24px',
            }}
          >
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  minWidth: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: val !== undefined ? '#4f46e5' : '#1e2537',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 800,
                  color: val !== undefined ? '#fff' : '#374151',
                }}
              >
                {qi + 1}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: '#818cf8',
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  {q.competency}
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: '#e2e8f0',
                    lineHeight: 1.6,
                  }}
                >
                  {q.text}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {labels.map((label, i) => {
                const v = i + 1;
                const isSelected = val === v;
                return (
                  <button
                    key={v}
                    onClick={() =>
                      setAnswers((prev) => ({ ...prev, [q.id]: v }))
                    }
                    style={{
                      flex: 1,
                      minWidth: 80,
                      padding: '10px 6px',
                      background: isSelected ? '#4f46e5' : '#1e2537',
                      border: `1px solid ${isSelected ? '#6366f1' : '#1e2a3a'}`,
                      borderRadius: 8,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'all 0.15s',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: isSelected ? '#fff' : '#6b7280',
                      }}
                    >
                      {v}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: isSelected ? '#c7d2fe' : '#475569',
                        textAlign: 'center',
                        lineHeight: 1.3,
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
      <div
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          padding: '20px 24px',
        }}
      >
        <p
          style={{
            margin: '0 0 12px',
            fontSize: 14,
            color: '#e2e8f0',
            lineHeight: 1.6,
          }}
        >
          Que feedback adicional gostaria de partilhar sobre este colaborador?
          (opcional)
        </p>
        <textarea
          style={{
            width: '100%',
            minHeight: 100,
            background: '#0f172a',
            border: '1px solid #1e2a3a',
            borderRadius: 8,
            padding: '12px',
            fontSize: 13,
            color: '#e2e8f0',
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'inherit',
          }}
          placeholder="Partilhe exemplos concretos e construtivos..."
        />
      </div>

      {/* Submit */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          style={{
            background: '#1e2537',
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8,
            padding: '12px 24px',
            fontSize: 14,
            fontWeight: 600,
            color: COLORS.muted,
            cursor: 'pointer',
          }}
        >
          Guardar Rascunho
        </button>
        <button
          style={{
            background:
              completion === 100
                ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
                : '#1e2537',
            border: `1px solid ${completion === 100 ? '#6366f1' : '#374151'}`,
            borderRadius: 8,
            padding: '12px 32px',
            fontSize: 14,
            fontWeight: 700,
            color: completion === 100 ? '#fff' : '#4b5563',
            cursor: completion === 100 ? 'pointer' : 'not-allowed',
          }}
          disabled={completion < 100}
        >
          {completion < 100
            ? `Responda todas as questões (${completion}%)`
            : 'Submeter Avaliação'}
        </button>
      </div>
    </div>
  );
}

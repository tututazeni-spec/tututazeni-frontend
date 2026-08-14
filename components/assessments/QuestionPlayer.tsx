// components/assessments/QuestionPlayer.tsx
// Renderização de uma pergunta do player (single/multi-choice, texto
// aberto, upload de ficheiro, media). Extraído de
// app/(platform)/assessments/page.tsx.

import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { parseOptions } from './utils';
import type { AttemptAnswer, Question } from './types';

export interface QuestionPlayerProps {
  question: Question;
  index: number;
  total: number;
  answer: AttemptAnswer | undefined;
  onChange: (a: AttemptAnswer) => void;
}

export function QuestionPlayer({
  question,
  index,
  total,
  answer,
  onChange,
}: QuestionPlayerProps) {
  const options = parseOptions(question.options);

  const handleSingleChoice = (idx: number) => {
    onChange({ questionId: question.id, selectedIndices: [idx] });
  };

  const handleMultiChoice = (idx: number) => {
    const current = answer?.selectedIndices ?? [];
    const updated = current.includes(idx)
      ? current.filter((i) => i !== idx)
      : [...current, idx];
    onChange({ questionId: question.id, selectedIndices: updated });
  };

  return (
    <Card className="p-6">
      {/* Question header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-data text-ink-faint">
              Pergunta {index + 1} de {total}
            </span>
            {question.difficulty > 1 && (
              <span
                className={`text-xs px-2 py-0.5 rounded-control ${
                  question.difficulty >= 4
                    ? 'bg-danger-subtle text-danger-ink'
                    : question.difficulty >= 3
                      ? 'bg-warning-subtle text-warning-ink'
                      : 'bg-info-subtle text-info-ink'
                }`}
              >
                {'★'.repeat(question.difficulty)}
              </span>
            )}
          </div>
          <p className="text-base font-medium text-ink leading-relaxed">
            {question.questionText}
          </p>
        </div>
        {question.weight !== 1 && (
          <span className="text-xs bg-info-subtle text-info-ink px-2 py-0.5 rounded-control flex-shrink-0">
            {question.weight} pts
          </span>
        )}
      </div>

      {/* Media */}
      {question.mediaUrl && (
        <div className="mb-4 rounded-control overflow-hidden bg-surface-sunken">
          {question.mediaUrl.match(/\.(mp4|webm)$/) ? (
            <video
              src={question.mediaUrl}
              controls
              className="w-full max-h-48 object-contain"
            />
          ) : (
            <div className="relative w-full h-48">
              <Image
                src={question.mediaUrl}
                alt="Media"
                fill
                className="object-contain"
              />
            </div>
          )}
        </div>
      )}

      {/* Options */}
      {(question.type === 'MULTIPLE_CHOICE_SINGLE' ||
        question.type === 'TRUE_FALSE') &&
        options && (
          <div className="space-y-2">
            {options.map((opt, idx) => {
              const selected = answer?.selectedIndices?.includes(idx);
              return (
                <label
                  key={idx}
                  className={`flex items-center gap-3 p-3.5 border rounded-card cursor-pointer transition-colors ${
                    selected
                      ? 'border-primary bg-primary-subtle'
                      : 'border-border hover:border-border-strong hover:bg-surface-sunken'
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${question.id}`}
                    checked={!!selected}
                    onChange={() => handleSingleChoice(idx)}
                    className="w-4 h-4 text-primary focus:ring-accent"
                  />
                  <span
                    className={`text-sm ${selected ? 'font-medium text-primary' : 'text-ink-muted'}`}
                  >
                    {opt.text}
                  </span>
                </label>
              );
            })}
          </div>
        )}

      {question.type === 'MULTIPLE_CHOICE_MULTI' && options && (
        <div className="space-y-2">
          <div className="text-xs text-ink-faint mb-2">
            Pode seleccionar múltiplas respostas
          </div>
          {options.map((opt, idx) => {
            const selected = answer?.selectedIndices?.includes(idx);
            return (
              <label
                key={idx}
                className={`flex items-center gap-3 p-3.5 border rounded-card cursor-pointer transition-colors ${
                  selected
                    ? 'border-primary bg-primary-subtle'
                    : 'border-border hover:border-border-strong hover:bg-surface-sunken'
                }`}
              >
                <input
                  type="checkbox"
                  checked={!!selected}
                  onChange={() => handleMultiChoice(idx)}
                  className="w-4 h-4 text-primary rounded accent-primary focus:ring-accent"
                />
                <span
                  className={`text-sm ${selected ? 'font-medium text-primary' : 'text-ink-muted'}`}
                >
                  {opt.text}
                </span>
              </label>
            );
          })}
        </div>
      )}

      {question.type === 'OPEN_TEXT' && (
        <textarea
          value={answer?.textAnswer ?? ''}
          onChange={(e) =>
            onChange({ questionId: question.id, textAnswer: e.target.value })
          }
          rows={5}
          placeholder="Escreva a sua resposta aqui…"
          className="w-full text-sm border border-border rounded-card px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
        />
      )}

      {question.type === 'FILE_UPLOAD' && (
        <div className="border-2 border-dashed border-border-strong rounded-card p-8 text-center">
          <div className="text-3xl mb-3">📎</div>
          <div className="text-sm font-medium text-ink mb-1">
            Upload de ficheiro
          </div>
          <button className="text-xs text-primary underline">
            Seleccionar ficheiro
          </button>
          {answer?.fileUrl && (
            <div className="mt-2 text-xs text-success">
              ✓ Ficheiro carregado
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

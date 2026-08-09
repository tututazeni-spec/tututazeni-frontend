// components/assessments/QuestionPlayer.tsx
// Renderização de uma pergunta do player (single/multi-choice, texto
// aberto, upload de ficheiro, media). Extraído de
// app/(platform)/assessments/page.tsx.

import Image from 'next/image';
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
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      {/* Question header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-gray-400">
              Pergunta {index + 1} de {total}
            </span>
            {question.difficulty > 1 && (
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  question.difficulty >= 4
                    ? 'bg-red-50 text-red-700'
                    : question.difficulty >= 3
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-blue-50 text-blue-600'
                }`}
              >
                {'★'.repeat(question.difficulty)}
              </span>
            )}
          </div>
          <p className="text-base font-medium text-gray-900 leading-relaxed">
            {question.questionText}
          </p>
        </div>
        {question.weight !== 1 && (
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded flex-shrink-0">
            {question.weight} pts
          </span>
        )}
      </div>

      {/* Media */}
      {question.mediaUrl && (
        <div className="mb-4 rounded-lg overflow-hidden bg-gray-100">
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
                  className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition-all ${
                    selected
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${question.id}`}
                    checked={!!selected}
                    onChange={() => handleSingleChoice(idx)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span
                    className={`text-sm ${selected ? 'font-medium text-blue-900' : 'text-gray-700'}`}
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
          <div className="text-xs text-gray-400 mb-2">
            Pode seleccionar múltiplas respostas
          </div>
          {options.map((opt, idx) => {
            const selected = answer?.selectedIndices?.includes(idx);
            return (
              <label
                key={idx}
                className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition-all ${
                  selected
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={!!selected}
                  onChange={() => handleMultiChoice(idx)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span
                  className={`text-sm ${selected ? 'font-medium text-blue-900' : 'text-gray-700'}`}
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
          className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      )}

      {question.type === 'FILE_UPLOAD' && (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
          <div className="text-3xl mb-3">📎</div>
          <div className="text-sm font-medium text-gray-700 mb-1">
            Upload de ficheiro
          </div>
          <button className="text-xs text-blue-600 underline">
            Seleccionar ficheiro
          </button>
          {answer?.fileUrl && (
            <div className="mt-2 text-xs text-emerald-600">
              ✓ Ficheiro carregado
            </div>
          )}
        </div>
      )}
    </div>
  );
}

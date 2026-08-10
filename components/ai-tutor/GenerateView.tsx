// components/ai-tutor/GenerateView.tsx
// Vista "Gerar conteúdo": criação de quizzes, flashcards, resumos e
// planos de estudo via IA. Extraído de
// app/(platform)/ai-tutor/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import type { Flashcard, GeneratedContent, QuizQuestion } from './types';

export function GenerateView() {
  const [type, setType] = useState<
    'QUIZ' | 'FLASHCARDS' | 'SUMMARY' | 'STUDY_PLAN'
  >('QUIZ');
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);
  const generateMutation = useApiMutation(
    (payload: { type: typeof type; topic: string; count: number }) =>
      apiClient.post<GeneratedContent>('/ai-tutor/generate', payload),
    { onError: (e) => alert(e.message) },
  );
  const result = generateMutation.data ?? null;
  const loading = generateMutation.isPending;

  const generate = () => {
    if (!topic.trim()) {
      alert('Introduz um tema');
      return;
    }
    generateMutation.mutate({ type, topic, count });
  };

  const renderContent = () => {
    if (!result) return null;

    if (type === 'QUIZ' && Array.isArray(result.content)) {
      return (
        <div className="space-y-4">
          {(result.content as QuizQuestion[]).map((q, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-xl p-4"
            >
              <div className="text-sm font-semibold text-gray-900 mb-3">
                {i + 1}. {q.question}
              </div>
              <div className="space-y-1.5">
                {(q.options ?? []).map((opt: string, j: number) => (
                  <div
                    key={j}
                    className={`text-sm px-3 py-2 rounded-lg ${
                      opt.startsWith(q.correct)
                        ? 'bg-emerald-50 text-emerald-700 font-medium'
                        : 'bg-gray-50 text-gray-700'
                    }`}
                  >
                    {opt}
                  </div>
                ))}
              </div>
              {q.explanation && (
                <div className="mt-3 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                  💡 {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (type === 'FLASHCARDS' && Array.isArray(result.content)) {
      return (
        <div className="grid grid-cols-2 gap-3">
          {(result.content as Flashcard[]).map((c, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-xl p-4"
            >
              <div className="text-xs text-gray-400 mb-1">FRENTE</div>
              <div className="text-sm font-semibold text-gray-900 mb-3">
                {c.front}
              </div>
              <div className="h-px bg-gray-100 mb-3" />
              <div className="text-xs text-gray-400 mb-1">VERSO</div>
              <div className="text-sm text-gray-700">{c.back}</div>
            </div>
          ))}
        </div>
      );
    }

    // SUMMARY ou raw text
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
        {typeof result.content === 'string' ? result.content : result.raw}
      </div>
    );
  };

  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <div className="text-sm font-semibold text-gray-900 mb-4">
          Geração de conteúdo com IA
        </div>

        {/* Tipo */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(
            [
              { id: 'QUIZ', label: '📊 Quiz' },
              { id: 'FLASHCARDS', label: '🃏 Flashcards' },
              { id: 'SUMMARY', label: '📝 Resumo' },
              { id: 'STUDY_PLAN', label: '📅 Plano de estudo' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                type === t.id
                  ? 'bg-blue-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tema */}
        <input
          type="text"
          placeholder="Tema (ex: Gestão de riscos de crédito, Liderança situacional…)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
        />

        {type !== 'SUMMARY' && type !== 'STUDY_PLAN' && (
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs text-gray-500">Quantidade:</span>
            {[3, 5, 8, 10].map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`w-8 h-8 text-xs rounded-lg ${count === n ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                {n}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={generate}
          disabled={loading || !topic.trim()}
          className="w-full py-2.5 bg-blue-700 text-white text-sm font-semibold rounded-xl hover:bg-blue-800 disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              A gerar com IA…
            </span>
          ) : (
            `⚡ Gerar ${type === 'QUIZ' ? 'Quiz' : type === 'FLASHCARDS' ? 'Flashcards' : type === 'SUMMARY' ? 'Resumo' : 'Plano de estudo'}`
          )}
        </button>
      </div>

      {result && (
        <div>
          <div className="text-xs text-gray-400 mb-3">
            Gerado por {result.provider}
          </div>
          {renderContent()}
        </div>
      )}
    </div>
  );
}

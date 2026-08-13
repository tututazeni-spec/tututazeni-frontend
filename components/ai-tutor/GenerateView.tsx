// components/ai-tutor/GenerateView.tsx
// Vista "Gerar conteúdo": criação de quizzes, flashcards, resumos e
// planos de estudo via IA. Extraído de
// app/(platform)/ai-tutor/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import type { Flashcard, GeneratedContent, QuizQuestion } from './types';

const CONTENT_TYPES = [
  { id: 'QUIZ', label: '📊 Quiz' },
  { id: 'FLASHCARDS', label: '🃏 Flashcards' },
  { id: 'SUMMARY', label: '📝 Resumo' },
  { id: 'STUDY_PLAN', label: '📅 Plano de estudo' },
] as const;

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
            <Card key={i} className="p-4">
              <div className="font-body text-sm font-semibold text-ink mb-3">
                {i + 1}. {q.question}
              </div>
              <div className="space-y-1.5">
                {(q.options ?? []).map((opt: string, j: number) => (
                  <div
                    key={j}
                    className={`font-body text-sm px-3 py-2 rounded-control ${
                      opt.startsWith(q.correct)
                        ? 'bg-success-subtle text-success-ink font-medium'
                        : 'bg-surface-sunken text-ink-muted'
                    }`}
                  >
                    {opt}
                  </div>
                ))}
              </div>
              {q.explanation && (
                <div className="mt-3 font-body text-xs text-info-ink bg-info-subtle rounded-control px-3 py-2">
                  💡 {q.explanation}
                </div>
              )}
            </Card>
          ))}
        </div>
      );
    }

    if (type === 'FLASHCARDS' && Array.isArray(result.content)) {
      return (
        <div className="grid grid-cols-2 gap-3">
          {(result.content as Flashcard[]).map((c, i) => (
            <Card key={i} className="p-4">
              <div className="font-body text-xs text-ink-faint mb-1">
                FRENTE
              </div>
              <div className="font-body text-sm font-semibold text-ink mb-3">
                {c.front}
              </div>
              <div className="h-px bg-border mb-3" />
              <div className="font-body text-xs text-ink-faint mb-1">
                VERSO
              </div>
              <div className="font-body text-sm text-ink">{c.back}</div>
            </Card>
          ))}
        </div>
      );
    }

    // SUMMARY ou raw text
    return (
      <Card className="p-5 font-body text-sm text-ink leading-relaxed whitespace-pre-line">
        {typeof result.content === 'string' ? result.content : result.raw}
      </Card>
    );
  };

  return (
    <div>
      <Card className="p-5 mb-5">
        <div className="font-body text-sm font-semibold text-ink mb-4">
          Geração de conteúdo com IA
        </div>

        {/* Tipo */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {CONTENT_TYPES.map((t) => (
            <Button
              key={t.id}
              size="sm"
              intent={type === t.id ? 'primary' : 'secondary'}
              onClick={() => setType(t.id)}
            >
              {t.label}
            </Button>
          ))}
        </div>

        {/* Tema */}
        <Input
          type="text"
          placeholder="Tema (ex: Gestão de riscos de crédito, Liderança situacional…)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full mb-3"
        />

        {type !== 'SUMMARY' && type !== 'STUDY_PLAN' && (
          <div className="flex items-center gap-3 mb-4">
            <span className="font-body text-xs text-ink-muted">
              Quantidade:
            </span>
            {[3, 5, 8, 10].map((n) => (
              <Button
                key={n}
                size="sm"
                intent={count === n ? 'primary' : 'secondary'}
                onClick={() => setCount(n)}
                className="h-8 w-8 justify-center p-0"
              >
                {n}
              </Button>
            ))}
          </div>
        )}

        <Button
          onClick={generate}
          disabled={!topic.trim()}
          loading={loading}
          className="w-full"
        >
          {loading
            ? 'A gerar com IA…'
            : `⚡ Gerar ${type === 'QUIZ' ? 'Quiz' : type === 'FLASHCARDS' ? 'Flashcards' : type === 'SUMMARY' ? 'Resumo' : 'Plano de estudo'}`}
        </Button>
      </Card>

      {result && (
        <div>
          <div className="font-body text-xs text-ink-faint mb-3">
            Gerado por {result.provider}
          </div>
          {renderContent()}
        </div>
      )}
    </div>
  );
}

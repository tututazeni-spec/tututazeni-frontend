// components/ai-tutor/ExercisesView.tsx
// Vista "Exercícios" (docs/ai-tutor.md secção 5): o tutor gera exercícios a
// partir de um tema/conteúdo — múltipla escolha, verdadeiro/falso, perguntas
// abertas, casos práticos, simulações, cenários e flashcards — e dá feedback
// de IA às respostas de tipo aberto. Substitui o antigo GenerateView, que
// cobria apenas QUIZ/FLASHCARDS/SUMMARY/STUDY_PLAN.

'use client';

import { useState } from 'react';
import { Lightbulb, Sparkles } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/providers/ToastProvider';
import type {
  ExerciseFeedbackResponse,
  Flashcard,
  GeneratedContent,
  OpenQuestionItem,
  PracticalCaseItem,
  QuizQuestion,
  ScenarioItem,
  SimulationItem,
  TrueFalseItem,
} from './types';

type ExerciseType =
  | 'QUIZ'
  | 'TRUE_FALSE'
  | 'OPEN_QUESTION'
  | 'PRACTICAL_CASE'
  | 'SIMULATION'
  | 'SCENARIO'
  | 'FLASHCARDS'
  | 'SUMMARY'
  | 'STUDY_PLAN';

const EXERCISE_TYPES: Array<{ id: ExerciseType; label: string; hasCount: boolean }> = [
  { id: 'QUIZ', label: 'Escolha múltipla', hasCount: true },
  { id: 'TRUE_FALSE', label: 'Verdadeiro/Falso', hasCount: true },
  { id: 'OPEN_QUESTION', label: 'Perguntas abertas', hasCount: true },
  { id: 'PRACTICAL_CASE', label: 'Casos práticos', hasCount: true },
  { id: 'SIMULATION', label: 'Simulações', hasCount: true },
  { id: 'SCENARIO', label: 'Cenários', hasCount: true },
  { id: 'FLASHCARDS', label: 'Flashcards', hasCount: true },
  { id: 'SUMMARY', label: 'Resumo', hasCount: false },
  { id: 'STUDY_PLAN', label: 'Plano de estudo', hasCount: false },
];

/** Caixa de resposta livre com feedback de IA — para tipos sem correcção automática. */
function ExerciseFeedbackBox({
  exerciseType,
  question,
  modelAnswer,
}: {
  exerciseType: 'OPEN_QUESTION' | 'PRACTICAL_CASE' | 'SCENARIO';
  question: string;
  modelAnswer?: string;
}) {
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const notify = useToast();

  const askFeedback = async () => {
    if (!answer.trim()) return;
    setLoading(true);
    try {
      const res = await apiClient.post<ExerciseFeedbackResponse>('/ai-tutor/exercises/feedback', {
        exerciseType,
        question,
        userAnswer: answer,
        modelAnswer,
      });
      setFeedback(res.feedback);
    } catch (e) {
      notify({ title: e instanceof Error ? e.message : 'Erro ao pedir feedback', intent: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 space-y-2">
      <Textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Escreve a tua resposta…"
        rows={3}
        className="w-full"
      />
      <Button size="sm" intent="secondary" onClick={askFeedback} loading={loading} disabled={!answer.trim()}>
        <Sparkles size={14} strokeWidth={1.75} />
        Pedir feedback à Ísis
      </Button>
      {feedback && (
        <div className="font-body text-sm text-info-ink bg-info-subtle rounded-control px-3 py-2 whitespace-pre-line">
          {feedback}
        </div>
      )}
    </div>
  );
}

function TrueFalseCard({ item, index }: { item: TrueFalseItem; index: number }) {
  const [answer, setAnswer] = useState<boolean | null>(null);
  return (
    <Card className="p-4">
      <div className="font-body text-sm font-semibold text-ink mb-3">
        {index + 1}. {item.statement}
      </div>
      <div className="flex gap-2">
        {[true, false].map((v) => (
          <Button
            key={String(v)}
            size="sm"
            intent={answer === v ? (v === item.isTrue ? 'success' : 'danger') : 'secondary'}
            onClick={() => setAnswer(v)}
          >
            {v ? 'Verdadeiro' : 'Falso'}
          </Button>
        ))}
      </div>
      {answer !== null && item.explanation && (
        <div className="mt-3 font-body text-xs text-info-ink bg-info-subtle rounded-control px-3 py-2">
          {item.explanation}
        </div>
      )}
    </Card>
  );
}

function SimulationCard({ item, index }: { item: SimulationItem; index: number }) {
  const [chosen, setChosen] = useState<number | null>(null);
  return (
    <Card className="p-4">
      <div className="font-body text-sm font-semibold text-ink mb-3">
        {index + 1}. {item.situation}
      </div>
      <div className="space-y-2">
        {item.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => setChosen(i)}
            className={`w-full text-left font-body text-sm px-3 py-2 rounded-control border transition-colors ${
              chosen === i
                ? opt.isBest
                  ? 'bg-success-subtle border-success text-success-ink'
                  : 'bg-warning-subtle border-warning text-warning-ink'
                : 'border-border bg-surface-sunken text-ink hover:bg-surface'
            }`}
          >
            {opt.text}
          </button>
        ))}
      </div>
      {chosen !== null && (
        <div className="mt-3 font-body text-xs text-ink-muted bg-surface-sunken rounded-control px-3 py-2">
          {item.options[chosen].isBest ? '✅ ' : 'ℹ️ '}
          {item.options[chosen].consequence}
        </div>
      )}
    </Card>
  );
}

export function ExercisesView() {
  const notify = useToast();
  const [type, setType] = useState<ExerciseType>('QUIZ');
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);
  const generateMutation = useApiMutation(
    (payload: { type: ExerciseType; topic: string; count: number }) =>
      apiClient.post<GeneratedContent>('/ai-tutor/generate', payload),
    { onError: (e) => notify({ title: e.message, intent: 'danger' }) },
  );
  const result = generateMutation.data ?? null;
  const loading = generateMutation.isPending;
  const activeType = EXERCISE_TYPES.find((t) => t.id === type)!;

  const generate = () => {
    if (!topic.trim()) {
      notify({ title: 'Introduz um tema', intent: 'danger' });
      return;
    }
    generateMutation.mutate({ type, topic, count });
  };

  const renderContent = () => {
    if (!result) return null;
    const content = result.content;

    if (type === 'QUIZ' && Array.isArray(content)) {
      return (
        <div className="space-y-4">
          {(content as QuizQuestion[]).map((q, i) => (
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
                  <Lightbulb size={14} strokeWidth={1.75} className="inline align-[-2px]" />{' '}
                  {q.explanation}
                </div>
              )}
            </Card>
          ))}
        </div>
      );
    }

    if (type === 'TRUE_FALSE' && Array.isArray(content)) {
      return (
        <div className="space-y-4">
          {(content as TrueFalseItem[]).map((item, i) => (
            <TrueFalseCard key={i} item={item} index={i} />
          ))}
        </div>
      );
    }

    if (type === 'OPEN_QUESTION' && Array.isArray(content)) {
      return (
        <div className="space-y-4">
          {(content as OpenQuestionItem[]).map((q, i) => (
            <Card key={i} className="p-4">
              <div className="font-body text-sm font-semibold text-ink">
                {i + 1}. {q.question}
              </div>
              <ExerciseFeedbackBox
                exerciseType="OPEN_QUESTION"
                question={q.question}
                modelAnswer={q.modelAnswer}
              />
            </Card>
          ))}
        </div>
      );
    }

    if (type === 'PRACTICAL_CASE' && Array.isArray(content)) {
      return (
        <div className="space-y-4">
          {(content as PracticalCaseItem[]).map((c, i) => (
            <Card key={i} className="p-4">
              <div className="font-body text-xs text-ink-faint uppercase tracking-wide mb-1">
                Caso {i + 1}
              </div>
              <div className="font-body text-sm text-ink mb-2">{c.scenario}</div>
              <div className="font-body text-sm font-semibold text-ink">{c.question}</div>
              <ExerciseFeedbackBox
                exerciseType="PRACTICAL_CASE"
                question={c.question}
                modelAnswer={c.keyPoints?.join('; ')}
              />
            </Card>
          ))}
        </div>
      );
    }

    if (type === 'SIMULATION' && Array.isArray(content)) {
      return (
        <div className="space-y-4">
          {(content as SimulationItem[]).map((item, i) => (
            <SimulationCard key={i} item={item} index={i} />
          ))}
        </div>
      );
    }

    if (type === 'SCENARIO' && Array.isArray(content)) {
      return (
        <div className="space-y-4">
          {(content as ScenarioItem[]).map((s, i) => (
            <Card key={i} className="p-4">
              <div className="font-body text-xs text-ink-faint uppercase tracking-wide mb-1">
                Cenário {i + 1}
              </div>
              <div className="font-body text-sm text-ink mb-2">{s.context}</div>
              <div className="font-body text-sm font-semibold text-ink mb-1">{s.challenge}</div>
              {s.reflectionQuestion && (
                <Badge intent="info" className="mb-2">
                  {s.reflectionQuestion}
                </Badge>
              )}
              <ExerciseFeedbackBox
                exerciseType="SCENARIO"
                question={s.reflectionQuestion ?? s.challenge}
              />
            </Card>
          ))}
        </div>
      );
    }

    if (type === 'FLASHCARDS' && Array.isArray(content)) {
      return (
        <div className="grid grid-cols-2 gap-3">
          {(content as Flashcard[]).map((c, i) => (
            <Card key={i} className="p-4">
              <div className="font-body text-xs text-ink-faint mb-1">FRENTE</div>
              <div className="font-body text-sm font-semibold text-ink mb-3">{c.front}</div>
              <div className="h-px bg-border mb-3" />
              <div className="font-body text-xs text-ink-faint mb-1">VERSO</div>
              <div className="font-body text-sm text-ink">{c.back}</div>
            </Card>
          ))}
        </div>
      );
    }

    // SUMMARY / STUDY_PLAN ou texto em bruto
    return (
      <Card className="p-5 font-body text-sm text-ink leading-relaxed whitespace-pre-line">
        {typeof content === 'string' ? content : result.raw}
      </Card>
    );
  };

  return (
    <div>
      <Card className="p-5 mb-5">
        <div className="font-body text-sm font-semibold text-ink mb-4">
          Gerar exercícios com IA
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {EXERCISE_TYPES.map((t) => (
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

        <Input
          type="text"
          placeholder="Tema (ex: Gestão de riscos de crédito, Liderança situacional…)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full mb-3"
        />

        {activeType.hasCount && (
          <div className="flex items-center gap-3 mb-4">
            <span className="font-body text-xs text-ink-muted">Quantidade:</span>
            {[2, 3, 5, 8, 10].map((n) => (
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

        <Button onClick={generate} disabled={!topic.trim()} loading={loading} className="w-full">
          {loading ? 'A gerar com IA…' : `Gerar ${activeType.label.toLowerCase()}`}
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

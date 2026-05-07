// src/app/(dashboard)/assessments/page.tsx
// Inclui: player de avaliação, resultado, lista, e builder admin
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type QType  = 'MULTIPLE_CHOICE_SINGLE' | 'MULTIPLE_CHOICE_MULTI' | 'TRUE_FALSE' | 'OPEN_TEXT' | 'FILE_UPLOAD' | 'ORDERING';
type AStatus= 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'PASSED' | 'FAILED' | 'EXPIRED';

interface QOption { text: string; isCorrect?: boolean; feedback?: string }

interface Question {
  id: number;
  type: QType;
  questionText: string;
  mediaUrl: string | null;
  options: QOption[] | null;  // parsed from JSON
  weight: number;
  difficulty: number;
  seq: number;
}

interface Assessment {
  id: number;
  title: string;
  description: string | null;
  type: string;
  status: AStatus;
  passingScore: number;
  maxAttempts: number;
  cooldownHours: number;
  timeLimitMinutes: number;
  feedbackMode: string;
  randomizeQuestions: boolean;
  allowReview: boolean;
  createdAt: string;
  questions: Question[];
  _count: { questions: number; attempts: number };
}

interface AttemptAnswer {
  questionId: number;
  selectedIndices?: number[];
  textAnswer?: string;
  fileUrl?: string;
}

interface AttemptResult {
  attempt: { id: number; status: AttemptStatus; score: number; passed: boolean | null };
  score: number;
  passed: boolean | null;
  totalQuestions: number;
  correctAnswers: number;
  needsManualReview: boolean;
  results?: Array<{
    questionId: number;
    questionText: string;
    isCorrect: boolean | null;
    earnedPoints: number;
    correctAnswer?: string;
    explanation?: string;
    options?: QOption[];
  }>;
}

type View = 'list' | 'player' | 'result' | 'review';

// ─── API ──────────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erro' }));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseOptions(optionsJson: any): QOption[] | null {
  if (!optionsJson) return null;
  try {
    return typeof optionsJson === 'string' ? JSON.parse(optionsJson) : optionsJson;
  } catch { return null; }
}

function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
    </div>
  );
}

// ─── Timer component ──────────────────────────────────────────────────────────

function CountdownTimer({ totalMinutes, onExpire }: { totalMinutes: number; onExpire: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(totalMinutes * 60);

  useEffect(() => {
    if (secondsLeft <= 0) { onExpire(); return; }
    const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, onExpire]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const isUrgent = secondsLeft <= 60;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-semibold text-sm ${
      isUrgent ? 'bg-red-50 text-red-700 animate-pulse' : 'bg-gray-100 text-gray-700'
    }`}>
      ⏱ {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </div>
  );
}

// ─── Question Player ──────────────────────────────────────────────────────────

function QuestionPlayer({
  question,
  index,
  total,
  answer,
  onChange,
}: {
  question: Question;
  index: number;
  total: number;
  answer: AttemptAnswer | undefined;
  onChange: (a: AttemptAnswer) => void;
}) {
  const options = parseOptions(question.options);

  const handleSingleChoice = (idx: number) => {
    onChange({ questionId: question.id, selectedIndices: [idx] });
  };

  const handleMultiChoice = (idx: number) => {
    const current = answer?.selectedIndices ?? [];
    const updated = current.includes(idx) ? current.filter(i => i !== idx) : [...current, idx];
    onChange({ questionId: question.id, selectedIndices: updated });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      {/* Question header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-gray-400">Pergunta {index + 1} de {total}</span>
            {question.difficulty > 1 && (
              <span className={`text-xs px-2 py-0.5 rounded ${
                question.difficulty >= 4 ? 'bg-red-50 text-red-700' :
                question.difficulty >= 3 ? 'bg-amber-50 text-amber-700' :
                'bg-blue-50 text-blue-600'
              }`}>
                {'★'.repeat(question.difficulty)}
              </span>
            )}
          </div>
          <p className="text-base font-medium text-gray-900 leading-relaxed">{question.questionText}</p>
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
            <video src={question.mediaUrl} controls className="w-full max-h-48 object-contain" />
          ) : (
            <img src={question.mediaUrl} alt="Media" className="w-full max-h-48 object-contain" />
          )}
        </div>
      )}

      {/* Options */}
      {(question.type === 'MULTIPLE_CHOICE_SINGLE' || question.type === 'TRUE_FALSE') && options && (
        <div className="space-y-2">
          {options.map((opt, idx) => {
            const selected = answer?.selectedIndices?.includes(idx);
            return (
              <label
                key={idx}
                className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition-all ${
                  selected ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name={`q-${question.id}`}
                  checked={!!selected}
                  onChange={() => handleSingleChoice(idx)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className={`text-sm ${selected ? 'font-medium text-blue-900' : 'text-gray-700'}`}>
                  {opt.text}
                </span>
              </label>
            );
          })}
        </div>
      )}

      {question.type === 'MULTIPLE_CHOICE_MULTI' && options && (
        <div className="space-y-2">
          <div className="text-xs text-gray-400 mb-2">Pode seleccionar múltiplas respostas</div>
          {options.map((opt, idx) => {
            const selected = answer?.selectedIndices?.includes(idx);
            return (
              <label
                key={idx}
                className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition-all ${
                  selected ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={!!selected}
                  onChange={() => handleMultiChoice(idx)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className={`text-sm ${selected ? 'font-medium text-blue-900' : 'text-gray-700'}`}>
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
          onChange={e => onChange({ questionId: question.id, textAnswer: e.target.value })}
          rows={5}
          placeholder="Escreva a sua resposta aqui…"
          className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      )}

      {question.type === 'FILE_UPLOAD' && (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
          <div className="text-3xl mb-3">📎</div>
          <div className="text-sm font-medium text-gray-700 mb-1">Upload de ficheiro</div>
          <button className="text-xs text-blue-600 underline">Seleccionar ficheiro</button>
          {answer?.fileUrl && (
            <div className="mt-2 text-xs text-emerald-600">✓ Ficheiro carregado</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Result Feedback ──────────────────────────────────────────────────────────

function ResultView({
  result,
  assessment,
  onRetry,
  onBack,
}: {
  result: AttemptResult;
  assessment: Assessment;
  onRetry: () => void;
  onBack: () => void;
}) {
  const { score, passed, totalQuestions, correctAnswers, needsManualReview } = result;
  const isPass = passed === true;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Score card */}
      <div className={`rounded-2xl p-8 text-center mb-6 ${
        needsManualReview ? 'bg-amber-50 border border-amber-200' :
        isPass ? 'bg-emerald-50 border border-emerald-200' :
        'bg-red-50 border border-red-200'
      }`}>
        <div className="text-5xl mb-3">
          {needsManualReview ? '⏳' : isPass ? '🎉' : '😔'}
        </div>
        <div className={`text-4xl font-bold font-mono mb-2 ${
          needsManualReview ? 'text-amber-700' :
          isPass ? 'text-emerald-700' : 'text-red-700'
        }`}>
          {score}%
        </div>
        <div className={`text-lg font-semibold mb-1 ${
          needsManualReview ? 'text-amber-800' :
          isPass ? 'text-emerald-800' : 'text-red-800'
        }`}>
          {needsManualReview ? 'Aguarda revisão manual' :
           isPass ? 'Aprovado!' : 'Reprovado'}
        </div>
        <div className={`text-sm ${
          needsManualReview ? 'text-amber-600' :
          isPass ? 'text-emerald-600' : 'text-red-600'
        }`}>
          {needsManualReview
            ? 'As tuas respostas abertas serão revistas pelo instrutor'
            : `${correctAnswers}/${totalQuestions} corretas · Mínimo: ${assessment.passingScore}%`}
        </div>
      </div>

      {/* Progress visual */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>Score obtido</span>
          <span>Mínimo: {assessment.passingScore}%</span>
        </div>
        <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${isPass ? 'bg-emerald-500' : 'bg-red-500'}`}
            style={{ width: `${score}%` }}
          />
          {/* Passing line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-gray-400"
            style={{ left: `${assessment.passingScore}%` }}
          />
        </div>
      </div>

      {/* Per-question feedback */}
      {result.results && result.results.length > 0 && (
        <div className="space-y-3 mb-5">
          <div className="text-sm font-semibold text-gray-700">Revisão das respostas</div>
          {result.results.map((r, idx) => (
            <div
              key={r.questionId}
              className={`border rounded-xl p-4 ${
                r.isCorrect === null ? 'border-amber-200 bg-amber-50' :
                r.isCorrect ? 'border-emerald-200 bg-emerald-50' :
                'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-start gap-2 mb-2">
                <span className={`text-sm flex-shrink-0 ${
                  r.isCorrect === null ? 'text-amber-600' :
                  r.isCorrect ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {r.isCorrect === null ? '⏳' : r.isCorrect ? '✓' : '✗'}
                </span>
                <span className="text-sm font-medium text-gray-800">{r.questionText}</span>
              </div>
              {r.explanation && (
                <div className="text-xs text-gray-600 mt-2 pl-5">
                  💡 {r.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-2.5 border border-gray-200 text-sm rounded-xl hover:bg-gray-50">
          ← Voltar
        </button>
        {!isPass && assessment.maxAttempts === 0 && (
          <button
            onClick={onRetry}
            className="flex-1 py-2.5 bg-blue-700 text-white text-sm font-medium rounded-xl hover:bg-blue-800"
          >
            🔄 Repetir avaliação
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Assessment Player ────────────────────────────────────────────────────────

function AssessmentPlayer({
  assessmentId,
  onBack,
}: {
  assessmentId: number;
  onBack: () => void;
}) {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [attempt, setAttempt]       = useState<any>(null);
  const [answers, setAnswers]       = useState<Record<number, AttemptAnswer>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [result, setResult]         = useState<AttemptResult | null>(null);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Carregar avaliação e iniciar tentativa
  useEffect(() => {
    const init = async () => {
      try {
        const a = await apiFetch<Assessment>(`/assessments/${assessmentId}`);
        // Parse options para cada pergunta
        const parsed = {
          ...a,
          questions: a.questions.map(q => ({ ...q, options: parseOptions((q as any).options) })),
        };
        setAssessment(parsed);

        const att = await apiFetch<any>('/assessments/attempts/start', {
          method: 'POST',
          body: JSON.stringify({ assessmentId }),
        });
        setAttempt(att);

        // Restaurar auto-save
        if (att.savedAnswers && att.savedAnswers !== '{}') {
          try {
            const saved = JSON.parse(att.savedAnswers);
            const restored: Record<number, AttemptAnswer> = {};
            if (Array.isArray(saved)) {
              saved.forEach((a: AttemptAnswer) => { restored[a.questionId] = a; });
            }
            setAnswers(restored);
          } catch { /* ignore */ }
        }
      } catch (e: any) {
        alert(e.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [assessmentId]);

  // Auto-save a cada 30s
  useEffect(() => {
    if (!attempt || !assessment) return;
    const interval = setInterval(async () => {
      const answersList = Object.values(answers);
      if (answersList.length === 0) return;
      await apiFetch('/assessments/attempts/save', {
        method: 'POST',
        body: JSON.stringify({ attemptId: attempt.id, answers: answersList }),
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [attempt, answers, assessment]);

  const handleSubmit = async () => {
    if (!attempt || !assessment) return;
    setSubmitting(true);
    try {
      const answersList = assessment.questions.map(q => answers[q.id] ?? { questionId: q.id });
      const res = await apiFetch<AttemptResult>('/assessments/attempts/submit', {
        method: 'POST',
        body: JSON.stringify({ attemptId: attempt.id, answers: answersList }),
      });
      setResult(res);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
      setShowConfirm(false);
    }
  };

  const handleAnswer = (a: AttemptAnswer) => {
    setAnswers(prev => ({ ...prev, [a.questionId]: a }));
  };

  const handleTimerExpire = () => {
    alert('Tempo esgotado! A submeter automaticamente.');
    handleSubmit();
  };

  if (loading || !assessment) return <div className="p-8"><Skeleton rows={4} /></div>;

  // Mostrar resultado
  if (result) {
    return (
      <ResultView
        result={result}
        assessment={assessment}
        onRetry={() => { setResult(null); setAnswers({}); setCurrentIdx(0); }}
        onBack={onBack}
      />
    );
  }

  const questions = assessment.questions;
  const currentQ  = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-5 gap-4">
        <div>
          <div className="text-base font-semibold text-gray-900">{assessment.title}</div>
          <div className="text-xs text-gray-400">{answeredCount}/{questions.length} respondidas</div>
        </div>
        <div className="flex items-center gap-3">
          {assessment.timeLimitMinutes > 0 && attempt && (
            <CountdownTimer totalMinutes={assessment.timeLimitMinutes} onExpire={handleTimerExpire} />
          )}
          <button
            onClick={() => setShowConfirm(true)}
            disabled={submitting}
            className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 disabled:opacity-50"
          >
            {submitting ? 'A submeter…' : 'Submeter'}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-1.5 bg-blue-600 rounded-full transition-all"
            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Pergunta {currentIdx + 1}</span>
          <span>{questions.length} perguntas</span>
        </div>
      </div>

      {/* Question */}
      {currentQ && (
        <QuestionPlayer
          question={currentQ}
          index={currentIdx}
          total={questions.length}
          answer={answers[currentQ.id]}
          onChange={handleAnswer}
        />
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-5">
        <button
          onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
          className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50"
        >
          ← Anterior
        </button>

        {/* Question dots */}
        <div className="flex gap-1.5">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentIdx(idx)}
              className={`w-6 h-6 rounded-full text-xs font-mono transition-all ${
                idx === currentIdx ? 'bg-blue-600 text-white scale-110' :
                answers[q.id] ? 'bg-emerald-100 text-emerald-700' :
                'bg-gray-100 text-gray-400'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            if (currentIdx < questions.length - 1) setCurrentIdx(i => i + 1);
            else setShowConfirm(true);
          }}
          className="px-4 py-2 text-sm bg-blue-700 text-white rounded-lg hover:bg-blue-800"
        >
          {currentIdx < questions.length - 1 ? 'Próxima →' : 'Submeter'}
        </button>
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4">
            <div className="text-base font-semibold text-gray-900 mb-2">Submeter avaliação?</div>
            <div className="text-sm text-gray-500 mb-5">
              Respondeste {answeredCount} de {questions.length} perguntas.
              {answeredCount < questions.length && (
                <span className="text-amber-600"> {questions.length - answeredCount} perguntas sem resposta.</span>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 border border-gray-200 text-sm rounded-lg hover:bg-gray-50">
                Continuar
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 disabled:opacity-50"
              >
                {submitting ? 'A submeter…' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── View: List ───────────────────────────────────────────────────────────────

function ListView({ onStart }: { onStart: (id: number) => void }) {
  const [data, setData]       = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      apiFetch<Assessment[]>('/assessments?status=PUBLISHED'),
      apiFetch<any[]>('/assessments/my/attempts'),
    ])
      .then(([asms, atts]) => { setData(asms); setAttempts(atts); })
      .finally(() => setLoading(false));
  }, []);

  const getMyBestScore = (assessmentId: number) => {
    const myAttempts = attempts.filter(a => a.assessmentId === assessmentId && a.status !== 'IN_PROGRESS');
    if (!myAttempts.length) return null;
    return Math.max(...myAttempts.map(a => a.score ?? 0));
  };

  const getMyStatus = (assessmentId: number): AttemptStatus | null => {
    const latest = attempts
      .filter(a => a.assessmentId === assessmentId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0];
    return latest?.status ?? null;
  };

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-3">
      {data.length === 0 && (
        <div className="py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
          Sem avaliações disponíveis
        </div>
      )}
      {data.map(a => {
        const bestScore = getMyBestScore(a.id);
        const status    = getMyStatus(a.id);
        return (
          <div
            key={a.id}
            className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4 hover:shadow-sm transition-all"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
              a.type === 'QUIZ'       ? 'bg-blue-50' :
              a.type === 'EXAM'       ? 'bg-purple-50' :
              a.type === 'DIAGNOSTIC' ? 'bg-amber-50' :
              'bg-gray-50'
            }`}>
              {{ QUIZ: '❓', EXAM: '📋', DIAGNOSTIC: '🔍', PRACTICAL: '🛠️', SURVEY: '📊' }[a.type] ?? '📝'}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900 mb-0.5">{a.title}</div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                <span>{a._count.questions} perguntas</span>
                {a.timeLimitMinutes > 0 && <span>⏱ {a.timeLimitMinutes}min</span>}
                <span>Aprovação: {a.passingScore}%</span>
                {a.maxAttempts > 0 && <span>Máx. {a.maxAttempts} tentativas</span>}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {bestScore !== null && (
                <div className="text-right">
                  <div className={`text-sm font-bold font-mono ${bestScore >= a.passingScore ? 'text-emerald-600' : 'text-red-600'}`}>
                    {bestScore}%
                  </div>
                  <div className="text-xs text-gray-400">melhor score</div>
                </div>
              )}
              <button
                onClick={() => onStart(a.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  status === 'PASSED' ? 'border border-emerald-300 text-emerald-700 hover:bg-emerald-50' :
                  status === 'IN_PROGRESS' ? 'bg-amber-600 text-white hover:bg-amber-700' :
                  'bg-blue-700 text-white hover:bg-blue-800'
                }`}
              >
                {status === 'PASSED' ? '✓ Repetir' :
                 status === 'IN_PROGRESS' ? '▶ Continuar' :
                 '▶ Iniciar'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── View: Review (Attempted) ─────────────────────────────────────────────────

function ReviewView() {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selectedAttempt, setSelected] = useState<any>(null);
  const [detail, setDetail]     = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    apiFetch<any[]>('/assessments/my/attempts')
      .then(d => setAttempts(d.filter(a => a.status !== 'IN_PROGRESS')))
      .finally(() => setLoading(false));
  }, []);

  const loadDetail = async (attempt: any) => {
    setSelected(attempt);
    setLoadingDetail(true);
    try {
      const d = await apiFetch<any>(`/assessments/attempts/${attempt.id}`);
      setDetail(d);
    } catch { /* silent */ }
    finally { setLoadingDetail(false); }
  };

  if (loading) return <Skeleton />;

  return (
    <div className="grid grid-cols-[280px_1fr] gap-5">
      {/* Attempts list */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Histórico</div>
        {attempts.length === 0 && (
          <div className="text-sm text-gray-400 text-center py-6">Sem tentativas concluídas</div>
        )}
        {attempts.map(a => (
          <div
            key={a.id}
            onClick={() => loadDetail(a)}
            className={`p-3 border rounded-xl cursor-pointer transition-colors ${
              selectedAttempt?.id === a.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="text-xs font-medium text-gray-800 truncate">{a.assessment?.title}</div>
            <div className="flex items-center justify-between mt-1">
              <span className={`text-sm font-bold font-mono ${(a.score ?? 0) >= (a.assessment?.passingScore ?? 70) ? 'text-emerald-600' : 'text-red-600'}`}>
                {a.score ?? '—'}%
              </span>
              <span className={`text-xs px-1.5 rounded ${
                a.status === 'PASSED' ? 'bg-emerald-50 text-emerald-700' :
                a.status === 'FAILED' ? 'bg-red-50 text-red-600' :
                'bg-amber-50 text-amber-700'
              }`}>{a.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail */}
      <div>
        {!selectedAttempt && (
          <div className="flex items-center justify-center h-48 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
            Selecciona uma tentativa para rever
          </div>
        )}
        {loadingDetail && <Skeleton rows={3} />}
        {detail && !loadingDetail && (
          <div className="space-y-3">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-sm font-semibold text-gray-900 mb-2">{detail.assessment?.title}</div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Score', value: `${detail.score ?? '—'}%` },
                  { label: 'Status', value: detail.status },
                  { label: 'Tempo', value: detail.timeSpentMinutes ? `${detail.timeSpentMinutes}min` : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-400">{label}</div>
                    <div className="text-sm font-semibold text-gray-900 mt-1">{value}</div>
                  </div>
                ))}
              </div>
            </div>
            {detail.answers?.map((ans: any) => (
              <div key={ans.id} className={`border rounded-xl p-4 ${
                ans.isCorrect === null ? 'border-amber-200 bg-amber-50' :
                ans.isCorrect ? 'border-emerald-200 bg-emerald-50' :
                'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-start gap-2 mb-1">
                  <span>{ans.isCorrect === null ? '⏳' : ans.isCorrect ? '✓' : '✗'}</span>
                  <p className="text-xs font-medium text-gray-800">{ans.question?.questionText}</p>
                </div>
                {ans.textAnswer && <p className="text-xs text-gray-600 pl-5 mt-1">{ans.textAnswer}</p>}
                {ans.reviewComment && (
                  <p className="text-xs text-blue-700 pl-5 mt-1">💬 {ans.reviewComment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page principal ───────────────────────────────────────────────────────────

const TITLES: Record<View, string> = {
  list:   'Avaliações disponíveis',
  player: 'Avaliação em progresso',
  result: 'Resultado',
  review: 'Histórico de tentativas',
};

export default function AssessmentsPage() {
  const [view, setView]         = useState<View>('list');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleStart = (id: number) => { setSelectedId(id); setView('player'); };
  const handleBack  = () => { setSelectedId(null); setView('list'); };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{TITLES[view]}</h1>
          <p className="text-sm text-gray-400 mt-0.5">INNOVA — Avaliações</p>
        </div>
      </div>

      {/* Tabs */}
      {view === 'list' || view === 'review' ? (
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {(['list', 'review'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {{ list: 'Disponíveis', review: 'Histórico' }[v]}
            </button>
          ))}
        </div>
      ) : (
        <button onClick={handleBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5">
          ← Voltar
        </button>
      )}

      {view === 'list'   && <ListView onStart={handleStart} />}
      {view === 'player' && selectedId !== null && (
        <AssessmentPlayer assessmentId={selectedId} onBack={handleBack} />
      )}
      {view === 'review' && <ReviewView />}
    </div>
  );
}
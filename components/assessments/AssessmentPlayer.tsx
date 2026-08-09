// components/assessments/AssessmentPlayer.tsx
// Player de avaliação — carrega a avaliação + inicia tentativa, auto-save
// periódico, navegação entre perguntas, submissão e resultado. Dados
// próprios (apiClient directo + reducer) + apresentação, mesmo padrão
// auto-contido usado em components/payslips/page.tsx. Extraído de
// app/(platform)/assessments/page.tsx.

'use client';

import { useEffect, useReducer, useRef } from 'react';
import { apiClient } from '@/lib/apiClient';
import { CountdownTimer } from './CountdownTimer';
import { QuestionPlayer } from './QuestionPlayer';
import { ResultView } from './ResultView';
import { Skeleton } from './Skeleton';
import { parseOptions } from './utils';
import type {
  Assessment,
  Attempt,
  AttemptAnswer,
  AttemptResult,
  RawAssessment,
} from './types';

// Estado do player como máquina de estados explícita: loading → playing →
// submitting → result. Evita combinações impossíveis (ex: submitting=true e
// result já preenchido em simultâneo) que os useState soltos anteriores
// permitiam.
type PlayerStatus = 'loading' | 'playing' | 'submitting' | 'result';

interface PlayerState {
  status: PlayerStatus;
  assessment: Assessment | null;
  attempt: Attempt | null;
  answers: Record<number, AttemptAnswer>;
  currentIdx: number;
  result: AttemptResult | null;
  showConfirm: boolean;
}

type PlayerAction =
  | {
      type: 'LOADED';
      assessment: Assessment;
      attempt: Attempt;
      answers: Record<number, AttemptAnswer>;
    }
  | { type: 'ANSWER'; answer: AttemptAnswer }
  | { type: 'SET_IDX'; idx: number }
  | { type: 'REQUEST_CONFIRM'; show: boolean }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_DONE'; result: AttemptResult }
  | { type: 'SUBMIT_ERROR' }
  | { type: 'RETRY' };

const initialPlayerState: PlayerState = {
  status: 'loading',
  assessment: null,
  attempt: null,
  answers: {},
  currentIdx: 0,
  result: null,
  showConfirm: false,
};

function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'LOADED':
      return {
        ...state,
        status: 'playing',
        assessment: action.assessment,
        attempt: action.attempt,
        answers: action.answers,
      };
    case 'ANSWER':
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.answer.questionId]: action.answer,
        },
      };
    case 'SET_IDX':
      return { ...state, currentIdx: action.idx };
    case 'REQUEST_CONFIRM':
      return { ...state, showConfirm: action.show };
    case 'SUBMIT_START':
      return { ...state, status: 'submitting' };
    case 'SUBMIT_DONE':
      return {
        ...state,
        status: 'result',
        result: action.result,
        showConfirm: false,
      };
    case 'SUBMIT_ERROR':
      return { ...state, status: 'playing', showConfirm: false };
    case 'RETRY':
      return {
        ...state,
        status: 'playing',
        result: null,
        answers: {},
        currentIdx: 0,
      };
    default:
      return state;
  }
}

export interface AssessmentPlayerProps {
  assessmentId: number;
  onBack: () => void;
}

export function AssessmentPlayer({
  assessmentId,
  onBack,
}: AssessmentPlayerProps) {
  const [state, dispatch] = useReducer(playerReducer, initialPlayerState);
  const {
    status,
    assessment,
    attempt,
    answers,
    currentIdx,
    result,
    showConfirm,
  } = state;

  // Ref sincronizado com `answers`, lido dentro do setInterval de auto-save.
  // Antes, `answers` estava nas deps do useEffect do auto-save: cada resposta
  // do utilizador recriava o setInterval de 30s, reiniciando a contagem — o
  // auto-save podia nunca disparar durante uso activo. Usando um ref, o
  // efeito do intervalo só depende de `attempt`/`assessment`.
  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Carregar avaliação e iniciar tentativa
  useEffect(() => {
    const init = async () => {
      try {
        const a = await apiClient.get<RawAssessment>(
          `/assessments/${assessmentId}`,
        );
        // Parse options para cada pergunta
        const parsed: Assessment = {
          ...a,
          questions: a.questions.map((q) => ({
            ...q,
            options: parseOptions(q.options),
          })),
        };

        const att = await apiClient.post<Attempt>(
          '/assessments/attempts/start',
          { assessmentId },
        );

        // Restaurar auto-save
        const restored: Record<number, AttemptAnswer> = {};
        if (att.savedAnswers && att.savedAnswers !== '{}') {
          try {
            const saved = JSON.parse(att.savedAnswers);
            if (Array.isArray(saved)) {
              saved.forEach((ans: AttemptAnswer) => {
                restored[ans.questionId] = ans;
              });
            }
          } catch {
            /* ignore */
          }
        }

        dispatch({
          type: 'LOADED',
          assessment: parsed,
          attempt: att,
          answers: restored,
        });
      } catch (e) {
        alert(e instanceof Error ? e.message : String(e));
      }
    };
    init();
  }, [assessmentId]);

  // Auto-save a cada 30s
  useEffect(() => {
    if (!attempt || !assessment) return;
    const interval = setInterval(async () => {
      const answersList = Object.values(answersRef.current);
      if (answersList.length === 0) return;
      await apiClient
        .post('/assessments/attempts/save', {
          attemptId: attempt.id,
          answers: answersList,
        })
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [attempt, assessment]);

  const handleSubmit = async () => {
    if (!attempt || !assessment) return;
    dispatch({ type: 'SUBMIT_START' });
    try {
      const answersList = assessment.questions.map(
        (q) => answersRef.current[q.id] ?? { questionId: q.id },
      );
      const res = await apiClient.post<AttemptResult>(
        '/assessments/attempts/submit',
        { attemptId: attempt.id, answers: answersList },
      );
      dispatch({ type: 'SUBMIT_DONE', result: res });
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
      dispatch({ type: 'SUBMIT_ERROR' });
    }
  };

  const handleAnswer = (a: AttemptAnswer) => {
    dispatch({ type: 'ANSWER', answer: a });
  };

  const handleTimerExpire = () => {
    alert('Tempo esgotado! A submeter automaticamente.');
    handleSubmit();
  };

  if (status === 'loading' || !assessment)
    return (
      <div className="p-8">
        <Skeleton rows={4} />
      </div>
    );

  // Mostrar resultado
  if (status === 'result' && result) {
    return (
      <ResultView
        result={result}
        assessment={assessment}
        onRetry={() => dispatch({ type: 'RETRY' })}
        onBack={onBack}
      />
    );
  }

  const questions = assessment.questions;
  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const submitting = status === 'submitting';

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-5 gap-4">
        <div>
          <div className="text-base font-semibold text-gray-900">
            {assessment.title}
          </div>
          <div className="text-xs text-gray-400">
            {answeredCount}/{questions.length} respondidas
          </div>
        </div>
        <div className="flex items-center gap-3">
          {assessment.timeLimitMinutes > 0 && attempt && (
            <CountdownTimer
              totalMinutes={assessment.timeLimitMinutes}
              onExpire={handleTimerExpire}
            />
          )}
          <button
            onClick={() => dispatch({ type: 'REQUEST_CONFIRM', show: true })}
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
          onClick={() =>
            dispatch({ type: 'SET_IDX', idx: Math.max(0, currentIdx - 1) })
          }
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
              onClick={() => dispatch({ type: 'SET_IDX', idx })}
              className={`w-6 h-6 rounded-full text-xs font-mono transition-all ${
                idx === currentIdx
                  ? 'bg-blue-600 text-white scale-110'
                  : answers[q.id]
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            if (currentIdx < questions.length - 1)
              dispatch({ type: 'SET_IDX', idx: currentIdx + 1 });
            else dispatch({ type: 'REQUEST_CONFIRM', show: true });
          }}
          className="px-4 py-2 text-sm bg-blue-700 text-white rounded-lg hover:bg-blue-800"
        >
          {currentIdx < questions.length - 1 ? 'Próxima →' : 'Submeter'}
        </button>
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4">
            <div className="text-base font-semibold text-gray-900 mb-2">
              Submeter avaliação?
            </div>
            <div className="text-sm text-gray-500 mb-5">
              Respondeste {answeredCount} de {questions.length} perguntas.
              {answeredCount < questions.length && (
                <span className="text-amber-600">
                  {' '}
                  {questions.length - answeredCount} perguntas sem resposta.
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  dispatch({ type: 'REQUEST_CONFIRM', show: false })
                }
                className="flex-1 py-2.5 border border-gray-200 text-sm rounded-lg hover:bg-gray-50"
              >
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

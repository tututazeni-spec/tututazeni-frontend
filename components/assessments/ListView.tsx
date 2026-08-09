// components/assessments/ListView.tsx
// Separador "Disponíveis" — lista de avaliações publicadas + melhor score/
// estado pessoal. Dados próprios (useApiQuery) + apresentação, mesmo
// padrão auto-contido usado em components/payslips/page.tsx. Extraído de
// app/(platform)/assessments/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './Skeleton';
import type { Assessment, AttemptStatus, MyAttemptSummary } from './types';

export interface ListViewProps {
  onStart: (id: number) => void;
}

export function ListView({ onStart }: ListViewProps) {
  const dataQ = useApiQuery<Assessment[]>(
    queryKeys.assessments.list(),
    '/assessments',
    { params: { status: 'PUBLISHED' }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const attemptsQ = useApiQuery<MyAttemptSummary[]>(
    queryKeys.assessments.myAttempts(),
    '/assessments/my/attempts',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const data = dataQ.data ?? [];
  const attempts = attemptsQ.data ?? [];
  const loading = dataQ.isLoading;

  const getMyBestScore = (assessmentId: number) => {
    const myAttempts = attempts.filter(
      (a) => a.assessmentId === assessmentId && a.status !== 'IN_PROGRESS',
    );
    if (!myAttempts.length) return null;
    return Math.max(...myAttempts.map((a) => a.score ?? 0));
  };

  const getMyStatus = (assessmentId: number): AttemptStatus | null => {
    const latest = attempts
      .filter((a) => a.assessmentId === assessmentId)
      .sort(
        (a, b) =>
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
      )[0];
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
      {data.map((a) => {
        const bestScore = getMyBestScore(a.id);
        const status = getMyStatus(a.id);
        return (
          <div
            key={a.id}
            className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4 hover:shadow-sm transition-all"
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                a.type === 'QUIZ'
                  ? 'bg-blue-50'
                  : a.type === 'EXAM'
                    ? 'bg-purple-50'
                    : a.type === 'DIAGNOSTIC'
                      ? 'bg-amber-50'
                      : 'bg-gray-50'
              }`}
            >
              {{
                QUIZ: '❓',
                EXAM: '📋',
                DIAGNOSTIC: '🔍',
                PRACTICAL: '🛠️',
                SURVEY: '📊',
              }[a.type] ?? '📝'}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900 mb-0.5">
                {a.title}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                <span>{a._count.questions} perguntas</span>
                {a.timeLimitMinutes > 0 && (
                  <span>⏱ {a.timeLimitMinutes}min</span>
                )}
                <span>Aprovação: {a.passingScore}%</span>
                {a.maxAttempts > 0 && (
                  <span>Máx. {a.maxAttempts} tentativas</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {bestScore !== null && (
                <div className="text-right">
                  <div
                    className={`text-sm font-bold font-mono ${bestScore >= a.passingScore ? 'text-emerald-600' : 'text-red-600'}`}
                  >
                    {bestScore}%
                  </div>
                  <div className="text-xs text-gray-400">melhor score</div>
                </div>
              )}
              <button
                onClick={() => onStart(a.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  status === 'PASSED'
                    ? 'border border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                    : status === 'IN_PROGRESS'
                      ? 'bg-amber-600 text-white hover:bg-amber-700'
                      : 'bg-blue-700 text-white hover:bg-blue-800'
                }`}
              >
                {status === 'PASSED'
                  ? '✓ Repetir'
                  : status === 'IN_PROGRESS'
                    ? '▶ Continuar'
                    : '▶ Iniciar'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

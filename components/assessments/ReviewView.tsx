// components/assessments/ReviewView.tsx
// Separador "Histórico" — lista de tentativas concluídas + detalhe da
// tentativa seleccionada. Dados próprios (useApiQuery/useApiMutation) +
// apresentação, mesmo padrão auto-contido usado em
// components/payslips/page.tsx. Extraído de
// app/(platform)/assessments/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './Skeleton';
import type { AttemptDetail, MyAttemptSummary } from './types';

export function ReviewView() {
  const [selectedAttempt, setSelected] = useState<MyAttemptSummary | null>(
    null,
  );

  const { data: allAttempts = [], isLoading: loading } = useApiQuery<
    MyAttemptSummary[]
  >(queryKeys.assessments.myAttempts(), '/assessments/my/attempts', {
    staleTime: STALE_TIME.DYNAMIC,
  });
  const attempts = allAttempts.filter((a) => a.status !== 'IN_PROGRESS');

  const detailMutation = useApiMutation((attemptId: number) =>
    apiClient.get<AttemptDetail>(`/assessments/attempts/${attemptId}`),
  );
  const detail = detailMutation.data ?? null;
  const loadingDetail = detailMutation.isPending;

  const loadDetail = (attempt: MyAttemptSummary) => {
    setSelected(attempt);
    detailMutation.mutate(attempt.id);
  };

  if (loading) return <Skeleton />;

  return (
    <div className="grid grid-cols-[280px_1fr] gap-5">
      {/* Attempts list */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
          Histórico
        </div>
        {attempts.length === 0 && (
          <div className="text-sm text-gray-400 text-center py-6">
            Sem tentativas concluídas
          </div>
        )}
        {attempts.map((a) => (
          <div
            key={a.id}
            onClick={() => loadDetail(a)}
            className={`p-3 border rounded-xl cursor-pointer transition-colors ${
              selectedAttempt?.id === a.id
                ? 'border-blue-300 bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="text-xs font-medium text-gray-800 truncate">
              {a.assessment?.title}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span
                className={`text-sm font-bold font-mono ${(a.score ?? 0) >= (a.assessment?.passingScore ?? 70) ? 'text-emerald-600' : 'text-red-600'}`}
              >
                {a.score ?? '—'}%
              </span>
              <span
                className={`text-xs px-1.5 rounded ${
                  a.status === 'PASSED'
                    ? 'bg-emerald-50 text-emerald-700'
                    : a.status === 'FAILED'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-amber-50 text-amber-700'
                }`}
              >
                {a.status}
              </span>
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
              <div className="text-sm font-semibold text-gray-900 mb-2">
                {detail.assessment?.title}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Score', value: `${detail.score ?? '—'}%` },
                  { label: 'Status', value: detail.status },
                  {
                    label: 'Tempo',
                    value: detail.timeSpentMinutes
                      ? `${detail.timeSpentMinutes}min`
                      : '—',
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="bg-gray-50 rounded-lg p-3 text-center"
                  >
                    <div className="text-xs text-gray-400">{label}</div>
                    <div className="text-sm font-semibold text-gray-900 mt-1">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {detail.answers?.map((ans) => (
              <div
                key={ans.id}
                className={`border rounded-xl p-4 ${
                  ans.isCorrect === null
                    ? 'border-amber-200 bg-amber-50'
                    : ans.isCorrect
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start gap-2 mb-1">
                  <span>
                    {ans.isCorrect === null ? '⏳' : ans.isCorrect ? '✓' : '✗'}
                  </span>
                  <p className="text-xs font-medium text-gray-800">
                    {ans.question?.questionText}
                  </p>
                </div>
                {ans.textAnswer && (
                  <p className="text-xs text-gray-600 pl-5 mt-1">
                    {ans.textAnswer}
                  </p>
                )}
                {ans.reviewComment && (
                  <p className="text-xs text-blue-700 pl-5 mt-1">
                    💬 {ans.reviewComment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

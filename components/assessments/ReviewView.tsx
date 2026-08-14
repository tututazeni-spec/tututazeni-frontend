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
import { Badge, type BadgeProps } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Skeleton } from './Skeleton';
import type { AttemptDetail, MyAttemptSummary } from './types';

const STATUS_INTENT: Record<string, BadgeProps['intent']> = {
  PASSED: 'success',
  FAILED: 'danger',
};

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
        <div className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-2">
          Histórico
        </div>
        {attempts.length === 0 && (
          <div className="text-sm text-ink-faint text-center py-6">
            Sem tentativas concluídas
          </div>
        )}
        {attempts.map((a) => (
          <div
            key={a.id}
            onClick={() => loadDetail(a)}
            className={`p-3 border rounded-card cursor-pointer transition-colors ${
              selectedAttempt?.id === a.id
                ? 'border-primary bg-primary-subtle'
                : 'border-border hover:bg-surface-sunken'
            }`}
          >
            <div className="text-xs font-medium text-ink truncate">
              {a.assessment?.title}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span
                className={`text-sm font-bold font-data ${(a.score ?? 0) >= (a.assessment?.passingScore ?? 70) ? 'text-success' : 'text-danger'}`}
              >
                {a.score ?? '—'}%
              </span>
              <Badge intent={STATUS_INTENT[a.status] ?? 'warning'}>
                {a.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {/* Detail */}
      <div>
        {!selectedAttempt && (
          <div className="flex items-center justify-center h-48 text-sm text-ink-faint border border-dashed border-border rounded-card">
            Selecciona uma tentativa para rever
          </div>
        )}
        {loadingDetail && <Skeleton rows={3} />}
        {detail && !loadingDetail && (
          <div className="space-y-3">
            <Card className="p-4">
              <div className="text-sm font-semibold text-ink mb-2">
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
                    className="bg-surface-sunken rounded-control p-3 text-center"
                  >
                    <div className="text-xs text-ink-faint">{label}</div>
                    <div className="text-sm font-semibold text-ink mt-1">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            {detail.answers?.map((ans) => (
              <div
                key={ans.id}
                className={`border rounded-card p-4 ${
                  ans.isCorrect === null
                    ? 'border-warning bg-warning-subtle'
                    : ans.isCorrect
                      ? 'border-success bg-success-subtle'
                      : 'border-danger bg-danger-subtle'
                }`}
              >
                <div className="flex items-start gap-2 mb-1">
                  <span>
                    {ans.isCorrect === null ? '⏳' : ans.isCorrect ? '✓' : '✗'}
                  </span>
                  <p className="text-xs font-medium text-ink">
                    {ans.question?.questionText}
                  </p>
                </div>
                {ans.textAnswer && (
                  <p className="text-xs text-ink-muted pl-5 mt-1">
                    {ans.textAnswer}
                  </p>
                )}
                {ans.reviewComment && (
                  <p className="text-xs text-primary pl-5 mt-1">
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

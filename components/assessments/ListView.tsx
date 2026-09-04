// components/assessments/ListView.tsx
// Separador "Disponíveis" — lista de avaliações publicadas + melhor score/
// estado pessoal. Dados próprios (useApiQuery) + apresentação, mesmo
// padrão auto-contido usado em components/payslips/page.tsx. Extraído de
// app/(platform)/assessments/page.tsx.

'use client';

import {
  ClipboardList,
  HelpCircle,
  Search,
  Wrench,
  BarChart3,
  PenLine,
  Timer,
  Check,
  Play,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from './Skeleton';
import type { Assessment, AttemptStatus, MyAttemptSummary } from './types';

export interface ListViewProps {
  onStart: (id: number) => void;
}

const TYPE_ICON_BG: Record<string, string> = {
  QUIZ: 'bg-primary-subtle',
  EXAM: 'bg-accent-subtle',
  DIAGNOSTIC: 'bg-warning-subtle',
};

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
        <EmptyState
          icon={ClipboardList}
          title="Sem avaliações disponíveis"
          description="Volta mais tarde para veres novas avaliações publicadas."
        />
      )}
      {data.map((a) => {
        const bestScore = getMyBestScore(a.id);
        const status = getMyStatus(a.id);
        return (
          <div
            key={a.id}
            className="bg-surface border border-border rounded-card p-5 flex items-center gap-4 hover:shadow-hover transition-shadow"
          >
            <div
              className={`w-12 h-12 rounded-card flex items-center justify-center flex-shrink-0 ${
                TYPE_ICON_BG[a.type] ?? 'bg-surface-sunken'
              }`}
            >
              {(() => {
                const AIcon =
                  {
                    QUIZ: HelpCircle,
                    EXAM: ClipboardList,
                    DIAGNOSTIC: Search,
                    PRACTICAL: Wrench,
                    SURVEY: BarChart3,
                  }[a.type] ?? PenLine;
                return <AIcon size={20} strokeWidth={1.75} />;
              })()}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-ink mb-0.5">
                {a.title}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-ink-faint">
                <span>{a._count.questions} perguntas</span>
                {a.timeLimitMinutes > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Timer size={12} strokeWidth={1.75} /> {a.timeLimitMinutes}
                    min
                  </span>
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
                    className={`text-sm font-bold font-data ${bestScore >= a.passingScore ? 'text-success' : 'text-danger'}`}
                  >
                    {bestScore}%
                  </div>
                  <div className="text-xs text-ink-faint">melhor score</div>
                </div>
              )}
              <Button
                size="sm"
                intent={
                  status === 'PASSED'
                    ? 'success'
                    : status === 'IN_PROGRESS'
                      ? 'warning'
                      : 'primary'
                }
                onClick={() => onStart(a.id)}
                className="inline-flex items-center gap-1.5"
              >
                {status === 'PASSED' ? (
                  <>
                    <Check size={14} strokeWidth={2} /> Repetir
                  </>
                ) : status === 'IN_PROGRESS' ? (
                  <>
                    <Play size={14} strokeWidth={1.75} /> Continuar
                  </>
                ) : (
                  <>
                    <Play size={14} strokeWidth={1.75} /> Iniciar
                  </>
                )}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

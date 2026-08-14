// components/instructor/AtRiskView.tsx
// Vista "Em risco": alunos com baixo progresso após 7 dias de
// inscrição. Extraído de app/(platform)/instructor/page.tsx.

'use client';

import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import type { AtRiskStudent } from './types';

export function AtRiskView() {
  const { data, isLoading } = useApiQuery<{
    count: number;
    students: AtRiskStudent[];
  }>(queryKeys.instructor.atRisk(), '/instructors/my/at-risk-students', {
    staleTime: STALE_TIME.DYNAMIC,
  });

  if (isLoading || !data)
    return (
      <Skeleton rows={3} itemClassName="skeleton-shimmer h-16 rounded-card" />
    );

  const hasAtRisk = data.count > 0;

  return (
    <div>
      <div
        className={cn(
          'mb-5 flex items-center gap-3 rounded-card border p-4',
          hasAtRisk
            ? 'border-danger bg-danger-subtle'
            : 'border-success bg-success-subtle',
        )}
      >
        {hasAtRisk ? (
          <AlertTriangle
            size={24}
            strokeWidth={1.75}
            className="shrink-0 text-danger"
          />
        ) : (
          <CheckCircle2
            size={24}
            strokeWidth={1.75}
            className="shrink-0 text-success"
          />
        )}
        <div>
          <div
            className={cn(
              'font-body text-sm font-semibold',
              hasAtRisk ? 'text-danger-ink' : 'text-success-ink',
            )}
          >
            {hasAtRisk
              ? `${data.count} aluno(s) em risco`
              : 'Nenhum aluno em risco'}
          </div>
          <div className="font-body text-xs text-ink-muted">
            Progresso abaixo de 20% após 7 dias de inscrição
          </div>
        </div>
      </div>

      {data.students.length > 0 && (
        <Card className="overflow-hidden">
          {data.students.map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-b border-border px-4 py-3.5 last:border-0"
            >
              <Avatar
                name={s.fullName}
                url={s.avatarUrl ?? undefined}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <div className="font-body text-sm font-medium text-ink">
                  {s.fullName}
                </div>
                <div className="font-body text-xs text-ink-faint">
                  {s.cohortName} · {s.course.title}
                </div>
                <div className="mt-1 flex max-w-xs items-center gap-2">
                  <ProgressBar value={s.progress} className="flex-1" />
                  <span className="w-9 shrink-0 font-mono text-xs text-danger">
                    {s.progress}%
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="font-body text-xs font-medium text-danger">
                  Inscrito há {s.daysSinceEnroll} dias
                </div>
                <div className="font-body text-xs text-ink-faint">
                  Progresso: {s.progress}%
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

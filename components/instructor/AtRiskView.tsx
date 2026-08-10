// components/instructor/AtRiskView.tsx
// Vista "Em risco": alunos com baixo progresso após 7 dias de
// inscrição. Extraído de app/(platform)/instructor/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar, ProgressBar, Skeleton } from './atoms';
import type { AtRiskStudent } from './types';

export function AtRiskView() {
  const { data, isLoading } = useApiQuery<{
    count: number;
    students: AtRiskStudent[];
  }>(queryKeys.instructor.atRisk(), '/instructors/my/at-risk-students', {
    staleTime: STALE_TIME.DYNAMIC,
  });

  if (isLoading || !data) return <Skeleton rows={3} />;

  return (
    <div>
      <div
        className={`flex items-center gap-3 mb-5 p-4 border rounded-xl ${data.count > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}
      >
        <span className="text-3xl">{data.count > 0 ? '⚠️' : '✅'}</span>
        <div>
          <div
            className={`text-sm font-semibold ${data.count > 0 ? 'text-red-700' : 'text-emerald-700'}`}
          >
            {data.count > 0
              ? `${data.count} aluno(s) em risco`
              : 'Nenhum aluno em risco'}
          </div>
          <div className="text-xs text-gray-500">
            Progresso abaixo de 20% após 7 dias de inscrição
          </div>
        </div>
      </div>

      {data.students.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {data.students.map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 last:border-0"
            >
              <Avatar name={s.fullName} avatarUrl={s.avatarUrl} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">
                  {s.fullName}
                </div>
                <div className="text-xs text-gray-400">
                  {s.cohortName} · {s.course.title}
                </div>
                <div className="mt-1 max-w-xs">
                  <ProgressBar pct={s.progress} color="bg-red-400" />
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs text-red-600 font-medium">
                  Inscrito há {s.daysSinceEnroll} dias
                </div>
                <div className="text-xs text-gray-400">
                  Progresso: {s.progress}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

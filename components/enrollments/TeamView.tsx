// components/enrollments/TeamView.tsx
// Separador "Equipa" — progresso/compliance dos subordinados directos.
// Dados próprios + apresentação. Extraído de
// app/(platform)/enrollments/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar, Skeleton } from './atoms';
import type { TeamProgress } from './types';

export function TeamView() {
  const { data, isLoading } = useApiQuery<TeamProgress>(
    queryKeys.enrollments.team(),
    '/enrollments/team',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading || !data) return <Skeleton rows={4} />;

  if (data.team.length === 0)
    return (
      <div className="py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
        Sem subordinados directos
      </div>
    );

  return (
    <div>
      <div className="text-xs text-gray-400 mb-4">
        {data.total} membros na equipa
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_80px_80px_100px] gap-3 px-4 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
          <div>Colaborador</div>
          <div>Total</div>
          <div>Concluídos</div>
          <div>Atrasados</div>
          <div>Compliance</div>
        </div>
        {data.team.map((member) => {
          const compliance =
            member.stats.total > 0
              ? Math.round((member.stats.completed / member.stats.total) * 100)
              : 100;
          return (
            <div
              key={member.id}
              className="grid grid-cols-[1fr_80px_80px_80px_100px] gap-3 items-center px-4 py-3 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center gap-3">
                <Avatar user={member} />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {member.fullName}
                  </div>
                  <div className="text-xs text-gray-400">{member.email}</div>
                </div>
              </div>
              <div className="text-sm font-mono text-gray-500">
                {member.stats.total}
              </div>
              <div className="text-sm font-mono text-emerald-600">
                {member.stats.completed}
              </div>
              <div
                className={`text-sm font-mono ${member.stats.overdue > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}`}
              >
                {member.stats.overdue}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${compliance >= 80 ? 'bg-emerald-500' : compliance >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${compliance}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-gray-500 w-8">
                    {compliance}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

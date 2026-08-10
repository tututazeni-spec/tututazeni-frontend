// components/history/MilestonesTab.tsx
// Tab "Marcos": lista de marcos de carreira do colaborador. Extraído
// de app/(platform)/history/page.tsx.

'use client';

import { Award } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import type { Milestone } from './types';

export function MilestonesTab() {
  const { data = [], isLoading: loading } = useApiQuery<Milestone[]>(
    queryKeys.history.milestones(),
    '/history/milestones/me',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-3">
      {data.map((m, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center text-2xl shrink-0">
            {m.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800">{m.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {new Date(m.date).toLocaleDateString('pt', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                m.impactScore >= 80
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {m.impactScore} pts
            </span>
            <p className="text-[10px] text-slate-400 mt-1">{m.type}</p>
          </div>
        </div>
      ))}

      {data.length === 0 && (
        <div className="py-16 text-center text-slate-400">
          <Award size={36} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Sem marcos de carreira registados ainda</p>
        </div>
      )}
    </div>
  );
}

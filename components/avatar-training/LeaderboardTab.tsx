// components/avatar-training/LeaderboardTab.tsx
// Separador "Ranking" — ranking global de utilizadores. Dados próprios
// (useApiQuery) + apresentação. Extraído de
// app/(platform)/avatar-training/page.tsx.

'use client';

import { Trophy } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import { SCORE_COLOR } from './constants';
import type { LeaderboardEntry } from './types';

export function LeaderboardTab() {
  const { data: board, isLoading } = useApiQuery<LeaderboardEntry[]>(
    queryKeys.avatarTraining.leaderboard(),
    '/avatar-training/leaderboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const data = board ?? [];

  if (isLoading) return <Skeleton />;

  return (
    <div className="bg-white rounded-xl border border-slate-100">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
          <Trophy size={16} className="text-amber-500" />
          Ranking Global
        </h3>
      </div>
      <div className="divide-y divide-slate-50">
        {data.map((u) => (
          <div key={u.rank} className="flex items-center gap-3 px-5 py-3">
            <span
              className={`w-8 text-center font-bold text-sm ${
                u.rank === 1
                  ? 'text-amber-500'
                  : u.rank === 2
                    ? 'text-slate-400'
                    : u.rank === 3
                      ? 'text-amber-700'
                      : 'text-slate-400'
              }`}
            >
              {u.rank === 1
                ? '🥇'
                : u.rank === 2
                  ? '🥈'
                  : u.rank === 3
                    ? '🥉'
                    : `#${u.rank}`}
            </span>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {u.user?.fullName?.split(' ')[0]?.[0] ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700">
                {u.user?.fullName}
              </p>
              <p className="text-[10px] text-slate-400">
                {u.user?.department?.name}
              </p>
            </div>
            <div className="text-right">
              <p
                className={`text-sm font-bold ${SCORE_COLOR(u.avgScore ?? 0)}`}
              >
                {u.avgScore ?? u.score}
              </p>
              <p className="text-[10px] text-slate-400">
                {u.sessions ?? ''} sessões
              </p>
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <div className="py-12 text-center text-slate-400">
            <Trophy size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sem dados de ranking ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}

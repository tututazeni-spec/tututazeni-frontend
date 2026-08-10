// components/leadership/RankingView.tsx
// Separador "Ranking" — leadership scorecard ordenado. Dados próprios +
// apresentação. Extraído de app/(platform)/leadership/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar, Skeleton } from './atoms';
import { CLASS_CFG } from './constants';
import type { RankingEntry } from './types';

export function RankingView() {
  const { data = [], isLoading } = useApiQuery<RankingEntry[]>(
    queryKeys.leadership.ranking(),
    '/leadership/ranking',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading) return <Skeleton rows={6} />;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          Leadership Scorecard
        </div>
        <div className="text-xs text-gray-400">{data.length} líderes</div>
      </div>
      {data.map((entry, idx) => {
        const scorePct = Math.round((entry.score / 1000) * 100);
        return (
          <div
            key={entry.userId}
            className="flex items-center gap-4 px-4 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                idx === 0
                  ? 'bg-amber-100 text-amber-800'
                  : idx === 1
                    ? 'bg-gray-100 text-gray-600'
                    : idx === 2
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-gray-50 text-gray-400'
              }`}
            >
              {idx + 1}
            </div>
            <Avatar
              name={entry.user.fullName}
              avatarUrl={entry.user.avatarUrl}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900">
                {entry.user.fullName}
              </div>
              <div className="text-xs text-gray-400">
                {entry.user.position?.name ?? '—'}
              </div>
            </div>
            <div className="w-40">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{entry.score} pts</span>
                <span>{scorePct}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    scorePct >= 80
                      ? 'bg-emerald-500'
                      : scorePct >= 50
                        ? 'bg-blue-500'
                        : 'bg-amber-500'
                  }`}
                  style={{ width: `${scorePct}%` }}
                />
              </div>
            </div>
            <StatusBadge
              value={entry.classification}
              map={CLASS_CFG}
              fallback={CLASS_CFG.AVERAGE}
              className="flex-shrink-0"
            />
          </div>
        );
      })}
      {data.length === 0 && (
        <div className="px-4 py-12 text-center text-sm text-gray-400">
          Sem dados de ranking disponíveis
        </div>
      )}
    </div>
  );
}

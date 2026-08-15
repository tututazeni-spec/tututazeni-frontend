// components/avatar-training/LeaderboardTab.tsx
// Separador "Ranking" — ranking global de utilizadores. Dados próprios
// (useApiQuery) + apresentação. Extraído de
// app/(platform)/avatar-training/page.tsx.

'use client';

import { Trophy } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { SCORE_COLOR } from './constants';
import type { LeaderboardEntry } from './types';

function rankColor(rank: number): string {
  if (rank === 1) return 'text-accent';
  if (rank === 3) return 'text-warning-ink';
  return 'text-ink-muted';
}

export function LeaderboardTab() {
  const { data: board, isLoading } = useApiQuery<LeaderboardEntry[]>(
    queryKeys.avatarTraining.leaderboard(),
    '/avatar-training/leaderboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const data = board ?? [];

  if (isLoading)
    return (
      <Skeleton
        wrapperClassName="space-y-4 animate-pulse"
        itemClassName="bg-surface-sunken rounded-card h-28"
      />
    );

  return (
    <Card>
      <CardHeader>
        <h3 className="font-display font-semibold text-ink flex items-center gap-2">
          <Trophy size={16} strokeWidth={1.75} className="text-accent" />
          Ranking Global
        </h3>
      </CardHeader>
      <div className="divide-y divide-border">
        {data.map((u) => (
          <div key={u.rank} className="flex items-center gap-3 px-5 py-3">
            <span
              className={`w-8 text-center font-bold text-sm ${rankColor(u.rank)}`}
            >
              {u.rank === 1
                ? '🥇'
                : u.rank === 2
                  ? '🥈'
                  : u.rank === 3
                    ? '🥉'
                    : `#${u.rank}`}
            </span>
            <Avatar name={u.user?.fullName ?? '?'} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink">{u.user?.fullName}</p>
              <p className="text-[10px] text-ink-faint">
                {u.user?.department?.name}
              </p>
            </div>
            <div className="text-right">
              <p
                className={`text-sm font-bold ${SCORE_COLOR(u.avgScore ?? 0)}`}
              >
                {u.avgScore ?? u.score}
              </p>
              <p className="text-[10px] text-ink-faint">
                {u.sessions ?? ''} sessões
              </p>
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <CardBody>
            <EmptyState
              icon={Trophy}
              title="Sem dados de ranking ainda"
              description="Completa cenários para apareceres no ranking global."
            />
          </CardBody>
        )}
      </div>
    </Card>
  );
}

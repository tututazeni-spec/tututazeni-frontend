// components/engagement/RecognitionTab.tsx
// Separador "Reconhecimento" — feed de kudos + leaderboard. Dados próprios
// (useApiQuery) + apresentação. Extraído de
// app/(platform)/engagement/page.tsx.

'use client';

import { useState } from 'react';
import { Heart, Zap } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import type { LeaderboardEntry, Recognition } from './types';

const RANK_COLOR = ['text-accent', 'text-ink-muted', 'text-ink-faint'] as const;

export function RecognitionTab() {
  const [kudosMsg, setKudosMsg] = useState('');
  const [kudosTo, setKudosTo] = useState('');

  const feedQuery = useApiQuery<{ data: Recognition[] }>(
    queryKeys.engagement.recognitionFeed(),
    '/engagement/recognition/feed',
    { params: { limit: 20 }, staleTime: STALE_TIME.DYNAMIC },
  );
  const boardQuery = useApiQuery<LeaderboardEntry[]>(
    queryKeys.engagement.recognitionLeaderboard(),
    '/engagement/recognition/leaderboard',
    {
      params: { type: 'points', limit: 10 },
      staleTime: STALE_TIME.SEMI_STATIC,
    },
  );

  const feed = feedQuery.data?.data ?? [];
  const board = boardQuery.data ?? [];

  if (feedQuery.isLoading || boardQuery.isLoading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-4"
        itemClassName="skeleton-shimmer h-20 rounded-card"
      />
    );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Feed */}
      <div className="space-y-4 lg:col-span-2">
        {/* Quick kudos box */}
        <Card>
          <CardBody>
            <h3 className="mb-3 font-display font-semibold text-ink">
              👏 Dar Kudos
            </h3>
            <div className="flex gap-2">
              <Input
                value={kudosTo}
                onChange={(e) => setKudosTo(e.target.value)}
                placeholder="@colaborador..."
                className="w-32"
              />
              <Input
                value={kudosMsg}
                onChange={(e) => setKudosMsg(e.target.value)}
                placeholder="Escreve uma mensagem de reconhecimento..."
                className="flex-1"
              />
              <Button>Enviar 🏆</Button>
            </div>
          </CardBody>
        </Card>

        {/* Feed */}
        <div className="space-y-3">
          {feed.map((r, i) => (
            <Card key={i}>
              <CardBody>
                <div className="flex items-start gap-3">
                  <Avatar
                    name={r.from?.fullName ?? 'User'}
                    url={r.from?.avatarUrl}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-body text-sm font-semibold text-ink">
                        {r.from?.fullName}
                      </span>
                      <span className="font-body text-xs text-ink-faint">
                        reconheceu
                      </span>
                      <span className="font-body text-sm font-semibold text-primary">
                        {r.to?.fullName}
                      </span>
                      <Badge intent="info">
                        {r.type === 'KUDOS'
                          ? '👏 Kudos'
                          : r.type === 'ACHIEVEMENT'
                            ? '🏆 Achievement'
                            : r.type}
                      </Badge>
                    </div>
                    <p className="mt-1 font-body text-sm text-ink-muted">
                      {r.message}
                    </p>
                    <p className="mt-1 font-body text-[10px] text-ink-faint">
                      {new Date(r.createdAt).toLocaleDateString('pt')}
                      {r.to?.department?.name && ` · ${r.to.department.name}`}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}

          {feed.length === 0 && (
            <EmptyState
              icon={Heart}
              title="Nenhum reconhecimento ainda"
              description="Sê o primeiro a reconhecer um colega!"
            />
          )}
        </div>
      </div>

      {/* Leaderboard */}
      <Card className="h-fit">
        <CardBody>
          <h3 className="mb-4 font-display font-semibold text-ink">
            🏅 Leaderboard
          </h3>
          <div className="space-y-3">
            {board.map((u, i) => (
              <div key={i} className="flex items-center gap-3">
                <span
                  className={`w-6 text-center text-sm font-bold ${RANK_COLOR[i] ?? 'text-ink-faint'}`}
                >
                  {i === 0
                    ? '🥇'
                    : i === 1
                      ? '🥈'
                      : i === 2
                        ? '🥉'
                        : `#${i + 1}`}
                </span>
                <Avatar
                  name={u.user?.fullName ?? 'User'}
                  url={u.user?.avatarUrl}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-sm font-medium text-ink">
                    {u.user?.fullName}
                  </p>
                  <p className="font-body text-[10px] text-ink-faint">
                    {u.user?.position?.name}
                  </p>
                </div>
                <div className="flex items-center gap-1 font-body text-sm font-bold text-primary">
                  <Zap size={12} strokeWidth={1.75} className="text-accent" />
                  {u.points ?? u.count}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

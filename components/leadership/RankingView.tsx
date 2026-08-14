// components/leadership/RankingView.tsx
// Separador "Ranking" — leadership scorecard ordenado. Dados próprios +
// apresentação. Extraído de app/(platform)/leadership/page.tsx.
//
// O ProgressBar da fundação é mono-cor (bg-accent) — a cor que aqui
// comunicava a faixa do score passa para o texto do score (scoreTextClass).

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CLASS_CFG } from './constants';
import type { RankingEntry } from './types';

function scoreTextClass(pct: number): string {
  if (pct >= 80) return 'text-success-ink';
  if (pct >= 50) return 'text-info-ink';
  return 'text-warning-ink';
}

const RANK_BADGE_CLS = [
  'bg-warning text-canvas',
  'bg-surface-sunken text-ink-muted',
  'bg-accent-subtle text-accent',
] as const;

export function RankingView() {
  const { data = [], isLoading } = useApiQuery<RankingEntry[]>(
    queryKeys.leadership.ranking(),
    '/leadership/ranking',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading) return <Skeleton rows={6} />;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
          Leadership Scorecard
        </div>
        <div className="font-body text-xs text-ink-faint">
          {data.length} líderes
        </div>
      </div>
      {data.map((entry, idx) => {
        const scorePct = Math.round((entry.score / 1000) * 100);
        return (
          <div
            key={entry.userId}
            className="flex items-center gap-4 border-b border-border px-4 py-4 last:border-0 hover:bg-surface-sunken"
          >
            <div
              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-body text-sm font-bold ${
                RANK_BADGE_CLS[idx] ?? 'bg-surface-sunken text-ink-faint'
              }`}
            >
              {idx + 1}
            </div>
            <Avatar
              name={entry.user.fullName}
              url={entry.user.avatarUrl ?? undefined}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <div className="font-body text-sm font-medium text-ink">
                {entry.user.fullName}
              </div>
              <div className="font-body text-xs text-ink-faint">
                {entry.user.position?.name ?? '—'}
              </div>
            </div>
            <div className="w-40">
              <div className="mb-1 flex justify-between font-body text-xs text-ink-faint">
                <span>{entry.score} pts</span>
                <span className={scoreTextClass(scorePct)}>{scorePct}%</span>
              </div>
              <ProgressBar value={scorePct} />
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
        <div className="px-4 py-12 text-center font-body text-sm text-ink-faint">
          Sem dados de ranking disponíveis
        </div>
      )}
    </Card>
  );
}

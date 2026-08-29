// components/sucession/TalentPoolView.tsx
// Vista "Talent Pool": lista filtrável de talentos por nível de
// prontidão. Extraído de app/(platform)/sucession/page.tsx.

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { READINESS_CFG } from './constants';
import type { ReadinessLevel, TalentPoolEntry } from './types';

export function TalentPoolView() {
  const [filter, setFilter] = useState<ReadinessLevel | ''>('');
  const { data: pool = [], isLoading: loading } = useApiQuery<
    TalentPoolEntry[]
  >(queryKeys.succession.talentPool(), '/succession/talent-pool/all', {
    staleTime: STALE_TIME.SEMI_STATIC,
  });

  const filtered = filter
    ? pool.filter((p) => p.readinessLevel === filter)
    : pool;

  if (loading) return <Skeleton rows={4} />;

  return (
    <div>
      {/* Filter */}
      <div className="mb-5 flex items-center gap-2">
        {(['', 'READY_NOW', 'READY_SOON', 'NEEDS_DEVELOPMENT'] as const).map(
          (r) => (
            <Button
              key={r}
              size="sm"
              intent={filter === r ? 'primary' : 'ghost'}
              onClick={() => setFilter(r)}
            >
              {r === '' ? 'Todos' : READINESS_CFG[r as ReadinessLevel].label}
            </Button>
          ),
        )}
        <span className="ml-auto font-body text-xs text-ink-faint">
          {filtered.length} talentos
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filtered.map((entry) => {
          const latestReview = entry.user.performanceReviews?.[0];
          return (
            <Card
              key={entry.id}
              className="p-5 transition-all hover:shadow-hover"
            >
              <div className="mb-3 flex items-start gap-3">
                <Avatar
                  name={entry.user.fullName}
                  url={entry.user.avatarUrl ?? undefined}
                  size="md"
                />
                <div className="flex-1">
                  <div className="font-body text-sm font-semibold text-ink">
                    {entry.user.fullName}
                  </div>
                  <div className="font-body text-xs text-ink-faint">
                    {entry.user.position?.name ?? '—'} ·{' '}
                    {entry.user.department?.name ?? '—'}
                  </div>
                  <div className="mt-1">
                    <StatusBadge
                      value={entry.readinessLevel}
                      map={READINESS_CFG}
                      variant="dot"
                    />
                  </div>
                </div>
                {latestReview?.score !== null &&
                  latestReview?.score !== undefined && (
                    <div className="flex-shrink-0 text-right">
                      <div className="font-mono text-lg font-bold text-info-ink">
                        {latestReview.score}
                      </div>
                      <div className="font-body text-xs text-ink-faint">
                        perf.
                      </div>
                    </div>
                  )}
              </div>

              <div className="flex flex-wrap gap-2 font-body text-xs text-ink-muted">
                {entry.geographicMobility && (
                  <span className="rounded bg-success-subtle px-2 py-0.5 text-success-ink">
                     Mobilidade
                  </span>
                )}
                {entry.mentor && (
                  <span className="rounded bg-info-subtle px-2 py-0.5 text-info-ink">
                     Mentor: {entry.mentor.fullName.split(' ')[0]}
                  </span>
                )}
              </div>

              {entry.notes && (
                <p className="mt-2 font-body text-xs italic text-ink-muted">
                  &quot;{entry.notes}&quot;
                </p>
              )}
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-2 rounded-card border border-dashed border-border-strong py-12 text-center font-body text-sm text-ink-faint">
            Nenhum talento no Banco com este filtro
          </div>
        )}
      </div>
    </div>
  );
}

// components/sucession/TalentPoolView.tsx
// Vista "Talent Pool": lista filtrável de talentos por nível de
// prontidão. Extraído de app/(platform)/sucession/page.tsx.

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar, ReadinessBadge, Skeleton } from './atoms';
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

  if (loading) return <Skeleton />;

  return (
    <div>
      {/* Filter */}
      <div className="flex items-center gap-2 mb-5">
        {(['', 'READY_NOW', 'READY_SOON', 'NEEDS_DEVELOPMENT'] as const).map(
          (r) => (
            <button
              key={r}
              onClick={() => setFilter(r)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === r
                  ? 'bg-blue-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {r === '' ? 'Todos' : READINESS_CFG[r as ReadinessLevel].label}
            </button>
          ),
        )}
        <span className="text-xs text-gray-400 ml-auto">
          {filtered.length} talentos
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filtered.map((entry) => {
          const latestReview = entry.user.performanceReviews?.[0];
          return (
            <div
              key={entry.id}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-3 mb-3">
                <Avatar
                  name={entry.user.fullName}
                  avatarUrl={entry.user.avatarUrl}
                  size="md"
                />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">
                    {entry.user.fullName}
                  </div>
                  <div className="text-xs text-gray-400">
                    {entry.user.position?.name ?? '—'} ·{' '}
                    {entry.user.department?.name ?? '—'}
                  </div>
                  <div className="mt-1">
                    <ReadinessBadge level={entry.readinessLevel} />
                  </div>
                </div>
                {latestReview?.score !== null &&
                  latestReview?.score !== undefined && (
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold font-mono text-blue-700">
                        {latestReview.score}
                      </div>
                      <div className="text-xs text-gray-400">perf.</div>
                    </div>
                  )}
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                {entry.geographicMobility && (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded">
                    🌍 Mobilidade
                  </span>
                )}
                {entry.mentor && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                    👨‍🏫 Mentor: {entry.mentor.fullName.split(' ')[0]}
                  </span>
                )}
              </div>

              {entry.notes && (
                <p className="text-xs text-gray-500 mt-2 italic">
                  &quot;{entry.notes}&quot;
                </p>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-2 py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
            Nenhum talento no pool com este filtro
          </div>
        )}
      </div>
    </div>
  );
}

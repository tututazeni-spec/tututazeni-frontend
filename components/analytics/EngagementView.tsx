// components/analytics/EngagementView.tsx
// Separador "Engagement" — GET /analytics/engagement. Endpoint já existia
// sem consumidor no frontend.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { EngagementMetrics } from './types';

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-card bg-surface-sunken p-3">
      <div className="mb-1 font-body text-xs text-ink-faint">{label}</div>
      <div className="font-data text-xl font-bold text-black">{value}</div>
    </div>
  );
}

export function EngagementView() {
  const { data, isLoading } = useApiQuery<EngagementMetrics>(
    queryKeys.analyticsPage.engagement(),
    '/analytics/engagement',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading || !data) return <Skeleton rows={4} />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <KpiCard
          label="Colaboradores"
          value={data.totalUsers}
          intent="primary"
          className="w-full [&_p]:text-black"
        />
        <KpiCard
          label="Activos (últimos 30 dias)"
          value={data.activeUsersLast30d}
          intent="success"
          className="w-full [&_p]:text-black"
        />
        <KpiCard
          label="Taxa de engagement"
          value={`${data.engagementRate}%`}
          intent="accent"
          className="w-full [&_p]:text-black"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Tile label="Interacções com a base de conhecimento" value={data.knowledgeInteractions} />
        <Tile label="Sessões de tutor AI" value={data.aiTutorSessions} />
        <Tile label="Acessos a micro-learning" value={data.microLearningAccess} />
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-xs font-medium text-ink-faint uppercase tracking-wide">
          Leaderboard — Top 10 pontos de experiência
        </div>
        {data.leaderboard.map((u, i) => (
          <div
            key={u.userId}
            className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0"
          >
            <div className="w-5 text-right font-data text-xs font-bold text-ink-faint">
              {i + 1}
            </div>
            <Avatar name={u.fullName} url={u.avatarUrl ?? undefined} size="sm" />
            <div className="flex-1 text-sm text-ink">{u.fullName}</div>
            <div className="text-sm font-data font-bold text-black">{u.points} XP</div>
          </div>
        ))}
        {data.leaderboard.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-ink-faint">
            Sem dados de leaderboard
          </div>
        )}
      </Card>
    </div>
  );
}

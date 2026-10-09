// components/analytics/EngagementView.tsx
// Separador "Engagement" — GET /analytics/engagement. Endpoint já existia
// sem consumidor no frontend.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import {
  BookOpen,
  Bot,
  GraduationCap,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import type { EngagementMetrics } from './types';

export function EngagementView() {
  const { data, isLoading } = useApiQuery<EngagementMetrics>(
    queryKeys.analyticsPage.engagement(),
    '/analytics/engagement',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading || !data) return <Skeleton rows={4} />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <NavyStatCard
          icon={Users}
          label="Colaboradores"
          value={data.totalUsers}
          tone="blue"
        />
        <NavyStatCard
          icon={UserCheck}
          label="Activos (últimos 30 dias)"
          value={data.activeUsersLast30d}
          tone="green"
        />
        <NavyStatCard
          icon={Zap}
          label="Taxa de engajamento"
          value={`${data.engagementRate}%`}
          tone="orange"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <NavyStatCard
          icon={BookOpen}
          label="Interacções com a base de conhecimento"
          value={data.knowledgeInteractions}
          tone="orange"
        />
        <NavyStatCard
          icon={Bot}
          label="Sessões de tutor AI"
          value={data.aiTutorSessions}
          tone="blue"
        />
        <NavyStatCard
          icon={GraduationCap}
          label="Acessos a micro-learning"
          value={data.microLearningAccess}
          tone="green"
        />
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
            <Avatar
              name={u.fullName}
              url={u.avatarUrl ?? undefined}
              size="sm"
            />
            <div className="flex-1 text-sm text-ink">{u.fullName}</div>
            <div className="text-sm font-data font-bold text-black">
              {u.points} XP
            </div>
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

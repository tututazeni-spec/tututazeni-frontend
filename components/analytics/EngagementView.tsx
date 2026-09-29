// components/analytics/EngagementView.tsx
// Separador "Engagement" — GET /analytics/engagement. Endpoint já existia
// sem consumidor no frontend.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import type { LucideIcon } from 'lucide-react';
import { BookOpen, Bot, GraduationCap, UserCheck, Users, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import type { EngagementMetrics } from './types';

type Tone = 'blue' | 'green' | 'gold' | 'red';

const TONES: Record<Tone, { bar: string; text: string }> = {
  blue: { bar: 'bg-[#2B6CC4]', text: 'text-[#2B6CC4]' },
  green: { bar: 'bg-[#2E8B3E]', text: 'text-[#2E8B3E]' },
  gold: { bar: 'bg-[#C9A227]', text: 'text-[#B8912A]' },
  red: { bar: 'bg-[#C0453F]', text: 'text-[#C0453F]' },
};

function TopBarKpiCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone: Tone;
}) {
  const t = TONES[tone];
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting">
      <div className={`h-1.5 w-full ${t.bar}`} />
      <div className="p-5 pt-6">
        <Icon size={22} strokeWidth={1.75} className={t.text} />
        <p className={`mt-3 font-display text-3xl font-bold ${t.text}`}>{value}</p>
        <p className="mt-1 font-body text-sm font-medium text-ink-muted">{label}</p>
      </div>
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
            <div className="grid grid-cols-3 gap-4">
        <TopBarKpiCard
          icon={Users}
          label="Colaboradores"
          value={data.totalUsers}
          tone="blue"
        />
        <TopBarKpiCard
          icon={UserCheck}
          label="Activos (últimos 30 dias)"
          value={data.activeUsersLast30d}
          tone="green"
        />
        <TopBarKpiCard
          icon={Zap}
          label="Taxa de engajamento"
          value={`${data.engagementRate}%`}
          tone="gold"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
                <TopBarKpiCard
          icon={BookOpen}
          label="Interacções com a base de conhecimento"
          value={data.knowledgeInteractions}
          tone="gold"
        />
        <TopBarKpiCard
          icon={Bot}
          label="Sessões de tutor AI"
          value={data.aiTutorSessions}
          tone="blue"
        />
        <TopBarKpiCard
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

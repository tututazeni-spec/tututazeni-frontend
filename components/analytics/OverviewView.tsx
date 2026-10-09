// components/analytics/OverviewView.tsx
// Separador "Visão geral" — KPIs organizacionais. Dados próprios +
// apresentação. Extraído de app/(platform)/analytics/page.tsx.
// Todos os KPIs usam o NavyStatCard; os pares agrupados (Cursos/
// Matrículas/Gamificação) ficam sob um título de grupo.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import {
  Award,
  BookOpen,
  FileBadge,
  Users,
  CheckCircle2,
  ClipboardList,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import type { OrgOverview } from './types';

function StatGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-3 font-body text-sm font-semibold uppercase tracking-wide text-[#152F59]">
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

export function OverviewView() {
  const { data, isLoading } = useApiQuery<OrgOverview>(
    queryKeys.analyticsPage.overview(),
    '/analytics/overview',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={4} />;

  return (
    <div className="space-y-8">
      {/* KPIs principais */}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <NavyStatCard
          label="Colaboradores activos"
          value={data.users.active}
          tone="blue"
          icon={Users}
        />
        <NavyStatCard
          label="Taxa de conclusão"
          value={`${data.enrollments.completionRate}%`}
          tone="green"
          icon={CheckCircle2}
        />
        <NavyStatCard
          label="Adopção de PDI"
          value={`${data.pdi.adoptionRate}%`}
          tone="orange"
          icon={ClipboardList}
        />
        <NavyStatCard
          label="Performance média"
          value={data.performance.avgScore}
          tone="red"
          icon={TrendingUp}
        />
      </div>

      {/* Segunda linha */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <StatGroup title="Cursos">
          <NavyStatCard
            icon={BookOpen}
            label="Total"
            value={data.courses.total}
            tone="blue"
          />
          <NavyStatCard
            icon={CheckCircle2}
            label="Publicados"
            value={data.courses.published}
            tone="green"
          />
        </StatGroup>

        <StatGroup title="Matrículas">
          <NavyStatCard
            icon={FileBadge}
            label="Concluídas"
            value={data.enrollments.completed}
            tone="green"
          />
          <NavyStatCard
            icon={ClipboardList}
            label="Adopção de PDI"
            value={`${data.pdi.adoptionRate}%`}
            tone="orange"
          />
        </StatGroup>

        <StatGroup title="Gamificação">
          <NavyStatCard
            icon={Zap}
            label="Pontos de Experiência"
            value={data.engagement.totalXp}
            tone="orange"
          />
          <NavyStatCard
            icon={Award}
            label="Distintivos"
            value={data.engagement.totalBadges}
            tone="blue"
          />
        </StatGroup>
      </div>
    </div>
  );
}

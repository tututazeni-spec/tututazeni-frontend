// components/analytics/OverviewView.tsx
// Separador "Visão geral" — KPIs organizacionais. Dados próprios +
// apresentação. Extraído de app/(platform)/analytics/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { KpiCard, Skeleton } from './atoms';
import type { OrgOverview } from './types';

export function OverviewView() {
  const { data, isLoading } = useApiQuery<OrgOverview>(
    queryKeys.analyticsPage.overview(),
    '/analytics/overview',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={4} />;

  return (
    <div className="space-y-5">
      {/* KPIs principais */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard
          label="Colaboradores activos"
          value={data.users.active}
          bg="bg-blue-50"
          color="text-blue-700"
        />
        <KpiCard
          label="Taxa de conclusão"
          value={`${data.enrollments.completionRate}%`}
          bg="bg-emerald-50"
          color="text-emerald-700"
        />
        <KpiCard
          label="Adopção de PDI"
          value={`${data.pdi.adoptionRate}%`}
          bg="bg-purple-50"
          color="text-purple-700"
        />
        <KpiCard
          label="Performance média"
          value={data.performance.avgScore}
          bg="bg-amber-50"
          color="text-amber-700"
        />
      </div>

      {/* Segunda linha */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Cursos
          </div>
          <div className="grid grid-cols-2 gap-3">
            <KpiCard label="Total" value={data.courses.total} bg="bg-gray-50" />
            <KpiCard
              label="Publicados"
              value={data.courses.published}
              bg="bg-gray-50"
            />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Matrículas
          </div>
          <div className="grid grid-cols-2 gap-3">
            <KpiCard
              label="Total"
              value={data.enrollments.total}
              bg="bg-gray-50"
            />
            <KpiCard
              label="Concluídas"
              value={data.enrollments.completed}
              bg="bg-gray-50"
              color="text-emerald-600"
            />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Gamificação
          </div>
          <div className="grid grid-cols-2 gap-3">
            <KpiCard
              label="XP total"
              value={data.engagement.totalXp}
              bg="bg-gray-50"
              color="text-amber-600"
            />
            <KpiCard
              label="Badges"
              value={data.engagement.totalBadges}
              bg="bg-gray-50"
              color="text-purple-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// components/dashboard-rh/EngagementPanel.tsx
// Painel "Engagement" — participação em surveys, reconhecimento, badges e
// sessões de avatar. Dados próprios (useApiQuery) + apresentação. Mesmo
// padrão de components/dashboard-rh/OverviewPanel.tsx (distribuição por
// departamento com ProgressBar).

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { BarChart } from '@/components/ui/charts/BarChart';
import { DonutStatCard } from '@/components/ui/charts/DonutStatCard';
import type { EngagementData } from './types';
import { Activity, Award, ThumbsUp } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export function EngagementPanel() {
  const { data, isLoading: loading } = useApiQuery<EngagementData>(
    queryKeys.dashboardRh.engagement(),
    '/dashboard-rh/engagement',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="grid grid-cols-2 md:grid-cols-4 gap-4"
        itemClassName="h-[155px] rounded-panel bg-surface-sunken"
      />
    );

  const byDept = data?.byDepartment ?? [];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <NavyStatCard
          label="PontuaÃ§Ã£o de Engajamento"
          value={
            data?.engagementScore != null ? `${data.engagementScore}%` : '–'
          }
          tone="blue"
          icon={Activity}
        />
        <DonutStatCard
          label="Participação em Pesquisas"
          value={data?.participationRate ?? 0}
          bare
        />
        <NavyStatCard
          label="Reconhecimentos (mês)"
          value={data?.recognitions ?? 0}
          tone="green"
          icon={ThumbsUp}
        />
        <NavyStatCard
          label="Badges Atribuídos (mês)"
          value={data?.badgeAwards ?? 0}
          tone="orange"
          icon={Award}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="overflow-hidden rounded-card border border-border bg-surface p-5">
          <h4 className="-mx-5 -mt-5 mb-4 bg-brand/60 px-5 py-3 font-body font-semibold text-white">
            Participação em Pesquisas por Departamento
          </h4>
          {byDept.length === 0 ? (
            <EmptyState variant="inline" title="Sem respostas este mês" />
          ) : (
            <BarChart
              orientation="horizontal"
              categories={byDept.slice(0, 8).map((d) => d.department)}
              series={[
                {
                  label: 'Respostas',
                  values: byDept.slice(0, 8).map((d) => d.responses),
                },
              ]}
            />
          )}
        </div>

        <div className="overflow-hidden rounded-card border border-border bg-surface p-5">
          <h4 className="-mx-5 -mt-5 mb-4 bg-brand/60 px-5 py-3 font-body font-semibold text-white">
            Actividade de Clima
          </h4>
          <table className="w-full font-body text-sm text-ink">
            <tbody>
              <tr className="border-b border-border">
                <td className="py-2 text-ink-muted">Pesquisas activas</td>
                <td className="py-2 text-right font-semibold">
                  {data?.activeSurveys ?? 0}
                </td>
              </tr>
              <tr>
                <td className="py-2 text-ink-muted">Sessões de avatar (mês)</td>
                <td className="py-2 text-right font-semibold">
                  {data?.avatarSessions ?? 0}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

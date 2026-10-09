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
import { rateTone } from './rateTone';
import type { EngagementData } from './types';
import { Activity, Award, ClipboardList, ThumbsUp } from 'lucide-react';

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
        wrapperClassName="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse"
        itemClassName="h-[155px] rounded-2xl bg-surface-sunken"
      />
    );

  const byDept = data?.byDepartment ?? [];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <NavyStatCard
          label="Score de Engajamento"
          value={
            data?.engagementScore != null ? `${data.engagementScore}%` : '–'
          }
          tone="blue"
          icon={Activity}
        />
        <NavyStatCard
          icon={ClipboardList}
          tone={rateTone(data?.participationRate ?? 0, { warning: 50, danger: 25 })}
          label="Participação em Pesquisas"
          value={`${Math.round(data?.participationRate ?? 0)}%`}
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
        <div className="rounded-card border border-border bg-surface p-5">
          <h4 className="mb-4 font-body font-semibold text-ink-muted">
            Participação em Pesquisas por Departamento
          </h4>
          {byDept.length === 0 ? (
            <p className="font-body text-xs text-ink-faint">
              Sem respostas este mês.
            </p>
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

        <div className="rounded-card border border-border bg-surface p-5">
          <h4 className="mb-4 font-body font-semibold text-ink-muted">
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

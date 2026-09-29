// components/dashboard-rh/EngagementPanel.tsx
// Painel "Engagement" — participação em surveys, reconhecimento, badges e
// sessões de avatar. Dados próprios (useApiQuery) + apresentação. Mesmo
// padrão de components/dashboard-rh/OverviewPanel.tsx (distribuição por
// departamento com ProgressBar).

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { TopBarCard } from '@/components/ui/TopBarCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { BarChart } from '@/components/ui/charts/BarChart';
import { GaugeChart } from '@/components/ui/charts/GaugeChart';
import type { EngagementData } from './types';
import { Activity, ThumbsUp, Award } from 'lucide-react';

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
        itemClassName="h-24 rounded-card bg-surface-sunken"
      />
    );

  const byDept = data?.byDepartment ?? [];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <TopBarCard
          label="Score de Engagement"
          value={
            data?.engagementScore != null ? `${data.engagementScore}%` : '–'
          }
          tone="blue"
          icon={<Activity className="h-6 w-6" />}
        />
        <div className="flex flex-col items-center justify-center rounded-card border border-border bg-surface p-3">
          <GaugeChart
            value={data?.participationRate ?? 0}
            label="Participação em Surveys"
            thresholds={{ warning: 50, danger: 25 }}
            size={120}
          />
        </div>
        <TopBarCard
          label="Reconhecimentos (mês)"
          value={data?.recognitions ?? 0}
          tone="green"
          icon={<ThumbsUp className="h-6 w-6" />}
        />
        <TopBarCard
          label="Badges Atribuídos (mês)"
          value={data?.badgeAwards ?? 0}
          tone="gold"
          icon={<Award className="h-6 w-6" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-card border border-border bg-surface p-5">
          <h4 className="mb-4 font-body font-semibold text-ink-muted">
            Participação em Surveys por Departamento
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

      {(data?.insights?.length ?? 0) > 0 && (
        <div className="rounded-card border border-accent-subtle bg-accent-subtle p-4">
          {data?.insights?.map((ins, i) => (
            <p key={i} className="font-body text-xs text-black">
              {ins.replace(/^[⚠️✅]\s*/, '')}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

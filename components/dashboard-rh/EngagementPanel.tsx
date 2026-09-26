// components/dashboard-rh/EngagementPanel.tsx
// Painel "Engagement" — participação em surveys, reconhecimento, badges e
// sessões de avatar. Dados próprios (useApiQuery) + apresentação. Mesmo
// padrão de components/dashboard-rh/OverviewPanel.tsx (distribuição por
// departamento com ProgressBar).

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { BarChart } from '@/components/ui/charts/BarChart';
import { GaugeChart } from '@/components/ui/charts/GaugeChart';
import type { EngagementData } from './types';

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
        <KpiCard
          label="Score de Engagement"
          value={data?.engagementScore != null ? `${data.engagementScore}%` : '–'}
          sub={data?.status}
          intent="accent"
          className="w-full"
        />
        <div className="flex flex-col items-center justify-center rounded-card border border-border bg-surface p-3">
          <GaugeChart value={data?.participationRate ?? 0} label="Participação em Surveys" thresholds={{ warning: 50, danger: 25 }} size={120} />
        </div>
        <KpiCard
          label="Reconhecimentos (mês)"
          value={data?.recognitions ?? 0}
          intent="success"
          className="w-full"
        />
        <KpiCard
          label="Badges Atribuídos (mês)"
          value={data?.badgeAwards ?? 0}
          intent="warning"
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-card border border-border bg-surface p-5">
          <h4 className="mb-4 font-body font-semibold text-ink-muted">
            Participação em Surveys por Departamento
          </h4>
          {byDept.length === 0 ? (
            <p className="font-body text-xs text-ink-faint">Sem respostas este mês.</p>
          ) : (
            <BarChart
              orientation="horizontal"
              categories={byDept.slice(0, 8).map((d) => d.department)}
              series={[{ label: 'Respostas', values: byDept.slice(0, 8).map((d) => d.responses) }]}
            />
          )}
        </div>

        <div className="rounded-card border border-border bg-surface p-5">
          <h4 className="mb-4 font-body font-semibold text-ink-muted">
            Actividade de Clima
          </h4>
          <div className="space-y-3 font-body text-sm text-ink">
            <div className="flex justify-between">
              <span className="text-ink-muted">Pesquisas activas</span>
              <span className="font-semibold">{data?.activeSurveys ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Sessões de avatar (mês)</span>
              <span className="font-semibold">{data?.avatarSessions ?? 0}</span>
            </div>
          </div>
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

// components/dashboard-rh/TurnoverPanel.tsx
// Painel "Rotatividade" — turnover/retenção e colaboradores em risco de
// saída. Dados próprios (useApiQuery) + apresentação. Mesmo padrão de
// components/dashboard-rh/PerformancePanel.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import type { LucideIcon } from 'lucide-react';
import { Clock, UserMinus } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { GaugeChart } from '@/components/ui/charts/GaugeChart';
import type { TurnoverData } from './types';

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
  sub,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  tone: Tone;
}) {
  const t = TONES[tone];
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting transition-shadow hover:shadow-lg">
      <div className={`h-1.5 w-full ${t.bar}`} />
      <div className="p-5 pt-6">
        <Icon size={22} strokeWidth={1.75} className={t.text} />
        <p className={`mt-3 font-display text-3xl font-bold ${t.text}`}>
          {value}
        </p>
        <p className="mt-1 font-body text-sm font-medium text-ink-muted">
          {label}
        </p>
        {sub && <p className="mt-1 font-body text-xs text-ink-faint">{sub}</p>}
      </div>
    </div>
  );
}

export function TurnoverPanel() {
  const { data, isLoading: loading } = useApiQuery<TurnoverData>(
    queryKeys.dashboardRh.turnover(),
    '/dashboard-rh/turnover',
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

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="flex flex-col items-center justify-center rounded-card border border-border bg-surface p-3">
          <GaugeChart
            value={data?.turnoverRate ?? 0}
            label="Taxa de Rotatividade"
            invert
            thresholds={{ warning: 15, danger: 25 }}
            size={120}
          />
        </div>
        <div className="flex flex-col items-center justify-center rounded-card border border-border bg-surface p-3">
          <GaugeChart
            value={data?.retentionRate ?? 0}
            label="Taxa de Retenção"
            thresholds={{ warning: 70, danger: 50 }}
            size={120}
          />
        </div>
        <TopBarKpiCard
          icon={UserMinus}
          label="Saídas (últimos 3 meses)"
          value={data?.leftLast3Months ?? 0}
          tone="gold"
        />
        <TopBarKpiCard
          icon={Clock}
          label="Tempo Médio de Casa"
          value={`${data?.avgTenureYears ?? 0} anos`}
          tone="blue"
        />
      </div>

      {(data?.atRiskUsers ?? []).length > 0 && (
        <div className="rounded-card border border-border bg-surface p-5">
          <h4 className="mb-3 font-body font-semibold text-ink-muted">
            Colaboradores em Risco de Saída
          </h4>
          <div className="space-y-2">
            {(data?.atRiskUsers ?? []).map((u, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-border py-2 last:border-0"
              >
                <Avatar name={u.user?.fullName ?? '?'} />
                <div className="min-w-0 flex-1">
                  <p className="font-body text-sm font-medium text-ink">
                    {u.user?.fullName}
                  </p>
                  <p className="font-body text-[10px] text-ink-faint">
                    {u.user?.position?.name} · {u.user?.department?.name}
                  </p>
                </div>
                <span className="font-body text-xs font-bold text-ink-muted">
                  {u.score?.toFixed(1)}/5
                </span>
                <Badge intent={u.risk === 'HIGH' ? 'danger' : 'warning'}>
                  {u.risk === 'HIGH' ? 'Risco Alto' : 'Risco Médio'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {(data?.insights?.length ?? 0) > 0 && (
        <div className="rounded-card border border-accent-subtle bg-accent-subtle p-4">
          {data?.insights?.map((ins, i) => (
            <p key={i} className="font-body text-xs text-black">
              {ins}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

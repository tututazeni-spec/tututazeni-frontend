// components/dashboard-rh/PredictionsPanel.tsx
// Painel "Previsões" — risco de saída projectado a partir de performance +
// tenure. Dados próprios (useApiQuery) + apresentação. Mesmo padrão de
// components/dashboard-rh/TurnoverPanel.tsx.
//
// KpiCards com ícone, seguindo o mesmo padrão aplicado nos outros painéis
// do dashboard-rh (icon + intent color).

'use client';

import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, MessageSquare, TrendingDown } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import type { PredictionsData } from './types';

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

export function PredictionsPanel() {
  const { data, isLoading: loading } = useApiQuery<PredictionsData>(
    queryKeys.dashboardRh.predictions(),
    '/dashboard-rh/predictions',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  if (loading)
    return (
      <Skeleton
        rows={3}
        wrapperClassName="grid grid-cols-2 md:grid-cols-3 gap-4 animate-pulse"
        itemClassName="h-24 rounded-card bg-surface-sunken"
      />
    );

  return (
    <div className="space-y-5">
      <div className="rounded-card border border-warning-subtle bg-warning-subtle p-3">
        <p className="font-body text-xs text-warning-ink">
          Previsão heurística baseada em performance e tempo de casa — não
          substitui análise de RH.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <TopBarKpiCard
          icon={AlertTriangle}
          label="Em Risco de Saída"
          value={data?.summary?.atRiskCount ?? 0}
          tone="red"
        />
        <TopBarKpiCard
          icon={TrendingDown}
          label="Baixa Performance"
          value={data?.summary?.lowPerfCount ?? 0}
          tone="gold"
        />
        <TopBarKpiCard
          icon={MessageSquare}
          label="Respostas de Engajamento (mês)"
          value={data?.summary?.engagementResponses ?? 0}
          tone="blue"
        />
      </div>

      {(data?.turnoverRisk ?? []).length > 0 && (
        <div className="rounded-card border border-border bg-surface p-5">
          <h4 className="mb-3 font-body font-semibold text-ink-muted">
            Colaboradores Sinalizados
          </h4>
          <div className="space-y-2">
            {(data?.turnoverRisk ?? []).map((r, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-border py-2 last:border-0"
              >
                <Avatar
                  name={r.user?.fullName ?? '?'}
                  url={r.user?.avatarUrl}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-body text-sm font-medium text-ink">
                    {r.user?.fullName}
                  </p>
                  <p className="font-body text-[10px] text-ink-faint">
                    {r.user?.department?.name} · {r.tenureMonths} meses de casa
                  </p>
                </div>
                <Badge intent={r.riskLevel === 'HIGH' ? 'danger' : 'warning'}>
                  {r.riskLevel === 'HIGH' ? 'Risco Alto' : 'Risco Médio'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// components/dashboard-rh/TalentPanel.tsx
// Painel "Talento" — pipeline de sucessão, high potentials e posições em
// risco. Dados próprios (useApiQuery) + apresentação. Extraído de
// app/(platform)/dashboard-rh/page.tsx. Migrado para a fundação de design
// — mesmo padrão de components/dashboard/OrgDashboard.tsx; badge de
// prontidão via components/ui/Badge.
//
// Conteúdo das três secções organizado em abas: Planos de Sucessão,
// Profissionais de Alto Potencial, Posições em Risco.

'use client';

import { useState } from 'react';
import { AlertTriangle, ShieldCheck, Star, Users } from 'lucide-react';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import { rateTone } from './rateTone';
import type { LucideIcon } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import type { TalentData } from './types';

type TabKey = 'succession' | 'hipo' | 'risk';



export function TalentPanel() {
  const { data, isLoading: loading } = useApiQuery<TalentData>(
    queryKeys.dashboardRh.talent(),
    '/dashboard-rh/talent-pipeline',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const [tab, setTab] = useState<TabKey>('succession');

  if (loading)
    return (
      <Skeleton
        rows={3}
        wrapperClassName="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse"
        itemClassName="h-[155px] rounded-2xl bg-surface-sunken"
      />
    );

  const successionPlans = data?.successionPlans ?? [];
  const hiPoList = data?.hiPoList ?? [];
  const positionsAtRisk = data?.positionsAtRisk ?? [];

  const tabs: Array<{
    key: TabKey;
    label: string;
    icon: LucideIcon;
    count: number;
  }> = [
    {
      key: 'succession',
      label: 'Planos de Sucessão',
      icon: Users,
      count: successionPlans.length,
    },
    {
      key: 'hipo',
      label: 'Alto Potencial',
      icon: Star,
      count: data?.hiPoCount ?? hiPoList.length,
    },
    {
      key: 'risk',
      label: 'Posições em Risco',
      icon: AlertTriangle,
      count: positionsAtRisk.length,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <NavyStatCard
          icon={ShieldCheck}
          tone={rateTone(data?.coverageRate ?? 0, { warning: 60, danger: 30 })}
          label="Posições Cobertas"
          value={`${Math.round(data?.coverageRate ?? 0)}%`}
        />
        <NavyStatCard
          icon={Users}
          label="Planos de Sucessão"
          value={successionPlans.length}
          tone="blue"
        />
        <NavyStatCard
          icon={Star}
          label="Profissionais de Alto Potencial"
          value={data?.hiPoCount ?? hiPoList.length}
          tone="orange"
        />
        <NavyStatCard
          icon={AlertTriangle}
          label="Posições em Risco"
          value={positionsAtRisk.length}
          tone="red"
        />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-panel border border-border bg-surface p-1.5 shadow-sm">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-control py-2 font-body text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-[#0F1F3D] text-canvas shadow-sm'
                : 'text-ink-muted hover:bg-surface-sunken hover:text-ink'
            }`}
          >
            <t.icon size={15} strokeWidth={1.75} />
            <span className="hidden sm:inline">{t.label}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                tab === t.key
                  ? 'bg-canvas/20 text-canvas'
                  : 'bg-surface-sunken text-ink-faint'
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Succession plans */}
      {tab === 'succession' && (
        <div className="rounded-card border border-border bg-surface p-5">
          <h4 className="mb-3 font-body font-semibold text-ink-muted">
            Planos de Sucessão
          </h4>
          {successionPlans.length === 0 ? (
            <p className="font-body text-sm text-ink-faint">
              Sem planos de sucessão registados.
            </p>
          ) : (
            <div className="space-y-2">
              {successionPlans.slice(0, 8).map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 border-b border-border py-2 last:border-0"
                >
                  <Avatar
                    name={p.candidate?.fullName ?? '?'}
                    url={p.candidate?.avatarUrl}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-sm font-medium text-ink">
                      {p.candidate?.fullName}
                    </p>
                    <p className="font-body text-[10px] text-ink-faint">
                      → {p.position?.name}
                    </p>
                  </div>
                  {p.readiness && <Badge intent="info">{p.readiness}</Badge>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* High potentials */}
      {tab === 'hipo' && (
        <div className="rounded-card border border-border bg-surface p-5">
          <h4 className="mb-3 font-body font-semibold text-ink-muted">
            Profissionais de Alto Potencial
          </h4>
          {hiPoList.length === 0 ? (
            <p className="font-body text-sm text-ink-faint">
              Sem colaboradores identificados como alto potencial.
            </p>
          ) : (
            <div className="space-y-2">
              {hiPoList.slice(0, 8).map((h, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 border-b border-border py-2 last:border-0"
                >
                  <Avatar name={h.fullName ?? '?'} url={h.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-sm font-medium text-ink">
                      {h.fullName}
                    </p>
                    <p className="font-body text-[10px] text-ink-faint">
                      {h.position?.name ?? h.department}
                    </p>
                  </div>
                  <Badge intent="warning">
                    <Star
                      size={11}
                      strokeWidth={2}
                      className="mr-1 inline align-[-1px]"
                    />
                    Alto Potencial
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Positions at risk */}
      {tab === 'risk' && (
        <div className="rounded-card border border-border bg-surface p-5">
          {positionsAtRisk.length === 0 ? (
            <p className="font-body text-sm text-ink-faint">
              Sem posições em risco no momento.
            </p>
          ) : (
            <div className="space-y-2">
              {positionsAtRisk.map((p, i) => (
                <p
                  key={i}
                  className="border-b border-border py-2 font-body text-sm text-ink last:border-0"
                >
                  {p.name} (Nível {p.level})
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

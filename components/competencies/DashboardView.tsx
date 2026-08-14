// components/competencies/DashboardView.tsx
// Separador "Dashboard RH" — métricas globais, gaps críticos e top
// competências. Dados próprios + apresentação. Extraído de
// app/(platform)/competencies/page.tsx. Migrado para a fundação de
// design: métricas passam a KpiCard, skeleton local passa a
// components/ui/Skeleton. A ProgressBar da fundação é mono-cor
// (bg-accent) — a barra de gap crítico deixa de recolorir-se a
// vermelho e passa a comunicar a severidade pelo texto adjacente
// (mesmo padrão de components/engagement/AnalyticsTab.tsx).

'use client';

import { AlertTriangle, UserCheck, Users, UserX } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CATEGORY_CFG } from './constants';
import type { CompetencyCategory, OrgDashboard, TopCompetency } from './types';

export function DashboardView() {
  const dataQ = useApiQuery<OrgDashboard>(
    queryKeys.competencies.dashboardGaps(),
    '/competencies/dashboard/gaps',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const topQ = useApiQuery<TopCompetency[]>(
    queryKeys.competencies.top(),
    '/competencies/top',
    { params: { limit: 8 }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const data = dataQ.data ?? null;
  const top = topQ.data ?? [];
  const loading = dataQ.isLoading;

  if (loading || !data) return <Skeleton rows={4} />;

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard icon={Users} label="Total colaboradores" value={data.totalUsers} intent="primary" />
        <KpiCard
          icon={UserCheck}
          label="Com competências"
          value={data.usersWithCompetencies}
          intent="success"
        />
        <KpiCard
          icon={UserX}
          label="Sem competências"
          value={data.totalUsers - data.usersWithCompetencies}
          intent="warning"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Gaps identificados"
          value={data.totalGaps}
          intent={data.totalGaps > 0 ? 'danger' : 'primary'}
        />
      </div>

      {/* Gaps críticos */}
      {data.criticalGaps.length > 0 && (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Competências críticas — mais gaps
          </div>
          {data.criticalGaps.map((c) => {
            const pct =
              data.totalUsers > 0
                ? Math.round((c.usersWithGap / data.totalUsers) * 100)
                : 0;
            return (
              <div
                key={c.id}
                className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0"
              >
                <div className="flex-1">
                  <div className="font-body text-sm font-medium text-ink">
                    {c.name}
                  </div>
                  <StatusBadge
                    value={c.category as CompetencyCategory}
                    map={CATEGORY_CFG}
                  />
                </div>
                <div className="w-40">
                  <div className="mb-1 flex justify-between font-body text-xs text-ink-faint">
                    <span>{c.usersWithGap} utilizadores</span>
                    <span className="font-semibold text-danger">{pct}%</span>
                  </div>
                  <ProgressBar value={pct} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Top competências */}
      {top.length > 0 && (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Competências mais comuns na organização
          </div>
          {top.map((t, idx) => (
            <div
              key={t.competencyId}
              className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0"
            >
              <span className="w-6 text-center font-data text-lg font-bold text-ink-faint">
                {idx + 1}
              </span>
              <div className="flex-1">
                <div className="font-body text-sm font-medium text-ink">
                  {t.competency?.name ?? '—'}
                </div>
                <StatusBadge
                  value={
                    (t.competency?.category ??
                      'HARD_SKILL') as CompetencyCategory
                  }
                  map={CATEGORY_CFG}
                />
              </div>
              <div className="text-right">
                <div className="font-data text-sm text-ink-muted">
                  {t._count.competencyId} utilizadores
                </div>
                <div className="font-body text-xs text-ink-faint">
                  Nível médio: {t.avgLevel}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

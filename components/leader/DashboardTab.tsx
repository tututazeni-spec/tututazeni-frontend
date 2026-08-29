// components/leader/DashboardTab.tsx
// Tab "Dashboard": alertas, KPIs, recomendações IA e badges recentes
// da equipa. Extraído de app/(platform)/leader/page.tsx.

'use client';

import {
  AlertTriangle,
  BookOpen,
  Brain,
  CheckCircle,
  Clock,
  MessageSquare,
  Star,
  Target,
  Users,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card, CardBody } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { LeaderDashboard, LeaderRecommendations } from './types';

export function DashboardTab() {
  const dashQ = useApiQuery<LeaderDashboard>(
    queryKeys.leader.dashboard(),
    '/leaders/my-dashboard',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const recsQ = useApiQuery<LeaderRecommendations>(
    queryKeys.leader.recommendations(),
    '/leaders/my-recommendations',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const dash = dashQ.data ?? null;
  const recs = recsQ.data ?? null;
  const loading = dashQ.isLoading;

  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="grid grid-cols-2 md:grid-cols-4 gap-4"
        itemClassName="skeleton-shimmer h-24 rounded-card"
      />
    );
  const k = dash?.kpis ?? {};

  return (
    <div className="space-y-5">
      {/* Alerts */}
      {(dash?.alerts ?? []).length > 0 && (
        <div className="space-y-2">
          {(dash?.alerts ?? []).map((a, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-card border border-black bg-white px-4 py-3"
            >
              <AlertTriangle
                size={14}
                strokeWidth={1.75}
                className="text-black"
              />
              <p className="font-body text-sm text-black">{a.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Equipa" value={k.teamSize ?? 0} intent="primary" />
        <KpiCard
          label="Pontuação Média"
          value={k.avgPerfScore?.toFixed(1) ?? '–'}
          intent="warning"
        />
        <KpiCard
          label="PDIs Activos"
          value={k.activePlans ?? 0}
          intent="accent"
        />
        <KpiCard label="Em Risco" value={k.atRiskCount ?? 0} intent="danger" />
        <KpiCard
          label="Em Formação"
          value={k.activeEnrollments ?? 0}
          intent="info"
        />
        <KpiCard
          label="Conclusões (mês)"
          value={k.completedThisMonth ?? 0}
          intent="success"
        />
        <KpiCard
          label="Respostas a Questionários"
          value={k.engagementResponses ?? 0}
          intent="accent"
        />
        <KpiCard
          label="Aprovações Pendentes"
          value={k.pendingLeaves ?? 0}
          intent="warning"
        />
      </div>

      {/* AI Recommendations */}
      {(recs?.recommendations ?? []).length > 0 && (
        <Card>
          <CardBody>
            <h3 className="mb-3 flex items-center gap-2 font-display font-semibold text-ink">
              <Brain size={16} strokeWidth={1.75} className="text-accent" />
              Recomendações IA
            </h3>
            <div className="space-y-2">
              {(recs?.recommendations ?? []).map((r, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-card border border-accent-subtle bg-accent-subtle p-3"
                >
                  <div
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${r.urgency === 'HIGH' ? 'bg-danger' : 'bg-warning'}`}
                  />
                  <div>
                    <p className="font-body text-sm font-medium text-ink">
                      {r.message}
                    </p>
                    {r.action && (
                      <p className="mt-0.5 font-body text-xs text-primary">
                        {r.action}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-pill px-2 py-0.5 font-body text-[10px] font-medium ${r.urgency === 'HIGH' ? 'bg-danger-subtle text-danger-ink' : 'bg-warning-subtle text-warning-ink'}`}
                  >
                    {r.urgency}
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Recent badges */}
      {(dash?.recentBadges ?? []).length > 0 && (
        <div className="rounded-card border border-warning bg-warning-subtle p-4">
          <h4 className="mb-3 font-display font-semibold text-warning-ink">
            Distintivos Conquistados esta Semana
          </h4>
          <div className="flex flex-wrap gap-2">
            {(dash?.recentBadges ?? []).map((b, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-control border border-warning-subtle bg-surface px-3 py-1.5"
              >
                <span className="text-sm"></span>
                <div>
                  <p className="font-body text-xs font-medium text-ink">
                    {b.user?.fullName}
                  </p>
                  <p className="font-body text-[10px] text-warning-ink">
                    {b.badge?.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

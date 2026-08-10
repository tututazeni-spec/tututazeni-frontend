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
import { KPICard, Skeleton } from './atoms';
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

  if (loading) return <Skeleton />;
  const k = dash?.kpis ?? {};

  return (
    <div className="space-y-5">
      {/* Alerts */}
      {(dash?.alerts ?? []).length > 0 && (
        <div className="space-y-2">
          {(dash?.alerts ?? []).map((a, i) => (
            <div
              key={i}
              className={`border rounded-xl px-4 py-3 flex items-center gap-3 ${a.severity === 'HIGH' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}
            >
              <AlertTriangle
                size={14}
                className={
                  a.severity === 'HIGH' ? 'text-red-500' : 'text-amber-500'
                }
              />
              <p
                className={`text-sm ${a.severity === 'HIGH' ? 'text-red-700' : 'text-amber-700'}`}
              >
                {a.message}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={Users} label="Equipa" value={k.teamSize ?? 0} />
        <KPICard
          icon={Star}
          label="Score Médio"
          value={k.avgPerfScore?.toFixed(1) ?? '–'}
          status={k.perfStatus}
          color="text-amber-600"
          bg="bg-amber-50"
        />
        <KPICard
          icon={Target}
          label="PDIs Activos"
          value={k.activePlans ?? 0}
          color="text-indigo-600"
          bg="bg-indigo-50"
        />
        <KPICard
          icon={AlertTriangle}
          label="Em Risco"
          value={k.atRiskCount ?? 0}
          color="text-red-500"
          bg="bg-red-50"
        />
        <KPICard
          icon={BookOpen}
          label="Em Formação"
          value={k.activeEnrollments ?? 0}
          color="text-teal-600"
          bg="bg-teal-50"
        />
        <KPICard
          icon={CheckCircle}
          label="Conclusões (mês)"
          value={k.completedThisMonth ?? 0}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
        <KPICard
          icon={MessageSquare}
          label="Respostas a Surveys"
          value={k.engagementResponses ?? 0}
          color="text-violet-600"
          bg="bg-violet-50"
        />
        <KPICard
          icon={Clock}
          label="Aprovações Pendentes"
          value={k.pendingLeaves ?? 0}
          color="text-orange-600"
          bg="bg-orange-50"
        />
      </div>

      {/* AI Recommendations */}
      {(recs?.recommendations ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Brain size={16} className="text-violet-500" />
            Recomendações IA
          </h3>
          <div className="space-y-2">
            {(recs?.recommendations ?? []).map((r, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl bg-violet-50 border border-violet-100"
              >
                <div
                  className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${r.urgency === 'HIGH' ? 'bg-red-500' : 'bg-amber-400'}`}
                />
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {r.message}
                  </p>
                  {r.action && (
                    <p className="text-xs text-violet-700 mt-0.5">
                      💡 {r.action}
                    </p>
                  )}
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${r.urgency === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}
                >
                  {r.urgency}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent badges */}
      {(dash?.recentBadges ?? []).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h4 className="font-semibold text-amber-700 mb-3">
            🏅 Badges Conquistados esta Semana
          </h4>
          <div className="flex flex-wrap gap-2">
            {(dash?.recentBadges ?? []).map((b, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-amber-100"
              >
                <span className="text-sm">🏅</span>
                <div>
                  <p className="text-xs font-medium text-slate-700">
                    {b.user?.fullName}
                  </p>
                  <p className="text-[10px] text-amber-600">{b.badge?.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// components/engagement/OverviewTab.tsx
// Separador "Visão Geral" — check-in de humor, resumo pessoal, KPIs, eNPS
// e reconhecimentos recentes. Dados próprios (useApiQuery) + apresentação,
// mesmo padrão auto-contido usado em components/payslips/page.tsx.
// Extraído de app/(platform)/engagement/page.tsx.
//
// `userId` nunca é passado pelo container (page.tsx renderiza
// `<OverviewTab />` sem prop) — mesmo padrão (não corrigido aqui) de
// components/evaluation/OverviewTab.tsx.

'use client';

import { AlertTriangle, Award, Smile, TrendingUp, Users } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar, KpiCard, ProgressBar, Skeleton } from './atoms';
import { GRADE_COLOR, LEVEL_CONFIG } from './constants';
import { MoodCheckin } from './MoodCheckin';
import type { DashboardData, MySummary } from './types';

export interface OverviewTabProps {
  userId?: number;
}

export function OverviewTab({ userId }: OverviewTabProps) {
  const dashQuery = useApiQuery<DashboardData>(
    queryKeys.engagement.dashboard(),
    '/engagement/dashboard',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const summaryQuery = useApiQuery<MySummary>(
    queryKeys.engagement.mySummary(),
    '/engagement/my-summary',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const dash = dashQuery.data ?? null;
  const summary = summaryQuery.data ?? null;

  const load = () => {
    dashQuery.refetch();
    summaryQuery.refetch();
  };

  if (dashQuery.isLoading || summaryQuery.isLoading) return <Skeleton />;

  const level = LEVEL_CONFIG[dash?.kpis.engagementLevel ?? 'FAIR'];

  return (
    <div className="space-y-6">
      {/* Mood checkin */}
      <MoodCheckin onDone={load} />

      {/* Personal summary */}
      {summary && (
        <div className={`rounded-xl border p-4 ${level.bg}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">
                Engagement Score da Organização
              </p>
              <p className={`text-3xl font-black ${level.color}`}>
                {dash?.kpis.engagementIndex ?? 0}%
              </p>
              <span className={`text-xs font-medium ${level.color}`}>
                {level.label}
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Human Success Score</p>
              <div
                className={`w-16 h-16 rounded-full border-4 ${GRADE_COLOR[summary.hssGrade]}
                flex flex-col items-center justify-center`}
              >
                <span
                  className={`text-2xl font-black ${GRADE_COLOR[summary.hssGrade].split(' ')[0]}`}
                >
                  {summary.hssGrade}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={Smile}
          label="Engajamento"
          value={`${dash?.kpis.engagementIndex ?? 0}%`}
          color="text-violet-600"
          bg="bg-violet-50"
          trend={dash?.kpis.engagementTrend}
        />
        <KpiCard
          icon={Users}
          label="Participação"
          value={`${dash?.kpis.participationRate ?? 0}%`}
          color="text-indigo-600"
          bg="bg-indigo-50"
        />
        <KpiCard
          icon={TrendingUp}
          label="eNPS"
          value={dash?.kpis.enps ?? 0}
          sub={dash?.enpsBreakdown.label}
          color={
            (dash?.kpis.enps ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
          }
          bg={(dash?.kpis.enps ?? 0) >= 0 ? 'bg-emerald-50' : 'bg-red-50'}
        />
        <KpiCard
          icon={Award}
          label="Reconhecimentos"
          value={dash?.kpis.totalRecognitions ?? 0}
          color="text-amber-600"
          bg="bg-amber-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* eNPS visual */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-4">eNPS Breakdown</h3>
          {dash?.enpsBreakdown && (
            <div className="space-y-3">
              {[
                {
                  label: 'Promotores',
                  pct: dash.enpsBreakdown.promoterPct,
                  color: 'bg-emerald-500',
                },
                {
                  label: 'Passivos',
                  pct:
                    100 -
                    dash.enpsBreakdown.promoterPct -
                    dash.enpsBreakdown.detractorPct,
                  color: 'bg-amber-400',
                },
                {
                  label: 'Detractores',
                  pct: dash.enpsBreakdown.detractorPct,
                  color: 'bg-red-400',
                },
              ].map((e) => (
                <div key={e.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">{e.label}</span>
                    <span className="font-semibold">{e.pct.toFixed(1)}%</span>
                  </div>
                  <ProgressBar value={e.pct} color={e.color} height="h-2" />
                </div>
              ))}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-sm text-slate-500">Score eNPS</span>
                <span
                  className={`text-2xl font-bold ${(dash.enpsBreakdown.enps ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                >
                  {dash.enpsBreakdown.enps ?? 'N/A'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Recent recognitions */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-4">
            🏆 Reconhecimentos Recentes
          </h3>
          {(dash?.recentRecognitions.length ?? 0) === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              Sem reconhecimentos recentes
            </p>
          ) : (
            <div className="space-y-3">
              {dash?.recentRecognitions.map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Avatar
                    name={r.from?.fullName ?? 'User'}
                    url={r.from?.avatarUrl}
                    size={8}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-600">
                      <span className="font-medium">{r.from?.fullName}</span>
                      {' → '}
                      <span className="font-medium">{r.to?.fullName}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {r.message}
                    </p>
                  </div>
                  <span className="text-sm">
                    {r.type === 'KUDOS' ? '👏' : '🏅'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending surveys */}
      {(summary?.surveys.length ?? 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-600" />
            <p className="text-sm font-semibold text-amber-700">
              {summary!.surveys.length} survey
              {summary!.surveys.length > 1 ? 's' : ''} pendente
              {summary!.surveys.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="space-y-2">
            {summary!.surveys.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between bg-white rounded-lg px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {s.title}
                  </p>
                  <p className="text-xs text-slate-400">{s.type}</p>
                </div>
                <button className="text-xs px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700">
                  Responder
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
// src/app/(dashboard)/dashboard-rh/page.tsx

import { useState } from 'react';
import {
  Users, TrendingUp, TrendingDown, Activity, Star, BookOpen,
  Shield, Brain, AlertTriangle, CheckCircle, Target, Zap,
  BarChart2, ChevronRight, RefreshCw, Clock, Award,
  UserMinus, UserPlus, Heart, Filter,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import Image from 'next/image';

// ─── Types ───────────────────────────────────────────────────────

type Panel = 'overview' | 'headcount' | 'turnover' | 'performance' | 'training' | 'engagement' | 'talent' | 'correlations';

interface Alert { type: string; severity: 'HIGH' | 'MEDIUM' | 'LOW'; message: string; count?: number }

function Skeleton({ count = 4 }: { count?: number }) {
  return <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">{[...Array(count)].map((_, i) => <div key={i} className="bg-slate-100 rounded-xl h-24" />)}</div>;
}

function ProgressBar({ value, color = 'bg-indigo-500', height = 'h-1.5' }: { value: number; color?: string; height?: string }) {
  return (
    <div className={`w-full ${height} bg-slate-100 rounded-full`}>
      <div className={`${height} ${color} rounded-full transition-all`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

function Avatar({ name, url, size = 8 }: { name: string; url?: string; size?: number }) {
  const i = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  return url
    ? <div className={`w-${size} h-${size} rounded-full overflow-hidden relative`}><Image src={url} alt={name} fill className="object-cover" /></div>
    : <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-indigo-500 to-violet-600
        flex items-center justify-center text-white text-xs font-bold shrink-0`}>{i}</div>;
}

function KPICard({ icon: Icon, label, value, sub, trend, color = 'text-indigo-600', bg = 'bg-indigo-50', status }: {
  icon: any; label: string; value: string | number; sub?: string;
  trend?: number; color?: string; bg?: string; status?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${bg}`}><Icon size={18} className={color} /></div>
        <div className="flex items-center gap-1">
          {status && <span className="text-base">{status}</span>}
          {trend !== undefined && (
            <span className={`text-xs font-medium flex items-center gap-0.5 ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Alert Banners ────────────────────────────────────────────────

function AlertStrip({ alerts }: { alerts: Alert[] }) {
  if (!alerts.length) return (
    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
      <CheckCircle size={16} className="text-emerald-500" />
      <p className="text-sm text-emerald-700 font-medium">Sem alertas críticos activos</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {alerts.map((a, i) => {
        const conf = {
          HIGH:   { bg: 'bg-red-50 border-red-200',    icon: AlertTriangle, color: 'text-red-700',  btnBg: 'bg-red-600' },
          MEDIUM: { bg: 'bg-amber-50 border-amber-200', icon: Clock,         color: 'text-amber-700',btnBg: 'bg-amber-600' },
          LOW:    { bg: 'bg-teal-50 border-teal-100',   icon: CheckCircle,   color: 'text-teal-700', btnBg: 'bg-teal-600' },
        }[a.severity];
        const AlertIcon = conf.icon;
        return (
          <div key={i} className={`border rounded-xl px-4 py-3 flex items-center gap-3 ${conf.bg}`}>
            <AlertIcon size={14} className={`${conf.color} shrink-0`} />
            <p className={`text-sm flex-1 ${conf.color}`}>{a.message}</p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Overview Panel ───────────────────────────────────────────────

function OverviewPanel() {
  const dataQ = useApiQuery<any>(queryKeys.dashboardRh.overview(), '/dashboard-rh', { staleTime: STALE_TIME.DYNAMIC });
  const alertsQ = useApiQuery<Alert[]>(queryKeys.dashboardRh.alerts(), '/dashboard-rh/alerts', { staleTime: STALE_TIME.DYNAMIC });
  const data = dataQ.data ?? null;
  const alerts = alertsQ.data ?? [];
  const loading = dataQ.isLoading;

  if (loading) return <div className="space-y-4"><Skeleton count={6} /></div>;
  const k = data?.kpis ?? {};

  return (
    <div className="space-y-5">
      <AlertStrip alerts={alerts} />

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={Users}       label="Colaboradores Activos"  value={k.headcount?.total ?? 0}      status={k.headcount?.status} />
        <KPICard icon={UserMinus}   label="Turnover"               value={`${k.turnover?.rate ?? 0}%`}  status={k.turnover?.status} color="text-red-500" bg="bg-red-50" />
        <KPICard icon={UserPlus}    label="Novas Admissões (mês)"  value={k.newHires?.count ?? 0}       trend={k.newHires?.trend} color="text-emerald-600" bg="bg-emerald-50" />
        <KPICard icon={Star}        label="Performance Média"      value={k.performance?.avg?.toFixed(1) ?? '–'} color="text-amber-600" bg="bg-amber-50" />
        <KPICard icon={Target}      label="Cobertura PDI"          value={`${k.pdpCoverage?.pct ?? 0}%`} status={k.pdpCoverage?.status} color="text-indigo-600" bg="bg-indigo-50" />
        <KPICard icon={BookOpen}    label="Conclusões (mês)"       value={k.completions?.count ?? 0}    color="text-teal-600" bg="bg-teal-50" />
        <KPICard icon={Activity}    label="Respostas a Surveys"    value={k.engagement?.surveyResponses ?? 0} color="text-violet-600" bg="bg-violet-50" />
        <KPICard icon={Shield}      label="Formações Obrigatórias" value={k.mandatoryCompliance ?? 0}   color="text-red-600" bg="bg-red-50" />
      </div>

      {/* Dept distribution */}
      {(data?.distribution?.byDepartment?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-4">Distribuição por Departamento</h3>
          <div className="space-y-2">
            {(data.distribution.byDepartment as any[]).slice(0, 8).map((d: any, i: number) => {
              const maxCount = Math.max(...(data.distribution.byDepartment as any[]).map((x: any) => x.count));
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-slate-600 truncate">{d.name ?? `Dept ${d.id}`}</span>
                    <span className="font-semibold text-slate-700">{d.count}</span>
                  </div>
                  <ProgressBar value={(d.count / maxCount) * 100} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Headcount Panel ──────────────────────────────────────────────

function HeadcountPanel() {
  const dataQ = useApiQuery<any>(queryKeys.dashboardRh.headcount(), '/dashboard-rh/headcount', { staleTime: STALE_TIME.SEMI_STATIC });
  const trendQ = useApiQuery<any[]>(queryKeys.dashboardRh.headcountTrend(), '/dashboard-rh/headcount-trend', { params: { months: 6 }, staleTime: STALE_TIME.SEMI_STATIC });
  const data = dataQ.data ?? null;
  const trend = trendQ.data ?? [];
  const loading = dataQ.isLoading;

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={Users}      label="Total"           value={data?.total ?? 0} />
        <KPICard icon={CheckCircle} label="Activos"         value={data?.active ?? 0}        color="text-emerald-600" bg="bg-emerald-50" />
        <KPICard icon={UserMinus}  label="Turnover"        value={`${data?.turnoverRate ?? 0}%`} color="text-red-500" bg="bg-red-50" />
        <KPICard icon={Clock}      label="Tenure Médio"    value={`${data?.avgTenureMonths ?? 0}m`} sub={`≈ ${((data?.avgTenureMonths ?? 0) / 12).toFixed(1)} anos`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Tenure buckets */}
        {data?.byTenure && (
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <h4 className="font-semibold text-slate-700 mb-4">Distribuição por Tempo de Casa</h4>
            {Object.entries(data.byTenure as Record<string, number>).map(([k, v]) => {
              const max = Math.max(...Object.values(data.byTenure as Record<string, number>));
              return (
                <div key={k} className="mb-2">
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-slate-600">{k}</span>
                    <span className="font-semibold text-slate-700">{v}</span>
                  </div>
                  <ProgressBar value={max > 0 ? (v / max) * 100 : 0} />
                </div>
              );
            })}
          </div>
        )}

        {/* Monthly trend */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-4">Evolução Mensal</h4>
          <div className="space-y-2">
            {trend.map((t: any, i: number) => {
              const max = Math.max(...trend.map(x => x.count));
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-slate-600">{t.month}</span>
                    <span className="font-semibold text-slate-700">{t.count}</span>
                  </div>
                  <ProgressBar value={(t.count / max) * 100} color="bg-indigo-400" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Anniversaries */}
      <AnniversariesWidget />
    </div>
  );
}

function AnniversariesWidget() {
  const { data = [] } = useApiQuery<any[]>(
    queryKeys.dashboardRh.anniversaries(), '/dashboard-rh/anniversaries',
    { staleTime: STALE_TIME.SEMI_STATIC, retry: false },
  );
  if (!data.length) return null;
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <h4 className="font-semibold text-amber-700 mb-3 flex items-center gap-2">
        🎉 Aniversários de Empresa este Mês
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {data.slice(0, 6).map((u: any, i) => (
          <div key={i} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2">
            <Avatar name={u.fullName} url={u.avatarUrl} size={7} />
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-700 truncate">{u.fullName}</p>
              <p className="text-[10px] text-amber-600 font-semibold">{u.years} {u.years === 1 ? 'ano' : 'anos'} 🏆</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Performance Panel ────────────────────────────────────────────

function PerformancePanel() {
  const { data, isLoading: loading } = useApiQuery<any>(
    queryKeys.dashboardRh.performance(), '/dashboard-rh/performance', { staleTime: STALE_TIME.SEMI_STATIC },
  );
  if (loading) return <Skeleton />;
  const dist = data?.distribution ?? {};
  const total = Object.values(dist as Record<string, number>).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={Star}       label="Score Médio"    value={data?.avgScore?.toFixed(1) ?? '–'} status={data?.status} color="text-amber-600" bg="bg-amber-50" />
        <KPICard icon={Users}      label="Avaliados"      value={data?.total ?? 0} />
        <KPICard icon={Zap}        label="High Potentials" value={data?.hiPos ?? 0} sub={`${data?.hiPoRatio ?? 0}% da equipa`} color="text-emerald-600" bg="bg-emerald-50" />
        <KPICard icon={AlertTriangle} label="Em Risco"    value={data?.atRisk ?? 0} color="text-red-500" bg="bg-red-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Distribution */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-4">Distribuição de Performance</h4>
          {[
            { key: 'exceptional', label: '⭐ Excepcional', color: 'bg-emerald-500' },
            { key: 'above',       label: '✅ Acima',       color: 'bg-teal-400' },
            { key: 'expected',    label: '👍 Esperado',    color: 'bg-amber-400' },
            { key: 'below',       label: '⚠️ Abaixo',      color: 'bg-orange-400' },
            { key: 'critical',    label: '🔴 Crítico',     color: 'bg-red-400' },
          ].map(b => {
            const val = dist[b.key] ?? 0;
            const pct = total > 0 ? Math.round((val / total) * 100) : 0;
            return (
              <div key={b.key} className="mb-2">
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-slate-600">{b.label}</span>
                  <span className="font-semibold text-slate-700">{val} ({pct}%)</span>
                </div>
                <ProgressBar value={pct} color={b.color} />
              </div>
            );
          })}
        </div>

        {/* By dept */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-4">Score por Departamento</h4>
          {(data?.byDepartment ?? []).slice(0, 6).map((d: any, i: number) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-slate-600 truncate">{d.department}</span>
                <span className={`font-bold text-xs ${d.avgScore >= 4 ? 'text-emerald-600' : d.avgScore >= 3 ? 'text-amber-600' : 'text-red-500'}`}>
                  {d.avgScore.toFixed(1)}
                </span>
              </div>
              <ProgressBar value={(d.avgScore / 5) * 100}
                color={d.avgScore >= 4 ? 'bg-emerald-500' : d.avgScore >= 3 ? 'bg-amber-400' : 'bg-red-400'} />
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      {(data?.insights ?? []).length > 0 && (
        <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
          {data.insights.map((ins: string, i: number) => <p key={i} className="text-xs text-violet-800">{ins}</p>)}
        </div>
      )}
    </div>
  );
}

// ─── Training Panel ───────────────────────────────────────────────

function TrainingPanel() {
  const { data, isLoading: loading } = useApiQuery<any>(
    queryKeys.dashboardRh.training(), '/dashboard-rh/training', { staleTime: STALE_TIME.SEMI_STATIC },
  );
  if (loading) return <Skeleton />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={BookOpen}    label="Conclusões (mês)"    value={data?.completed ?? 0}      color="text-teal-600"    bg="bg-teal-50" />
        <KPICard icon={Activity}    label="Taxa de Conclusão"   value={`${data?.completionRate ?? 0}%`} />
        <KPICard icon={Shield}      label="Formações Obrig."    value={`${data?.mandatoryRate ?? 0}%`} status={data?.mandatoryStatus} color="text-red-600" bg="bg-red-50" />
        <KPICard icon={Clock}       label="Horas Estimadas"     value={`${data?.estimatedHours ?? 0}h`} color="text-violet-600" bg="bg-violet-50" />
      </div>

      {/* Top courses */}
      {(data?.topCourses ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-3">Top 5 Cursos</h4>
          <div className="space-y-2">
            {data.topCourses.map((c: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-300 w-4">#{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{c.course?.title ?? `Curso ${c.courseId}`}</p>
                  <p className="text-[10px] text-slate-400">{c.course?.category}</p>
                </div>
                <span className="text-xs font-bold text-indigo-600">{c.count} inscrições</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(data?.insights ?? []).length > 0 && (
        <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
          {data.insights.map((ins: string, i: number) => <p key={i} className="text-xs text-violet-800">{ins}</p>)}
        </div>
      )}
    </div>
  );
}

// ─── Correlations Panel ───────────────────────────────────────────

function CorrelationsPanel() {
  const { data, isLoading: loading } = useApiQuery<any>(
    queryKeys.dashboardRh.correlations(), '/dashboard-rh/correlations', { staleTime: STALE_TIME.SEMI_STATIC },
  );
  if (loading) return <Skeleton count={2} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <Brain size={18} className="text-violet-600" />
        <h3 className="font-semibold text-slate-700">People Analytics — Correlações</h3>
        <span className="text-xs text-slate-400">Base: {data?.sampleSize ?? 0} colaboradores</span>
      </div>

      {data?.trainingVsPerformance && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-1">📚 Formação × Performance</h4>
          <p className="text-xs text-violet-700 bg-violet-50 rounded-lg px-3 py-2 mb-4">
            💡 {data.trainingVsPerformance.insight}
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Alto treino (3+ cursos)', value: data.trainingVsPerformance.highTrainingAvgPerf, color: 'bg-emerald-500' },
              { label: 'Baixo treino',            value: data.trainingVsPerformance.lowTrainingAvgPerf,  color: 'bg-red-400' },
            ].map(item => (
              <div key={item.label} className="text-center">
                <p className={`text-3xl font-black ${item.value >= 3.5 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {item.value?.toFixed(1) ?? '–'}
                </p>
                <p className="text-xs text-slate-500">{item.label}</p>
                <ProgressBar value={(item.value / 5) * 100} color={item.color} height="h-2" />
              </div>
            ))}
          </div>
          {data.trainingVsPerformance.lift > 0 && (
            <div className="mt-3 text-center">
              <span className="text-sm font-bold text-emerald-600">+{data.trainingVsPerformance.lift} pts lift</span>
              <span className="text-xs text-slate-400 ml-2">por alto consumo de formação</span>
            </div>
          )}
        </div>
      )}

      {data?.engagementVsPerformance && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-1">💬 Engagement × Performance</h4>
          <p className="text-xs text-violet-700 bg-violet-50 rounded-lg px-3 py-2 mb-4">
            💡 {data.engagementVsPerformance.insight}
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Alto engagement',  value: data.engagementVsPerformance.highEngAvgPerf, color: 'bg-emerald-500' },
              { label: 'Baixo engagement', value: data.engagementVsPerformance.lowEngAvgPerf,  color: 'bg-red-400' },
            ].map(item => (
              <div key={item.label} className="text-center">
                <p className={`text-3xl font-black ${item.value >= 3.5 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {item.value?.toFixed(1) ?? '–'}
                </p>
                <p className="text-xs text-slate-500">{item.label}</p>
                <ProgressBar value={(item.value / 5) * 100} color={item.color} height="h-2" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Talent Pipeline Panel ────────────────────────────────────────

function TalentPanel() {
  const { data, isLoading: loading } = useApiQuery<any>(
    queryKeys.dashboardRh.talent(), '/dashboard-rh/talent-pipeline', { staleTime: STALE_TIME.SEMI_STATIC },
  );
  if (loading) return <Skeleton count={3} />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={Target}  label="Posições Cobertas"     value={`${data?.coverageRate ?? 0}%`}   color="text-indigo-600" bg="bg-indigo-50" />
        <KPICard icon={Users}   label="Planos de Sucessão"    value={data?.successionPlans?.length ?? 0} />
        <KPICard icon={Star}    label="High Potentials"       value={data?.hiPoCount ?? 0}             color="text-amber-600" bg="bg-amber-50" />
        <KPICard icon={AlertTriangle} label="Posições em Risco" value={data?.positionsAtRisk?.length ?? 0} color="text-red-500" bg="bg-red-50" />
      </div>

      {/* Succession plans */}
      {(data?.successionPlans ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-3">Planos de Sucessão</h4>
          <div className="space-y-2">
            {(data.successionPlans as any[]).slice(0, 8).map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                <Avatar name={p.candidate?.fullName ?? '?'} url={p.candidate?.avatarUrl} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700">{p.candidate?.fullName}</p>
                  <p className="text-[10px] text-slate-400">→ {p.position?.name}</p>
                </div>
                {p.readiness && <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium">{p.readiness}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Positions at risk */}
      {(data?.positionsAtRisk ?? []).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h4 className="font-semibold text-red-700 mb-2">⚠️ Posições Sem Sucessor</h4>
          <div className="space-y-1">
            {data.positionsAtRisk.map((p: any, i: number) => (
              <p key={i} className="text-xs text-red-700">• {p.name} (Nível {p.level})</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

const PANELS: { id: Panel; label: string; icon: any }[] = [
  { id: 'overview',      label: 'Visão Geral',    icon: BarChart2 },
  { id: 'headcount',     label: 'Headcount',      icon: Users },
  { id: 'performance',   label: 'Performance',    icon: Star },
  { id: 'training',      label: 'Formação',       icon: BookOpen },
  { id: 'talent',        label: 'Talento',        icon: Target },
  { id: 'correlations',  label: 'People Analytics',icon: Brain },
];

export default function DashboardRhPage() {
  const [panel, setPanel] = useState<Panel>('overview');

  const PANEL_CONTENT: Record<Panel, JSX.Element> = {
    overview:     <OverviewPanel />,
    headcount:    <HeadcountPanel />,
    turnover:     <OverviewPanel />,
    performance:  <PerformancePanel />,
    training:     <TrainingPanel />,
    engagement:   <OverviewPanel />,
    talent:       <TalentPanel />,
    correlations: <CorrelationsPanel />,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-indigo-100 rounded-lg"><Users size={18} className="text-indigo-600" /></div>
              <h1 className="text-xl font-bold text-slate-800">Dashboard RH</h1>
              <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">People Analytics</span>
            </div>
            <p className="text-sm text-slate-400">Centro de comando · Headcount · Performance · Talento · Formação</p>
          </div>
          <button onClick={() => window.location.reload()} className="p-2 bg-white border border-slate-200 rounded-lg hover:border-slate-300">
            <RefreshCw size={15} className="text-slate-500" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
          {PANELS.map(p => {
            const Icon = p.icon;
            return (
              <button key={p.id} onClick={() => setPanel(p.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  panel === p.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <Icon size={15} />{p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {PANEL_CONTENT[panel]}
      </div>
    </div>
  );
}























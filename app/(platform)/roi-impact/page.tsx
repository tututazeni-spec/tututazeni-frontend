'use client';
// src/app/(dashboard)/roi-impact/page.tsx

import { useState } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Target, BookOpen,
  Users, Star, BarChart2, Brain, Zap, CheckCircle,
  AlertTriangle, ChevronRight, RefreshCw, ArrowUp, ArrowDown,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';

// ─── Helpers ─────────────────────────────────────────────────────

type Tab = 'executive' | 'learning' | 'retention' | 'performance' | 'simulator' | 'programs';

function fmt$(val: number): string {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
  return `$${val.toLocaleString()}`;
}

function ProgressBar({ value, color = 'bg-indigo-500', height = 'h-1.5' }: { value: number; color?: string; height?: string }) {
  return (
    <div className={`w-full ${height} bg-slate-100 rounded-full`}>
      <div className={`${height} ${color} rounded-full transition-all`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

function Skeleton({ count = 4 }: { count?: number }) {
  return <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">{[...Array(count)].map((_, i) => <div key={i} className="bg-slate-100 rounded-xl h-24" />)}</div>;
}

function KPICard({ icon: Icon, label, value, sub, color = 'text-indigo-600', bg = 'bg-indigo-50', status, trend }: {
  icon: any; label: string; value: string | number; sub?: string;
  color?: string; bg?: string; status?: string; trend?: number;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${bg}`}><Icon size={18} className={color} /></div>
        <div className="flex items-center gap-1">
          {status && <span className="text-xl">{status}</span>}
          {trend !== undefined && (
            <span className={`text-xs font-medium flex items-center gap-0.5 ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {trend >= 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}{Math.abs(trend)}%
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

// ─── Confidence Badge ─────────────────────────────────────────────

function ConfidenceBadge({ level }: { level?: string }) {
  const cfg: Record<string, { color: string; label: string }> = {
    HIGH:   { color: 'bg-emerald-100 text-emerald-700', label: 'Alta Confiança' },
    MEDIUM: { color: 'bg-amber-100 text-amber-700',     label: 'Média Confiança' },
    LOW:    { color: 'bg-red-100 text-red-600',         label: 'Baixa Confiança ⚠️' },
  };
  if (!level || !cfg[level]) return null;
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg[level].color}`}>{cfg[level].label}</span>;
}

// ─── Executive Tab ────────────────────────────────────────────────

function ExecutiveTab() {
  const { data, isLoading: loading } = useApiQuery<any>(
    queryKeys.roiImpact.executive(), '/roi-impact/executive', { staleTime: STALE_TIME.SEMI_STATIC },
  );
  if (loading) return <Skeleton />;

  const h = data?.headline ?? {};
  const d = data?.domains  ?? {};

  return (
    <div className="space-y-6">
      {/* ROI Hero */}
      <div className={`rounded-2xl p-6 ${h.overallRoi >= 100 ? 'bg-gradient-to-br from-emerald-600 to-teal-700' : h.overallRoi >= 0 ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-red-600 to-rose-700'} text-white`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/70 text-sm mb-1">ROI Total do Investimento em Pessoas</p>
            <p className="text-6xl font-black">{h.overallRoi ?? 0}%</p>
            <p className="text-white/80 text-sm mt-1">BCR: {h.totalCost > 0 ? (h.totalBenefit / h.totalCost).toFixed(2) : '–'} · Status: {h.status}</p>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-xs mb-1">Benefício Total</p>
            <p className="text-3xl font-bold">{fmt$(h.totalBenefit ?? 0)}</p>
            <p className="text-white/70 text-xs mt-1">Custo: {fmt$(h.totalCost ?? 0)}</p>
          </div>
        </div>
        {h.narrative && (
          <p className="text-white/90 text-sm bg-white/10 rounded-xl px-4 py-3 leading-relaxed">
            💡 {h.narrative}
          </p>
        )}
      </div>

      {/* Domain breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Aprendizagem',  icon: BookOpen,  value: `${d.learning?.roi ?? 0}%`, sub: `${fmt$(d.learning?.cost ?? 0)} investido · ${d.learning?.completions ?? 0} conclusões`, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Retenção',      icon: Users,     value: fmt$(d.retention?.savedValue ?? 0), sub: `Turnover: ${d.retention?.turnoverRate ?? 0}%`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Performance',   icon: Star,      value: d.performance?.lift ? `+${d.performance.lift}pts` : '–', sub: `Benefício produtivo: ${fmt$(d.performance?.benefit ?? 0)}`, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-xl border border-slate-100 p-4">
            <div className={`p-2 rounded-lg ${item.bg} w-fit mb-3`}><item.icon size={16} className={item.color} /></div>
            <p className="text-2xl font-bold text-slate-800">{item.value}</p>
            <p className="text-xs text-slate-500 mb-1">{item.label}</p>
            <p className="text-[10px] text-slate-400">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {(data?.alerts ?? []).length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((a: any, i: number) => (
            <div key={i} className={`border rounded-xl px-4 py-3 flex items-center gap-3 ${a.severity === 'HIGH' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
              <AlertTriangle size={14} className={a.severity === 'HIGH' ? 'text-red-600' : 'text-amber-600'} />
              <p className={`text-sm ${a.severity === 'HIGH' ? 'text-red-700' : 'text-amber-700'}`}>{a.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Top insights */}
      {(data?.topInsights ?? []).length > 0 && (
        <div className="bg-violet-50 border border-violet-100 rounded-xl p-5">
          <h4 className="font-semibold text-violet-700 mb-3 flex items-center gap-2"><Brain size={14} />Insights Automáticos</h4>
          {data.topInsights.slice(0, 4).map((ins: string, i: number) => (
            <p key={i} className="text-xs text-violet-800 mb-1">{ins}</p>
          ))}
          {data.confidence && <div className="mt-2"><ConfidenceBadge level={data.confidence} /></div>}
        </div>
      )}
    </div>
  );
}

// ─── Learning Tab ─────────────────────────────────────────────────

function LearningTab() {
  const { data, isLoading: loading } = useApiQuery<any>(
    queryKeys.roiImpact.learning(), '/roi-impact/impact/learning', { staleTime: STALE_TIME.SEMI_STATIC },
  );
  if (loading) return <Skeleton />;

  const v = data?.volume ?? {}, f = data?.financial ?? {};

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={BookOpen}  label="Conclusões"           value={v.completed ?? 0}          color="text-teal-600"    bg="bg-teal-50" />
        <KPICard icon={Target}    label="Taxa de Conclusão"    value={`${v.completionRate ?? 0}%`} />
        <KPICard icon={DollarSign}label="ROI Estimado"         value={`${f.roi ?? 0}%`}           color={f.roi >= 0 ? 'text-emerald-600' : 'text-red-500'} bg={f.roi >= 0 ? 'bg-emerald-50' : 'bg-red-50'} />
        <KPICard icon={Zap}       label="Horas de Formação"    value={`${f.hoursEstimated ?? 0}h`} color="text-violet-600" bg="bg-violet-50" />
      </div>

      {/* Financial */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <h4 className="font-semibold text-slate-700 mb-4">Análise Financeira</h4>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Custo Total',    value: fmt$(f.costEstimated ?? 0),    color: 'text-red-600' },
            { label: 'Benefício Est.', value: fmt$(f.benefitEstimated ?? 0), color: 'text-emerald-600' },
            { label: 'Benefício Líq.', value: fmt$((f.benefitEstimated ?? 0) - (f.costEstimated ?? 0)), color: (f.benefitEstimated - f.costEstimated) >= 0 ? 'text-emerald-600' : 'text-red-500' },
          ].map(item => (
            <div key={item.label} className="text-center p-3 rounded-xl bg-slate-50">
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top courses */}
      {(data?.topCourses ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-3">Cursos com Mais Impacto</h4>
          <div className="space-y-2">
            {data.topCourses.map((c: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-slate-300 font-bold w-4">#{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{c.course?.title}</p>
                  <p className="text-[10px] text-slate-400">{c.course?.category}</p>
                </div>
                <span className="text-xs font-bold text-teal-600">{c.completions} conclusões</span>
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

// ─── Retention Tab ────────────────────────────────────────────────

function RetentionTab() {
  const { data, isLoading: loading } = useApiQuery<any>(
    queryKeys.roiImpact.retention(), '/roi-impact/impact/retention', { staleTime: STALE_TIME.SEMI_STATIC },
  );
  if (loading) return <Skeleton />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={Users}      label="Activos"          value={data?.headcount?.active ?? 0} />
        <KPICard icon={TrendingDown} label="Turnover"       value={`${data?.turnoverRate ?? 0}%`} trend={data?.turnoverTrend} color="text-red-500" bg="bg-red-50" />
        <KPICard icon={CheckCircle} label="Retenção"        value={`${data?.retentionRate ?? 0}%`} color="text-emerald-600" bg="bg-emerald-50" />
        <KPICard icon={DollarSign}  label="Economia Gerada" value={fmt$(data?.savedValue ?? 0)} sub={`${data?.saved ?? 0} saídas evitadas`} color="text-teal-600" bg="bg-teal-50" />
      </div>

      {/* Turnover comparison */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <h4 className="font-semibold text-slate-700 mb-4">Evolução do Turnover</h4>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Período Anterior', value: data?.prevTurnoverRate ?? 0 },
            { label: 'Período Actual',   value: data?.turnoverRate ?? 0 },
          ].map(item => (
            <div key={item.label} className="text-center p-4 rounded-xl bg-slate-50">
              <p className={`text-3xl font-bold ${item.value <= 10 ? 'text-emerald-600' : item.value <= 15 ? 'text-amber-600' : 'text-red-500'}`}>
                {item.value}%
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
        {data?.turnoverTrend !== undefined && (
          <div className="mt-3 text-center">
            <span className={`text-sm font-bold ${data.turnoverTrend < 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {data.turnoverTrend < 0 ? '↓' : '↑'} {Math.abs(data.turnoverTrend).toFixed(1)}pts
            </span>
            <span className="text-xs text-slate-400 ml-2">vs. período anterior</span>
          </div>
        )}
      </div>

      {(data?.insights ?? []).length > 0 && (
        <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
          {data.insights.map((ins: string, i: number) => <p key={i} className="text-xs text-violet-800">{ins}</p>)}
        </div>
      )}
    </div>
  );
}

// ─── Simulator Tab ────────────────────────────────────────────────

function SimulatorTab() {
  const [targetRate, setTargetRate]   = useState(80);
  const [result, setResult]           = useState<any | null>(null);
  const [loading, setLoading]         = useState(false);

  const run = async () => {
    setLoading(true);
    apiClient.post<any>('/roi-impact/simulate', { targetCompletionRate: targetRate })
      .then(setResult).finally(() => setLoading(false));
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Brain size={16} className="text-violet-500" />
          Simulador What-If — Impacto de Taxa de Conclusão
        </h4>
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm text-slate-600 shrink-0">Meta de Conclusão:</label>
          <input type="range" min={10} max={100} value={targetRate} onChange={e => setTargetRate(+e.target.value)}
            className="flex-1 accent-indigo-600" />
          <span className="text-xl font-bold text-indigo-600 w-14 text-right">{targetRate}%</span>
        </div>
        <button onClick={run} disabled={loading}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-60">
          {loading ? 'A calcular…' : 'Calcular Impacto'}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          {/* Narrative */}
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-5">
            <p className="text-sm text-indigo-800 leading-relaxed">💡 {result.narrative}</p>
          </div>

          {/* Comparison */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Estado Actual', data: result.current, color: 'border-slate-200' },
              { label: `Com ${targetRate}% conclusão`, data: result.projected, color: 'border-indigo-300' },
            ].map(item => (
              <div key={item.label} className={`bg-white rounded-xl border-2 ${item.color} p-4`}>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{item.label}</p>
                {[
                  { label: 'Taxa Conclusão', value: `${item.data.completionRate ?? 0}%` },
                  { label: 'Custo',          value: fmt$(item.data.cost ?? 0) },
                  { label: 'Benefício',      value: fmt$(item.data.benefit ?? 0) },
                  { label: 'ROI',            value: `${item.data.roi ?? 0}%` },
                ].map(m => (
                  <div key={m.label} className="flex justify-between text-xs py-0.5">
                    <span className="text-slate-500">{m.label}</span>
                    <span className="font-semibold text-slate-700">{m.value}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Delta */}
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Impacto Projectado</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'ROI Lift',        value: `${result.delta.roiLift >= 0 ? '+' : ''}${result.delta.roiLift}pts`, color: result.delta.roiLift >= 0 ? 'text-emerald-600' : 'text-red-500' },
                { label: 'Benefício Extra', value: fmt$(result.delta.benefitDelta), color: result.delta.benefitDelta >= 0 ? 'text-emerald-600' : 'text-red-500' },
                { label: 'Custo Delta',     value: fmt$(result.delta.costDelta), color: 'text-slate-700' },
              ].map(d => (
                <div key={d.label} className="text-center p-2 rounded-lg bg-slate-50">
                  <p className={`text-xl font-bold ${d.color}`}>{d.value}</p>
                  <p className="text-[10px] text-slate-400">{d.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Programs Tab ─────────────────────────────────────────────────

function ProgramsTab() {
  const { data, isLoading: loading } = useApiQuery<any>(
    queryKeys.roiImpact.programs(), '/roi-impact/programs', { staleTime: STALE_TIME.SEMI_STATIC },
  );
  if (loading) return <Skeleton count={3} />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 p-4 text-center">
          <p className="text-2xl font-bold text-slate-800">{data?.total ?? 0}</p>
          <p className="text-xs text-slate-400">Programas</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 text-center">
          <p className={`text-2xl font-bold ${(data?.avgRoi ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{data?.avgRoi ?? 0}%</p>
          <p className="text-xs text-slate-400">ROI Médio</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">{data?.topByRoi?.length ?? 0}</p>
          <p className="text-xs text-slate-400">Acima de 100% ROI</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h4 className="font-semibold text-slate-700">Ranking de Programas por ROI</h4>
        </div>
        <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
          {(data?.programs ?? []).map((p: any, i: number) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
              <span className="text-xs text-slate-300 font-bold w-5 text-right">#{i+1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{p.course?.title ?? `Curso ${i+1}`}</p>
                <p className="text-[10px] text-slate-400">{p.course?.category} · {p.completions} conclusões</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold ${p.roi >= 100 ? 'text-emerald-600' : p.roi >= 0 ? 'text-amber-600' : 'text-red-500'}`}>{p.roi}%</p>
                <p className="text-[10px] text-slate-400">BCR: {p.bcr}</p>
              </div>
            </div>
          ))}
          {(data?.programs?.length ?? 0) === 0 && (
            <div className="py-12 text-center text-slate-400">
              <BarChart2 size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sem dados de programas para o período</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'executive',   label: 'Executivo',   icon: DollarSign },
  { id: 'learning',    label: 'Aprendizagem',icon: BookOpen },
  { id: 'retention',   label: 'Retenção',    icon: Users },
  { id: 'performance', label: 'Performance', icon: Star },
  { id: 'simulator',   label: 'Simulador',   icon: Brain },
  { id: 'programs',    label: 'Programas',   icon: BarChart2 },
];

export default function RoiImpactPage() {
  const [tab, setTab] = useState<Tab>('executive');

  const PerformanceTab = () => {
    const { data, isLoading: loading } = useApiQuery<any>(
      queryKeys.roiImpact.performance(), '/roi-impact/impact/performance', { staleTime: STALE_TIME.SEMI_STATIC },
    );
    if (loading) return <Skeleton />;
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard icon={Star}       label="Score Antes"     value={data?.before?.toFixed(1) ?? '–'} />
          <KPICard icon={TrendingUp} label="Score Depois"    value={data?.after?.toFixed(1) ?? '–'}  />
          <KPICard icon={Zap}        label="Lift"            value={data?.lift !== null ? `${data.lift >= 0 ? '+' : ''}${data.lift}pts` : '–'} color={data?.lift >= 0 ? 'text-emerald-600' : 'text-red-500'} bg={data?.lift >= 0 ? 'bg-emerald-50' : 'bg-red-50'} />
          <KPICard icon={DollarSign} label="Benefício Est."  value={fmt$(data?.monetised?.productivityBenefit ?? 0)} color="text-teal-600" bg="bg-teal-50" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <KPICard icon={CheckCircle} label="Top Performers" value={data?.highPerformers ?? 0} color="text-emerald-600" bg="bg-emerald-50" />
          <KPICard icon={AlertTriangle} label="Em Risco"     value={data?.atRisk ?? 0}         color="text-red-500" bg="bg-red-50" />
        </div>
        {(data?.insights ?? []).length > 0 && (
          <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
            {data.insights.map((ins: string, i: number) => <p key={i} className="text-xs text-violet-800">{ins}</p>)}
          </div>
        )}
        <div className="text-center"><ConfidenceBadge level={data?.confidence} /></div>
      </div>
    );
  };

  const PANELS: Record<Tab, JSX.Element> = {
    executive:   <ExecutiveTab />,
    learning:    <LearningTab />,
    retention:   <RetentionTab />,
    performance: <PerformanceTab />,
    simulator:   <SimulatorTab />,
    programs:    <ProgramsTab />,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-emerald-100 rounded-lg"><DollarSign size={18} className="text-emerald-600" /></div>
              <h1 className="text-xl font-bold text-slate-800">ROI & Impact</h1>
            </div>
            <p className="text-sm text-slate-400">Impacto financeiro · Kirkpatrick L1-L5 · Simulações · Programas</p>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-slate-200 px-6">
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t.id ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <Icon size={15} />{t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {PANELS[tab]}
      </div>
    </div>
  );
}


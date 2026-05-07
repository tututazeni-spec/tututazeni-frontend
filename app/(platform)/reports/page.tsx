'use client';
// src/app/(dashboard)/reports/page.tsx

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart2, FileText, Users, BookOpen, Star, Shield,
  Activity, Brain, TrendingUp, TrendingDown, Download,
  Search, Plus, Clock, CheckCircle, AlertTriangle,
  ChevronRight, RefreshCw, Filter, Bookmark, Calendar,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────

type Tab = 'hub' | 'hr' | 'learning' | 'performance' | 'talent' | 'engagement' | 'compliance' | 'insights';

interface Template {
  id: string; name: string; category: string; reportKey: string; description: string;
}

// ─── Helpers ─────────────────────────────────────────────────────

const BASE = '/api';
async function api(path: string, opts?: RequestInit) {
  const r = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` },
    ...opts,
  });
  if (!r.ok) throw new Error();
  return r.json();
}

function defaultRange(months = 1) {
  const to   = new Date().toISOString().split('T')[0];
  const from = new Date(Date.now() - months * 30 * 86400000).toISOString().split('T')[0];
  return { from, to };
}

function Skeleton({ count = 3 }: { count?: number }) {
  return <div className="space-y-3 animate-pulse">{[...Array(count)].map((_, i) => <div key={i} className="bg-slate-100 rounded-xl h-20" />)}</div>;
}

function ProgressBar({ value, color = 'bg-indigo-500', height = 'h-1.5' }: { value: number; color?: string; height?: string }) {
  return (
    <div className={`w-full ${height} bg-slate-100 rounded-full`}>
      <div className={`${height} ${color} rounded-full transition-all`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

function StatusBadge({ value, thresholds = [60, 80] }: { value: number; thresholds?: [number, number] }) {
  const color = value >= thresholds[1] ? 'bg-emerald-100 text-emerald-700' :
                value >= thresholds[0] ? 'bg-amber-100 text-amber-700'   : 'bg-red-100 text-red-600';
  return <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${color}`}>{value}%</span>;
}

// ─── Category config ─────────────────────────────────────────────

const CAT_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  HR:          { label: 'RH & Pessoas',    icon: Users,     color: 'text-violet-600', bg: 'bg-violet-50' },
  LEARNING:    { label: 'Aprendizagem',    icon: BookOpen,  color: 'text-blue-600',   bg: 'bg-blue-50' },
  PERFORMANCE: { label: 'Performance',     icon: Star,      color: 'text-amber-600',  bg: 'bg-amber-50' },
  TALENT:      { label: 'Talento',         icon: TrendingUp,color: 'text-emerald-600',bg: 'bg-emerald-50' },
  ENGAGEMENT:  { label: 'Engagement',      icon: Activity,  color: 'text-pink-600',   bg: 'bg-pink-50' },
  COMPLIANCE:  { label: 'Compliance',      icon: Shield,    color: 'text-red-600',    bg: 'bg-red-50' },
  OPERATIONAL: { label: 'Operacional',     icon: BarChart2, color: 'text-slate-600',  bg: 'bg-slate-50' },
  FINANCIAL:   { label: 'Financeiro',      icon: BarChart2, color: 'text-teal-600',   bg: 'bg-teal-50' },
};

// ─── Template Card ────────────────────────────────────────────────

function TemplateCard({ tpl, onRun }: { tpl: Template; onRun: (t: Template) => void }) {
  const cat  = CAT_CONFIG[tpl.category] ?? CAT_CONFIG.HR;
  const Icon = cat.icon;
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-all cursor-pointer"
      onClick={() => onRun(tpl)}>
      <div className={`p-2 rounded-lg ${cat.bg} w-fit mb-3`}><Icon size={16} className={cat.color} /></div>
      <h4 className="text-sm font-semibold text-slate-800 mb-1">{tpl.name}</h4>
      <p className="text-xs text-slate-400 mb-3">{tpl.description}</p>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-medium ${cat.color}`}>{cat.label}</span>
        <span className="text-[10px] text-indigo-600 font-semibold hover:underline">Executar →</span>
      </div>
    </div>
  );
}

// ─── Report Hub (Home) ────────────────────────────────────────────

function ReportHub({ onRun }: { onRun: (t: Template) => void }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('');
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    api('/reports/templates').then(setTemplates).finally(() => setLoading(false));
  }, []);

  const filtered = templates.filter(t =>
    (!category || t.category === category) &&
    (!search || t.name.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="space-y-6">
      {/* Search + filter */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar templates..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none">
          <option value="">Todas as categorias</option>
          {Object.entries(CAT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span className="text-xs text-slate-400 self-center">{filtered.length} templates</span>
      </div>

      {loading ? <Skeleton count={6} /> : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(t => <TemplateCard key={t.id} tpl={t} onRun={onRun} />)}
        </div>
      )}
    </div>
  );
}

// ─── Report Viewer ────────────────────────────────────────────────

function ReportViewer({ template, onBack }: { template: Template; onBack: () => void }) {
  const [data, setData]       = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom]       = useState(defaultRange(1).from);
  const [to, setTo]           = useState(defaultRange(1).to);
  const [deptId, setDeptId]   = useState('');

  const run = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams({ from, to, ...(deptId ? { departmentId: deptId } : {}) });
    const path = {
      headcount:   `/reports/hr/headcount`,
      turnover:    `/reports/hr/turnover`,
      training:    `/reports/learning/training`,
      'skill-gap': `/reports/learning/skill-gap`,
      performance: `/reports/performance`,
      talent:      `/reports/talent`,
      engagement:  `/reports/engagement`,
      compliance:  `/reports/compliance`,
      usage:       `/reports/operational/usage`,
    }[template.reportKey] ?? `/reports/learning/training`;
    api(`${path}?${qs}`).then(setData).finally(() => setLoading(false));
  }, [template.reportKey, from, to, deptId]);

  useEffect(() => { run(); }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 flex flex-wrap items-center gap-3">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-1">
          ← Voltar
        </button>
        <h3 className="font-semibold text-slate-700 flex-1">{template.name}</h3>
        {/* Filters */}
        <input type="date" value={from} onChange={e => setFrom(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none" />
        <span className="text-slate-300">→</span>
        <input type="date" value={to} onChange={e => setTo(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none" />
        <button onClick={run}
          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700">
          <RefreshCw size={12} />Executar
        </button>
        <a href={`/api/reports/export/${template.reportKey}-csv?from=${from}&to=${to}`}
          className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 text-slate-600 text-xs rounded-lg hover:bg-slate-50">
          <Download size={12} />CSV
        </a>
      </div>

      {loading ? <Skeleton count={4} /> : data ? (
        <ReportOutput data={data} reportKey={template.reportKey} />
      ) : (
        <div className="py-16 text-center text-slate-400">
          <BarChart2 size={40} className="mx-auto mb-3 opacity-30" />
          <p>Sem dados para o período seleccionado</p>
        </div>
      )}
    </div>
  );
}

// ─── Generic Report Output ────────────────────────────────────────

function ReportOutput({ data, reportKey }: { data: any; reportKey: string }) {
  const summary = data.summary ?? {};

  return (
    <div className="space-y-4">
      {/* Insights */}
      {(data.insights ?? []).length > 0 && (
        <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-violet-700 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Brain size={12} />Insights
          </h4>
          {data.insights.map((ins: string, i: number) => (
            <p key={i} className="text-xs text-violet-800 mb-1">{ins}</p>
          ))}
        </div>
      )}

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(summary).slice(0, 8).map(([k, v]) => {
          if (typeof v === 'object') return null;
          const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
          const isRate = k.toLowerCase().includes('rate') || k.toLowerCase().includes('pct') || k.toLowerCase().includes('ratio');
          return (
            <div key={k} className="bg-white rounded-xl border border-slate-100 p-3">
              <p className="text-xl font-bold text-slate-800">{typeof v === 'number' ? (isRate ? `${v}%` : v) : v as any}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
            </div>
          );
        })}
      </div>

      {/* By Department */}
      {(data.byDepartment ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-4">Por Departamento</h4>
          <div className="space-y-2">
            {(data.byDepartment as any[]).slice(0, 8).map((d: any, i: number) => {
              const val = d.count ?? d.avgScore ?? d.completions ?? 0;
              const max = Math.max(...(data.byDepartment as any[]).map((x: any) => x.count ?? x.avgScore ?? x.completions ?? 0));
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-slate-600 truncate">{d.department ?? d.name}</span>
                    <span className="font-semibold text-slate-700">{typeof val === 'number' ? (val > 10 ? val : val.toFixed(1)) : val}</span>
                  </div>
                  <ProgressBar value={max > 0 ? (val / max) * 100 : 0} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top list */}
      {(data.topPerformers ?? data.topCourses ?? data.skills ?? data.topContent ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-4">
            {data.topPerformers ? 'Top Performers' : data.topCourses ? 'Top Cursos' : data.skills ? 'Gaps Críticos' : 'Top Conteúdos'}
          </h4>
          <div className="space-y-2">
            {(data.topPerformers ?? data.topCourses ?? (data.skills ?? []).slice(0, 8) ?? data.topContent ?? []).map((item: any, i: number) => {
              const name   = item.user?.fullName ?? item.course?.title ?? item.competency?.name ?? item.content?.title ?? item.name ?? `Item ${i+1}`;
              const val    = item.score ?? item.avgScore ?? item.completionRate ?? item.views ?? item.avgGap ?? 0;
              const sub    = item.user?.department?.name ?? item.course?.category ?? item.competency?.type ?? '';
              const isGap  = data.skills;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-slate-300 font-bold w-5 text-right">#{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{name}</p>
                    {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
                  </div>
                  <span className={`text-sm font-bold shrink-0 ${
                    isGap ? (val >= 2 ? 'text-red-500' : 'text-amber-500') :
                    (typeof val === 'number' && val >= 70) ? 'text-emerald-600' : 'text-slate-700'
                  }`}>
                    {typeof val === 'number' ? (val > 10 ? val : val.toFixed(1)) : val}
                    {isGap ? ' gap' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Insights Tab ─────────────────────────────────────────────────

function InsightsTab() {
  const [data, setData]     = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const range = defaultRange(1);
    api(`/reports/insights?from=${range.from}&to=${range.to}`).then(setData).finally(() => setLoading(false));
  }, []);

  const SEV_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
    HIGH:   { color: 'text-red-700',    bg: 'bg-red-50 border-red-200',    icon: AlertTriangle },
    MEDIUM: { color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200',icon: Clock },
    LOW:    { color: 'text-teal-700',   bg: 'bg-teal-50 border-teal-100',  icon: CheckCircle },
  };

  if (loading) return <Skeleton count={4} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
          <Brain size={16} className="text-violet-500" />
          Insights Inteligentes
        </h3>
        <span className="text-xs bg-violet-100 text-violet-700 px-3 py-1 rounded-full font-medium">
          {data?.count ?? 0} insights identificados
        </span>
      </div>

      {(data?.insights ?? []).length === 0 && (
        <div className="py-16 text-center bg-emerald-50 rounded-xl border border-emerald-100">
          <CheckCircle size={36} className="mx-auto mb-2 text-emerald-500" />
          <p className="font-medium text-emerald-700">Organização saudável!</p>
          <p className="text-sm text-emerald-600">Sem alertas críticos identificados</p>
        </div>
      )}

      {(data?.insights ?? []).map((ins: any, i: number) => {
        const conf = SEV_CONFIG[ins.severity] ?? SEV_CONFIG.LOW;
        const Icon = conf.icon;
        return (
          <div key={i} className={`border rounded-xl p-4 ${conf.bg}`}>
            <div className="flex items-start gap-3">
              <Icon size={16} className={`${conf.color} shrink-0 mt-0.5`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold ${conf.color} uppercase tracking-wide`}>{ins.type}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${conf.color} ${conf.bg} border`}>
                    {ins.severity}
                  </span>
                </div>
                <p className={`text-sm font-medium ${conf.color} mb-1`}>{ins.message}</p>
                {ins.recommendation && (
                  <p className="text-xs text-slate-600 bg-white/60 rounded-lg px-3 py-1.5 border border-white">
                    💡 <span className="font-medium">Recomendação:</span> {ins.recommendation}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'hub',         label: 'Report Hub',   icon: BarChart2 },
  { id: 'insights',    label: 'Insights IA',  icon: Brain },
];

export default function ReportsPage() {
  const [tab, setTab]             = useState<Tab>('hub');
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);

  const handleRun = (t: Template) => { setActiveTemplate(t); };
  const handleBack = () => setActiveTemplate(null);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <BarChart2 size={18} className="text-indigo-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">Reports</h1>
            </div>
            <p className="text-sm text-slate-400">
              Análises · Templates · Insights IA · Exportação
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
            <Plus size={14} />
            Criar Relatório
          </button>
        </div>
      </div>

      <div className="bg-white border-b border-slate-200 px-6">
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => { setTab(t.id); setActiveTemplate(null); }}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap
                  border-b-2 transition-colors ${tab === t.id && !activeTemplate
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <Icon size={15} />{t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTemplate
          ? <ReportViewer template={activeTemplate} onBack={handleBack} />
          : tab === 'hub'
          ? <ReportHub onRun={handleRun} />
          : <InsightsTab />
        }
      </div>
    </div>
  );
}


















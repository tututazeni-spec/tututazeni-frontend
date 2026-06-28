'use client';
// src/app/(dashboard)/talent-development/page.tsx

import { useState } from 'react';
import {
  Users, TrendingUp, Target, BookOpen, Award, AlertTriangle,
  ChevronRight, Plus, Filter, Search, Star, Zap, Brain,
  BarChart2, CheckCircle, Clock, ArrowUp, X, ChevronDown,
  Layers, UserCheck, Activity, RefreshCw,
} from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApiQuery';
import { queryKeys } from '../../../lib/queryKeys';
import { STALE_TIME } from '../../../lib/queryClient';
import Image from 'next/image';

// ─── Types ────────────────────────────────────────────────────────

type Tab   = 'pool' | 'plans' | 'skill-gaps' | 'mentoring' | 'analytics';
type Tier  = 'HIGH' | 'MEDIUM' | 'DEVELOPING';

interface TalentUser {
  user: { id: number; fullName: string; email: string; avatarUrl?: string;
    position?: { name: string }; department?: { name: string } };
  scores: { talent: number; competency: number; performance: number; potential: number; engagement: number };
  tier: Tier;
  activePlan: { id: number; name: string; overallProgress: number } | null;
  nineBox: { performanceAxis: number; potentialAxis: number } | null;
}

interface Plan {
  id: number; name: string; status: string; priority: string; overallProgress: number;
  user: { fullName: string; avatarUrl?: string; department?: { name: string } };
  manager?: { fullName: string };
  stats: { total: number; completed: number; overdue: number };
  startDate?: string; endDate?: string;
}

interface HealthScore {
  healthScore: number; grade: string; total: number;
  metrics: { pdpCoverage: number; skillsAssessment: number; reviewedRate: number; mentoringRate: number; hiPoRatio: number };
}

interface DashboardData {
  kpis: { totalUsers: number; usersWithActivePlan: number; pdpCoverage: number;
    totalPlans: number; completedActions: number; overdueActions: number;
    actionCompletion: number; activeMentorings: number };
  plansByStatus: { status: string; count: number }[];
  topTrainingNeeds: { skill: { name: string }; avgGap: number; count: number }[];
  recentCompletions: { name: string; user: { fullName: string } }[];
}

// ─── Helpers ──────────────────────────────────────────────────────

const TIER_COLOR: Record<Tier, string> = {
  HIGH:       'bg-emerald-100 text-emerald-700',
  MEDIUM:     'bg-amber-100 text-amber-700',
  DEVELOPING: 'bg-slate-100 text-slate-600',
};

const TIER_LABEL: Record<Tier, string> = {
  HIGH: 'Alto Potencial', MEDIUM: 'Médio', DEVELOPING: 'Em Desenvolvimento',
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT:     'bg-slate-100 text-slate-600',
  ACTIVE:    'bg-blue-100 text-blue-700',
  PAUSED:    'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-600',
};

const PRIORITY_COLOR: Record<string, string> = {
  LOW: 'text-slate-400', MEDIUM: 'text-amber-500',
  HIGH: 'text-orange-500', CRITICAL: 'text-red-600',
};

function Avatar({ name, url, size = 8 }: { name: string; url?: string; size?: number }) {
  const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  return url
    ? <div className={`w-${size} h-${size} rounded-full overflow-hidden relative`}><Image src={url} alt={name} fill className="object-cover" /></div>
    : (
      <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600
        flex items-center justify-center text-white font-semibold text-xs`}>
        {initials}
      </div>
    );
}

function ProgressBar({ value, color = 'bg-indigo-500', height = 'h-1.5' }: {
  value: number; color?: string; height?: string;
}) {
  return (
    <div className={`w-full ${height} bg-slate-100 rounded-full overflow-hidden`}>
      <div className={`${height} ${color} rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 4 ? 'text-emerald-600' : score >= 2.5 ? 'text-amber-600' : 'text-slate-500';
  return <span className={`font-bold text-sm ${color}`}>{score.toFixed(1)}</span>;
}

function KpiCard({ icon: Icon, label, value, sub, color = 'text-indigo-600', trend }: {
  icon: any; label: string; value: string | number; sub?: string;
  color?: string; trend?: number;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex items-start gap-4">
      <div className={`p-3 rounded-xl bg-slate-50 ${color}`}><Icon size={20} /></div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      {trend !== undefined && (
        <span className={`text-xs font-medium flex items-center gap-0.5 ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          <ArrowUp size={12} className={trend < 0 ? 'rotate-180' : ''} />
          {Math.abs(trend)}%
        </span>
      )}
    </div>
  );
}

// ─── Nine Box Matrix ─────────────────────────────────────────────

function NineBoxMatrix({ matrix }: { matrix: any[] }) {
  const BOX_COLORS: Record<string, string> = {
    '3_3': 'bg-emerald-50 border-emerald-200', '3_2': 'bg-teal-50 border-teal-200',
    '3_1': 'bg-sky-50 border-sky-200',         '2_3': 'bg-violet-50 border-violet-200',
    '2_2': 'bg-slate-50 border-slate-200',     '2_1': 'bg-amber-50 border-amber-200',
    '1_3': 'bg-blue-50 border-blue-200',       '1_2': 'bg-orange-50 border-orange-200',
    '1_1': 'bg-red-50 border-red-200',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-700">Matriz 9-Box</h3>
        <span className="text-xs text-slate-400">Performance × Competência</span>
      </div>

      {/* Y label */}
      <div className="flex gap-3">
        <div className="flex flex-col items-center justify-center w-6">
          <span className="text-[10px] text-slate-400 writing-mode-vertical -rotate-90 whitespace-nowrap">
            ← Performance →
          </span>
        </div>

        <div className="flex-1">
          <div className="grid grid-cols-3 gap-2">
            {['3','2','1'].flatMap(y =>
              ['1','2','3'].map(x => {
                const key  = `${y}_${x}`;
                const cell = matrix.find(m => m.box === key);
                const labelShort = cell?.label.split(' — ')[0] ?? '';
                return (
                  <div key={key}
                    className={`border rounded-lg p-3 min-h-[80px] ${BOX_COLORS[key] ?? 'bg-slate-50'}`}>
                    <p className="text-[10px] font-semibold text-slate-600 leading-tight">{labelShort}</p>
                    <p className="text-2xl font-bold text-slate-700 mt-1">{cell?.count ?? 0}</p>
                  </div>
                );
              })
            )}
          </div>

          {/* X label */}
          <p className="text-center text-[10px] text-slate-400 mt-2">← Competência →</p>
        </div>
      </div>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'pool',       label: 'Pool de Talento',   icon: Users },
  { id: 'plans',      label: 'Planos (PDI)',       icon: Target },
  { id: 'skill-gaps', label: 'Skill Gaps',         icon: Brain },
  { id: 'mentoring',  label: 'Mentoria',           icon: UserCheck },
  { id: 'analytics',  label: 'Analytics',          icon: BarChart2 },
];

// ─── Pool Tab ─────────────────────────────────────────────────────

function PoolTab() {
  const [search, setSearch]     = useState('');
  const [tier, setTier]         = useState<string>('');

  const poolParams = { limit: 100, ...(tier ? { tier } : {}) };
  const poolQuery = useApiQuery<{ data: TalentUser[]; meta: any }>(
    queryKeys.talentDevelopment.pool(tier), '/talent/pool',
    { params: poolParams, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const matrixQuery = useApiQuery<any>(
    queryKeys.talentDevelopment.matrix(), '/talent/matrix',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const data   = poolQuery.data ?? null;
  const matrix = matrixQuery.data ?? null;

  const filtered = data?.data.filter(u =>
    u.user.fullName.toLowerCase().includes(search.toLowerCase()),
  ) ?? [];

  if (poolQuery.isLoading || matrixQuery.isLoading) return <Skeleton />;

  return (
    <div className="space-y-6">
      {/* Tier summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Alto Potencial', key: 'high',       color: 'bg-emerald-500' },
          { label: 'Médio',          key: 'medium',     color: 'bg-amber-500' },
          { label: 'Em Desenvolvimento', key: 'developing', color: 'bg-slate-400' },
        ].map(t => (
          <button key={t.key}
            onClick={() => setTier(tier === t.key.toUpperCase() ? '' : t.key.toUpperCase())}
            className={`bg-white rounded-xl p-4 border-2 transition-all ${
              tier === t.key.toUpperCase() ? 'border-indigo-500' : 'border-slate-100'}`}>
            <div className={`w-3 h-3 rounded-full ${t.color} mb-2`} />
            <p className="text-xl font-bold text-slate-800">
              {(data?.meta.tierCounts as any)?.[t.key] ?? 0}
            </p>
            <p className="text-xs text-slate-500">{t.label}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Table */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="p-4 border-b border-slate-100 flex items-center gap-3">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Pesquisar colaborador..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" />
            </div>
            <span className="text-xs text-slate-400">{filtered.length} colaboradores</span>
          </div>

          <div className="divide-y divide-slate-50 max-h-[520px] overflow-y-auto">
            {filtered.map(t => (
              <div key={t.user.id} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                <Avatar name={t.user.fullName} url={t.user.avatarUrl} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{t.user.fullName}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {t.user.position?.name} · {t.user.department?.name}
                  </p>
                  {t.activePlan && (
                    <div className="mt-1 flex items-center gap-2">
                      <ProgressBar value={t.activePlan.overallProgress} height="h-1" />
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {t.activePlan.overallProgress}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <ScoreBadge score={t.scores.talent} />
                  <div className="mt-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${TIER_COLOR[t.tier]}`}>
                      {t.tier === 'HIGH' ? 'HiPo' : t.tier === 'MEDIUM' ? 'Médio' : 'Dev.'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 9-Box */}
        {matrix && <NineBoxMatrix matrix={matrix.matrix} />}
      </div>
    </div>
  );
}

// ─── Plans Tab ────────────────────────────────────────────────────

function PlansTab() {
  const [status, setStatus]   = useState('');
  const [search, setSearch]   = useState('');

  const params = { limit: 40, isTemplate: false, ...(status ? { status } : {}) };
  const { data, isLoading } = useApiQuery<{ data: Plan[]; meta: any }>(
    queryKeys.talentDevelopment.plans(status), '/talent/plans',
    { params, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const loading = isLoading;

  const filtered = data?.data.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.user.fullName.toLowerCase().includes(search.toLowerCase()),
  ) ?? [];

  const statuses = ['DRAFT','ACTIVE','PAUSED','COMPLETED','CANCELLED'];

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar plano ou colaborador..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg
              focus:outline-none focus:border-indigo-400" />
        </div>
        <div className="flex gap-1">
          {['', ...statuses].map(s => (
            <button key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                status === s
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300'
              }`}>
              {s || 'Todos'}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400 ml-auto">{data?.meta.total ?? 0} planos</span>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-5 gap-3">
        {statuses.map(s => {
          const count = data?.data.filter(p => p.status === s).length ?? 0;
          return (
            <div key={s} className="bg-white rounded-lg p-3 border border-slate-100 text-center">
              <p className="text-xl font-bold text-slate-700">{count}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLOR[s]}`}>{s}</span>
            </div>
          );
        })}
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(plan => (
          <div key={plan.id} className="bg-white rounded-xl border border-slate-100 p-4
            hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar name={plan.user.fullName} url={plan.user.avatarUrl} size={8} />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{plan.user.fullName}</p>
                  <p className="text-[10px] text-slate-400">{plan.user.department?.name}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[plan.status]}`}>
                  {plan.status}
                </span>
                <span className={`text-[10px] font-semibold ${PRIORITY_COLOR[plan.priority]}`}>
                  {plan.priority}
                </span>
              </div>
            </div>

            <h4 className="text-sm font-semibold text-slate-800 mb-2 leading-snug line-clamp-2">
              {plan.name}
            </h4>

            {/* Progress */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-slate-400">Progresso geral</span>
                <span className="text-xs font-bold text-indigo-600">{plan.overallProgress}%</span>
              </div>
              <ProgressBar value={plan.overallProgress}
                color={plan.overallProgress >= 80 ? 'bg-emerald-500' : 'bg-indigo-500'} />
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <CheckCircle size={11} className="text-emerald-500" />
                {plan.stats.completed}/{plan.stats.total} acções
              </span>
              {plan.stats.overdue > 0 && (
                <span className="flex items-center gap-1 text-red-500">
                  <AlertTriangle size={11} />
                  {plan.stats.overdue} atrasadas
                </span>
              )}
              {plan.manager && (
                <span className="ml-auto text-[10px] text-slate-400 truncate">
                  Gestor: {plan.manager.fullName}
                </span>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-3 py-16 text-center text-slate-400">
            <Target size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhum plano encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Skill Gaps Tab ───────────────────────────────────────────────

function SkillGapsTab() {
  const [view, setView]       = useState<'needs' | 'heatmap'>('needs');

  const needsQuery = useApiQuery<any[]>(
    queryKeys.talentDevelopment.trainingNeeds(), '/talent/training-needs',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const heatmapQuery = useApiQuery<any[]>(
    queryKeys.talentDevelopment.skillHeatmap(), '/talent/skill-heatmap',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const needs   = needsQuery.data ?? [];
  const heatmap = heatmapQuery.data ?? [];

  if (needsQuery.isLoading || heatmapQuery.isLoading) return <Skeleton />;

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex gap-2">
        {(['needs', 'heatmap'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === v ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            {v === 'needs' ? 'Necessidades de Formação' : 'Heatmap de Skills'}
          </button>
        ))}
      </div>

      {view === 'needs' && (
        <div className="bg-white rounded-xl border border-slate-100">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-700">Top Skills com Maior Gap</h3>
            <p className="text-xs text-slate-400 mt-0.5">Ordenado por gap médio — colaboradores vs nível alvo</p>
          </div>
          <div className="divide-y divide-slate-50">
            {needs.slice(0, 15).map((item, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-4">
                <span className="text-xs font-bold text-slate-400 w-5">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700">{item.skill?.name ?? item.competency?.name}</p>
                  <p className="text-xs text-slate-400">{item.category} · {item.count} colaboradores</p>
                  <div className="mt-1.5">
                    <ProgressBar
                      value={100 - (item.avgGap / 5) * 100}
                      color={item.avgGap >= 3 ? 'bg-red-400' : item.avgGap >= 2 ? 'bg-amber-400' : 'bg-emerald-400'}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-red-500">-{item.avgGap}</p>
                  <p className="text-[10px] text-slate-400">gap médio</p>
                </div>
              </div>
            ))}
            {needs.length === 0 && (
              <div className="py-12 text-center text-slate-400">
                <Brain size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sem gaps de skills registados</p>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'heatmap' && (
        <div className="bg-white rounded-xl border border-slate-100 overflow-x-auto">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-700">Heatmap de Skills por Departamento</h3>
          </div>
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left text-slate-500 font-medium">Skill</th>
                {Array.from(new Set(heatmap.flatMap(h => h.departments.map((d: any) => d.department)))).map((dept: any) => (
                  <th key={dept} className="px-3 py-2 text-center text-slate-500 font-medium whitespace-nowrap">
                    {dept}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {heatmap.map((row, i) => {
                const depts = Array.from(new Set(heatmap.flatMap(h => h.departments.map((d: any) => d.department))));
                return (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium text-slate-700">{row.skill}</td>
                    {depts.map((dept: any) => {
                      const d = row.departments.find((x: any) => x.department === dept);
                      const lvl = d?.avgLevel ?? null;
                      const bg = lvl === null ? 'bg-slate-50' :
                        lvl >= 4 ? 'bg-emerald-100 text-emerald-700' :
                        lvl >= 3 ? 'bg-teal-100 text-teal-700' :
                        lvl >= 2 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600';
                      return (
                        <td key={dept} className={`px-3 py-2 text-center font-semibold ${bg}`}>
                          {lvl !== null ? lvl.toFixed(1) : '–'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {heatmap.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm">Sem dados de skills avaliadas</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Mentoring Tab ────────────────────────────────────────────────

function MentoringTab() {
  const [status, setStatus]   = useState('ACTIVE');

  const params = { status, limit: 30 };
  const { data, isLoading } = useApiQuery<{ data: any[]; meta: any }>(
    queryKeys.talentDevelopment.mentoring(status), '/talent/mentoring',
    { params, staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading) return <Skeleton />;

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2">
        {['ACTIVE', 'COMPLETED', 'PAUSED'].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
              status === s ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            {s}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400">{data?.meta.total ?? 0} mentorias</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data?.data.map((m: any) => (
          <div key={m.id} className="bg-white rounded-xl border border-slate-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[m.status] ?? ''}`}>
                {m.status}
              </span>
              {m.reverseMentoring && (
                <span className="text-[10px] bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full">
                  Reversa
                </span>
              )}
            </div>

            {/* Pair */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex flex-col items-center gap-1">
                <Avatar name={m.mentor.fullName} url={m.mentor.avatarUrl} size={9} />
                <span className="text-[9px] text-indigo-600 font-semibold">MENTOR</span>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <ChevronRight size={16} className="text-slate-300" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <Avatar name={m.mentee.fullName} url={m.mentee.avatarUrl} size={9} />
                <span className="text-[9px] text-emerald-600 font-semibold">MENTEE</span>
              </div>
            </div>

            <p className="text-sm font-semibold text-slate-700 mb-1 truncate">{m.mentor.fullName}</p>
            <p className="text-xs text-slate-500 mb-2">→ {m.mentee.fullName}</p>

            {m.objective && (
              <p className="text-xs text-slate-400 italic mb-3 line-clamp-2">&quot;{m.objective}&quot;</p>
            )}

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Activity size={11} />
                {m._count?.sessions ?? 0} sessões
              </span>
              {m.durationMonths && (
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {m.durationMonths}m
                </span>
              )}
            </div>
          </div>
        ))}

        {(data?.data.length ?? 0) === 0 && (
          <div className="col-span-3 py-16 text-center text-slate-400">
            <UserCheck size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhuma mentoria {status.toLowerCase()}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────

function AnalyticsTab() {
  const dashQuery = useApiQuery<DashboardData>(
    queryKeys.talentDevelopment.analytics(), '/talent/analytics/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const healthQuery = useApiQuery<HealthScore>(
    queryKeys.talentDevelopment.health(), '/talent/analytics/talent-health',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const dash   = dashQuery.data ?? null;
  const health = healthQuery.data ?? null;

  if (dashQuery.isLoading || healthQuery.isLoading) return <Skeleton />;

  const GRADE_COLOR: Record<string, string> = {
    A: 'text-emerald-600 border-emerald-500',
    B: 'text-teal-600 border-teal-500',
    C: 'text-amber-600 border-amber-500',
    D: 'text-red-600 border-red-500',
  };

  return (
    <div className="space-y-6">
      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={Users}       label="Colaboradores Activos"   value={dash?.kpis.totalUsers ?? 0} />
        <KpiCard icon={Target}      label="Com PDI Activo"          value={`${dash?.kpis.pdpCoverage ?? 0}%`}
          sub={`${dash?.kpis.usersWithActivePlan} colaboradores`} color="text-indigo-600" />
        <KpiCard icon={CheckCircle} label="Taxa Conclusão Acções"   value={`${dash?.kpis.actionCompletion ?? 0}%`}
          color="text-emerald-600" />
        <KpiCard icon={AlertTriangle} label="Acções em Atraso"      value={dash?.kpis.overdueActions ?? 0}
          color="text-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Talent Health Score */}
        {health && (
          <div className="bg-white rounded-xl border border-slate-100 p-6 flex flex-col items-center">
            <h3 className="font-semibold text-slate-700 mb-4 self-start">Talent Health Score</h3>
            <div className={`w-28 h-28 rounded-full border-4 ${GRADE_COLOR[health.grade]} flex flex-col
              items-center justify-center mb-4`}>
              <span className={`text-4xl font-black ${GRADE_COLOR[health.grade].split(' ')[0]}`}>
                {health.grade}
              </span>
              <span className="text-xs text-slate-500">{health.healthScore}/100</span>
            </div>
            <div className="w-full space-y-2">
              {Object.entries(health.metrics).map(([k, v]) => {
                const labels: Record<string, string> = {
                  pdpCoverage: 'Cobertura PDI', skillsAssessment: 'Skills Avaliadas',
                  reviewedRate: 'Avaliados', mentoringRate: 'Mentoring', hiPoRatio: 'HiPo Ratio',
                };
                return (
                  <div key={k}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-slate-500">{labels[k] ?? k}</span>
                      <span className="font-semibold text-slate-700">{v as number}%</span>
                    </div>
                    <ProgressBar value={v as number}
                      color={(v as number) >= 70 ? 'bg-emerald-400' : (v as number) >= 40 ? 'bg-amber-400' : 'bg-red-400'} />
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 mt-3">Base: {health.total} colaboradores</p>
          </div>
        )}

        {/* Plans by status */}
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-700 mb-4">Planos por Status</h3>
          <div className="space-y-3">
            {dash?.plansByStatus.map(s => {
              const total = dash.plansByStatus.reduce((sum, x) => sum + x.count, 0);
              const pct   = total > 0 ? Math.round((s.count / total) * 100) : 0;
              return (
                <div key={s.status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={`px-2 py-0.5 rounded-full ${STATUS_COLOR[s.status]}`}>{s.status}</span>
                    <span className="font-semibold text-slate-700">{s.count} ({pct}%)</span>
                  </div>
                  <ProgressBar value={pct} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Top training needs */}
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-700 mb-4">Top Necessidades de Formação</h3>
          <div className="space-y-3">
            {dash?.topTrainingNeeds.map((n, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-300 w-4">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{n.skill?.name}</p>
                  <p className="text-[10px] text-slate-400">{n.count} pessoas</p>
                </div>
                <span className="text-sm font-bold text-red-500 shrink-0">-{n.avgGap}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent completions */}
      {(dash?.recentCompletions.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-700 mb-3">Conclusões Recentes</h3>
          <div className="flex flex-wrap gap-2">
            {dash?.recentCompletions.map((c: any, i) => (
              <div key={i} className="flex items-center gap-2 bg-emerald-50 rounded-lg px-3 py-2">
                <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-slate-700">{c.user.fullName}</p>
                  <p className="text-[10px] text-slate-400 truncate max-w-[160px]">{c.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-slate-100 rounded-xl h-24" />
      ))}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

export default function TalentDevelopmentPage() {
  const [tab, setTab] = useState<Tab>('pool');

  const TAB_COMPONENTS: Record<Tab, JSX.Element> = {
    'pool':       <PoolTab />,
    'plans':      <PlansTab />,
    'skill-gaps': <SkillGapsTab />,
    'mentoring':  <MentoringTab />,
    'analytics':  <AnalyticsTab />,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <TrendingUp size={18} className="text-indigo-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">Talent Development</h1>
            </div>
            <p className="text-sm text-slate-400">
              Pool de talento · PDI · Skill Gaps · Mentoria · Analytics
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200
              text-slate-600 text-sm rounded-lg hover:border-indigo-300 transition-colors">
              <Filter size={14} />
              Filtros
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white
              text-sm rounded-lg hover:bg-indigo-700 transition-colors">
              <Plus size={14} />
              Novo PDI
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="max-w-7xl mx-auto flex gap-0 overflow-x-auto">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap
                  border-b-2 transition-colors ${
                    tab === t.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}>
                <Icon size={15} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {TAB_COMPONENTS[tab]}
      </div>
    </div>
  );
}
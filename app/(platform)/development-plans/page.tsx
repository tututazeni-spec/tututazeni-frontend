// src/app/(dashboard)/development-plans/page.tsx
'use client';

import { useState } from 'react';
import {
  Users, Target, Brain, UserCheck, Search, CheckCircle,
  AlertTriangle, ChevronRight, Clock, Activity, ArrowUp,
} from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApiQuery';
import { apiClient } from '../../../lib/apiClient';
import { queryKeys } from '../../../lib/queryKeys';
import { STALE_TIME } from '../../../lib/queryClient';
import Image from 'next/image';

// ─── Types ────────────────────────────────────────────────────────────────────

type PlanStatus   = 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';
type ActionType   = 'COURSE' | 'MENTORING' | 'COACHING' | 'READING' | 'PROJECT' | 'JOB_ROTATION' | 'MICROLEARNING' | 'WORKSHOP' | 'CERTIFICATION' | 'OTHER';
type ActionStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED';
type Priority     = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface Plan {
  id: number;
  name: string;
  goal: string;
  status: PlanStatus;
  priority: Priority;
  period: string | null;
  startDate: string | null;
  endDate: string | null;
  completedAt: string | null;
  overallProgress: number;
  actionProgress?: number;
  avgGoalProgress?: number;
  overdueActions?: number;
  user: { id: number; fullName: string; avatarUrl: string | null; position: { name: string } | null };
  manager: { id: number; fullName: string; avatarUrl: string | null } | null;
  actions?: Action[];
  goals?: Goal[];
  checkpoints?: Checkpoint[];
  certificates?: any[];
  _count: { actions: number; goals: number; checkpoints: number };
}

interface Action {
  id: number;
  title: string;
  description: string | null;
  type: ActionType;
  status: ActionStatus;
  progress: number;
  xpReward: number;
  dueDate: string | null;
  completedAt: string | null;
  mandatory: boolean;
  workloadHours: number | null;
  evidence?: Evidence[];
}

interface Evidence {
  id: number;
  title: string;
  url: string | null;
  notes: string | null;
  evidenceType: string;
  createdAt: string;
}

interface Goal {
  id: number;
  title: string;
  description: string | null;
  successIndicator: string | null;
  progress: number;
  weight: number;
  dueDate: string | null;
  completedAt: string | null;
}

interface Checkpoint {
  id: number;
  title: string;
  type: string;
  status: string;
  scheduledAt: string;
  completedAt: string | null;
  selfScore: number | null;
}

interface MyStats {
  plans: { total: number; active: number; completed: number; cancelled: number };
  actions: Record<string, number>;
  completionRate: number;
  totalXp: number;
}

type Tier = 'HIGH' | 'MEDIUM' | 'DEVELOPING';

interface TalentUser {
  user: { id: number; fullName: string; email: string; avatarUrl?: string;
    position?: { name: string }; department?: { name: string } };
  scores: { talent: number; competency: number; performance: number; potential: number; engagement: number };
  tier: Tier;
  activePlan: { id: number; name: string; overallProgress: number } | null;
  nineBox: { performanceAxis: number; potentialAxis: number } | null;
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

type View = 'my-plans' | 'detail' | 'team' | 'pool' | 'skill-gaps' | 'mentoring' | 'analytics' | 'create';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isOverdue(d: string | null, status: string): boolean {
  return !!d && new Date(d) < new Date() && status !== 'COMPLETED' && status !== 'CANCELLED';
}

function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
    </div>
  );
}

function Avatar({ name, avatarUrl, size = 'sm' }: { name: string; avatarUrl?: string | null; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return avatarUrl ? (
    <div className={`${dim} rounded-full overflow-hidden relative flex-shrink-0`}>
      <Image src={avatarUrl} alt={name} fill className="object-cover" />
    </div>
  ) : (
    <div className={`${dim} rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold flex-shrink-0`}>
      {initials(name)}
    </div>
  );
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<PlanStatus, { label: string; cls: string }> = {
  DRAFT:            { label: 'Rascunho',       cls: 'bg-gray-100 text-gray-500' },
  PENDING_APPROVAL: { label: 'Ag. aprovação',  cls: 'bg-amber-50 text-amber-700' },
  ACTIVE:           { label: 'Activo',          cls: 'bg-emerald-50 text-emerald-700' },
  COMPLETED:        { label: 'Concluído',       cls: 'bg-blue-50 text-blue-700' },
  CANCELLED:        { label: 'Cancelado',       cls: 'bg-red-50 text-red-500' },
  OVERDUE:          { label: 'Atrasado',        cls: 'bg-red-100 text-red-700' },
};

const ACTION_CFG: Record<ActionType, { icon: string; label: string; cls: string }> = {
  COURSE:       { icon: '🎓', label: 'Curso',           cls: 'bg-blue-50 text-blue-700' },
  MENTORING:    { icon: '👥', label: 'Mentoria',        cls: 'bg-purple-50 text-purple-700' },
  COACHING:     { icon: '🎯', label: 'Coaching',        cls: 'bg-amber-50 text-amber-700' },
  READING:      { icon: '📚', label: 'Leitura',         cls: 'bg-emerald-50 text-emerald-700' },
  PROJECT:      { icon: '🚀', label: 'Projecto',        cls: 'bg-red-50 text-red-700' },
  JOB_ROTATION: { icon: '🔄', label: 'Job Rotation',   cls: 'bg-orange-50 text-orange-700' },
  MICROLEARNING:{ icon: '⚡', label: 'Micro-Learning',  cls: 'bg-pink-50 text-pink-700' },
  WORKSHOP:     { icon: '🛠', label: 'Workshop',        cls: 'bg-teal-50 text-teal-700' },
  CERTIFICATION:{ icon: '🏆', label: 'Certificação',    cls: 'bg-gold-50 text-yellow-700' },
  OTHER:        { icon: '📌', label: 'Outro',           cls: 'bg-gray-100 text-gray-600' },
};

const ACTION_STATUS: Record<ActionStatus, { icon: string; cls: string; label: string }> = {
  TODO:        { icon: '○', cls: 'text-gray-400', label: 'A fazer' },
  IN_PROGRESS: { icon: '▶', cls: 'text-blue-500', label: 'Em progresso' },
  COMPLETED:   { icon: '✓', cls: 'text-emerald-500', label: 'Concluída' },
  BLOCKED:     { icon: '🔒', cls: 'text-gray-400', label: 'Bloqueada' },
  CANCELLED:   { icon: '✕', cls: 'text-red-400', label: 'Cancelada' },
};

const PRIORITY_CFG: Record<Priority, { label: string; cls: string }> = {
  LOW:    { label: 'Baixa',   cls: 'bg-gray-100 text-gray-500' },
  MEDIUM: { label: 'Média',   cls: 'bg-blue-50 text-blue-600' },
  HIGH:   { label: 'Alta',    cls: 'bg-amber-50 text-amber-700' },
  URGENT: { label: 'Urgente', cls: 'bg-red-100 text-red-700' },
};

function ProgressBar({ pct, color = 'bg-blue-500' }: { pct: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-xs font-mono text-gray-500 w-8 flex-shrink-0">{pct}%</span>
    </div>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({ plan, onClick }: { plan: Plan; onClick: () => void }) {
  const statusCfg   = STATUS_CFG[plan.status];
  const priorityCfg = PRIORITY_CFG[plan.priority];
  const pct         = plan.actionProgress ?? plan.overallProgress;
  const hasOverdue  = (plan.overdueActions ?? 0) > 0;

  return (
    <div
      onClick={onClick}
      className={`bg-white border rounded-xl p-5 cursor-pointer hover:shadow-md transition-all ${
        hasOverdue ? 'border-red-200' : 'border-gray-200 hover:border-blue-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusCfg.cls}`}>{statusCfg.label}</span>
            <span className={`text-xs px-2 py-0.5 rounded ${priorityCfg.cls}`}>{priorityCfg.label}</span>
            {plan.period && <span className="text-xs text-gray-400">{plan.period}</span>}
          </div>
          <div className="text-sm font-semibold text-gray-900 truncate">{plan.name}</div>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{plan.goal}</p>
        </div>
        <Avatar name={plan.user.fullName} avatarUrl={plan.user.avatarUrl} size="sm" />
      </div>

      <ProgressBar
        pct={pct}
        color={pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-400'}
      />

      <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
        <div className="flex items-center gap-3">
          <span>📋 {plan._count.actions} acções</span>
          <span>🎯 {plan._count.goals} metas</span>
        </div>
        <div className="flex items-center gap-2">
          {hasOverdue && (
            <span className="text-red-600 font-medium">⚠ {plan.overdueActions} atrasada(s)</span>
          )}
          {plan.endDate && (
            <span className={isOverdue(plan.endDate, plan.status) ? 'text-red-600' : ''}>
              📅 {fmtDate(plan.endDate)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Talent Development — Helpers & Config ─────────────────────────────────────
// (secções abaixo migradas de talent-development/page.tsx — módulo fundido em
// Planos de Desenvolvimento)

const TIER_COLOR: Record<Tier, string> = {
  HIGH:       'bg-emerald-100 text-emerald-700',
  MEDIUM:     'bg-amber-100 text-amber-700',
  DEVELOPING: 'bg-slate-100 text-slate-600',
};

const TALENT_STATUS_COLOR: Record<string, string> = {
  DRAFT:     'bg-slate-100 text-slate-600',
  ACTIVE:    'bg-blue-100 text-blue-700',
  PAUSED:    'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-600',
};

function TalentAvatar({ name, url, size = 8 }: { name: string; url?: string; size?: number }) {
  const tInitials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  return url
    ? <div className={`w-${size} h-${size} rounded-full overflow-hidden relative`}><Image src={url} alt={name} fill className="object-cover" /></div>
    : (
      <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600
        flex items-center justify-center text-white font-semibold text-xs`}>
        {tInitials}
      </div>
    );
}

function TalentProgressBar({ value, color = 'bg-indigo-500', height = 'h-1.5' }: {
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

          <p className="text-center text-[10px] text-slate-400 mt-2">← Competência →</p>
        </div>
      </div>
    </div>
  );
}

function TalentSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-slate-100 rounded-xl h-24" />
      ))}
    </div>
  );
}

// ─── Talent Development — Pool Tab ─────────────────────────────────────────────

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

  if (poolQuery.isLoading || matrixQuery.isLoading) return <TalentSkeleton />;

  return (
    <div className="space-y-6">
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
                <TalentAvatar name={t.user.fullName} url={t.user.avatarUrl} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{t.user.fullName}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {t.user.position?.name} · {t.user.department?.name}
                  </p>
                  {t.activePlan && (
                    <div className="mt-1 flex items-center gap-2">
                      <TalentProgressBar value={t.activePlan.overallProgress} height="h-1" />
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

        {matrix && <NineBoxMatrix matrix={matrix.matrix} />}
      </div>
    </div>
  );
}

// ─── Talent Development — Skill Gaps Tab ───────────────────────────────────────

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

  if (needsQuery.isLoading || heatmapQuery.isLoading) return <TalentSkeleton />;

  return (
    <div className="space-y-4">
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
                    <TalentProgressBar
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

// ─── Talent Development — Mentoring Tab ────────────────────────────────────────

function MentoringTab() {
  const [status, setStatus]   = useState('ACTIVE');

  const params = { status, limit: 30 };
  const { data, isLoading } = useApiQuery<{ data: any[]; meta: any }>(
    queryKeys.talentDevelopment.mentoring(status), '/talent/mentoring',
    { params, staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading) return <TalentSkeleton />;

  return (
    <div className="space-y-4">
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
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TALENT_STATUS_COLOR[m.status] ?? ''}`}>
                {m.status}
              </span>
              {m.reverseMentoring && (
                <span className="text-[10px] bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full">
                  Reversa
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="flex flex-col items-center gap-1">
                <TalentAvatar name={m.mentor.fullName} url={m.mentor.avatarUrl} size={9} />
                <span className="text-[9px] text-indigo-600 font-semibold">MENTOR</span>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <ChevronRight size={16} className="text-slate-300" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <TalentAvatar name={m.mentee.fullName} url={m.mentee.avatarUrl} size={9} />
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

// ─── Talent Development — Analytics Tab ────────────────────────────────────────

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

  if (dashQuery.isLoading || healthQuery.isLoading) return <TalentSkeleton />;

  const GRADE_COLOR: Record<string, string> = {
    A: 'text-emerald-600 border-emerald-500',
    B: 'text-teal-600 border-teal-500',
    C: 'text-amber-600 border-amber-500',
    D: 'text-red-600 border-red-500',
  };

  return (
    <div className="space-y-6">
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
                    <TalentProgressBar value={v as number}
                      color={(v as number) >= 70 ? 'bg-emerald-400' : (v as number) >= 40 ? 'bg-amber-400' : 'bg-red-400'} />
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 mt-3">Base: {health.total} colaboradores</p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-700 mb-4">Planos por Status</h3>
          <div className="space-y-3">
            {dash?.plansByStatus.map(s => {
              const total = dash.plansByStatus.reduce((sum, x) => sum + x.count, 0);
              const pct   = total > 0 ? Math.round((s.count / total) * 100) : 0;
              return (
                <div key={s.status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={`px-2 py-0.5 rounded-full ${TALENT_STATUS_COLOR[s.status]}`}>{s.status}</span>
                    <span className="font-semibold text-slate-700">{s.count} ({pct}%)</span>
                  </div>
                  <TalentProgressBar value={pct} />
                </div>
              );
            })}
          </div>
        </div>

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

// ─── View: My Plans + Stats ───────────────────────────────────────────────────

function MyPlansView({ onSelect }: { onSelect: (id: number) => void }) {
  const plansQuery = useApiQuery<Plan[]>(
    queryKeys.developmentPlans.my(), '/development-plans/my',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const statsQuery = useApiQuery<MyStats>(
    queryKeys.developmentPlans.myStats(), '/development-plans/my/stats',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const plans = plansQuery.data ?? [];
  const stats = statsQuery.data ?? null;

  if (plansQuery.isLoading || statsQuery.isLoading) return <Skeleton />;

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total PDIs',      value: stats.plans.total },
            { label: 'Activos',         value: stats.plans.active,     color: 'text-emerald-600' },
            { label: 'Concluídos',      value: stats.plans.completed,  color: 'text-blue-600' },
            { label: 'XP ganho',        value: `${stats.totalXp}`,     color: 'text-amber-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs text-gray-400 mb-1">{label}</div>
              <div className={`text-2xl font-bold font-mono ${color ?? 'text-gray-900'}`}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Plans */}
      {plans.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-gray-200 rounded-xl text-sm text-gray-400">
          <div className="text-4xl mb-3">🎯</div>
          Sem planos de desenvolvimento criados ainda
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {plans.map(p => <PlanCard key={p.id} plan={p} onClick={() => onSelect(p.id)} />)}
        </div>
      )}
    </div>
  );
}

// ─── View: Detail ─────────────────────────────────────────────────────────────

function DetailView({ planId, onBack }: { planId: number; onBack: () => void }) {
  const [updatingAction, setUpdatingAction] = useState<number | null>(null);
  const [updatingGoal, setUpdatingGoal] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'actions' | 'goals' | 'checkpoints'>('actions');

  const { data: plan, isLoading: loading, refetch } = useApiQuery<Plan>(
    queryKeys.developmentPlans.detail(planId), `/development-plans/${planId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const handleCompleteAction = async (actionId: number, xpReward: number) => {
    setUpdatingAction(actionId);
    try {
      await apiClient.put(`/development-plans/actions/${actionId}`, { status: 'COMPLETED', progress: 100 });
      await refetch();
    } catch (e: any) { alert(e.message); }
    finally { setUpdatingAction(null); }
  };

  const handleGoalProgress = async (goalId: number, progress: number) => {
    setUpdatingGoal(goalId);
    try {
      await apiClient.patch('/development-plans/goals/progress', { goalId, progress });
      await refetch();
    } catch (e: any) { alert(e.message); }
    finally { setUpdatingGoal(null); }
  };

  const handleSubmit = async () => {
    try {
      await apiClient.patch(`/development-plans/${planId}/submit`, {});
      await refetch();
    } catch (e: any) { alert(e.message); }
  };

  if (loading || !plan) return <Skeleton rows={5} />;

  const statusCfg   = STATUS_CFG[plan.status];
  const priorityCfg = PRIORITY_CFG[plan.priority];
  const pct         = plan.actionProgress ?? plan.overallProgress;

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5">
        ← Voltar
      </button>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusCfg.cls}`}>{statusCfg.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${priorityCfg.cls}`}>{priorityCfg.label}</span>
              {plan.period && <span className="text-xs text-gray-400">{plan.period}</span>}
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h1>
            <p className="text-sm text-gray-600">{plan.goal}</p>
          </div>
          <div className="flex-shrink-0">
            {plan.status === 'DRAFT' && (
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800"
              >
                Submeter para aprovação →
              </button>
            )}
          </div>
        </div>

        {/* Progresso geral */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progresso geral</span>
            <span className="font-mono">{pct}%</span>
          </div>
          <ProgressBar
            pct={pct}
            color={pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-400'}
          />
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-400">
          <span>📅 Início: {fmtDate(plan.startDate)}</span>
          <span>📅 Fim: {fmtDate(plan.endDate)}</span>
          <span>📋 {plan._count.actions} acções</span>
          <span>🎯 {plan._count.goals} metas</span>
          {plan.manager && (
            <span className="flex items-center gap-1">
              <Avatar name={plan.manager.fullName} size="sm" />
              Gestor: {plan.manager.fullName}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {(['actions', 'goals', 'checkpoints'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {{ actions: '✅ Acções', goals: '🎯 Metas', checkpoints: '📍 Checkpoints' }[t]}
          </button>
        ))}
      </div>

      {/* Actions */}
      {activeTab === 'actions' && (
        <div className="space-y-3">
          {plan.actions?.map(action => {
            const typeCfg   = ACTION_CFG[action.type];
            const statusCfg = ACTION_STATUS[action.status];
            const overdue   = isOverdue(action.dueDate, action.status);
            return (
              <div
                key={action.id}
                className={`bg-white border rounded-xl p-4 ${overdue ? 'border-red-200' : 'border-gray-200'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${typeCfg.cls}`}>
                    {typeCfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-lg ${statusCfg.cls}`}>{statusCfg.icon}</span>
                      <span className={`text-sm font-medium ${action.status === 'COMPLETED' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {action.title}
                      </span>
                      {action.mandatory && <span className="text-xs text-red-600">Obrigatória</span>}
                    </div>
                    {action.description && (
                      <p className="text-xs text-gray-500 mb-2">{action.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{typeCfg.label}</span>
                      {action.workloadHours && <span>⏱ {action.workloadHours}h</span>}
                      {action.dueDate && (
                        <span className={overdue ? 'text-red-600 font-medium' : ''}>
                          {overdue ? '⚠ ' : ''}📅 {fmtDate(action.dueDate)}
                        </span>
                      )}
                      <span className="text-amber-600">+{action.xpReward} XP</span>
                      {action.evidence && action.evidence.length > 0 && (
                        <span className="text-blue-600">📎 {action.evidence.length} evidência(s)</span>
                      )}
                    </div>
                    {action.status !== 'COMPLETED' && (
                      <div className="mt-2">
                        <ProgressBar pct={action.progress} />
                      </div>
                    )}
                  </div>
                  {action.status !== 'COMPLETED' && action.status !== 'CANCELLED' && (
                    <button
                      onClick={() => handleCompleteAction(action.id, action.xpReward)}
                      disabled={updatingAction === action.id}
                      className="flex-shrink-0 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {updatingAction === action.id ? '…' : 'Concluir'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {(!plan.actions || plan.actions.length === 0) && (
            <div className="py-8 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Sem acções adicionadas
            </div>
          )}
        </div>
      )}

      {/* Goals */}
      {activeTab === 'goals' && (
        <div className="space-y-3">
          {plan.goals?.map(goal => (
            <div key={goal.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900 mb-0.5">{goal.title}</div>
                  {goal.successIndicator && (
                    <div className="text-xs text-gray-500">📊 {goal.successIndicator}</div>
                  )}
                  {goal.dueDate && <div className="text-xs text-gray-400 mt-0.5">📅 {fmtDate(goal.dueDate)}</div>}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-bold font-mono text-blue-700">{goal.progress}%</div>
                  {goal.completedAt && <div className="text-xs text-emerald-600">✓ Concluída</div>}
                </div>
              </div>
              <ProgressBar pct={goal.progress} />
              {goal.progress < 100 && (
                <div className="flex gap-2 mt-3">
                  {[25, 50, 75, 100].map(v => (
                    <button
                      key={v}
                      onClick={() => handleGoalProgress(goal.id, v)}
                      disabled={updatingGoal === goal.id || goal.progress >= v}
                      className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                        goal.progress >= v ? 'bg-gray-100 text-gray-300' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      } disabled:opacity-50`}
                    >
                      {v}%
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {(!plan.goals || plan.goals.length === 0) && (
            <div className="py-8 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Sem metas adicionadas
            </div>
          )}
        </div>
      )}

      {/* Checkpoints */}
      {activeTab === 'checkpoints' && (
        <div className="space-y-3">
          {plan.checkpoints?.map(cp => (
            <div key={cp.id} className={`flex items-center gap-4 bg-white border rounded-xl p-4 ${
              cp.status === 'COMPLETED' ? 'border-emerald-200' : 'border-gray-200'
            }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                cp.status === 'COMPLETED' ? 'bg-emerald-50' : 'bg-blue-50'
              }`}>
                {cp.status === 'COMPLETED' ? '✅' : cp.type === 'STRUCTURED' ? '📋' : '💬'}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{cp.title}</div>
                <div className="text-xs text-gray-400">
                  📅 {fmtDate(cp.scheduledAt)}
                  {cp.selfScore && <span className="ml-2">⭐ {cp.selfScore}/5</span>}
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                cp.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {cp.status === 'COMPLETED' ? 'Concluído' : 'Pendente'}
              </span>
            </div>
          ))}
          {(!plan.checkpoints || plan.checkpoints.length === 0) && (
            <div className="py-8 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Sem checkpoints agendados
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── View: Team ────────────────────────────────────────────────────────────────

function TeamView({ onSelect }: { onSelect: (id: number) => void }) {
  const { data: plans = [], isLoading } = useApiQuery<any[]>(
    queryKeys.developmentPlans.teamDashboard(), '/development-plans/team/dashboard',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading) return <Skeleton />;

  return (
    <div>
      <div className="text-xs text-gray-400 mb-4">{plans.length} planos activos na equipa</div>
      <div className="space-y-3">
        {plans.map(p => (
          <div
            key={p.id}
            onClick={() => onSelect(p.id)}
            className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:shadow-sm"
          >
            <Avatar name={p.user.fullName} avatarUrl={p.user.avatarUrl} size="md" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{p.name}</div>
              <div className="text-xs text-gray-400">{p.user.fullName} · {p.user.position?.name ?? '—'}</div>
              <div className="mt-1">
                <ProgressBar pct={p.progress} />
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-sm font-bold font-mono text-blue-700">{p.progress}%</div>
              {p.overdueActions > 0 && (
                <div className="text-xs text-red-600">⚠ {p.overdueActions} atrasadas</div>
              )}
              {p.pendingApproval && (
                <div className="text-xs text-amber-600 font-medium">Ag. aprovação</div>
              )}
            </div>
          </div>
        ))}
        {plans.length === 0 && (
          <div className="py-10 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
            Sem PDIs activos na equipa
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page principal ───────────────────────────────────────────────────────────

const NAV = [
  { id: 'my-plans',   label: '🎯 Os meus PDIs' },
  { id: 'team',       label: '👥 Equipa' },
  { id: 'pool',       label: '⭐ Pool de Talento' },
  { id: 'skill-gaps', label: '🧠 Skill Gaps' },
  { id: 'mentoring',  label: '🤝 Mentoria' },
  { id: 'analytics',  label: '📊 Analytics' },
] as const;

const TITLES: Record<View, string> = {
  'my-plans':   'Planos de Desenvolvimento',
  detail:       'Detalhe do PDI',
  team:         'PDIs da Equipa',
  pool:         'Pool de Talento',
  'skill-gaps': 'Skill Gaps',
  mentoring:    'Mentoria',
  analytics:    'Analytics de Desenvolvimento',
  create:       'Novo PDI',
};

export default function DevelopmentPlansPage() {
  const [view, setView]         = useState<View>('my-plans');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleSelect = (id: number) => { setSelectedId(id); setView('detail'); };
  const handleBack   = () => { setSelectedId(null); setView('my-plans'); };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{TITLES[view]}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            INNOVA — Planos de Desenvolvimento Individual · Pool de Talento · Skill Gaps · Mentoria
          </p>
        </div>
        {view !== 'detail' && (
          <button
            onClick={() => alert('Abrir formulário de criação de PDI')}
            className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800"
          >
            + Novo PDI
          </button>
        )}
      </div>

      {view !== 'detail' && (
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setView(n.id as View)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                view === n.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
      )}

      {view === 'my-plans' && <MyPlansView onSelect={handleSelect} />}
      {view === 'detail' && selectedId !== null && (
        <DetailView planId={selectedId} onBack={handleBack} />
      )}
      {view === 'team' && <TeamView onSelect={handleSelect} />}
      {view === 'pool' && <PoolTab />}
      {view === 'skill-gaps' && <SkillGapsTab />}
      {view === 'mentoring' && <MentoringTab />}
      {view === 'analytics' && <AnalyticsTab />}
    </div>
  );
}
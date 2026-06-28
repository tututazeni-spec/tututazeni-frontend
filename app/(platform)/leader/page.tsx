'use client';
// src/app/(dashboard)/leader/page.tsx

import { useState } from 'react';
import {
  Users, Star, Target, BookOpen, Brain, AlertTriangle, CheckCircle,
  MessageSquare, Calendar, TrendingUp, TrendingDown, Zap, Award,
  ChevronRight, RefreshCw, Clock, ArrowUp,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import Image from 'next/image';

// ─── Types ───────────────────────────────────────────────────────

type Tab = 'dashboard' | 'team' | 'performance' | 'pipeline' | 'plans';

const RISK_COLOR: Record<string, string> = {
  HIGH:   'bg-red-100 text-red-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  LOW:    'bg-teal-100 text-teal-700',
  NONE:   'bg-slate-100 text-slate-500',
};

function Avatar({ name, url, size = 8 }: { name: string; url?: string; size?: number }) {
  const i = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  return url
    ? <div className={`w-${size} h-${size} rounded-full overflow-hidden relative`}><Image src={url} alt={name} fill className="object-cover" /></div>
    : <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-indigo-500 to-violet-600
        flex items-center justify-center text-white text-xs font-bold shrink-0`}>{i}</div>;
}

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

function KPICard({ icon: Icon, label, value, sub, status, trend, color = 'text-indigo-600', bg = 'bg-indigo-50' }: {
  icon: any; label: string; value: string | number; sub?: string;
  status?: string; trend?: number; color?: string; bg?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${bg}`}><Icon size={18} className={color} /></div>
        <div className="flex items-center gap-1">
          {status && <span className="text-lg">{status}</span>}
          {trend !== undefined && (
            <span className={`text-xs font-medium flex items-center gap-0.5 ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}{Math.abs(trend)}%
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

// ─── Dashboard Tab ────────────────────────────────────────────────

function DashboardTab() {
  const dashQ = useApiQuery<any>(queryKeys.leader.dashboard(), '/leaders/my-dashboard', { staleTime: STALE_TIME.DYNAMIC });
  const recsQ = useApiQuery<any>(queryKeys.leader.recommendations(), '/leaders/my-recommendations', { staleTime: STALE_TIME.DYNAMIC });
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
          {(dash.alerts as any[]).map((a: any, i: number) => (
            <div key={i} className={`border rounded-xl px-4 py-3 flex items-center gap-3 ${a.severity === 'HIGH' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
              <AlertTriangle size={14} className={a.severity === 'HIGH' ? 'text-red-500' : 'text-amber-500'} />
              <p className={`text-sm ${a.severity === 'HIGH' ? 'text-red-700' : 'text-amber-700'}`}>{a.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={Users}       label="Equipa"              value={k.teamSize ?? 0} />
        <KPICard icon={Star}        label="Score Médio"         value={k.avgPerfScore?.toFixed(1) ?? '–'} status={k.perfStatus} color="text-amber-600" bg="bg-amber-50" />
        <KPICard icon={Target}      label="PDIs Activos"        value={k.activePlans ?? 0}             color="text-indigo-600" bg="bg-indigo-50" />
        <KPICard icon={AlertTriangle} label="Em Risco"          value={k.atRiskCount ?? 0}             color="text-red-500" bg="bg-red-50" />
        <KPICard icon={BookOpen}    label="Em Formação"         value={k.activeEnrollments ?? 0}       color="text-teal-600" bg="bg-teal-50" />
        <KPICard icon={CheckCircle} label="Conclusões (mês)"    value={k.completedThisMonth ?? 0}      color="text-emerald-600" bg="bg-emerald-50" />
        <KPICard icon={MessageSquare} label="Respostas a Surveys" value={k.engagementResponses ?? 0}  color="text-violet-600" bg="bg-violet-50" />
        <KPICard icon={Clock}       label="Aprovações Pendentes" value={k.pendingLeaves ?? 0}          color="text-orange-600" bg="bg-orange-50" />
      </div>

      {/* AI Recommendations */}
      {(recs?.recommendations ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Brain size={16} className="text-violet-500" />
            Recomendações IA
          </h3>
          <div className="space-y-2">
            {(recs.recommendations as any[]).map((r: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-violet-50 border border-violet-100">
                <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${r.urgency === 'HIGH' ? 'bg-red-500' : 'bg-amber-400'}`} />
                <div>
                  <p className="text-sm font-medium text-slate-800">{r.message}</p>
                  {r.action && <p className="text-xs text-violet-700 mt-0.5">💡 {r.action}</p>}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${r.urgency === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
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
          <h4 className="font-semibold text-amber-700 mb-3">🏅 Badges Conquistados esta Semana</h4>
          <div className="flex flex-wrap gap-2">
            {(dash.recentBadges as any[]).map((b: any, i: number) => (
              <div key={i} className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-amber-100">
                <span className="text-sm">🏅</span>
                <div>
                  <p className="text-xs font-medium text-slate-700">{b.user?.fullName}</p>
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

// ─── Team Tab ─────────────────────────────────────────────────────

function TeamTab() {
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<{ userId: number; name: string } | null>(null);
  const { data, isLoading: loading } = useApiQuery<any>(
    queryKeys.leader.team(), '/leaders/my-team', { staleTime: STALE_TIME.DYNAMIC },
  );

  if (loading) return <Skeleton />;

  const filtered = (data?.data ?? []).filter((u: any) =>
    !search || u.fullName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      {/* Summary */}
      {data?.summary && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total',    value: data.summary.headcount },
            { label: 'Em Risco', value: data.summary.atRisk, color: data.summary.atRisk > 0 ? 'text-red-600' : 'text-emerald-600' },
            { label: 'Score Médio', value: data.summary.avgScore?.toFixed(1) ?? '–' },
            { label: 'Tenure Médio', value: `${data.summary.avgTenureMonths}m` },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-3 text-center">
              <p className={`text-xl font-bold ${s.color ?? 'text-slate-800'}`}>{s.value}</p>
              <p className="text-[10px] text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Pesquisar membro..."
        className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400" />

      {/* Team list */}
      <div className="bg-white rounded-xl border border-slate-100">
        <div className="divide-y divide-slate-50">
          {filtered.map((u: any, i: number) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
              <Avatar name={u.fullName} url={u.avatarUrl} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{u.fullName}</p>
                <p className="text-[10px] text-slate-400">{u.position?.name} · {u.tenure}m empresa</p>
              </div>

              {/* PDI progress */}
              {u.activePlan && (
                <div className="w-20 hidden md:block">
                  <p className="text-[9px] text-slate-400 mb-0.5">PDI</p>
                  <ProgressBar value={u.planProgress}
                    color={u.planProgress >= 75 ? 'bg-emerald-500' : 'bg-indigo-400'} />
                  <p className="text-[9px] text-slate-400 text-right">{u.planProgress}%</p>
                </div>
              )}

              {/* Score */}
              {u.latestPerfScore !== null && (
                <span className={`text-sm font-bold ${u.latestPerfScore >= 4 ? 'text-emerald-600' : u.latestPerfScore >= 3 ? 'text-amber-600' : 'text-red-500'}`}>
                  {u.latestPerfScore?.toFixed(1)}
                </span>
              )}

              {/* Risk */}
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${RISK_COLOR[u.riskLevel] ?? RISK_COLOR.NONE}`}>
                {u.riskLevel}
              </span>

              {/* Actions */}
              <div className="flex gap-1 shrink-0">
                <button onClick={() => setFeedback({ userId: u.id, name: u.fullName })}
                  className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600" title="Dar feedback">
                  <MessageSquare size={13} />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <Users size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sem membros na equipa</p>
            </div>
          )}
        </div>
      </div>

      {/* Feedback modal */}
      {feedback && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h4 className="font-bold text-slate-800 mb-4">Feedback para {feedback.name}</h4>
            <FeedbackForm recipientId={feedback.userId} onClose={() => setFeedback(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

function FeedbackForm({ recipientId, onClose }: { recipientId: number; onClose: () => void }) {
  const [type, setType]     = useState('POSITIVE');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!content.trim()) return;
    setSending(true);
    await apiClient.post('/leaders/feedback', { recipientId, type, content }).catch(() => {});
    setSending(false);
    onClose();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {['POSITIVE', 'CONSTRUCTIVE', 'SBI'].map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`text-xs px-3 py-1.5 rounded-lg ${type === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {t}
          </button>
        ))}
      </div>
      <textarea value={content} onChange={e => setContent(e.target.value)}
        placeholder="Escreve o teu feedback..."
        className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none h-28 resize-none" />
      <div className="flex gap-2">
        <button onClick={send} disabled={sending || !content.trim()}
          className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 disabled:opacity-60">
          {sending ? 'A enviar…' : 'Enviar Feedback'}
        </button>
        <button onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-xl">
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ─── Performance Tab ──────────────────────────────────────────────

function PerformanceTab() {
  const { data, isLoading: loading } = useApiQuery<any>(
    queryKeys.leader.dashboard(), '/leaders/my-dashboard', { staleTime: STALE_TIME.DYNAMIC },
  );

  return (
    <div className="space-y-4">
      {loading ? <Skeleton /> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard icon={Star}       label="Score Médio"      value={data?.kpis?.avgPerfScore?.toFixed(1) ?? '–'} status={data?.kpis?.perfStatus} color="text-amber-600" bg="bg-amber-50" />
            <KPICard icon={AlertTriangle} label="Em Risco"      value={data?.kpis?.atRiskCount ?? 0}              color="text-red-500" bg="bg-red-50" />
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <h4 className="font-semibold text-slate-700 mb-3">Para ver análise detalhada de performance</h4>
            <p className="text-sm text-slate-500">Usa o separador <strong>Equipa</strong> para ver cada membro individualmente, ou os <strong>Reports</strong> para análise avançada.</p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Talent Pipeline Tab ──────────────────────────────────────────

function TalentPipelineTab() {
  const { data, isLoading: loading } = useApiQuery<any>(
    queryKeys.leader.pipeline(), '/leaders/my-talent-pipeline', { staleTime: STALE_TIME.DYNAMIC },
  );
  if (loading) return <Skeleton />;

  const sections = [
    { key: 'hipos',          label: '🌟 High Potentials',       bg: 'bg-amber-50', border: 'border-amber-200' },
    { key: 'promotionReady', label: '🚀 Prontos para Promoção', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { key: 'developing',     label: '📈 Em Desenvolvimento',    bg: 'bg-blue-50',   border: 'border-blue-200' },
    { key: 'atRisk',         label: '⚠️ Em Risco',              bg: 'bg-red-50',    border: 'border-red-200' },
  ];

  return (
    <div className="space-y-4">
      {sections.map(s => {
        const items = (data as any)?.[s.key] ?? [];
        if (!items.length) return null;
        return (
          <div key={s.key} className={`${s.bg} border ${s.border} rounded-xl p-4`}>
            <h4 className="font-semibold text-slate-700 mb-3">{s.label} ({items.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {(items as any[]).map((u: any, i: number) => (
                <div key={i} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2.5 border border-white">
                  <Avatar name={u.user.fullName} url={u.user.avatarUrl} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{u.user.fullName}</p>
                    <p className="text-[10px] text-slate-400">{u.user.position?.name}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-bold text-slate-700">{u.score?.toFixed(1) ?? '–'}</p>
                    <p className="text-slate-400">score</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {!(data?.hipos?.length || data?.promotionReady?.length || data?.atRisk?.length) && (
        <div className="py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-100">
          <Award size={36} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Sem dados de talent pipeline disponíveis</p>
        </div>
      )}
    </div>
  );
}

// ─── Plans Tab ────────────────────────────────────────────────────

function PlansTab() {
  const { data = [], isLoading: loading } = useApiQuery<any[]>(
    queryKeys.leader.plans(), '/leaders/my-team-plans', { staleTime: STALE_TIME.DYNAMIC },
  );

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-3">
      {data.map((p: any, i: number) => (
        <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4">
          <Avatar name={p.user?.fullName ?? '?'} url={p.user?.avatarUrl} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-semibold text-slate-800 truncate">{p.user?.fullName}</p>
              <span className="text-base shrink-0">{p.health}</span>
            </div>
            <p className="text-xs text-slate-500 truncate">{p.name}</p>
            <div className="flex justify-between text-[10px] mt-1 mb-0.5">
              <span className="text-slate-400">{p.actCompleted}/{p.totalActions} acções</span>
              <span className="font-bold text-slate-600">{p.progress}%</span>
            </div>
            <ProgressBar value={p.progress}
              color={p.progress >= 75 ? 'bg-emerald-500' : p.progress >= 40 ? 'bg-amber-400' : 'bg-red-400'} />
          </div>
          <button onClick={() => { void apiClient.patch(`/leaders/plans/${p.id}/approve`, {}).catch(() => {}); }}
            className="shrink-0 text-xs px-3 py-1.5 border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50">
            Aprovar
          </button>
        </div>
      ))}
      {data.length === 0 && (
        <div className="py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-100">
          <Target size={36} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Sem PDIs activos na equipa</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'dashboard',   label: 'Dashboard',    icon: TrendingUp },
  { id: 'team',        label: 'Equipa',       icon: Users },
  { id: 'performance', label: 'Performance',  icon: Star },
  { id: 'pipeline',    label: 'Talentos',     icon: Award },
  { id: 'plans',       label: 'PDIs',         icon: Target },
];

export default function LeaderPage() {
  const [tab, setTab] = useState<Tab>('dashboard');

  const PANELS: Record<Tab, JSX.Element> = {
    dashboard:   <DashboardTab />,
    team:        <TeamTab />,
    performance: <PerformanceTab />,
    pipeline:    <TalentPipelineTab />,
    plans:       <PlansTab />,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-teal-100 rounded-lg"><Users size={18} className="text-teal-700" /></div>
              <h1 className="text-xl font-bold text-slate-800">Leader Hub</h1>
            </div>
            <p className="text-sm text-slate-400">Gestão de equipa · Performance · PDIs · Talent Pipeline · Recomendações IA</p>
          </div>
          <button onClick={() => window.location.reload()}
            className="p-2 bg-white border border-slate-200 rounded-lg hover:border-slate-300">
            <RefreshCw size={15} className="text-slate-500" />
          </button>
        </div>
      </div>

      <div className="bg-white border-b border-slate-200 px-6">
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tab === t.id ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
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































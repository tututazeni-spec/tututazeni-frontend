'use client';
// src/app/(dashboard)/engagement/page.tsx

import { useState } from 'react';
import {
  Smile, BarChart2, MessageSquare, Heart, Award, Users,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Star, Zap, Target, Activity, Plus, ChevronRight,
  ThumbsUp, Meh, Frown, Send, RefreshCw, ArrowUp,
} from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApiQuery';
import { apiClient } from '../../../lib/apiClient';
import { queryKeys } from '../../../lib/queryKeys';
import { STALE_TIME } from '../../../lib/queryClient';

// ─── Types ───────────────────────────────────────────────────────

type Tab = 'overview' | 'surveys' | 'recognition' | 'feedback' | 'analytics';

interface DashboardData {
  kpis: {
    totalUsers: number; activeSurveys: number; engagementIndex: number;
    engagementTrend: number; participationRate: number; enps: number;
    totalRecognitions: number; totalFeedback: number; engagementLevel: string;
  };
  engagementHistory: { surveyId: number; title: string; avgScore: number; responses: number; date: string }[];
  enpsBreakdown: { enps: number; promoterPct: number; detractorPct: number; total: number; label: string };
  recentRecognitions: any[];
}

interface MySummary {
  pendingSurveys: number; surveys: any[];
  recognitionsReceived: number; xpPoints: number;
  lastMood: number | null; humanSuccessScore: number; hssGrade: string;
}

// ─── Helpers ─────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  EXCELLENT: { label: 'Excelente',     color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  GOOD:      { label: 'Bom',           color: 'text-teal-700',    bg: 'bg-teal-50 border-teal-200' },
  FAIR:      { label: 'Razoável',      color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
  AT_RISK:   { label: 'Em Risco',      color: 'text-red-700',     bg: 'bg-red-50 border-red-200' },
};

const GRADE_COLOR: Record<string, string> = {
  A: 'text-emerald-600 border-emerald-400',
  B: 'text-teal-600 border-teal-400',
  C: 'text-amber-600 border-amber-400',
  D: 'text-red-600 border-red-400',
};

const MOOD_EMOJI: Record<number, string> = { 5: '😄', 4: '🙂', 3: '😐', 2: '😔', 1: '😞' };
const MOOD_LABEL: Record<number, string> = { 5: 'Óptimo', 4: 'Bem', 3: 'Normal', 2: 'Triste', 1: 'Péssimo' };

function ProgressBar({ value, color = 'bg-indigo-500', height = 'h-1.5' }: {
  value: number; color?: string; height?: string;
}) {
  return (
    <div className={`w-full ${height} bg-slate-100 rounded-full`}>
      <div className={`${height} ${color} rounded-full transition-all`}
        style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

function Avatar({ name, url, size = 8 }: { name: string; url?: string; size?: number }) {
  const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  return url
    ? <img src={url} alt={name} className={`w-${size} h-${size} rounded-full object-cover`} />
    : <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-violet-500 to-pink-500
        flex items-center justify-center text-white font-semibold text-xs`}>{initials}</div>;
}

function KpiCard({ icon: Icon, label, value, sub, color = 'text-indigo-600', bg = 'bg-indigo-50', trend }: {
  icon: any; label: string; value: string | number; sub?: string;
  color?: string; bg?: string; trend?: number;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${bg}`}><Icon size={18} className={color} /></div>
        {trend !== undefined && (
          <span className={`text-xs font-medium flex items-center gap-0.5 ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function Skeleton() {
  return <div className="space-y-4 animate-pulse">{[...Array(3)].map((_, i) => (
    <div key={i} className="bg-slate-100 rounded-xl h-24" />))}</div>;
}

// ─── Mood Quick Check-in ─────────────────────────────────────────

function MoodCheckin({ onDone }: { onDone: () => void }) {
  const [selected, setSelected]   = useState<number | null>(null);
  const [note, setNote]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]           = useState(false);

  const submit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await apiClient.post('/engagement/mood/checkin', {
        mood: selected, note: note || undefined,
      });
      setDone(true);
      onDone();
    } catch {} finally { setSubmitting(false); }
  };

  if (done) return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
      <CheckCircle size={20} className="text-emerald-500" />
      <p className="text-sm text-emerald-700 font-medium">Check-in registado! +5 XP 🎉</p>
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-violet-50 to-pink-50 border border-violet-100 rounded-xl p-5">
      <p className="text-sm font-semibold text-slate-700 mb-3">
        💫 Como te sentes hoje?
      </p>
      <div className="flex gap-3 mb-3">
        {[5, 4, 3, 2, 1].map(m => (
          <button key={m} onClick={() => setSelected(m)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
              selected === m ? 'border-violet-500 bg-white scale-110 shadow-md' : 'border-transparent hover:border-violet-200'}`}>
            <span className="text-2xl">{MOOD_EMOJI[m]}</span>
            <span className="text-[10px] text-slate-500">{MOOD_LABEL[m]}</span>
          </button>
        ))}
      </div>
      {selected && (
        <div className="flex gap-2 mt-2">
          <input value={note} onChange={e => setNote(e.target.value)}
            placeholder="Nota opcional (não é obrigatório)..."
            className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-400" />
          <button onClick={submit} disabled={submitting}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700 transition-colors disabled:opacity-60">
            <Send size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────

function OverviewTab({ userId }: { userId?: number }) {
  const dashQuery = useApiQuery<DashboardData>(
    queryKeys.engagement.dashboard(), '/engagement/dashboard',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const summaryQuery = useApiQuery<MySummary>(
    queryKeys.engagement.mySummary(), '/engagement/my-summary',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const dash = dashQuery.data ?? null;
  const summary = summaryQuery.data ?? null;

  const load = () => { dashQuery.refetch(); summaryQuery.refetch(); };

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
              <p className="text-xs text-slate-500 mb-1">Engagement Score da Organização</p>
              <p className={`text-3xl font-black ${level.color}`}>{dash?.kpis.engagementIndex ?? 0}%</p>
              <span className={`text-xs font-medium ${level.color}`}>{level.label}</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Human Success Score</p>
              <div className={`w-16 h-16 rounded-full border-4 ${GRADE_COLOR[summary.hssGrade]}
                flex flex-col items-center justify-center`}>
                <span className={`text-2xl font-black ${GRADE_COLOR[summary.hssGrade].split(' ')[0]}`}>
                  {summary.hssGrade}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={Smile}       label="Engajamento"       value={`${dash?.kpis.engagementIndex ?? 0}%`}
          color="text-violet-600" bg="bg-violet-50" trend={dash?.kpis.engagementTrend} />
        <KpiCard icon={Users}       label="Participação"      value={`${dash?.kpis.participationRate ?? 0}%`}
          color="text-indigo-600" bg="bg-indigo-50" />
        <KpiCard icon={TrendingUp}  label="eNPS"              value={dash?.kpis.enps ?? 0}
          sub={dash?.enpsBreakdown.label}
          color={( dash?.kpis.enps ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}
          bg={(dash?.kpis.enps ?? 0) >= 0 ? 'bg-emerald-50' : 'bg-red-50'} />
        <KpiCard icon={Award}       label="Reconhecimentos"   value={dash?.kpis.totalRecognitions ?? 0}
          color="text-amber-600" bg="bg-amber-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* eNPS visual */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-4">eNPS Breakdown</h3>
          {dash?.enpsBreakdown && (
            <div className="space-y-3">
              {[
                { label: 'Promotores',  pct: dash.enpsBreakdown.promoterPct,  color: 'bg-emerald-500' },
                { label: 'Passivos',    pct: 100 - dash.enpsBreakdown.promoterPct - dash.enpsBreakdown.detractorPct, color: 'bg-amber-400' },
                { label: 'Detractores', pct: dash.enpsBreakdown.detractorPct, color: 'bg-red-400' },
              ].map(e => (
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
                <span className={`text-2xl font-bold ${(dash.enpsBreakdown.enps ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {dash.enpsBreakdown.enps ?? 'N/A'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Recent recognitions */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-4">🏆 Reconhecimentos Recentes</h3>
          {(dash?.recentRecognitions.length ?? 0) === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Sem reconhecimentos recentes</p>
          ) : (
            <div className="space-y-3">
              {dash?.recentRecognitions.map((r: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <Avatar name={r.from?.fullName ?? 'User'} url={r.from?.avatarUrl} size={8} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-600">
                      <span className="font-medium">{r.from?.fullName}</span>
                      {' → '}
                      <span className="font-medium">{r.to?.fullName}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{r.message}</p>
                  </div>
                  <span className="text-sm">{r.type === 'KUDOS' ? '👏' : '🏅'}</span>
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
              {summary!.surveys.length} survey{summary!.surveys.length > 1 ? 's' : ''} pendente{summary!.surveys.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="space-y-2">
            {summary!.surveys.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-slate-700">{s.title}</p>
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

// ─── Surveys Tab ─────────────────────────────────────────────────

function SurveysTab() {
  const [status, setStatus]   = useState('ACTIVE');

  const params = { limit: 30, ...(status ? { status } : {}) };
  const { data, isLoading } = useApiQuery<{ data: any[]; meta: any }>(
    queryKeys.engagement.surveys(params), '/engagement/surveys',
    { params, staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading) return <Skeleton />;

  const TYPE_ICON: Record<string, string> = {
    CLIMATE: '🌡️', PULSE: '💓', ENPS: '📊', ONBOARDING: '👋',
    OFFBOARDING: '🚪', WELLBEING: '🌿', CUSTOM: '⚙️',
  };

  const STATUS_COLOR: Record<string, string> = {
    DRAFT:     'bg-slate-100 text-slate-600',
    ACTIVE:    'bg-emerald-100 text-emerald-700',
    PAUSED:    'bg-amber-100 text-amber-700',
    COMPLETED: 'bg-blue-100 text-blue-700',
    ARCHIVED:  'bg-slate-100 text-slate-400',
  };

  return (
    <div className="space-y-4">
      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {['ACTIVE', 'DRAFT', 'COMPLETED', ''].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              status === s ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            {s || 'Todos'}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400 self-center">{data?.meta.total ?? 0} surveys</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data?.data.map((s: any) => (
          <div key={s.id} className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{TYPE_ICON[s.type] ?? '📋'}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[s.status]}`}>
                {s.status}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-slate-800 mb-1">{s.title}</h4>
            <p className="text-xs text-slate-400 mb-3 line-clamp-2">{s.description}</p>

            <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
              <span>📝 {s._count?.questions ?? 0} perguntas</span>
              <span>👥 {s._count?.responses ?? 0} respostas</span>
            </div>

            {s.status === 'ACTIVE' && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Participação</span>
                  <span className="font-semibold text-indigo-600">{s.participationRate ?? 0}%</span>
                </div>
                <ProgressBar value={s.participationRate ?? 0} color="bg-indigo-500" />
              </div>
            )}

            {s.endDate && (
              <p className="text-[10px] text-slate-400 mt-2">
                ⏳ Termina: {new Date(s.endDate).toLocaleDateString('pt')}
              </p>
            )}
          </div>
        ))}

        {(data?.data.length ?? 0) === 0 && (
          <div className="col-span-3 py-16 text-center text-slate-400">
            <BarChart2 size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhum survey encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Recognition Tab ─────────────────────────────────────────────

function RecognitionTab() {
  const [kudosMsg, setKudosMsg] = useState('');
  const [kudosTo, setKudosTo]   = useState('');

  const feedQuery = useApiQuery<{ data: any[] }>(
    queryKeys.engagement.recognitionFeed(), '/engagement/recognition/feed',
    { params: { limit: 20 }, staleTime: STALE_TIME.DYNAMIC },
  );
  const boardQuery = useApiQuery<any[]>(
    queryKeys.engagement.recognitionLeaderboard(), '/engagement/recognition/leaderboard',
    { params: { type: 'points', limit: 10 }, staleTime: STALE_TIME.SEMI_STATIC },
  );

  const feed  = feedQuery.data?.data ?? [];
  const board = boardQuery.data ?? [];

  if (feedQuery.isLoading || boardQuery.isLoading) return <Skeleton />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Feed */}
      <div className="lg:col-span-2 space-y-4">
        {/* Quick kudos box */}
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <h3 className="font-semibold text-slate-700 mb-3">👏 Dar Kudos</h3>
          <div className="flex gap-2">
            <input value={kudosTo} onChange={e => setKudosTo(e.target.value)}
              placeholder="@colaborador..."
              className="w-32 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-400" />
            <input value={kudosMsg} onChange={e => setKudosMsg(e.target.value)}
              placeholder="Escreve uma mensagem de reconhecimento..."
              className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-400" />
            <button className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700">
              Enviar 🏆
            </button>
          </div>
        </div>

        {/* Feed */}
        <div className="space-y-3">
          {feed.map((r: any, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-4">
              <div className="flex items-start gap-3">
                <Avatar name={r.from?.fullName ?? 'User'} url={r.from?.avatarUrl} size={10} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-700">{r.from?.fullName}</span>
                    <span className="text-xs text-slate-400">reconheceu</span>
                    <span className="text-sm font-semibold text-violet-700">{r.to?.fullName}</span>
                    <span className="text-xs bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full">
                      {r.type === 'KUDOS' ? '👏 Kudos' : r.type === 'ACHIEVEMENT' ? '🏆 Achievement' : r.type}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{r.message}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(r.createdAt).toLocaleDateString('pt')}
                    {r.to?.department?.name && ` · ${r.to.department.name}`}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {feed.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <Heart size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum reconhecimento ainda</p>
              <p className="text-xs">Sê o primeiro a reconhecer um colega!</p>
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 h-fit">
        <h3 className="font-semibold text-slate-700 mb-4">🏅 Leaderboard</h3>
        <div className="space-y-3">
          {board.map((u: any, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className={`w-6 text-center text-sm font-bold ${
                i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-700' : 'text-slate-400'
              }`}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
              <Avatar name={u.user?.fullName ?? 'User'} url={u.user?.avatarUrl} size={8} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{u.user?.fullName}</p>
                <p className="text-[10px] text-slate-400">{u.user?.position?.name}</p>
              </div>
              <div className="flex items-center gap-1 text-sm font-bold text-violet-600">
                <Zap size={12} className="text-amber-400" />
                {u.points ?? u.count}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Feedback Tab ────────────────────────────────────────────────

function FeedbackTab({ userId }: { userId?: number }) {
  const [type, setType]       = useState('');
  const [msg, setMsg]         = useState('');
  const [anon, setAnon]       = useState(false);

  const params = { limit: 20, ...(type ? { type } : {}) };
  const { data: resp, isLoading, refetch } = useApiQuery<{ data: any[] }>(
    queryKeys.engagement.feedback(type), '/engagement/feedback',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );
  const data = resp?.data ?? [];

  const send = async () => {
    if (!msg.trim()) return;
    await apiClient.post('/engagement/feedback', {
      type: type || 'OPEN', message: msg, anonymous: anon,
    });
    setMsg('');
    refetch();
  };

  if (isLoading) return <Skeleton />;

  const TYPE_COLOR: Record<string, string> = {
    OPEN: 'bg-blue-100 text-blue-700', ANONYMOUS: 'bg-slate-100 text-slate-600',
    PEER: 'bg-violet-100 text-violet-700', MANAGER: 'bg-amber-100 text-amber-700',
    RECOGNITION: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div className="space-y-4">
      {/* New feedback box */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <h3 className="font-semibold text-slate-700 mb-3">💬 Novo Feedback</h3>
        <div className="flex gap-2 mb-3">
          {['OPEN', 'PEER', 'MANAGER'].map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                type === t ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500'}`}>
              {t}
            </button>
          ))}
        </div>
        <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={3}
          placeholder="Escreve o teu feedback..."
          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none
            focus:border-indigo-400 resize-none" />
        <div className="flex items-center justify-between mt-2">
          <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
            <input type="checkbox" checked={anon} onChange={e => setAnon(e.target.checked)}
              className="rounded" />
            Enviar anonimamente
          </label>
          <button onClick={send}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
            Enviar
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['', 'OPEN', 'ANONYMOUS', 'PEER', 'MANAGER'].map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              type === t ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            {t || 'Todos'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {data.map((f: any, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-100 p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Avatar name={f.from?.fullName ?? 'Anónimo'} url={f.from?.avatarUrl} size={8} />
                <div>
                  <p className="text-sm font-medium text-slate-700">{f.from?.fullName ?? 'Anónimo'}</p>
                  <p className="text-[10px] text-slate-400">{new Date(f.createdAt).toLocaleDateString('pt')}</p>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[f.type] ?? ''}`}>
                {f.type}
              </span>
            </div>
            <p className="text-sm text-slate-600 ml-10">{f.message}</p>
            {f.reply && (
              <div className="mt-2 ml-10 p-2 bg-slate-50 rounded-lg border-l-2 border-indigo-400">
                <p className="text-xs text-slate-500">Resposta:</p>
                <p className="text-xs text-slate-700">{f.reply}</p>
              </div>
            )}
          </div>
        ))}
        {data.length === 0 && (
          <div className="py-12 text-center text-slate-400">
            <MessageSquare size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum feedback encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Analytics Tab ───────────────────────────────────────────────

function AnalyticsTab() {
  const [metric, setMetric]   = useState<'score' | 'participation' | 'mood'>('score');

  const indexQuery = useApiQuery<any>(
    queryKeys.engagement.index(), '/engagement/index',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const heatmapQuery = useApiQuery<any[]>(
    queryKeys.engagement.heatmap(metric), '/engagement/heatmap',
    { params: { metric }, staleTime: STALE_TIME.SEMI_STATIC },
  );

  const index   = indexQuery.data ?? null;
  const heatmap = heatmapQuery.data ?? [];

  const LEVEL_BAR = { EXCELLENT: 'bg-emerald-500', GOOD: 'bg-teal-500', FAIR: 'bg-amber-400', AT_RISK: 'bg-red-400' };

  if (indexQuery.isLoading || heatmapQuery.isLoading) return <Skeleton />;

  return (
    <div className="space-y-6">
      {/* Engagement index card */}
      {index && (
        <div className={`rounded-xl border p-5 ${LEVEL_CONFIG[index.level]?.bg ?? 'bg-slate-50'}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">Índice de Engajamento</p>
              <p className={`text-4xl font-black ${LEVEL_CONFIG[index.level]?.color ?? ''}`}>
                {index.currentIndex}%
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs flex items-center gap-1 ${index.trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {index.trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(index.trend).toFixed(1)} pts vs. anterior
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Participação</p>
              <p className="text-2xl font-bold text-slate-700">{index.latestParticipation}%</p>
              <p className="text-xs text-slate-400">{index.totalUsers} colaboradores</p>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {(index?.history.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-4">Histórico de Surveys</h3>
          <div className="space-y-3">
            {index!.history.map((h: any, i: number) => (
              <div key={i} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{h.title}</p>
                  <p className="text-[10px] text-slate-400">{h.responses} respostas · {new Date(h.date).toLocaleDateString('pt')}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-24">
                    <ProgressBar value={h.avgScore * 20}
                      color={h.avgScore >= 4 ? 'bg-emerald-500' : h.avgScore >= 3 ? 'bg-teal-500' : h.avgScore >= 2 ? 'bg-amber-400' : 'bg-red-400'} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 w-8 text-right">{h.avgScore}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Heatmap */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-700">Heatmap por Departamento</h3>
          <div className="flex gap-1">
            {(['score', 'participation', 'mood'] as const).map(m => (
              <button key={m} onClick={() => setMetric(m)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  metric === m ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {m === 'score' ? 'Score' : m === 'participation' ? 'Participação' : 'Humor'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {heatmap.map((row: any, i: number) => {
            const v = row.value;
            const pct = metric === 'score' ? (v !== null ? (v / 5) * 100 : null)
              : metric === 'mood' ? (v !== null ? (v / 5) * 100 : null)
              : v;
            const color = pct === null ? 'bg-slate-100' :
              pct >= 75 ? 'bg-emerald-500' :
              pct >= 50 ? 'bg-teal-400' :
              pct >= 30 ? 'bg-amber-400' : 'bg-red-400';

            return (
              <div key={i} className="flex items-center gap-3">
                <p className="text-xs text-slate-600 w-32 truncate">{row.department}</p>
                <div className="flex-1 h-5 bg-slate-100 rounded">
                  {pct !== null && (
                    <div className={`h-5 ${color} rounded text-[10px] text-white flex items-center px-2`}
                      style={{ width: `${pct}%` }}>
                      {v?.toFixed ? v.toFixed(1) : v ?? '–'}
                    </div>
                  )}
                </div>
                {pct === null && <span className="text-xs text-slate-400">Sem dados</span>}
              </div>
            );
          })}

          {heatmap.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">Sem dados disponíveis</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'overview',    label: 'Visão Geral',    icon: Smile },
  { id: 'surveys',     label: 'Surveys',        icon: BarChart2 },
  { id: 'recognition', label: 'Reconhecimento', icon: Award },
  { id: 'feedback',    label: 'Feedback',       icon: MessageSquare },
  { id: 'analytics',   label: 'Analytics',      icon: Activity },
];

export default function EngagementPage() {
  const [tab, setTab] = useState<Tab>('overview');

  const TAB_COMPONENTS: Record<Tab, JSX.Element> = {
    overview:    <OverviewTab />,
    surveys:     <SurveysTab />,
    recognition: <RecognitionTab />,
    feedback:    <FeedbackTab />,
    analytics:   <AnalyticsTab />,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-violet-100 rounded-lg">
                <Smile size={18} className="text-violet-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">Engagement</h1>
            </div>
            <p className="text-sm text-slate-400">
              Surveys · Reconhecimento · Feedback · Mood · Analytics
            </p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200
              text-slate-600 text-sm rounded-lg hover:border-violet-300 transition-colors">
              <RefreshCw size={14} />
              Actualizar
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white
              text-sm rounded-lg hover:bg-violet-700 transition-colors">
              <Plus size={14} />
              Novo Survey
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap
                  border-b-2 transition-colors ${
                    tab === t.id
                      ? 'border-violet-600 text-violet-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
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
'use client';
// src/app/(dashboard)/avatar-training/page.tsx

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bot, Play, Star, TrendingUp, Award, Zap, Users, Target,
  MessageSquare, BarChart2, Clock, CheckCircle, ChevronRight,
  Mic, Send, X, Brain, Shield, Headphones, Trophy, Flame,
  RefreshCw, ArrowRight, AlertTriangle, Volume2,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────

type Tab = 'home' | 'scenarios' | 'session' | 'history' | 'leaderboard' | 'analytics';

interface Scenario {
  id: number; title: string; description?: string; category: string;
  difficulty: string; estimatedMinutes?: number; xpReward?: number;
  thumbnailUrl?: string; completions?: number; avgScore?: number;
  bestSession?: { score: number } | null;
  competency?: { name: string };
}

interface SessionMessage {
  role: 'USER' | 'AVATAR' | 'SYSTEM';
  content: string; timestamp: string;
  score?: number; behavioral?: Record<string, number>;
}

interface ActiveSession {
  id: number; scenarioId: number;
  conversationHistory: SessionMessage[];
  scenario: { title: string; objective?: string; turns: any[] };
  openingMessage?: string;
  avatar?: { name: string; avatarImageUrl?: string; role: string };
}

// ─── Helpers ─────────────────────────────────────────────────────

const BASE = '/api';
async function api(path: string, opts?: RequestInit) {
  const r = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` },
    ...opts,
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  SOFT_SKILLS:     { label: 'Soft Skills',     icon: Brain,     color: 'text-violet-600', bg: 'bg-violet-50' },
  SALES:           { label: 'Vendas',          icon: TrendingUp,color: 'text-emerald-600',bg: 'bg-emerald-50' },
  CUSTOMER_SERVICE:{ label: 'Atendimento',     icon: Headphones,color: 'text-blue-600',   bg: 'bg-blue-50' },
  ONBOARDING:      { label: 'Onboarding',      icon: Users,     color: 'text-teal-600',   bg: 'bg-teal-50' },
  COMPLIANCE:      { label: 'Compliance',      icon: Shield,    color: 'text-red-600',    bg: 'bg-red-50' },
  LEADERSHIP:      { label: 'Liderança',       icon: Star,      color: 'text-amber-600',  bg: 'bg-amber-50' },
  NEGOTIATION:     { label: 'Negociação',      icon: MessageSquare, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  SECURITY:        { label: 'Segurança',       icon: Shield,    color: 'text-slate-600',  bg: 'bg-slate-50' },
};

const DIFF_COLOR: Record<string, string> = {
  BEGINNER:     'bg-emerald-100 text-emerald-700',
  INTERMEDIATE: 'bg-amber-100 text-amber-700',
  ADVANCED:     'bg-orange-100 text-orange-700',
  EXPERT:       'bg-red-100 text-red-700',
};

const SCORE_COLOR = (s: number) =>
  s >= 90 ? 'text-emerald-600' : s >= 75 ? 'text-teal-600' :
  s >= 60 ? 'text-amber-600'  : 'text-red-500';

function ProgressBar({ value, color = 'bg-indigo-500', height = 'h-1.5' }: {
  value: number; color?: string; height?: string;
}) {
  return (
    <div className={`w-full ${height} bg-slate-100 rounded-full`}>
      <div className={`${height} ${color} rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

function Skeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(count)].map((_, i) => <div key={i} className="bg-slate-100 rounded-xl h-28" />)}
    </div>
  );
}

// ─── Scenario Card ────────────────────────────────────────────────

function ScenarioCard({ scenario, onStart }: { scenario: Scenario; onStart: (s: Scenario) => void }) {
  const cat  = CATEGORY_CONFIG[scenario.category] ?? CATEGORY_CONFIG.SOFT_SKILLS;
  const Icon = cat.icon;
  const done = scenario.bestSession?.score ?? null;

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-lg
      transition-all group">
      {/* Thumbnail */}
      <div className={`h-32 ${cat.bg} flex items-center justify-center relative`}>
        {scenario.thumbnailUrl
          ? <img src={scenario.thumbnailUrl} className="w-full h-full object-cover" alt="" />
          : <Icon size={40} className={`${cat.color} opacity-40`} />
        }
        {done !== null && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90
            rounded-full px-2 py-0.5 text-xs font-bold text-emerald-700">
            <CheckCircle size={10} />{done}%
          </div>
        )}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity
          flex items-center justify-center">
          <button onClick={() => onStart(scenario)}
            className="flex items-center gap-2 px-5 py-2 bg-white text-slate-800 rounded-full
              font-semibold text-sm shadow-lg hover:shadow-xl">
            <Play size={14} className="ml-0.5" />
            Iniciar
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${DIFF_COLOR[scenario.difficulty]}`}>
            {scenario.difficulty}
          </span>
          <span className={`text-[10px] font-medium ${cat.color}`}>{cat.label}</span>
          {scenario.competency && (
            <span className="text-[10px] text-slate-400 ml-auto truncate">{scenario.competency.name}</span>
          )}
        </div>

        <h4 className="text-sm font-semibold text-slate-800 line-clamp-2 mb-2">{scenario.title}</h4>

        <div className="flex items-center gap-3 text-[10px] text-slate-400">
          {scenario.estimatedMinutes && (
            <span className="flex items-center gap-0.5"><Clock size={10} />{scenario.estimatedMinutes} min</span>
          )}
          {scenario.xpReward && (
            <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
              <Zap size={10} />+{scenario.xpReward} XP
            </span>
          )}
          {scenario.avgScore !== null && scenario.avgScore !== undefined && (
            <span className="flex items-center gap-0.5 ml-auto">
              <Star size={10} className="text-amber-400 fill-amber-400" />
              {scenario.avgScore}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Chat Session UI ──────────────────────────────────────────────

function ChatSession({
  session, onComplete, onClose,
}: {
  session: ActiveSession; onComplete: (result: any) => void; onClose: () => void;
}) {
  const [messages, setMessages] = useState<SessionMessage[]>(session.conversationHistory ?? []);
  const [input, setInput]       = useState('');
  const [sending, setSending]   = useState(false);
  const [runningScore, setRunningScore] = useState<number | null>(null);
  const [isLastTurn, setIsLastTurn]     = useState(false);
  const [completing, setCompleting]     = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    const userMsg: SessionMessage = { role: 'USER', content: input, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const r = await api(`/avatar-training/sessions/${session.id}/message`, {
        method: 'POST',
        body: JSON.stringify({ message: input, turnIndex: messages.filter(m => m.role === 'USER').length }),
      });

      const avatarMsg: SessionMessage = {
        role: 'AVATAR', content: r.avatarResponse, timestamp: new Date().toISOString(),
        score: r.turnScore, behavioral: r.behavioral,
      };
      setMessages(prev => [...prev, avatarMsg]);
      setRunningScore(r.runningScore);
      setIsLastTurn(r.isLastTurn);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'SYSTEM', content: '⚠️ Erro na comunicação', timestamp: new Date().toISOString() }]);
    } finally {
      setSending(false);
    }
  };

  const complete = async () => {
    setCompleting(true);
    try {
      const r = await api(`/avatar-training/sessions/${session.id}/complete`, {
        method: 'POST',
        body: JSON.stringify({ score: runningScore ?? undefined }),
      });
      onComplete(r);
    } catch {} finally { setCompleting(false); }
  };

  const avatarName  = session.avatar?.name ?? 'Avatar';
  const avatarImage = session.avatar?.avatarImageUrl;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600
            flex items-center justify-center overflow-hidden shrink-0">
            {avatarImage
              ? <img src={avatarImage} alt={avatarName} className="w-full h-full object-cover" />
              : <Bot size={18} className="text-white" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">{avatarName}</p>
            <p className="text-xs text-slate-400 truncate">{session.scenario.title}</p>
          </div>
          {runningScore !== null && (
            <div className="text-center px-3 py-1 rounded-lg bg-indigo-50">
              <p className={`text-lg font-bold ${SCORE_COLOR(runningScore)}`}>{runningScore}</p>
              <p className="text-[9px] text-slate-400">Score</p>
            </div>
          )}
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        {/* Objective */}
        {session.scenario.objective && (
          <div className="px-5 py-2 bg-indigo-50 border-b border-indigo-100">
            <p className="text-xs text-indigo-700">
              🎯 <span className="font-medium">Objectivo:</span> {session.scenario.objective}
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'USER' ? 'justify-end' : 'justify-start'} gap-2`}>
              {m.role === 'AVATAR' && (
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={12} className="text-white" />
                </div>
              )}
              <div className={`max-w-[80%] ${m.role === 'SYSTEM' ? 'mx-auto' : ''}`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'USER'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : m.role === 'SYSTEM'
                    ? 'bg-slate-100 text-slate-500 text-xs text-center'
                    : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                }`}>
                  {m.content}
                </div>
                {m.role === 'AVATAR' && m.score !== undefined && (
                  <div className="flex items-center gap-2 mt-1 px-1">
                    <span className={`text-[10px] font-bold ${SCORE_COLOR(m.score)}`}>
                      Score: {m.score}
                    </span>
                    {m.behavioral && (
                      <div className="flex gap-1">
                        {Object.entries(m.behavioral).slice(0, 3).map(([k, v]) => (
                          <span key={k} className="text-[9px] text-slate-400">
                            {k.slice(0, 3)}: {v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center">
                <Bot size={12} className="text-white" />
              </div>
              <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-2.5">
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-100 p-4">
          {isLastTurn ? (
            <button onClick={complete} disabled={completing}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold
                hover:bg-emerald-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              <CheckCircle size={16} />
              {completing ? 'A concluir…' : 'Concluir Sessão e Ver Resultados'}
            </button>
          ) : (
            <div className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Escreve a tua resposta..."
                className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl
                  focus:outline-none focus:border-indigo-400" />
              <button onClick={send} disabled={sending || !input.trim()}
                className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700
                  disabled:opacity-40 transition-colors">
                <Send size={16} />
              </button>
              <button onClick={complete} disabled={completing}
                className="px-3 py-2 border border-slate-200 text-slate-600 text-xs rounded-xl hover:bg-slate-50">
                Concluir
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Results Modal ────────────────────────────────────────────────

function ResultsModal({ result, onClose, onRetry, onNext }: {
  result: any; onClose: () => void; onRetry: () => void; onNext?: () => void;
}) {
  const score = result.finalScore ?? 0;
  const grade = result.grade ?? 'AVERAGE';

  const GRADE_CONFIG: Record<string, { emoji: string; color: string; label: string }> = {
    EXCEPTIONAL:    { emoji: '🏆', color: 'text-emerald-600', label: 'Excepcional' },
    ABOVE_AVERAGE:  { emoji: '⭐', color: 'text-teal-600',    label: 'Acima Média' },
    AVERAGE:        { emoji: '👍', color: 'text-amber-600',   label: 'Médio' },
    BELOW_AVERAGE:  { emoji: '📈', color: 'text-orange-600',  label: 'Abaixo Média' },
    NEEDS_IMPROVEMENT: { emoji: '🎯', color: 'text-red-600', label: 'Melhorar' },
  };

  const g = GRADE_CONFIG[grade] ?? GRADE_CONFIG.AVERAGE;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        {/* Score */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">{g.emoji}</div>
          <p className={`text-5xl font-black ${g.color}`}>{score}</p>
          <p className="text-lg font-semibold text-slate-700 mt-1">{g.label}</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="flex items-center gap-1 text-amber-500 font-bold text-sm">
              <Zap size={14} />+{result.xpEarned} XP
            </span>
            {result.durationSeconds && (
              <span className="flex items-center gap-1 text-slate-400 text-xs">
                <Clock size={12} />{Math.round(result.durationSeconds / 60)} min
              </span>
            )}
          </div>
        </div>

        {/* Behavioral scores */}
        {result.behavioral && Object.keys(result.behavioral).length > 0 && (
          <div className="mb-4 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Comportamental</p>
            {Object.entries(result.behavioral as Record<string, number>).map(([k, v]) => (
              <div key={k}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-slate-600 capitalize">{k}</span>
                  <span className={`font-bold ${SCORE_COLOR(+v)}`}>{+v}</span>
                </div>
                <ProgressBar value={+v}
                  color={+v >= 70 ? 'bg-emerald-500' : +v >= 50 ? 'bg-amber-400' : 'bg-red-400'} />
              </div>
            ))}
          </div>
        )}

        {/* Strengths / Improvements */}
        {(result.strengths?.length > 0 || result.improvements?.length > 0) && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {result.strengths?.length > 0 && (
              <div className="bg-emerald-50 rounded-xl p-3">
                <p className="text-xs font-bold text-emerald-700 mb-1">💪 Pontos Fortes</p>
                {result.strengths.slice(0, 2).map((s: string, i: number) => (
                  <p key={i} className="text-[10px] text-emerald-700">• {s}</p>
                ))}
              </div>
            )}
            {result.improvements?.length > 0 && (
              <div className="bg-amber-50 rounded-xl p-3">
                <p className="text-xs font-bold text-amber-700 mb-1">🎯 Melhorar</p>
                {result.improvements.slice(0, 2).map((s: string, i: number) => (
                  <p key={i} className="text-[10px] text-amber-700">• {s}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={onRetry}
            className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm rounded-xl hover:bg-slate-50">
            <RefreshCw size={13} className="inline mr-1" />Repetir
          </button>
          {result.nextScenario && (
            <button onClick={onNext}
              className="flex-1 py-2.5 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700">
              Próximo<ArrowRight size={13} className="inline ml-1" />
            </button>
          )}
          <button onClick={onClose}
            className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm rounded-xl hover:bg-slate-50">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Home Tab ─────────────────────────────────────────────────────

function HomeTab({ onStartScenario }: { onStartScenario: (s: Scenario) => void }) {
  const [recommended, setRecommended] = useState<Scenario[]>([]);
  const [history, setHistory]         = useState<any | null>(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    Promise.all([
      api('/avatar-training/scenarios/recommended?limit=4'),
      api('/avatar-training/my-history?limit=5'),
    ]).then(([rec, hist]) => { setRecommended(rec ?? []); setHistory(hist); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-6">
      {/* Stats strip */}
      {history && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Sessões',   value: history.stats.total,     icon: Play,       color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Concluídas',value: history.stats.completed, icon: CheckCircle,color: 'text-emerald-600',bg: 'bg-emerald-50' },
            { label: 'Score Médio',value: history.stats.avgScore ?? '–', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Streak',    value: `${history.stats.streak}🔥`, icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-3">
              <div className={`p-1.5 rounded-lg ${s.bg} w-fit mb-2`}><s.icon size={14} className={s.color} /></div>
              <p className="text-xl font-bold text-slate-800">{s.value}</p>
              <p className="text-[10px] text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Treina com IA</h2>
            <p className="text-indigo-200 text-sm">Cenários imersivos com avatares inteligentes</p>
          </div>
        </div>
        <p className="text-indigo-100 text-sm mb-4">
          Pratica soft skills, vendas, liderança e compliance com feedback comportamental em tempo real.
        </p>
        <div className="flex gap-2">
          <span className="text-[10px] bg-white/20 px-2 py-1 rounded-full">🎭 Roleplay</span>
          <span className="text-[10px] bg-white/20 px-2 py-1 rounded-full">🧠 Avaliação IA</span>
          <span className="text-[10px] bg-white/20 px-2 py-1 rounded-full">⚡ XP + Badges</span>
          <span className="text-[10px] bg-white/20 px-2 py-1 rounded-full">📊 Analytics</span>
        </div>
      </div>

      {/* Recommended */}
      <div>
        <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Target size={16} className="text-indigo-500" />
          Recomendados para ti
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {recommended.map(s => <ScenarioCard key={s.id} scenario={s} onStart={onStartScenario} />)}
          {recommended.length === 0 && (
            <div className="col-span-4 py-8 text-center text-slate-400 text-sm">
              Sem recomendações — completa o teu perfil de competências
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Scenarios Tab ────────────────────────────────────────────────

function ScenariosTab({ onStart }: { onStart: (s: Scenario) => void }) {
  const [data, setData]         = useState<{ data: Scenario[]; meta: any } | null>(null);
  const [loading, setLoading]   = useState(true);
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [search, setSearch]     = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ limit: '30',
      ...(category   ? { category }   : {}),
      ...(difficulty ? { difficulty } : {}),
      ...(search     ? { search }     : {}),
    });
    api(`/avatar-training/scenarios?${p}`).then(setData).finally(() => setLoading(false));
  }, [category, difficulty, search]);

  useEffect(() => { load(); }, [load]);

  const DIFFS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 flex flex-wrap gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Pesquisar cenários..."
          className="flex-1 min-w-[180px] text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-400" />

        <select value={category} onChange={e => setCategory(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-2 py-2 focus:outline-none">
          <option value="">Todas as categorias</option>
          {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>

        <div className="flex gap-1">
          {['', ...DIFFS].map(d => (
            <button key={d} onClick={() => setDifficulty(d)}
              className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                difficulty === d ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {d || 'Todos'}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 self-center ml-auto">{data?.meta.total ?? 0} cenários</span>
      </div>

      {loading ? <Skeleton count={6} /> : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {data?.data.map(s => <ScenarioCard key={s.id} scenario={s} onStart={onStart} />)}
          {(data?.data.length ?? 0) === 0 && (
            <div className="col-span-4 py-16 text-center text-slate-400">
              <Bot size={40} className="mx-auto mb-3 opacity-30" />
              <p>Nenhum cenário encontrado</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── History Tab ──────────────────────────────────────────────────

function HistoryTab() {
  const [data, setData]   = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/avatar-training/my-history?limit=30').then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  const STATUS_COLOR: Record<string, string> = {
    COMPLETED:   'bg-emerald-100 text-emerald-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    PAUSED:      'bg-amber-100 text-amber-700',
    ABANDONED:   'bg-slate-100 text-slate-500',
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      {data?.stats && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total', value: data.stats.total },
            { label: 'Concluídas', value: data.stats.completed },
            { label: 'Score Médio', value: data.stats.avgScore ?? '–' },
            { label: 'XP Total', value: data.stats.totalXP },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-3 text-center">
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-100">
        <div className="divide-y divide-slate-50">
          {(data?.sessions ?? []).map((s: any) => {
            const cat = CATEGORY_CONFIG[(s.scenario as any)?.category] ?? CATEGORY_CONFIG.SOFT_SKILLS;
            const Icon = cat.icon;
            return (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                <div className={`p-2 rounded-lg ${cat.bg} shrink-0`}><Icon size={14} className={cat.color} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{(s.scenario as any)?.title}</p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(s.startedAt).toLocaleDateString('pt')}
                    {(s.scenario as any)?.competency && ` · ${(s.scenario as any).competency.name}`}
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[s.status]}`}>
                  {s.status}
                </span>
                {s.score !== null && s.score !== undefined && (
                  <span className={`text-sm font-bold ${SCORE_COLOR(s.score)} w-10 text-right`}>
                    {s.score}
                  </span>
                )}
              </div>
            );
          })}
          {(data?.sessions?.length ?? 0) === 0 && (
            <div className="py-12 text-center text-slate-400">
              <Play size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sem sessões ainda — começa um cenário!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Leaderboard Tab ─────────────────────────────────────────────

function LeaderboardTab() {
  const [data, setData]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/avatar-training/leaderboard').then(r => setData(r ?? [])).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  return (
    <div className="bg-white rounded-xl border border-slate-100">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
          <Trophy size={16} className="text-amber-500" />
          Ranking Global
        </h3>
      </div>
      <div className="divide-y divide-slate-50">
        {data.map((u: any) => (
          <div key={u.rank} className="flex items-center gap-3 px-5 py-3">
            <span className={`w-8 text-center font-bold text-sm ${
              u.rank === 1 ? 'text-amber-500' : u.rank === 2 ? 'text-slate-400' : u.rank === 3 ? 'text-amber-700' : 'text-slate-400'
            }`}>
              {u.rank === 1 ? '🥇' : u.rank === 2 ? '🥈' : u.rank === 3 ? '🥉' : `#${u.rank}`}
            </span>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600
              flex items-center justify-center text-white text-xs font-bold shrink-0">
              {u.user?.fullName?.split(' ')[0]?.[0] ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700">{u.user?.fullName}</p>
              <p className="text-[10px] text-slate-400">{u.user?.department?.name}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold ${SCORE_COLOR(u.avgScore ?? 0)}`}>{u.avgScore ?? u.score}</p>
              <p className="text-[10px] text-slate-400">{u.sessions ?? ''} sessões</p>
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <div className="py-12 text-center text-slate-400">
            <Trophy size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sem dados de ranking ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────

function AnalyticsTab() {
  const [data, setData]   = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/avatar-training/analytics/dashboard').then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Cenários', value: data?.kpis.totalScenarios, icon: Bot, color: 'text-indigo-600' },
          { label: 'Em Progresso', value: data?.kpis.activeSessions, icon: Play, color: 'text-blue-600' },
          { label: 'Concluídas', value: data?.kpis.completedSessions, icon: CheckCircle, color: 'text-emerald-600' },
          { label: 'Score Médio', value: data?.kpis.avgScore ?? '–', icon: Star, color: 'text-amber-600' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-100 p-4">
            <div className="flex items-center gap-2 mb-1"><k.icon size={15} className={k.color} /></div>
            <p className="text-2xl font-bold text-slate-800">{k.value ?? 0}</p>
            <p className="text-xs text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top scenarios */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-3">Top Cenários</h3>
          <div className="space-y-3">
            {(data?.topScenarios ?? []).map((s: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-slate-300 font-bold w-4">#{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{s.scenario?.title}</p>
                  <p className="text-[10px] text-slate-400">{s.completions} sessões</p>
                </div>
                <span className={`text-sm font-bold ${SCORE_COLOR(s.avgScore ?? 0)}`}>
                  {s.avgScore ?? '–'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* By category */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-3">Por Categoria</h3>
          <div className="space-y-2">
            {(data?.categoryBreakdown ?? []).map((c: any) => {
              const total = (data?.categoryBreakdown ?? []).reduce((a: number, x: any) => a + x.count, 0);
              const pct   = total > 0 ? Math.round((c.count / total) * 100) : 0;
              const cat   = CATEGORY_CONFIG[c.category] ?? CATEGORY_CONFIG.SOFT_SKILLS;
              return (
                <div key={c.category}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-slate-600">{cat.label}</span>
                    <span className="font-semibold text-slate-700">{c.count} ({pct}%)</span>
                  </div>
                  <ProgressBar value={pct} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent completions */}
      {(data?.recentCompletions?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-3">Conclusões Recentes</h3>
          <div className="flex flex-wrap gap-2">
            {data.recentCompletions.map((s: any, i: number) => (
              <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                <CheckCircle size={12} className="text-emerald-500" />
                <div>
                  <p className="text-xs font-medium text-slate-700">{s.user?.fullName}</p>
                  <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{s.scenario?.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'home',        label: 'Início',      icon: Bot },
  { id: 'scenarios',   label: 'Cenários',    icon: Play },
  { id: 'history',     label: 'Histórico',   icon: Clock },
  { id: 'leaderboard', label: 'Ranking',     icon: Trophy },
  { id: 'analytics',   label: 'Analytics',  icon: BarChart2 },
];

export default function AvatarTrainingPage() {
  const [tab, setTab]           = useState<Tab>('home');
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [sessionResult, setSessionResult] = useState<any | null>(null);
  const [lastScenario, setLastScenario]   = useState<Scenario | null>(null);

  const handleStart = async (scenario: Scenario) => {
    setLastScenario(scenario);
    try {
      const r = await api('/avatar-training/sessions/start', {
        method: 'POST',
        body: JSON.stringify({ scenarioId: scenario.id }),
      });
      setActiveSession({
        id:                  r.session.id,
        scenarioId:          scenario.id,
        conversationHistory: [{ role: 'AVATAR', content: r.openingMessage, timestamp: new Date().toISOString() }],
        scenario:            r.session.scenario,
        avatar:              r.avatar,
      });
    } catch (e) {
      alert('Erro ao iniciar sessão. Tenta novamente.');
    }
  };

  const handleComplete = (result: any) => {
    setActiveSession(null);
    setSessionResult(result);
  };

  const handleRetry = async () => {
    setSessionResult(null);
    if (lastScenario) await handleStart(lastScenario);
  };

  const handleNext = async () => {
    setSessionResult(null);
    if (sessionResult?.nextScenario) await handleStart(sessionResult.nextScenario);
  };

  const TAB_COMPONENTS: Record<Tab, JSX.Element> = {
    home:        <HomeTab onStartScenario={handleStart} />,
    scenarios:   <ScenariosTab onStart={handleStart} />,
    history:     <HistoryTab />,
    leaderboard: <LeaderboardTab />,
    analytics:   <AnalyticsTab />,
    session:     <div />,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Active Session overlay */}
      {activeSession && (
        <ChatSession
          session={activeSession}
          onComplete={handleComplete}
          onClose={() => setActiveSession(null)}
        />
      )}

      {/* Results overlay */}
      {sessionResult && (
        <ResultsModal
          result={sessionResult}
          onClose={() => setSessionResult(null)}
          onRetry={handleRetry}
          onNext={sessionResult.nextScenario ? handleNext : undefined}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <Bot size={18} className="text-indigo-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">Avatar Training</h1>
            </div>
            <p className="text-sm text-slate-400">
              Simulações imersivas · Roleplay com IA · Feedback comportamental
            </p>
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
                      ? 'border-indigo-600 text-indigo-600'
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













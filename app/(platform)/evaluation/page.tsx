'use client';
// src/app/(dashboard)/evaluations/page.tsx

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Star, TrendingUp, TrendingDown, BarChart2, Target,
  CheckCircle, Clock, AlertTriangle, ChevronRight, Plus,
  RefreshCw, Award, Brain, Shield, Layers, ArrowUp, ArrowDown,
  Activity, Eye, Zap, Send,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────

type Tab = 'overview' | 'cycles' | 'pending' | 'results' | 'analytics' | 'calibration';

interface Cycle {
  id: number; name: string; model: string; status: string;
  startDate: string; endDate: string;
  participation: { total: number; completed: number; rate: number };
}

interface EvalRequest {
  id: number; type: string; status: string; dueDate?: string;
  evaluated: { id: number; fullName: string; avatarUrl?: string;
    position?: { name: string }; department?: { name: string } };
  cycle?: { id: number; name: string; endDate?: string };
}

interface EvalResults {
  evaluated: { id: number; fullName: string; position?: { name: string }; department?: { name: string } };
  finalScore: number; scoreLabel: string;
  byType: Record<string, number>;
  competencies: Record<number, number>;
  concordance: { selfScore: number; othersScore: number; gap: number; label: string } | null;
  totalEvaluators: number;
  qualitative: { strengths: string[]; improvements: string[]; recommendations: string[] };
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

const STATUS_COLOR: Record<string, string> = {
  DRAFT:       'bg-slate-100 text-slate-600',
  PUBLISHED:   'bg-blue-100 text-blue-700',
  ACTIVE:      'bg-emerald-100 text-emerald-700',
  CALIBRATING: 'bg-amber-100 text-amber-700',
  COMPLETED:   'bg-indigo-100 text-indigo-700',
  ARCHIVED:    'bg-slate-100 text-slate-400',
};

const TYPE_LABEL: Record<string, string> = {
  SELF: '🟢 Autoavaliação', MANAGER: '🟣 Gestor',
  PEER: '🔵 Par', SUBORDINATE: '🟡 Subordinado', CLIENT: '🟠 Cliente',
};

const MODEL_LABEL: Record<string, string> = {
  '90': '90° (Gestor)', '180': '180° (Auto + Gestor)', '270': '270°',
  '360': '360° Completo', CONTINUOUS: 'Contínuo', PROJECT: 'Por Projecto',
};

const SCORE_COLOR = (score: number) =>
  score >= 4 ? 'text-emerald-600' : score >= 3 ? 'text-teal-600' :
  score >= 2 ? 'text-amber-600'  : 'text-red-600';

const SCORE_BG = (score: number) =>
  score >= 4 ? 'bg-emerald-50 border-emerald-200' : score >= 3 ? 'bg-teal-50 border-teal-200' :
  score >= 2 ? 'bg-amber-50 border-amber-200'     : 'bg-red-50 border-red-200';

function Avatar({ name, url, size = 8 }: { name: string; url?: string; size?: number }) {
  const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  return url
    ? <img src={url} alt={name} className={`w-${size} h-${size} rounded-full object-cover`} />
    : <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600
        flex items-center justify-center text-white font-semibold text-xs shrink-0`}>{initials}</div>;
}

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

function Skeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(count)].map((_, i) => <div key={i} className="bg-slate-100 rounded-xl h-24" />)}
    </div>
  );
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

// ─── Radar Chart (SVG) ────────────────────────────────────────────

function RadarChart({ data, size = 200 }: { data: { label: string; value: number; max?: number }[]; size?: number }) {
  if (!data.length) return null;
  const cx = size / 2, cy = size / 2, r = (size / 2) - 24;
  const n   = data.length;
  const pts = data.map((d, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const pct   = d.value / (d.max ?? 5);
    return { x: cx + r * pct * Math.cos(angle), y: cy + r * pct * Math.sin(angle) };
  });
  const bgPts = data.map((_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });

  const toPath = (p: { x: number; y: number }[]) =>
    p.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ') + 'Z';

  return (
    <svg width={size} height={size} className="mx-auto">
      {/* Grid */}
      {[0.25, 0.5, 0.75, 1].map(pct => (
        <polygon key={pct}
          points={bgPts.map(p => {
            const angle = Math.atan2(p.y - cy, p.x - cx);
            return `${(cx + r * pct * Math.cos(angle)).toFixed(1)},${(cy + r * pct * Math.sin(angle)).toFixed(1)}`;
          }).join(' ')}
          fill="none" stroke="#e2e8f0" strokeWidth="1" />
      ))}
      {/* Spokes */}
      {bgPts.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#e2e8f0" strokeWidth="1" />
      ))}
      {/* Data polygon */}
      <path d={toPath(pts)} fill="rgba(99,102,241,0.15)" stroke="#6366f1" strokeWidth="2" />
      {/* Dots */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#6366f1" />
      ))}
      {/* Labels */}
      {bgPts.map((p, i) => {
        const dx = p.x - cx, dy = p.y - cy;
        const len = Math.sqrt(dx * dx + dy * dy);
        const lx  = cx + (len + 16) * (dx / len);
        const ly  = cy + (len + 16) * (dy / len);
        return (
          <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            className="text-[9px]" fill="#64748b" fontSize="9">
            {data[i].label.slice(0, 6)}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────

function OverviewTab({ userId }: { userId?: number }) {
  const [progress, setProgress]     = useState<any | null>(null);
  const [myResults, setMyResults]   = useState<EvalResults | null>(null);
  const [pending, setPending]       = useState<EvalRequest[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      api('/evaluations/my-progress'),
      api('/evaluations/pending'),
    ]).then(([prog, pend]) => {
      setProgress(prog);
      setPending(pend ?? []);
    }).finally(() => setLoading(false));

    if (userId) {
      api(`/evaluations/results/${userId}`).then(r => {
        if (r?.hasResults !== false) setMyResults(r);
      }).catch(() => {});
    }
  }, [userId]);

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-6">
      {/* My completion progress */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={CheckCircle} label="Concluídas"  value={progress?.completed ?? 0}
          color="text-emerald-600" bg="bg-emerald-50" />
        <KpiCard icon={Clock}       label="Pendentes"   value={progress?.pending ?? 0}
          color="text-amber-600"  bg="bg-amber-50" />
        <KpiCard icon={Activity}    label="Taxa Conclusão" value={`${progress?.completionRate ?? 0}%`}
          color="text-indigo-600" bg="bg-indigo-50" />
        <KpiCard icon={Star}        label="Último Score"
          value={myResults ? myResults.finalScore.toFixed(1) : '–'}
          sub={myResults?.scoreLabel} color="text-violet-600" bg="bg-violet-50" />
      </div>

      {/* Pending evaluations urgent banner */}
      {pending.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-600" />
            <p className="text-sm font-semibold text-amber-700">
              {pending.length} avaliação{pending.length > 1 ? 'ões' : ''} pendente{pending.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="space-y-2">
            {pending.slice(0, 3).map(r => (
              <div key={r.id}
                className="flex items-center gap-3 bg-white rounded-lg px-3 py-2.5 border border-amber-100">
                <Avatar name={r.evaluated.fullName} url={r.evaluated.avatarUrl} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700">{r.evaluated.fullName}</p>
                  <p className="text-xs text-slate-400">
                    {TYPE_LABEL[r.type]} · {r.cycle?.name}
                  </p>
                </div>
                {r.dueDate && (
                  <span className="text-xs text-amber-600 font-medium shrink-0">
                    {new Date(r.dueDate).toLocaleDateString('pt')}
                  </span>
                )}
                <ChevronRight size={14} className="text-slate-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My results radar */}
      {myResults && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-4">Os Meus Resultados</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Score breakdown */}
            <div>
              <div className={`rounded-xl border p-4 mb-4 ${SCORE_BG(myResults.finalScore)}`}>
                <p className="text-xs text-slate-500 mb-0.5">Score Final</p>
                <p className={`text-4xl font-black ${SCORE_COLOR(myResults.finalScore)}`}>
                  {myResults.finalScore.toFixed(1)}
                </p>
                <p className="text-sm text-slate-600 font-medium">{myResults.scoreLabel}</p>
              </div>

              {/* By type */}
              <div className="space-y-2">
                {Object.entries(myResults.byType).map(([type, score]) => (
                  <div key={type}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-slate-500">{TYPE_LABEL[type] ?? type}</span>
                      <span className={`font-bold ${SCORE_COLOR(+score)}`}>{(+score).toFixed(1)}</span>
                    </div>
                    <ProgressBar value={(+score / 5) * 100}
                      color={+score >= 4 ? 'bg-emerald-500' : +score >= 3 ? 'bg-teal-400' : 'bg-amber-400'} />
                  </div>
                ))}
              </div>
            </div>

            {/* Radar + Concordance */}
            <div>
              {Object.keys(myResults.competencies).length > 0 && (
                <RadarChart
                  data={Object.entries(myResults.competencies).map(([id, score]) => ({
                    label: `Comp.${id}`, value: +score, max: 5,
                  }))}
                  size={180}
                />
              )}

              {myResults.concordance && (
                <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 mb-1">Concordância</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Auto: <b>{myResults.concordance.selfScore.toFixed(1)}</b></span>
                    <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${
                      myResults.concordance.label === 'Alinhado'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'}`}>
                      {myResults.concordance.label}
                    </span>
                    <span className="text-slate-500">Outros: <b>{myResults.concordance.othersScore.toFixed(1)}</b></span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Cycles Tab ───────────────────────────────────────────────────

function CyclesTab() {
  const [data, setData]       = useState<{ data: Cycle[]; meta: any } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/evaluations/cycles').then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-slate-700">Ciclos de Avaliação</h3>
        <span className="text-xs text-slate-400">{data?.meta.total ?? 0} ciclos</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data?.data.map(cycle => (
          <div key={cycle.id}
            className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[cycle.status]}`}>
                {cycle.status}
              </span>
              <span className="text-xs text-slate-400">
                {MODEL_LABEL[cycle.model] ?? cycle.model}
              </span>
            </div>

            <h4 className="font-semibold text-slate-800 mb-3">{cycle.name}</h4>

            {/* Participation */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">Participação</span>
                <span className="font-semibold text-indigo-600">{cycle.participation.rate}%</span>
              </div>
              <ProgressBar value={cycle.participation.rate}
                color={cycle.participation.rate >= 75 ? 'bg-emerald-500' : 'bg-indigo-500'} height="h-1.5" />
              <p className="text-[10px] text-slate-400 mt-1">
                {cycle.participation.completed}/{cycle.participation.total} avaliações
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span>📅 {new Date(cycle.startDate).toLocaleDateString('pt')}</span>
              <span>→</span>
              <span>{new Date(cycle.endDate).toLocaleDateString('pt')}</span>
            </div>

            {/* Actions */}
            {cycle.status === 'DRAFT' && (
              <button
                onClick={() => api(`/evaluations/cycles/${cycle.id}/publish`, { method: 'POST' })
                  .then(() => window.location.reload())}
                className="mt-3 w-full py-1.5 border border-indigo-300 text-indigo-600 text-xs
                  rounded-lg hover:bg-indigo-50 transition-colors">
                Publicar
              </button>
            )}
            {cycle.status === 'PUBLISHED' && (
              <button
                onClick={() => api(`/evaluations/cycles/${cycle.id}/activate`, { method: 'POST' })
                  .then(() => window.location.reload())}
                className="mt-3 w-full py-1.5 bg-indigo-600 text-white text-xs
                  rounded-lg hover:bg-indigo-700 transition-colors">
                Activar
              </button>
            )}
          </div>
        ))}

        {(data?.data.length ?? 0) === 0 && (
          <div className="col-span-3 py-16 text-center text-slate-400">
            <Layers size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhum ciclo criado ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Pending Tab ─────────────────────────────────────────────────

function PendingTab() {
  const [pending, setPending] = useState<EvalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/evaluations/pending').then(r => setPending(r ?? [])).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  const TYPE_COLOR: Record<string, string> = {
    SELF:       'bg-emerald-100 text-emerald-700',
    MANAGER:    'bg-purple-100 text-purple-700',
    PEER:       'bg-blue-100 text-blue-700',
    SUBORDINATE:'bg-amber-100 text-amber-700',
    CLIENT:     'bg-orange-100 text-orange-700',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-700">Avaliações Pendentes</h3>
        <span className={`text-sm font-bold px-3 py-1 rounded-full ${pending.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
          {pending.length} pendentes
        </span>
      </div>

      <div className="space-y-3">
        {pending.map(r => {
          const isOverdue = r.dueDate && new Date(r.dueDate) < new Date();
          return (
            <div key={r.id}
              className={`bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow ${
                isOverdue ? 'border-red-200 bg-red-50' : 'border-slate-100'}`}>
              <div className="flex items-center gap-4">
                <Avatar name={r.evaluated.fullName} url={r.evaluated.avatarUrl} size={10} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-sm font-semibold text-slate-800">{r.evaluated.fullName}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[r.type]}`}>
                      {TYPE_LABEL[r.type]}
                    </span>
                    {isOverdue && (
                      <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                        ATRASADO
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {r.evaluated.position?.name} · {r.evaluated.department?.name}
                  </p>
                  {r.cycle && (
                    <p className="text-xs text-slate-400">📋 {r.cycle.name}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {r.dueDate && (
                    <p className={`text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-slate-500'}`}>
                      {isOverdue ? '⚠️' : '⏰'} {new Date(r.dueDate).toLocaleDateString('pt')}
                    </p>
                  )}
                  <button className="mt-2 px-4 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700">
                    Avaliar →
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {pending.length === 0 && (
          <div className="py-16 text-center bg-emerald-50 rounded-xl border border-emerald-100">
            <CheckCircle size={40} className="mx-auto mb-3 text-emerald-400" />
            <p className="font-medium text-emerald-700">Estás em dia!</p>
            <p className="text-sm text-emerald-600">Sem avaliações pendentes</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Results Tab ──────────────────────────────────────────────────

function ResultsTab() {
  const [userId, setUserId]   = useState('');
  const [result, setResult]   = useState<EvalResults | null>(null);
  const [evolution, setEvolution] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [r, ev] = await Promise.all([
        api(`/evaluations/results/${userId}`),
        api(`/evaluations/evolution/${userId}`),
      ]);
      setResult(r);
      setEvolution(ev);
    } catch {} finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 flex gap-3">
        <input value={userId} onChange={e => setUserId(e.target.value)}
          placeholder="ID do colaborador..."
          className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2
            focus:outline-none focus:border-indigo-400" />
        <button onClick={load}
          className="px-5 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
          Ver Resultados
        </button>
      </div>

      {loading && <Skeleton />}

      {!loading && result && (
        <div className="space-y-4">
          {/* Header */}
          <div className={`rounded-xl border p-5 ${SCORE_BG(result.finalScore)}`}>
            <div className="flex items-start gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Score 360°</p>
                <p className={`text-5xl font-black ${SCORE_COLOR(result.finalScore)}`}>
                  {result.finalScore.toFixed(1)}
                </p>
                <p className="font-semibold text-slate-700 mt-1">{result.scoreLabel}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-sm font-semibold text-slate-700">{result.evaluated.fullName}</p>
                <p className="text-xs text-slate-400">{result.evaluated.position?.name}</p>
                <p className="text-xs text-slate-400">{result.evaluated.department?.name}</p>
                <p className="text-xs text-slate-500 mt-1">{result.totalEvaluators} avaliadores</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* By evaluator type */}
            <div className="bg-white rounded-xl border border-slate-100 p-5">
              <h4 className="font-semibold text-slate-700 mb-3">Por Tipo de Avaliador</h4>
              <div className="space-y-3">
                {Object.entries(result.byType).map(([type, score]) => (
                  <div key={type}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{TYPE_LABEL[type] ?? type}</span>
                      <span className={`font-bold ${SCORE_COLOR(+score)}`}>{(+score).toFixed(1)}/5</span>
                    </div>
                    <ProgressBar value={(+score / 5) * 100}
                      color={+score >= 4 ? 'bg-emerald-500' : +score >= 3 ? 'bg-teal-400' : 'bg-amber-400'}
                      height="h-2" />
                  </div>
                ))}
              </div>
            </div>

            {/* Concordance */}
            {result.concordance && (
              <div className="bg-white rounded-xl border border-slate-100 p-5">
                <h4 className="font-semibold text-slate-700 mb-3">Matriz de Concordância</h4>
                <div className="flex items-center justify-center gap-6 py-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-indigo-600">{result.concordance.selfScore.toFixed(1)}</p>
                    <p className="text-xs text-slate-500">Autoavaliação</p>
                  </div>
                  <div className="text-center">
                    <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                      result.concordance.label === 'Alinhado'
                        ? 'bg-emerald-100 text-emerald-700'
                        : Math.abs(result.concordance.gap) > 1
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'}`}>
                      {result.concordance.label}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">
                      gap: {result.concordance.gap > 0 ? '+' : ''}{result.concordance.gap.toFixed(1)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-slate-700">{result.concordance.othersScore.toFixed(1)}</p>
                    <p className="text-xs text-slate-500">Outros</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Competency Radar */}
          {Object.keys(result.competencies).length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 p-5">
              <h4 className="font-semibold text-slate-700 mb-4">Mapa de Competências</h4>
              <RadarChart
                data={Object.entries(result.competencies).map(([id, score]) => ({
                  label: `C${id}`, value: +score, max: 5,
                }))}
                size={220}
              />
            </div>
          )}

          {/* Qualitative */}
          {(result.qualitative.strengths.length > 0 || result.qualitative.improvements.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.qualitative.strengths.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <h4 className="font-semibold text-emerald-700 mb-2">💪 Pontos Fortes</h4>
                  <div className="space-y-1">
                    {result.qualitative.strengths.slice(0, 5).map((s, i) => (
                      <p key={i} className="text-xs text-emerald-800">• {s}</p>
                    ))}
                  </div>
                </div>
              )}
              {result.qualitative.improvements.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <h4 className="font-semibold text-amber-700 mb-2">🎯 Áreas de Melhoria</h4>
                  <div className="space-y-1">
                    {result.qualitative.improvements.slice(0, 5).map((s, i) => (
                      <p key={i} className="text-xs text-amber-800">• {s}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PDI trigger */}
          <button
            onClick={() => api(`/evaluations/results/${userId}/trigger-pdi`, { method: 'POST' })}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
            🎯 Gerar Sugestão de PDI com base nestes resultados
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────

function AnalyticsTab() {
  const [data, setData]   = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/evaluations/analytics/dashboard').then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;
  if (!data?.hasData) return (
    <div className="py-16 text-center text-slate-400">
      <BarChart2 size={40} className="mx-auto mb-3 opacity-30" />
      <p>{data?.message ?? 'Sem dados disponíveis'}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={Users}       label="Participantes"       value={data.kpis.totalParticipants} />
        <KpiCard icon={Star}        label="Score Médio"         value={data.kpis.avgScore?.toFixed(1)}
          color="text-amber-600" bg="bg-amber-50" />
        <KpiCard icon={CheckCircle} label="Taxa Participação"   value={`${data.kpis.participationRate}%`}
          color="text-emerald-600" bg="bg-emerald-50" />
        <KpiCard icon={Activity}    label="Total Avaliações"    value={data.kpis.totalEvaluations} />
      </div>

      {/* Distribution */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <h3 className="font-semibold text-slate-700 mb-4">Distribuição de Performance</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { key: 'exceptional', label: 'Excepcional', color: 'bg-emerald-500', textColor: 'text-emerald-700' },
            { key: 'above',       label: 'Acima',       color: 'bg-teal-500',    textColor: 'text-teal-700' },
            { key: 'expected',    label: 'Esperado',    color: 'bg-amber-500',   textColor: 'text-amber-700' },
            { key: 'below',       label: 'Abaixo',      color: 'bg-red-400',     textColor: 'text-red-700' },
          ].map(d => {
            const total = Object.values(data.distribution as Record<string, number>).reduce((a, b) => a + b, 0);
            const pct   = total > 0 ? Math.round((data.distribution[d.key] / total) * 100) : 0;
            return (
              <div key={d.key} className="text-center p-3 rounded-xl border bg-white">
                <div className={`w-12 h-12 rounded-full ${d.color} mx-auto mb-2
                  flex items-center justify-center`}>
                  <span className="text-white font-bold text-sm">{pct}%</span>
                </div>
                <p className="text-xl font-bold text-slate-800">{data.distribution[d.key]}</p>
                <p className={`text-[10px] font-medium ${d.textColor}`}>{d.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top performers */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-4">🏆 Top Performers</h3>
          <div className="space-y-2">
            {(data.topPerformers ?? []).slice(0, 8).map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-300 w-5 text-right">#{i+1}</span>
                <Avatar name={p.user?.fullName ?? '?'} url={p.user?.avatarUrl} size={7} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{p.user?.fullName}</p>
                  <p className="text-[10px] text-slate-400">{p.user?.department?.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold ${SCORE_COLOR(p.avgScore)}`}>{p.avgScore.toFixed(1)}</p>
                  <p className="text-[10px] text-slate-400">P{p.percentile}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By department */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-4">Score por Departamento</h3>
          <div className="space-y-2">
            {(data.byDepartment ?? []).map((d: any, i: number) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 truncate">{d.department}</span>
                  <span className={`font-bold ${SCORE_COLOR(d.avgScore)}`}>{d.avgScore.toFixed(1)}</span>
                </div>
                <ProgressBar value={(d.avgScore / 5) * 100}
                  color={d.avgScore >= 4 ? 'bg-emerald-500' : d.avgScore >= 3 ? 'bg-teal-400' : 'bg-amber-400'} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Calibration Tab ─────────────────────────────────────────────

function CalibrationTab() {
  const [cycleId, setCycleId] = useState('');
  const [data, setData]       = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!cycleId) return;
    setLoading(true);
    api(`/evaluations/calibration/${cycleId}`).then(setData).finally(() => setLoading(false));
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-100 p-4 flex gap-3">
        <input value={cycleId} onChange={e => setCycleId(e.target.value)}
          placeholder="ID do ciclo..."
          className="w-48 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-400" />
        <button onClick={load}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
          Abrir Calibração
        </button>
      </div>

      {loading && <Skeleton />}

      {!loading && data && (
        <div className="space-y-4">
          {/* Biased evaluators alert */}
          {(data.biasedEvaluators ?? []).length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-amber-700 mb-2">
                ⚠️ {data.biasedEvaluators.length} avaliadores com viés detectado
              </p>
              <div className="space-y-1">
                {data.biasedEvaluators.map((e: any, i: number) => (
                  <p key={i} className="text-xs text-amber-700">
                    Avaliador #{e.evaluatorId}: média {e.avg.toFixed(1)} (desvio {e.deviation > 0 ? '+' : ''}{e.deviation.toFixed(2)})
                    {e.deviation > 0 ? ' — muito generoso' : ' — muito rigoroso'}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Participants ranking */}
          <div className="bg-white rounded-xl border border-slate-100">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-semibold text-slate-700">Participantes para Calibração</h4>
              <span className="text-xs text-slate-400">Média global: {data.globalAvg?.toFixed(2)}</span>
            </div>
            <div className="divide-y divide-slate-50 max-h-[480px] overflow-y-auto">
              {(data.participants ?? []).map((p: any, i: number) => (
                <div key={i} className="px-4 py-3 flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-300 w-5 text-right">#{i+1}</span>
                  <Avatar name={p.evaluated?.fullName ?? '?'} url={p.evaluated?.avatarUrl} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">{p.evaluated?.fullName}</p>
                    <p className="text-xs text-slate-400">
                      {p.evaluated?.position?.name} · {p.evaluated?.department?.name}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-bold ${SCORE_COLOR(p.avgScore)}`}>{p.avgScore.toFixed(1)}</p>
                    <p className="text-[10px] text-slate-400">P{p.percentile}</p>
                  </div>
                  {p.dispersion > 1 && (
                    <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                      ±{p.dispersion.toFixed(1)}
                    </span>
                  )}
                  <input type="number" min="0" max="5" step="0.1"
                    defaultValue={p.avgScore}
                    className="w-16 text-sm border border-slate-200 rounded px-2 py-1 text-center focus:outline-none"
                    onBlur={async e => {
                      const val = parseFloat(e.target.value);
                      if (val >= 0 && val <= 5 && val !== p.avgScore) {
                        await api(`/evaluations/calibration/${cycleId}/calibrate`, {
                          method: 'POST',
                          body: JSON.stringify({ evaluatedId: p.evaluated.id, calibratedScore: val }),
                        });
                      }
                    }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'overview',     label: 'Visão Geral',  icon: Star },
  { id: 'cycles',       label: 'Ciclos',       icon: Layers },
  { id: 'pending',      label: 'Pendentes',    icon: Clock },
  { id: 'results',      label: 'Resultados',   icon: BarChart2 },
  { id: 'analytics',    label: 'Analytics',    icon: TrendingUp },
  { id: 'calibration',  label: 'Calibração',   icon: Shield },
];

export default function EvaluationsPage() {
  const [tab, setTab] = useState<Tab>('overview');

  const TAB_COMPONENTS: Record<Tab, JSX.Element> = {
    overview:    <OverviewTab />,
    cycles:      <CyclesTab />,
    pending:     <PendingTab />,
    results:     <ResultsTab />,
    analytics:   <AnalyticsTab />,
    calibration: <CalibrationTab />,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <Star size={18} className="text-indigo-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">Avaliação 360°</h1>
            </div>
            <p className="text-sm text-slate-400">Ciclos · Formulários · Resultados · Calibração · Analytics</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white
            text-sm rounded-lg hover:bg-indigo-700 transition-colors">
            <Plus size={14} />
            Novo Ciclo
          </button>
        </div>
      </div>

      <div className="bg-white border-b border-slate-200 px-6">
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap
                  border-b-2 transition-colors ${tab === t.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <Icon size={15} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {TAB_COMPONENTS[tab]}
      </div>
    </div>
  );
}

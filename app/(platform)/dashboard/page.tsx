'use client';
// src/app/(dashboard)/dashboard/page.tsx

import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Users, BookOpen, Target, Star, Zap, Award,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock,
  Search, Bell, BarChart2, Brain, ChevronRight, Shield,
  Activity, RefreshCw, ArrowUp, ArrowDown,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────

type Role = 'COLABORADOR' | 'LIDER' | 'RH' | 'ADMIN';

interface KPICardProps {
  icon: any; label: string; value: string | number;
  sub?: string; trend?: number; color?: string; bg?: string;
}

interface Alert { type: string; message: string; priority: 'URGENT' | 'ATTENTION' | 'INFORMATIVE'; actionUrl?: string }

// ─── Slideshow images ─────────────────────────────────────────────────────────
// Substitui os URLs pelos teus — recomendado: 1400×400 px (banner horizontal)
const SLIDES = [
  { url: "/images/banner1.jpg", caption: "Aprende. Cresce. Inova." },
  { url: "/images/banner2.jpg", caption: "Formação de excelência." },
  { url: "/images/banner3.jpg", caption: "Desenvolve competências." },
  { url: "/images/banner4.jpg", caption: "Conhecimento partilhado." },
];

// ─── Slideshow ────────────────────────────────────────────────────────────────
function Slideshow() {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrent(c => (c + 1) % SLIDES.length);
        setFading(false);
      }, 400);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  function goTo(i: number) {
    if (i === current) return;
    setFading(true);
    setTimeout(() => { setCurrent(i); setFading(false); }, 400);
  }

  const slide = SLIDES[current];

  return (
    <div style={{ position: "relative", width: "100%", borderRadius: 16, overflow: "hidden", marginBottom: 32, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
      {/* Image */}
      <div style={{
        width: "100%", height: 340,
        backgroundImage: `url(${slide.url})`,
        backgroundSize: "cover", backgroundPosition: "center",
        transition: "opacity 0.4s ease",
        opacity: fading ? 0 : 1,
      }}>
        {/* Gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg, rgba(10,20,60,0.72) 0%, rgba(10,20,60,0.35) 60%, rgba(10,20,60,0.10) 100%)",
        }} />
        {/* Caption */}
        <div style={{
          position: "absolute", bottom: 48, left: 40, right: "40%",
          opacity: fading ? 0 : 1, transition: "opacity 0.4s ease",
        }}>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.3, textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
            {slide.caption}
          </p>
        </div>
      </div>

      {/* Dot indicators */}
      <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8 }}>
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} style={{
            width: i === current ? 24 : 8, height: 8, borderRadius: 4,
            background: i === current ? "#fff" : "rgba(255,255,255,0.45)",
            border: "none", cursor: "pointer", padding: 0,
            transition: "all 0.3s ease",
          }} />
        ))}
      </div>

      {/* Prev / Next arrows */}
      {[{ dir: -1, pos: "left" as const }, { dir: 1, pos: "right" as const }].map(({ dir, pos }) => (
        <button key={pos} onClick={() => goTo((current + dir + SLIDES.length) % SLIDES.length)} style={{
          position: "absolute", top: "50%", [pos]: 16, transform: "translateY(-50%)",
          width: 36, height: 36, borderRadius: "50%", border: "none", cursor: "pointer",
          background: "rgba(255,255,255,0.18)", color: "#fff", fontSize: 18, fontWeight: 700,
          backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.2s",
        }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.35)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
        >
          {dir === -1 ? "‹" : "›"}
        </button>
      ))}

      {/* Slide counter */}
      <div style={{ position: "absolute", top: 16, right: 16, padding: "4px 10px", borderRadius: 20, background: "rgba(0,0,0,0.35)", color: "#fff", fontSize: 11, fontWeight: 700, backdropFilter: "blur(4px)" }}>
        {current + 1} / {SLIDES.length}
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, bg, sub }: { icon: string; label: string; value: string | number; color: string; bg: string; sub?: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{icon}</div>
      <div>
        <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color }}>{value}</p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b", fontWeight: 600 }}>{label}</p>
        {sub && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Tab ──────────────────────────────────────────────────────────────────────
type Tab = "my" | "manager" | "org";

// ─── Helpers ─────────────────────────────────────────────────────

const BASE = '/api';
async function api(path: string) {
  const r = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` },
  });
  if (!r.ok) throw new Error();
  return r.json();
}

function ProgressBar({ value, color = 'bg-indigo-500', height = 'h-1.5' }: { value: number; color?: string; height?: string }) {
  return (
    <div className={`w-full ${height} bg-slate-100 rounded-full`}>
      <div className={`${height} ${color} rounded-full transition-all duration-700`}
        style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

function Avatar({ name, url, size = 8 }: { name: string; url?: string; size?: number }) {
  const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  return url
    ? <img src={url} alt={name} className={`w-${size} h-${size} rounded-full object-cover`} />
    : <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-indigo-500 to-violet-600
        flex items-center justify-center text-white text-xs font-bold shrink-0`}>{initials}</div>;
}

function KPICard({ icon: Icon, label, value, sub, trend, color = 'text-indigo-600', bg = 'bg-indigo-50' }: KPICardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${bg}`}><Icon size={18} className={color} /></div>
        {trend !== undefined && (
          <span className={`text-xs font-medium flex items-center gap-0.5 ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function Skeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
      {[...Array(count)].map((_, i) => <div key={i} className="bg-slate-100 rounded-xl h-24" />)}
    </div>
  );
}

// ─── Alert Banner ─────────────────────────────────────────────────

function AlertBanner({ alerts }: { alerts: Alert[] }) {
  if (!alerts.length) return null;
  const urgent = alerts.filter(a => a.priority === 'URGENT');
  const others = alerts.filter(a => a.priority !== 'URGENT');

  return (
    <div className="space-y-2">
      {urgent.map((a, i) => (
        <div key={i} className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertTriangle size={16} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-700 flex-1">{a.message}</p>
          {a.actionUrl && (
            <a href={a.actionUrl} className="text-xs px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700">
              Ver →
            </a>
          )}
        </div>
      ))}
      {others.slice(0, 2).map((a, i) => (
        <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <Clock size={14} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700 flex-1">{a.message}</p>
          {a.actionUrl && (
            <a href={a.actionUrl} className="text-xs px-3 py-1 bg-amber-600 text-white rounded-lg hover:bg-amber-700 shrink-0">
              Ver →
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Colaborador Dashboard ────────────────────────────────────────

function ColaboradorDashboard() {
  const [data, setData]   = useState<any | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api('/dashboard/my'),
      api('/dashboard/alerts'),
    ]).then(([d, a]) => { setData(d); setAlerts(a ?? []); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-4"><Skeleton count={4} /><Skeleton count={2} /></div>;

  const plan     = data?.development?.activePlan;
  const level    = data?.gamification?.level;
  const points   = data?.gamification?.totalPoints ?? 0;

  return (
    <div className="space-y-6">
      {/* Alerts */}
      <AlertBanner alerts={alerts} />

      {/* Hero: user + points */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-4">
          {data?.user && <Avatar name={data.user.fullName ?? 'U'} url={data.user.avatarUrl} size={12} />}
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold">{data?.user?.fullName}</p>
            <p className="text-indigo-200 text-sm">{data?.user?.position?.name} · {data?.user?.department?.name}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xl">
              <Zap size={18} />{points}
            </div>
            <p className="text-indigo-200 text-xs">{level?.label} · Nível {level?.level}</p>
          </div>
        </div>
        {level && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-indigo-200 mb-1">
              <span>Próximo nível</span><span>{points}/{level.nextAt}</span>
            </div>
            <ProgressBar value={(points / level.nextAt) * 100} color="bg-amber-400" height="h-1.5" />
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={BookOpen}    label="Cursos em Progresso"  value={data?.learning?.inProgress ?? 0} color="text-blue-600" bg="bg-blue-50" />
        <KPICard icon={CheckCircle} label="Cursos Concluídos"    value={data?.learning?.completed ?? 0}  color="text-emerald-600" bg="bg-emerald-50" />
        <KPICard icon={Award}       label="Badges Conquistados"  value={data?.gamification?.recentBadges?.length ?? 0} color="text-amber-600" bg="bg-amber-50" />
        <KPICard icon={Target}      label="Avaliações Pendentes" value={(data?.engagement?.pendingSurveys ?? 0) + 0} color="text-violet-600" bg="bg-violet-50" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* PDI */}
        {plan && (
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2"><Target size={15} className="text-indigo-500" />PDI Activo</h3>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{plan.status}</span>
            </div>
            <p className="text-sm text-slate-600 mb-3 truncate">{plan.name}</p>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Progresso</span>
              <span className="font-bold text-indigo-600">{plan.progress}%</span>
            </div>
            <ProgressBar value={plan.progress} color={plan.progress >= 80 ? 'bg-emerald-500' : 'bg-indigo-500'} />
            <p className="text-[10px] text-slate-400 mt-2">{plan.completedActions} / {plan.goals} acções concluídas</p>
          </div>
        )}

        {/* Pending items */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Clock size={15} className="text-amber-500" />Pendentes
          </h3>
          {(data?.pendingItems ?? []).length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Tudo em dia! 🎉</p>
          ) : (
            <div className="space-y-2">
              {(data?.pendingItems ?? []).map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${item.priority === 'HIGH' ? 'bg-red-500' : 'bg-amber-400'}`} />
                  {item.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Competencies radar */}
      {(data?.skills?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-3">Evolução de Competências</h3>
          <div className="space-y-2">
            {data.skills.map((s: any, i: number) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-slate-600">{s.name}</span>
                  <span className="font-semibold text-slate-700">{s.current}/{s.target ?? 5}</span>
                </div>
                <ProgressBar
                  value={(s.current / (s.target ?? 5)) * 100}
                  color={s.current >= (s.target ?? 5) ? 'bg-emerald-500' : 'bg-indigo-500'} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Manager Dashboard ────────────────────────────────────────────

function ManagerDashboard() {
  const [data, setData]     = useState<any | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api('/dashboard/manager'),
      api('/dashboard/alerts'),
    ]).then(([d, a]) => { setData(d); setAlerts(a ?? []); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-4"><Skeleton count={4} /></div>;

  const kpis = data?.kpis ?? {};

  return (
    <div className="space-y-6">
      <AlertBanner alerts={alerts} />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={Users}       label="Equipa"              value={data?.teamSize ?? 0} />
        <KPICard icon={Target}      label="PDIs Activos"        value={kpis.activePlans ?? 0}
          sub={`Cobertura: ${kpis.pdpCoverage ?? 0}%`} color="text-indigo-600" bg="bg-indigo-50" />
        <KPICard icon={Star}        label="Score Médio"         value={kpis.avgScore?.toFixed(1) ?? '–'}
          trend={kpis.scoreTrend} color="text-amber-600" bg="bg-amber-50" />
        <KPICard icon={Shield}      label="Formação Obrigatória" value={`${kpis.mandatoryRate ?? 0}%`}
          color={kpis.mandatoryRate >= 80 ? 'text-emerald-600' : 'text-red-500'} bg="bg-emerald-50" />
      </div>

      {/* Team table */}
      <div className="bg-white rounded-xl border border-slate-100">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-700">Equipa</h3>
          <span className="text-xs text-slate-400">{data?.teamSize ?? 0} colaboradores</span>
        </div>
        <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
          {(data?.team ?? []).map((u: any) => (
            <div key={u.user.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
              <Avatar name={u.user.fullName} url={u.user.avatarUrl} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700">{u.user.fullName}</p>
                <p className="text-[10px] text-slate-400">{u.user.position?.name}</p>
              </div>
              {u.plan && (
                <div className="w-20">
                  <ProgressBar value={u.plan.progress}
                    color={u.plan.progress >= 80 ? 'bg-emerald-500' : 'bg-indigo-400'} />
                  <p className="text-[9px] text-slate-400 mt-0.5 text-center">{u.plan.progress}% PDI</p>
                </div>
              )}
              {u.lastScore && (
                <span className={`text-sm font-bold ${u.lastScore >= 4 ? 'text-emerald-600' : u.lastScore >= 2.5 ? 'text-amber-600' : 'text-red-500'}`}>
                  {u.lastScore.toFixed(1)}
                </span>
              )}
              {u.alert && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" title="Em risco" />}
            </div>
          ))}
          {(data?.team?.length ?? 0) === 0 && (
            <div className="py-8 text-center text-slate-400 text-sm">Sem equipa directa</div>
          )}
        </div>
      </div>

      {/* Manager alerts */}
      {(data?.alerts ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-3">⚠️ Alertas da Equipa</h3>
          <div className="space-y-2">
            {data.alerts.map((a: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full shrink-0 ${a.priority === 'URGENT' ? 'bg-red-500' : 'bg-amber-400'}`} />
                <p className="text-sm text-slate-700">{a.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── RH / Organisation Dashboard ─────────────────────────────────

function OrgDashboard() {
  const [data, setData]     = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('MONTH');

  const load = useCallback(() => {
    setLoading(true);
    api(`/dashboard/organization?period=${period}`).then(setData).finally(() => setLoading(false));
  }, [period]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Skeleton count={6} />;

  const k = data?.kpis ?? {};
  const GRADE_COLOR: Record<string, string> = { A: 'text-emerald-600', B: 'text-teal-600', C: 'text-amber-600', D: 'text-red-600' };

  return (
    <div className="space-y-6">
      {/* Period filter */}
      <div className="flex gap-2">
        {['WEEK', 'MONTH', 'QUARTER', 'YEAR'].map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              period === p ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            {p === 'WEEK' ? 'Semana' : p === 'MONTH' ? 'Mês' : p === 'QUARTER' ? 'Trimestre' : 'Ano'}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400 self-center">
          {new Date().toLocaleDateString('pt')}
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={Users}       label="Colaboradores Activos" value={k.headcount?.active ?? 0}
          sub={`+${k.headcount?.new ?? 0} no período`} trend={k.headcount?.newTrend} />
        <KPICard icon={BookOpen}    label="Conclusões de Cursos"  value={k.learning?.completions ?? 0}
          trend={k.learning?.completionsTrend} color="text-teal-600" bg="bg-teal-50" />
        <KPICard icon={Target}      label="PDIs Activos"          value={k.development?.activePlans ?? 0}
          sub={`Cobertura: ${k.development?.coverage ?? 0}%`} color="text-indigo-600" bg="bg-indigo-50" />
        <KPICard icon={TrendingUp}  label="Score Médio Geral"     value={k.performance?.avgScore?.toFixed(1) ?? '–'}
          color="text-amber-600" bg="bg-amber-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Talent metrics */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-4">Talentos</h3>
          <div className="space-y-3">
            {[
              { label: 'High Potentials', value: k.talent?.hiPos ?? 0, icon: '🌟' },
              { label: 'Sucessão coberta', value: `${k.talent?.successionCoverage ?? 0}%`, icon: '🔄' },
              { label: 'Horas de treino', value: k.learning?.trainingHours ?? 0, icon: '⏱️' },
              { label: 'Surveys activos', value: k.engagement?.activeSurveys ?? 0, icon: '📊' },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between">
                <span className="text-sm text-slate-600 flex items-center gap-2">{m.icon} {m.label}</span>
                <span className="font-bold text-slate-800">{m.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Departments */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-4">Departamentos</h3>
          <div className="space-y-2">
            {(data?.departments ?? []).slice(0, 6).map((d: any) => {
              const total = (data?.departments ?? []).reduce((a: number, x: any) => a + x.headcount, 0);
              const pct   = total > 0 ? Math.round((d.headcount / total) * 100) : 0;
              return (
                <div key={d.id}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-slate-600 truncate">{d.name}</span>
                    <span className="text-slate-700 font-semibold">{d.headcount}</span>
                  </div>
                  <ProgressBar value={pct} />
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Brain size={15} className="text-violet-500" />Insights
          </h3>
          {(data?.insights ?? []).length > 0 ? (
            <div className="space-y-2">
              {(data.insights ?? []).map((ins: string, i: number) => (
                <p key={i} className="text-xs text-slate-600 bg-violet-50 rounded-lg px-3 py-2">{ins}</p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">Sem insights gerados</p>
          )}
        </div>
      </div>

      {/* Top content */}
      {(data?.topContent?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-3">Conteúdos Mais Vistos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {data.topContent.map((c: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                <span className="text-xs font-bold text-slate-300 w-4">#{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{c.content?.title}</p>
                  <p className="text-[10px] text-slate-400">{c.content?.type}</p>
                </div>
                <span className="text-xs font-bold text-indigo-600 shrink-0">{c.views} views</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Global Search ────────────────────────────────────────────────

function GlobalSearch({ onClose }: { onClose: () => void }) {
  const [query, setQuery]   = useState('');
  const [results, setResults] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) { setResults(null); return; }
    const t = setTimeout(() => {
      setLoading(true);
      api(`/dashboard/search?q=${encodeURIComponent(query)}&limit=5`)
        .then(setResults).finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-start justify-center pt-20 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <Search size={18} className="text-slate-400" />
          <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Pesquisar colaboradores, cursos, competências..."
            className="flex-1 text-sm focus:outline-none" />
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        {loading && <div className="px-5 py-4 text-sm text-slate-400 animate-pulse">A pesquisar…</div>}

        {results && (
          <div className="px-5 py-3 max-h-80 overflow-y-auto">
            {results.users?.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Colaboradores</p>
                {results.users.map((u: any) => (
                  <div key={u.id} className="flex items-center gap-2 py-1.5 hover:bg-slate-50 rounded-lg px-2 cursor-pointer">
                    <Avatar name={u.fullName} url={u.avatarUrl} size={7} />
                    <div>
                      <p className="text-sm font-medium text-slate-700">{u.fullName}</p>
                      <p className="text-[10px] text-slate-400">{u.position?.name} · {u.department?.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {results.courses?.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Cursos</p>
                {results.courses.map((c: any) => (
                  <div key={c.id} className="flex items-center gap-2 py-1.5 hover:bg-slate-50 rounded-lg px-2 cursor-pointer">
                    <BookOpen size={14} className="text-indigo-500 shrink-0" />
                    <p className="text-sm text-slate-700">{c.title}</p>
                  </div>
                ))}
              </div>
            )}
            {!results.users?.length && !results.courses?.length && (
              <p className="text-sm text-slate-400 text-center py-4">Sem resultados para "{query}"</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

const TABS = [
  { id: 'personal',  label: 'O Meu Dashboard', icon: LayoutDashboard, roles: ['COLABORADOR', 'LIDER', 'RH', 'ADMIN'] },
  { id: 'manager',   label: 'Gestor',           icon: Users,           roles: ['LIDER', 'RH', 'ADMIN'] },
  { id: 'org',       label: 'Organização',      icon: BarChart2,       roles: ['RH', 'ADMIN'] },
];

export default function DashboardPage() {
  const [tab, setTab]           = useState('personal');
  const [showSearch, setShowSearch] = useState(false);
  const [role] = useState<Role>('COLABORADOR'); // In real app, from auth context
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    api('/dashboard/alerts').then(a => setAlertCount(a?.filter((x: any) => x.priority === 'URGENT').length ?? 0))
      .catch(() => {});
  }, []);

  const availableTabs = TABS.filter(t => t.roles.includes(role));

  const TAB_CONTENT: Record<string, JSX.Element> = {
    personal: <ColaboradorDashboard />,
    manager:  <ManagerDashboard />,
    org:      <OrgDashboard />,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {showSearch && <GlobalSearch onClose={() => setShowSearch(false)} />}

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <LayoutDashboard size={18} className="text-indigo-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
            </div>
            <p className="text-sm text-slate-400">
              Visão unificada · KPIs · Insights · Alertas
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowSearch(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200
                text-slate-600 text-sm rounded-lg hover:border-indigo-300 transition-colors">
              <Search size={14} />
              Pesquisar
            </button>
            <button className="relative flex items-center gap-2 px-4 py-2 bg-white border border-slate-200
              text-slate-600 text-sm rounded-lg hover:border-slate-300 transition-colors">
              <Bell size={14} />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px]
                  rounded-full flex items-center justify-center font-bold">
                  {alertCount}
                </span>
              )}
            </button>
            <button onClick={() => window.location.reload()}
              className="p-2 bg-white border border-slate-200 rounded-lg hover:border-slate-300">
              <RefreshCw size={15} className="text-slate-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
          {availableTabs.map(t => {
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
        {TAB_CONTENT[tab] ?? <ColaboradorDashboard />}
      </div>
    </div>
  );
}


























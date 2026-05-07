'use client';
// src/app/(dashboard)/history/page.tsx

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Clock, Activity, Star, Award, Filter, Search,
  ChevronDown, ChevronRight, Flame, Zap, BarChart2,
  BookOpen, Target, Users, Shield, Calendar, TrendingUp,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────

type Tab = 'timeline' | 'milestones' | 'stats' | 'audit';

interface TimelineEvent {
  id: string; source: string; timestamp: string;
  category: string; module: string; impactScore: number;
  milestone: boolean; icon: string; title: string;
  action: string; entity: string; userId: number;
  user?: { fullName: string; avatarUrl?: string };
}

interface GroupedEvents { month: string; items: TimelineEvent[] }

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

const CATEGORY_COLOR: Record<string, { color: string; bg: string }> = {
  LEARNING:     { color: 'text-blue-700',    bg: 'bg-blue-100' },
  PERFORMANCE:  { color: 'text-amber-700',   bg: 'bg-amber-100' },
  CAREER:       { color: 'text-violet-700',  bg: 'bg-violet-100' },
  ENGAGEMENT:   { color: 'text-pink-700',    bg: 'bg-pink-100' },
  SYSTEM:       { color: 'text-slate-600',   bg: 'bg-slate-100' },
  COMPLIANCE:   { color: 'text-red-700',     bg: 'bg-red-100' },
  ATTENDANCE:   { color: 'text-teal-700',    bg: 'bg-teal-100' },
  FINANCIAL:    { color: 'text-emerald-700', bg: 'bg-emerald-100' },
};

function monthLabel(key: string): string {
  const [y, m] = key.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[+m - 1]} ${y}`;
}

function Avatar({ name, url, size = 7 }: { name: string; url?: string; size?: number }) {
  const i = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  return url
    ? <img src={url} alt={name} className={`w-${size} h-${size} rounded-full object-cover`} />
    : <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-indigo-500 to-violet-600
        flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>{i}</div>;
}

function Skeleton() {
  return <div className="space-y-4 animate-pulse">{[...Array(5)].map((_, i) => <div key={i} className="bg-slate-100 rounded-xl h-16" />)}</div>;
}

// ─── Event Card ───────────────────────────────────────────────────

function EventCard({ event, compact = false }: { event: TimelineEvent; compact?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const cat  = CATEGORY_COLOR[event.category] ?? CATEGORY_COLOR.SYSTEM;

  if (compact) return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-base shrink-0">{event.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-700 truncate">{event.title}</p>
        <p className="text-[10px] text-slate-400">{new Date(event.timestamp).toLocaleDateString('pt')}</p>
      </div>
      {event.milestone && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium shrink-0">MARCO</span>}
    </div>
  );

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all
        ${event.milestone ? 'bg-amber-50 border border-amber-200' : 'bg-white border border-slate-100'}
        hover:shadow-sm`}>
      {/* Icon circle */}
      <div className={`w-8 h-8 rounded-full ${cat.bg} flex items-center justify-center text-sm shrink-0 mt-0.5`}>
        {event.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <p className="text-sm font-semibold text-slate-800">{event.title}</p>
          {event.milestone && (
            <span className="text-[9px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full font-bold">⭐ MARCO</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <span className={`px-1.5 py-0.5 rounded font-medium ${cat.color} ${cat.bg}`}>{event.category}</span>
          <span>·</span>
          <span>{event.module}</span>
          <span>·</span>
          <span>{new Date(event.timestamp).toLocaleDateString('pt', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          {event.user && (
            <>
              <span>·</span>
              <span>{event.user.fullName}</span>
            </>
          )}
        </div>

        {expanded && (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
              <div><span className="font-medium">Entidade:</span> {event.entity}</div>
              {event.entityId && <div><span className="font-medium">ID:</span> {event.entityId}</div>}
              <div><span className="font-medium">Impact:</span> {event.impactScore}/100</div>
              <div><span className="font-medium">Módulo:</span> {event.module}</div>
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 flex items-center gap-1.5">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
          event.impactScore >= 75 ? 'bg-emerald-100 text-emerald-700' :
          event.impactScore >= 50 ? 'bg-amber-100 text-amber-700'     : 'bg-slate-100 text-slate-500'
        }`}>{event.impactScore}</span>
        <ChevronDown size={13} className={`text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </div>
    </div>
  );
}

// ─── Timeline Tab ─────────────────────────────────────────────────

function TimelineTab() {
  const [data, setData]         = useState<{ grouped: GroupedEvents[]; milestones: any[]; meta: any } | null>(null);
  const [loading, setLoading]   = useState(true);
  const [category, setCategory] = useState('');
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), limit: '20', ...(category ? { category } : {}) });
    api(`/history/timeline/me?${qs}`).then(setData).finally(() => setLoading(false));
  }, [page, category]);

  useEffect(() => { load(); }, [load]);

  const CATS = ['LEARNING', 'PERFORMANCE', 'CAREER', 'ENGAGEMENT', 'SYSTEM', 'COMPLIANCE', 'ATTENDANCE'];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar eventos..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" />
        </div>
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => { setCategory(''); setPage(1); }}
            className={`text-xs px-2.5 py-1.5 rounded-lg ${!category ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            Todos
          </button>
          {CATS.map(c => {
            const conf = CATEGORY_COLOR[c] ?? CATEGORY_COLOR.SYSTEM;
            return (
              <button key={c} onClick={() => { setCategory(c); setPage(1); }}
                className={`text-xs px-2.5 py-1.5 rounded-lg ${category === c ? 'bg-indigo-600 text-white' : `${conf.bg} ${conf.color}`}`}>
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {/* Milestones strip */}
      {(data?.milestones.length ?? 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-700 mb-2">⭐ Marcos Recentes</p>
          <div className="flex flex-wrap gap-2">
            {data!.milestones.slice(0, 5).map((m, i) => (
              <div key={i} className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-amber-100">
                <span className="text-sm">{m.icon}</span>
                <p className="text-xs font-medium text-slate-700">{m.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grouped timeline */}
      {loading ? <Skeleton /> : (
        <div className="space-y-6">
          {(data?.grouped ?? []).map(group => (
            <div key={group.month}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                <h3 className="text-sm font-semibold text-slate-600">{monthLabel(group.month)}</h3>
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[10px] text-slate-400">{group.items.length} eventos</span>
              </div>
              <div className="space-y-2 pl-5">
                {group.items
                  .filter(e => !search || e.title.toLowerCase().includes(search.toLowerCase()))
                  .map(e => <EventCard key={e.id} event={e} />)}
              </div>
            </div>
          ))}

          {(data?.grouped ?? []).length === 0 && (
            <div className="py-16 text-center text-slate-400">
              <Clock size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum evento encontrado</p>
            </div>
          )}

          {/* Pagination */}
          {data && data.meta.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 text-sm rounded-lg border border-slate-200 disabled:opacity-40">← Anterior</button>
              <span className="px-4 py-2 text-sm text-slate-500">{page} / {data.meta.totalPages}</span>
              <button disabled={page === data.meta.totalPages} onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 text-sm rounded-lg border border-slate-200 disabled:opacity-40">Próxima →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Milestones Tab ───────────────────────────────────────────────

function MilestonesTab() {
  const [data, setData]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api('/history/milestones/me').then(setData).finally(() => setLoading(false)); }, []);

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-3">
      {data.map((m, i) => (
        <div key={i} className="bg-white rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center text-2xl shrink-0">
            {m.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800">{m.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{new Date(m.date).toLocaleDateString('pt', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="text-right shrink-0">
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              m.impactScore >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {m.impactScore} pts
            </span>
            <p className="text-[10px] text-slate-400 mt-1">{m.type}</p>
          </div>
        </div>
      ))}

      {data.length === 0 && (
        <div className="py-16 text-center text-slate-400">
          <Award size={36} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Sem marcos de carreira registados ainda</p>
        </div>
      )}
    </div>
  );
}

// ─── Stats Tab ────────────────────────────────────────────────────

function StatsTab() {
  const [data, setData]   = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api('/history/stats/me').then(setData).finally(() => setLoading(false)); }, []);

  if (loading) return <Skeleton />;

  // Heatmap (last 12 weeks)
  const today   = new Date();
  const days12w = Array.from({ length: 84 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (83 - i));
    return d.toISOString().split('T')[0];
  });

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Flame,     label: 'Streak',         value: `${data?.streak ?? 0} dias`,   color: 'text-orange-600', bg: 'bg-orange-50' },
          { icon: Activity,  label: 'Dias Activos',   value: data?.activeDays ?? 0,          color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { icon: BookOpen,  label: 'Conclusões',     value: data?.completions ?? 0,         color: 'text-teal-600',   bg: 'bg-teal-50' },
          { icon: Zap,       label: 'XP Total',       value: data?.xpPoints ?? 0,            color: 'text-amber-600',  bg: 'bg-amber-50' },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-xl border border-slate-100 p-4">
            <div className={`p-2 rounded-lg ${item.bg} w-fit mb-2`}><item.icon size={16} className={item.color} /></div>
            <p className="text-2xl font-bold text-slate-800">{item.value}</p>
            <p className="text-xs text-slate-500">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Activity heatmap */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <h4 className="font-semibold text-slate-700 mb-4">Actividade — Últimas 12 Semanas</h4>
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(84, 1fr)' }}>
          {days12w.map(day => {
            const count = data?.heatmap?.[day] ?? 0;
            const intensity = count === 0 ? 'bg-slate-100' :
              count <= 2  ? 'bg-indigo-200' :
              count <= 5  ? 'bg-indigo-400' : 'bg-indigo-600';
            return (
              <div key={day} title={`${day}: ${count} eventos`}
                className={`aspect-square rounded-[2px] ${intensity}`} />
            );
          })}
        </div>
        <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
          <span>Menos</span>
          {['bg-slate-100', 'bg-indigo-200', 'bg-indigo-400', 'bg-indigo-600'].map((c, i) => (
            <div key={i} className={`w-3 h-3 rounded-[2px] ${c}`} />
          ))}
          <span>Mais</span>
        </div>
      </div>

      {/* By category */}
      {data?.byCategory && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-4">Actividade por Categoria</h4>
          <div className="space-y-2">
            {Object.entries(data.byCategory as Record<string, number>)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, count]) => {
                const total = Object.values(data.byCategory as Record<string, number>).reduce((a, b) => a + b, 0);
                const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
                const conf  = CATEGORY_COLOR[cat] ?? CATEGORY_COLOR.SYSTEM;
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className={`${conf.color} font-medium`}>{cat}</span>
                      <span className="text-slate-700 font-semibold">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full">
                      <div className={`h-1.5 rounded-full ${conf.bg.replace('bg-', 'bg-').replace('-100', '-400')}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Audit Tab ────────────────────────────────────────────────────

function AuditTab() {
  const [data, setData]   = useState<any | null>(null);
  const [upcoming, setUpcoming] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api('/history/audit/stats'),
      api('/history/upcoming'),
    ]).then(([a, u]) => { setData(a); setUpcoming(u); }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-5">
      {/* Audit stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Total de Eventos', value: data?.total ?? 0, icon: Activity },
          { label: 'Top Acção',        value: data?.byAction?.[0]?.action ?? '–', icon: BarChart2 },
          { label: 'Utilizadores',     value: data?.topUsers?.length ?? 0, icon: Users },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-100 p-4">
            <k.icon size={16} className="text-indigo-600 mb-2" />
            <p className="text-2xl font-bold text-slate-800">{k.value}</p>
            <p className="text-xs text-slate-400">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Top actions */}
      {(data?.byAction ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-3">Top Acções</h4>
          <div className="space-y-1.5">
            {data.byAction.slice(0, 8).map((a: any, i: number) => {
              const max = data.byAction[0].count;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-slate-300 w-5 text-right">#{i+1}</span>
                  <span className="text-xs font-mono font-medium text-slate-700 w-40 truncate">{a.action}</span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full">
                    <div className="h-1.5 bg-indigo-400 rounded-full" style={{ width: `${(a.count / max) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-600 w-10 text-right">{a.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming anniversaries */}
      {(upcoming?.anniversaries?.length ?? 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h4 className="font-semibold text-amber-700 mb-3">🎉 Aniversários de Empresa este Mês</h4>
          <div className="grid grid-cols-2 gap-2">
            {(upcoming.anniversaries as any[]).slice(0, 6).map((u: any, i: number) => (
              <div key={i} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2">
                <div className="w-7 h-7 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold text-amber-700 shrink-0">
                  {u.fullName[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{u.fullName}</p>
                  <p className="text-[10px] text-amber-600 font-semibold">{u.years} {u.years === 1 ? 'ano' : 'anos'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent alerts */}
      {(data?.recentAlerts ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Shield size={14} className="text-red-500" />Eventos de Segurança Recentes
          </h4>
          <div className="space-y-2">
            {(data.recentAlerts as any[]).map((a: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-600 py-1.5 border-b border-slate-50">
                <span className="font-mono text-red-500 shrink-0">{a.action}</span>
                <span>·</span>
                <span>{a.user?.fullName ?? `User ${a.userId}`}</span>
                <span className="ml-auto text-slate-400">{new Date(a.timestamp).toLocaleDateString('pt')}</span>
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
  { id: 'timeline',   label: 'Timeline',   icon: Clock },
  { id: 'milestones', label: 'Marcos',     icon: Award },
  { id: 'stats',      label: 'Actividade', icon: Activity },
  { id: 'audit',      label: 'Auditoria',  icon: Shield },
];

export default function HistoryPage() {
  const [tab, setTab] = useState<Tab>('timeline');

  const PANELS: Record<Tab, JSX.Element> = {
    timeline:   <TimelineTab />,
    milestones: <MilestonesTab />,
    stats:      <StatsTab />,
    audit:      <AuditTab />,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-indigo-100 rounded-lg"><Clock size={18} className="text-indigo-600" /></div>
            <h1 className="text-xl font-bold text-slate-800">History & Timeline</h1>
          </div>
          <p className="text-sm text-slate-400">Jornada do colaborador · Marcos · Actividade · Auditoria</p>
        </div>
      </div>

      <div className="bg-white border-b border-slate-200 px-6">
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tab === t.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
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


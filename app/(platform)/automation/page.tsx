
'use client';
// src/app/(dashboard)/automation/page.tsx

import { useState, useEffect } from 'react';
import {
  Zap, Play, Pause, Copy, Trash2, Plus, RefreshCw,
  CheckCircle, AlertTriangle, Clock, BarChart2, BookOpen,
  ChevronRight, Activity, Settings,
} from 'lucide-react';

type Tab = 'rules' | 'executions' | 'templates' | 'stats';

const BASE = '/api';
async function api(path: string, opts?: RequestInit) {
  const r = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` },
    ...opts,
  });
  if (!r.ok) throw new Error();
  return r.json();
}

const CATEGORY_COLOR: Record<string, string> = {
  HR:          'bg-violet-100 text-violet-700',
  LMS:         'bg-blue-100 text-blue-700',
  PERFORMANCE: 'bg-amber-100 text-amber-700',
  ENGAGEMENT:  'bg-pink-100 text-pink-700',
  GAMIFICATION:'bg-yellow-100 text-yellow-700',
  OPERATIONAL: 'bg-slate-100 text-slate-600',
  CUSTOM:      'bg-teal-100 text-teal-700',
};

const TRIGGER_LABEL: Record<string, string> = {
  'employee.created':       '👤 Novo Colaborador',
  'employee.deactivated':   '🚪 Colaborador Desactivado',
  'course.completed':       '📚 Curso Concluído',
  'pdi.approved':           '✅ PDI Aprovado',
  'evaluation.submitted':   '⭐ Avaliação Submetida',
  'badge.awarded':          '🏅 Badge Atribuído',
  'cron.daily':             '🗓️ Diário',
  'cron.weekly':            '📅 Semanal',
  'cron.monthly':           '📆 Mensal',
  'BIRTHDAY_TODAY':         '🎂 Aniversário',
  'ENROLLMENT_EXPIRING':    '⏰ Formação Pendente',
  'PAYSLIP_DUE':            '💰 Recibos Pendentes',
  'manual':                 '▶️ Manual',
};

function Skeleton({ count = 3 }: { count?: number }) {
  return <div className="space-y-3 animate-pulse">{[...Array(count)].map((_, i) => <div key={i} className="bg-slate-100 rounded-xl h-16" />)}</div>;
}

// ─── Rules Tab ────────────────────────────────────────────────────

function RulesTab() {
  const [rules, setRules]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = () => { setLoading(true); api('/automation/rules').then(setRules).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const toggle = async (id: number) => { await api(`/automation/rules/${id}/toggle`, { method: 'PATCH' }); load(); };
  const clone  = async (id: number) => { await api(`/automation/rules/${id}/clone`, { method: 'POST' }); load(); };
  const remove = async (id: number) => { if (confirm('Remover regra?')) { await api(`/automation/rules/${id}`, { method: 'DELETE' }); load(); } };
  const runAll = async () => { setRunning(true); const r = await api('/automation/run', { method: 'POST' }); setRunning(false); alert(`Executadas: ${r.executed} regras`); };

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{rules.length} regra(s) · {rules.filter(r => r.active).length} activas</span>
        <div className="flex gap-2">
          <button onClick={runAll} disabled={running}
            className="flex items-center gap-1 text-xs px-3 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-60">
            {running ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
            Executar Todas
          </button>
          <button className="flex items-center gap-1 text-xs px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <Plus size={12} />Nova Regra
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {rules.map((r: any) => (
          <div key={r.id} className={`bg-white rounded-xl border p-4 ${r.active ? 'border-slate-100' : 'border-slate-100 opacity-60'}`}>
            <div className="flex items-start gap-3">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${r.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-sm font-semibold text-slate-800">{r.name}</p>
                  {r.category && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_COLOR[r.category] ?? CATEGORY_COLOR.CUSTOM}`}>
                      {r.category}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <span>{TRIGGER_LABEL[r.trigger] ?? r.trigger}</span>
                  <span>→</span>
                  <span className="font-mono">{r.action}</span>
                </div>
                {r.stats && (
                  <div className="flex gap-3 mt-1 text-[10px]">
                    <span className="text-slate-400">{r.stats.total} execuções</span>
                    <span className="text-emerald-600">{r.stats.success} ✅</span>
                    {r.stats.failed > 0 && <span className="text-red-500">{r.stats.failed} ❌</span>}
                    <span className="text-indigo-500 font-semibold">{r.stats.successRate}% ok</span>
                  </div>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => toggle(r.id)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400" title="Toggle">
                  {r.active ? <Pause size={13} /> : <Play size={13} />}
                </button>
                <button onClick={() => clone(r.id)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400" title="Clonar">
                  <Copy size={13} />
                </button>
                <button onClick={() => remove(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500" title="Remover">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {rules.length === 0 && (
          <div className="py-16 text-center bg-white rounded-xl border border-slate-100 text-slate-400">
            <Zap size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sem automações — usa os templates para começar</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Executions Tab ───────────────────────────────────────────────

function ExecutionsTab() {
  const [data, setData]   = useState<any | null>(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const load = (s = '') => {
    setLoading(true);
    api(`/automation/executions${s ? `?status=${s}` : ''}`).then(setData).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const STATUS_COLOR: Record<string, string> = {
    SUCCESS: 'bg-emerald-100 text-emerald-700',
    FAILED:  'bg-red-100 text-red-700',
    RUNNING: 'bg-blue-100 text-blue-700',
    PENDING: 'bg-amber-100 text-amber-700',
    SKIPPED: 'bg-slate-100 text-slate-500',
  };

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['', 'SUCCESS', 'FAILED', 'PENDING'].map(s => (
          <button key={s} onClick={() => { setStatus(s); load(s); }}
            className={`text-xs px-3 py-1.5 rounded-lg ${status === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {s || 'Todas'}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400 self-center">{data?.meta?.total ?? 0} execuções</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-100">
        <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
          {(data?.data ?? []).map((e: any, i: number) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
              <div className={`w-2 h-2 rounded-full shrink-0 ${e.status === 'SUCCESS' ? 'bg-emerald-500' : e.status === 'FAILED' ? 'bg-red-500' : 'bg-amber-400'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700">Rule #{e.ruleId}</p>
                {e.error && <p className="text-[10px] text-red-500 truncate">{e.error}</p>}
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLOR[e.status] ?? STATUS_COLOR.PENDING}`}>
                {e.status}
              </span>
              <span className="text-[10px] text-slate-400 shrink-0">
                {e.startedAt ? new Date(e.startedAt).toLocaleString('pt') : '–'}
              </span>
              {e.status === 'FAILED' && (
                <button onClick={() => api(`/automation/executions/${e.id}/rerun`, { method: 'POST' })}
                  className="text-[10px] px-2 py-1 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 shrink-0">
                  Retry
                </button>
              )}
            </div>
          ))}
          {(data?.data?.length ?? 0) === 0 && (
            <div className="py-12 text-center text-slate-400">
              <Activity size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sem execuções registadas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Templates Tab ────────────────────────────────────────────────

function TemplatesTab() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [applying, setApplying]   = useState<number | null>(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => { api('/automation/templates').then(setTemplates).finally(() => setLoading(false)); }, []);

  const apply = async (index: number) => {
    setApplying(index);
    const r = await api(`/automation/templates/${index}/apply`, { method: 'POST' }).catch(() => null);
    setApplying(null);
    if (r) alert(r.message ?? 'Template aplicado!');
  };

  if (loading) return <Skeleton />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {templates.map((t: any, i: number) => (
        <div key={i} className="bg-white rounded-xl border border-slate-100 p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-slate-800">{t.name}</p>
              {t.description && <p className="text-xs text-slate-400 mt-0.5">{t.description}</p>}
            </div>
            {t.category && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ml-2 ${CATEGORY_COLOR[t.category] ?? CATEGORY_COLOR.CUSTOM}`}>
                {t.category}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-3">
            <span>{TRIGGER_LABEL[t.trigger] ?? t.trigger}</span>
            <span>→</span>
            <span className="font-mono">{t.action}</span>
          </div>
          <button onClick={() => apply(i)} disabled={applying === i}
            className="w-full text-xs py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60">
            {applying === i ? 'A aplicar…' : 'Aplicar Template'}
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Stats Tab ────────────────────────────────────────────────────

function StatsTab() {
  const [data, setData]   = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api('/automation/stats').then(setData).finally(() => setLoading(false)); }, []);
  if (loading) return <Skeleton />;
  const e = data?.executions ?? {};
  const r = data?.rules ?? {};

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Regras Activas',  value: r.active ?? 0,       color: 'text-indigo-600' },
          { label: 'Total Execuções', value: e.total ?? 0,        color: 'text-slate-800' },
          { label: 'Taxa de Sucesso', value: `${e.successRate ?? 0}%`, color: e.successRate >= 90 ? 'text-emerald-600' : 'text-amber-600' },
          { label: 'Falhas',          value: e.failed ?? 0,       color: e.failed > 0 ? 'text-red-600' : 'text-emerald-600' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-100 p-4">
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      {(data?.byCategory ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-4">Por Categoria</h4>
          {(data.byCategory as any[]).map((c: any, i: number) => {
            const max = Math.max(...(data.byCategory as any[]).map((x: any) => x.count));
            return (
              <div key={i} className="mb-2">
                <div className="flex justify-between text-xs mb-0.5">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${CATEGORY_COLOR[c.category] ?? CATEGORY_COLOR.CUSTOM}`}>{c.category}</span>
                  <span className="font-bold text-slate-700">{c.count}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full">
                  <div className="h-1.5 bg-indigo-400 rounded-full" style={{ width: `${(c.count / max) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(data?.recentFails ?? []).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
            <AlertTriangle size={14} />Falhas Recentes
          </h4>
          {(data.recentFails as any[]).map((f: any, i: number) => (
            <div key={i} className="text-xs text-red-700 py-1 border-b border-red-100 last:border-0">
              Rule #{f.ruleId} — {f.error ?? 'Erro desconhecido'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'rules',      label: 'Automações',  icon: Zap },
  { id: 'executions', label: 'Execuções',   icon: Activity },
  { id: 'templates',  label: 'Templates',   icon: BookOpen },
  { id: 'stats',      label: 'Analytics',   icon: BarChart2 },
];

export default function AutomationPage() {
  const [tab, setTab] = useState<Tab>('rules');

  const PANELS: Record<Tab, JSX.Element> = {
    rules:      <RulesTab />,
    executions: <ExecutionsTab />,
    templates:  <TemplatesTab />,
    stats:      <StatsTab />,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-amber-100 rounded-lg"><Zap size={18} className="text-amber-600" /></div>
            <h1 className="text-xl font-bold text-slate-800">Automation</h1>
          </div>
          <p className="text-sm text-slate-400">Regras · Triggers · Execuções · Templates · Analytics</p>
        </div>
      </div>

      <div className="bg-white border-b border-slate-200 px-6">
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tab === t.id ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
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
















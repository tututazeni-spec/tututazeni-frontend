
'use client';
// src/app/(dashboard)/acl/page.tsx

import { useState, useEffect } from 'react';
import {
  Shield, Users, Key, Lock, AlertTriangle, CheckCircle,
  Settings, ChevronRight, Plus, RefreshCw, Eye, Trash2,
  BarChart2, Activity,
} from 'lucide-react';

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

type Tab = 'overview' | 'roles' | 'matrix' | 'policies' | 'audit';

function Skeleton({ count = 3 }: { count?: number }) {
  return <div className="space-y-3 animate-pulse">{[...Array(count)].map((_, i) => <div key={i} className="bg-slate-100 rounded-xl h-16" />)}</div>;
}

// ─── Overview ─────────────────────────────────────────────────────

function OverviewTab() {
  const [stats, setStats]     = useState<any | null>(null);
  const [myPerms, setMyPerms] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api('/acl/stats'), api('/acl/my-permissions')])
      .then(([s, m]) => { setStats(s); setMyPerms(m); }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Utilizadores',    value: stats?.totalUsers     ?? 0, icon: Users,     color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Roles',           value: stats?.totalRoles     ?? 0, icon: Shield,    color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Permissões',      value: stats?.totalPermissions ?? 0, icon: Key,     color: 'text-teal-600',   bg: 'bg-teal-50' },
          { label: 'Acessos Negados', value: stats?.deniedCount    ?? 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
            <div className={`p-2 rounded-lg ${k.bg} w-fit mb-2`}><k.icon size={16} className={k.color} /></div>
            <p className="text-2xl font-bold text-slate-800">{k.value}</p>
            <p className="text-xs text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Role distribution */}
      {(stats?.roleBreakdown ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-4">Distribuição de Roles</h4>
          <div className="space-y-2">
            {(stats.roleBreakdown as any[]).map((r: any, i: number) => {
              const max = stats.roleBreakdown[0].count;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-600 w-24 truncate">{r.role?.name ?? 'N/A'}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full">
                    <div className="h-2 bg-indigo-400 rounded-full" style={{ width: `${(r.count / max) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 w-8 text-right">{r.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* My permissions */}
      {myPerms && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Key size={14} className="text-indigo-500" />
            As Minhas Permissões ({myPerms.roleCode})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {myPerms.permissions.includes('*') ? (
              <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg font-bold">
                ✅ ADMIN — Acesso Total (*)
              </span>
            ) : (
              (myPerms.permissions as string[]).slice(0, 20).map((p: string, i: number) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg font-mono">{p}</span>
              ))
            )}
            {myPerms.permissions.length > 20 && (
              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg">+{myPerms.permissions.length - 20} mais</span>
            )}
          </div>
        </div>
      )}

      {/* Recent denied */}
      {(stats?.recentDenied ?? []).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
            <AlertTriangle size={14} />Acessos Negados Recentes
          </h4>
          <div className="space-y-1.5">
            {(stats.recentDenied as any[]).map((d: any, i: number) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <span className="text-red-600 font-medium">{d.user?.fullName ?? `User ${d.userId}`}</span>
                <span className="text-slate-400">·</span>
                <span className="font-mono text-slate-600">{JSON.parse(d.changes ?? '{}').subject ?? d.entity}</span>
                <span className="text-slate-400 ml-auto">{new Date(d.timestamp).toLocaleTimeString('pt')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Roles Tab ────────────────────────────────────────────────────

function RolesTab() {
  const [roles, setRoles]   = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api('/acl/roles').then(setRoles).finally(() => setLoading(false)); }, []);

  if (loading) return <Skeleton />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Role list */}
      <div className="bg-white rounded-xl border border-slate-100">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h4 className="font-semibold text-slate-700">Roles ({roles.length})</h4>
        </div>
        <div className="divide-y divide-slate-50">
          {roles.map(r => (
            <button key={r.id} onClick={() => setSelected(r)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${selected?.id === r.id ? 'bg-indigo-50' : ''}`}>
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">
                {r.code?.[0] ?? r.name[0]}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-slate-700">{r.name}</p>
                <p className="text-[10px] text-slate-400">{r._count?.users ?? 0} utilizadores · {r.permissions?.length ?? 0} permissões</p>
              </div>
              <ChevronRight size={13} className="text-slate-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Role detail */}
      <div className="md:col-span-2 bg-white rounded-xl border border-slate-100 p-5">
        {!selected ? (
          <div className="text-center py-12 text-slate-400">
            <Shield size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Selecciona um role para ver detalhes</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-slate-800 text-lg">{selected.name}</h4>
                <p className="text-xs text-slate-400 font-mono">{selected.code}</p>
              </div>
              <div className="flex gap-2">
                <button className="text-xs px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">
                  Clonar
                </button>
              </div>
            </div>

            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Permissões ({selected.permissions?.length ?? 0})
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto">
              {(selected.permissions ?? []).map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-1 text-[10px] bg-slate-100 text-slate-700 px-2 py-1 rounded-lg">
                  <span className="font-mono">{p.name}</span>
                </div>
              ))}
              {selected.permissions?.length === 0 && (
                <p className="text-sm text-slate-400">Sem permissões atribuídas</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Matrix Tab ───────────────────────────────────────────────────

function MatrixTab() {
  const [data, setData]   = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState('');

  useEffect(() => { api('/acl/matrix').then(setData).finally(() => setLoading(false)); }, []);

  if (loading) return <Skeleton />;

  const subjects = [...new Set((data?.permissions ?? []).map((p: any) => p.subject as string))];
  const filtered = (data?.permissions ?? []).filter((p: any) => !subjectFilter || p.subject === subjectFilter);

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setSubjectFilter('')}
          className={`text-xs px-3 py-1.5 rounded-lg ${!subjectFilter ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
          Todos
        </button>
        {subjects.map(s => (
          <button key={s} onClick={() => setSubjectFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-lg ${subjectFilter === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Matrix table */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left text-slate-500 font-medium whitespace-nowrap">Permissão</th>
              {(data?.roles ?? []).map((r: any) => (
                <th key={r.id} className="px-2 py-2 text-center text-slate-500 font-medium whitespace-nowrap">{r.name}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((p: any, i: number) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-3 py-1.5">
                  <div>
                    <p className="font-mono text-slate-700">{p.name}</p>
                    <p className="text-[10px] text-slate-400">{p.subject} · {p.action}</p>
                  </div>
                </td>
                {(data?.roles ?? []).map((r: any) => (
                  <td key={r.id} className="px-2 py-1.5 text-center">
                    {data.matrix[i]?.[r.name]
                      ? <CheckCircle size={14} className="text-emerald-500 mx-auto" />
                      : <span className="text-slate-200">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Audit Tab ────────────────────────────────────────────────────

function AuditTab() {
  const [data, setData]     = useState<any | null>(null);
  const [denied, setDenied] = useState<any | null>(null);
  const [view, setView]     = useState<'all' | 'denied'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const path = view === 'denied' ? '/acl/audit/denied' : '/acl/audit';
    setLoading(true);
    api(path).then(setData).finally(() => setLoading(false));
  }, [view]);

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['all', 'denied'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`text-xs px-4 py-2 rounded-lg font-medium ${view === v ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            {v === 'all' ? 'Todas as Alterações' : '🔴 Acessos Negados'}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400 self-center">{data?.meta?.total ?? 0} registos</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-100">
        <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
          {(data?.data ?? []).map((log: any, i: number) => {
            const changes = log.changes ? (() => { try { return JSON.parse(log.changes); } catch { return null; } })() : null;
            return (
              <div key={i} className="px-4 py-3 flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${log.action === 'ACCESS_DENIED' ? 'bg-red-500' : 'bg-indigo-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-slate-700">{log.user?.fullName ?? `User ${log.userId}`}</span>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{log.action}</span>
                    {changes?.subject && <span className="text-[10px] text-slate-400">{changes.subject}</span>}
                  </div>
                  {changes?.reason && <p className="text-[10px] text-slate-400 mt-0.5">{changes.reason}</p>}
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">{new Date(log.timestamp).toLocaleString('pt')}</span>
              </div>
            );
          })}
          {(data?.data?.length ?? 0) === 0 && (
            <div className="py-12 text-center text-slate-400">
              <Activity size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sem registos de auditoria</p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {data?.meta?.totalPages > 1 && (
        <p className="text-xs text-slate-400 text-center">
          Pág. 1 / {data.meta.totalPages} — {data.meta.total} registos totais
        </p>
      )}
    </div>
  );
}

// ─── Policies Tab ────────────────────────────────────────────────

function PoliciesTab() {
  const [data, setData]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api('/acl/policies').then(d => setData(d ?? [])).finally(() => setLoading(false)); }, []);

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-3">
      {data.map((p: any, i: number) => (
        <div key={i} className={`bg-white rounded-xl border p-4 ${p.effect === 'DENY' ? 'border-red-200' : 'border-emerald-200'}`}>
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-slate-800">{p.name}</h4>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${p.effect === 'DENY' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {p.effect}
            </span>
          </div>
          {p.description && <p className="text-xs text-slate-500 mb-2">{p.description}</p>}
          <div className="flex gap-2 flex-wrap text-[10px]">
            {p.subject && <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Subject: {p.subject}</span>}
            {p.action  && <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Action: {p.action}</span>}
            {p.requiresJustification && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded">⚠️ Requer Justificativa</span>}
            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded">Priority: {p.priority}</span>
          </div>
          {p.condition && (
            <pre className="text-[10px] bg-slate-50 rounded p-2 mt-2 text-slate-600 overflow-x-auto">
              {JSON.stringify(JSON.parse(p.condition), null, 2)}
            </pre>
          )}
        </div>
      ))}

      {data.length === 0 && (
        <div className="py-16 text-center bg-slate-50 rounded-xl text-slate-400">
          <Lock size={36} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Sem políticas de acesso definidas</p>
          <p className="text-xs mt-1">As políticas ABAC/PBAC permitem controlo granular baseado em contexto</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'overview',  label: 'Visão Geral', icon: BarChart2 },
  { id: 'roles',     label: 'Roles',       icon: Shield },
  { id: 'matrix',    label: 'Matriz',      icon: Key },
  { id: 'policies',  label: 'Políticas',   icon: Settings },
  { id: 'audit',     label: 'Auditoria',   icon: Activity },
];

export default function AclPage() {
  const [tab, setTab] = useState<Tab>('overview');

  const PANELS: Record<Tab, JSX.Element> = {
    overview: <OverviewTab />,
    roles:    <RolesTab />,
    matrix:   <MatrixTab />,
    policies: <PoliciesTab />,
    audit:    <AuditTab />,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-red-100 rounded-lg"><Shield size={18} className="text-red-600" /></div>
              <h1 className="text-xl font-bold text-slate-800">Access Control</h1>
            </div>
            <p className="text-sm text-slate-400">RBAC · ABAC · Roles · Permissões · Políticas · Auditoria</p>
          </div>
          <button onClick={() => api('/acl/seed-permissions', { method: 'POST' })}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 text-xs rounded-lg hover:bg-slate-200">
            <RefreshCw size={13} />
            Seed Permissões
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
                  tab === t.id ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
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

'use client';
// src/app/(dashboard)/roles-permissions/page.tsx

import { useState } from 'react';
import {
  Shield, Users, Key, CheckCircle, AlertTriangle,
  Copy, Trash2, Plus, ChevronRight, Search, Brain, Activity,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useConfirm } from '@/providers/ConfirmProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';

type Tab = 'roles' | 'matrix' | 'simulator' | 'governance';

function Skeleton({ count = 3 }: { count?: number }) {
  return <div className="space-y-3 animate-pulse">{[...Array(count)].map((_, i) => <div key={i} className="bg-slate-100 rounded-xl h-16" />)}</div>;
}

// ─── Roles Tab ────────────────────────────────────────────────────

function RolesTab() {
  const [selected, setSel]  = useState<any | null>(null);
  const [search, setSearch] = useState('');

  const { data: roles = [], isLoading: loading, refetch } = useApiQuery<any[]>(
    queryKeys.rolesPermissions.roles(), '/roles-permissions', { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const load = () => { void refetch(); };
  const confirm = useConfirm();

  const filtered = roles.filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* List */}
      <div className="bg-white rounded-xl border border-slate-100">
        <div className="p-3 border-b border-slate-100">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar roles..."
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" />
          </div>
        </div>
        {loading ? <Skeleton /> : (
          <div className="divide-y divide-slate-50 max-h-[560px] overflow-y-auto">
            {filtered.map(r => (
              <button key={r.id} onClick={() => setSel(r)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 ${selected?.id === r.id ? 'bg-indigo-50' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">
                  {r.code?.[0] ?? r.name[0]}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-slate-700 truncate">{r.name}</p>
                  <p className="text-[10px] text-slate-400">{r._count?.users ?? 0} users · {r.effectivePermissions ?? 0} perms</p>
                </div>
                <ChevronRight size={12} className="text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail */}
      <div className="md:col-span-2 bg-white rounded-xl border border-slate-100 p-5">
        {!selected ? (
          <div className="text-center py-12 text-slate-400">
            <Shield size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Selecciona um role para ver e editar permissões</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-slate-800 text-lg">{selected.name}</h4>
                <p className="text-xs text-slate-400 font-mono">{selected.code} · {selected._count?.users ?? 0} utilizadores</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { const n = prompt('Nome do clone:'); if (n) apiClient.post(`/roles-permissions/${selected.id}/clone`, { newName: n }).then(load); }}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">
                  <Copy size={12} />Clonar
                </button>
                {!(selected.isSystem) && selected._count?.users === 0 && (
                  <button onClick={async () => { if (await confirm({ title: 'Remover role?', confirmLabel: 'Remover', destructive: true })) apiClient.delete(`/roles-permissions/${selected.id}`).then(() => { setSel(null); load(); }); }}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
                    <Trash2 size={12} />Remover
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Permissões ({selected.permissions?.length ?? 0})
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto mb-4">
              {(selected.permissions ?? []).map((p: any, i: number) => (
                <span key={i} className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg">{p.name}</span>
              ))}
              {!selected.permissions?.length && <p className="text-sm text-slate-400">Sem permissões</p>}
            </div>

            {/* Users in role */}
            {(selected.users ?? []).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Utilizadores</p>
                <div className="flex flex-wrap gap-2">
                  {selected.users.slice(0, 10).map((u: any, i: number) => (
                    <div key={i} className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-2.5 py-1.5">
                      <div className="w-5 h-5 rounded-full bg-indigo-200 flex items-center justify-center text-[9px] font-bold text-indigo-700">
                        {u.fullName[0]}
                      </div>
                      <span className="text-xs text-slate-700">{u.fullName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Matrix Tab ───────────────────────────────────────────────────

function MatrixTab() {
  const [subject, setSubject] = useState('');
  const { data, isLoading: loading } = useApiQuery<any>(
    queryKeys.rolesPermissions.matrix(), '/roles-permissions/matrix', { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading) return <Skeleton />;

  const subjects = (data?.grouped ?? []).map((g: any) => g.subject);
  const filtered = subject
    ? (data?.permissions ?? []).filter((p: any) => p.subject === subject)
    : (data?.permissions ?? []);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setSubject('')}
          className={`text-xs px-3 py-1.5 rounded-lg ${!subject ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Todos</button>
        {subjects.map((s: string) => (
          <button key={s} onClick={() => setSubject(s)}
            className={`text-xs px-3 py-1.5 rounded-lg ${subject === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{s}</button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-100 overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left text-slate-500 font-medium">Permissão</th>
              {(data?.roles ?? []).map((r: any) => (
                <th key={r.id} className="px-2 py-2 text-center text-slate-500 font-medium whitespace-nowrap">{r.name}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((p: any, i: number) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-3 py-1.5">
                  <p className="font-mono text-slate-700">{p.name}</p>
                  <p className="text-[10px] text-slate-400">{p.subject} · {p.action}</p>
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

// ─── Simulator Tab ────────────────────────────────────────────────

function SimulatorTab() {
  const [userId, setUserId]   = useState('');
  const [resource, setResource] = useState('');
  const [action, setAction]   = useState('');
  const [result, setResult]   = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!userId || !resource || !action) return;
    setLoading(true);
    apiClient.post<any>('/roles-permissions/simulate', { userId: +userId, resource, action })
      .then(setResult).finally(() => setLoading(false));
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Brain size={16} className="text-violet-500" />
          Simulador de Permissões
        </h4>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'User ID', value: userId, set: setUserId, placeholder: 'Ex: 123' },
            { label: 'Recurso', value: resource, set: setResource, placeholder: 'Ex: reports' },
            { label: 'Acção', value: action, set: setAction, placeholder: 'Ex: export' },
          ].map(f => (
            <div key={f.label}>
              <label className="text-xs text-slate-500 mb-1 block">{f.label}</label>
              <input value={f.value} onChange={e => f.set(e.target.value)}
                placeholder={f.placeholder}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-400" />
            </div>
          ))}
        </div>
        <button onClick={run} disabled={loading || !userId || !resource || !action}
          className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60">
          {loading ? 'A verificar…' : 'Verificar Permissão'}
        </button>
      </div>

      {result && (
        <div className={`border rounded-xl p-5 ${result.allowed ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          {/* Verdict */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${result.allowed ? 'bg-emerald-500' : 'bg-red-500'}`}>
              {result.allowed ? <CheckCircle size={20} className="text-white" /> : <AlertTriangle size={20} className="text-white" />}
            </div>
            <div>
              <p className={`font-bold text-lg ${result.allowed ? 'text-emerald-700' : 'text-red-700'}`}>
                {result.allowed ? 'PERMITIDO' : 'NEGADO'}
              </p>
              <p className="text-xs text-slate-600">{result.reason}</p>
            </div>
          </div>

          {/* User + Role */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Utilizador', value: result.user?.fullName },
              { label: 'Role',       value: result.role?.name ?? 'Sem role' },
              { label: 'Recurso',    value: result.resource },
              { label: 'Acção',      value: result.action },
            ].map(item => (
              <div key={item.label} className="bg-white/60 rounded-lg p-2.5">
                <p className="text-[10px] text-slate-400">{item.label}</p>
                <p className="text-xs font-semibold text-slate-700">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Decision chain */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Cadeia de Decisão</p>
            {(result.chain ?? []).map((s: any, i: number) => (
              <div key={i} className="flex items-center gap-3 mb-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${s.result ? 'bg-emerald-500 text-white' : 'bg-red-400 text-white'}`}>
                  {s.step}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-slate-700">{s.check}</p>
                  <p className="text-[10px] text-slate-400">{s.detail}</p>
                </div>
                <span className={`text-[10px] font-bold ${s.result ? 'text-emerald-600' : 'text-red-500'}`}>
                  {s.result ? 'PASS' : 'FAIL'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Governance Tab ───────────────────────────────────────────────

function GovernanceTab() {
  const { data, isLoading: loading } = useApiQuery<any>(
    queryKeys.rolesPermissions.governance(), '/roles-permissions/governance-stats', { staleTime: STALE_TIME.DYNAMIC },
  );
  if (loading) return <Skeleton />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Roles',           value: data?.totalRoles     ?? 0, icon: Shield,    color: 'text-indigo-600' },
          { label: 'Permissões',      value: data?.totalPermissions ?? 0, icon: Key,    color: 'text-teal-600' },
          { label: 'Sem Role',        value: data?.usersWithoutRole ?? 0, icon: Users,  color: data?.usersWithoutRole > 0 ? 'text-red-600' : 'text-emerald-600' },
          { label: 'Acessos Negados', value: data?.deniedAccesses   ?? 0, icon: AlertTriangle, color: data?.deniedAccesses > 50 ? 'text-red-600' : 'text-slate-600' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-100 p-4">
            <k.icon size={16} className={`${k.color} mb-2`} />
            <p className="text-2xl font-bold text-slate-800">{k.value}</p>
            <p className="text-xs text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {(data?.alerts ?? []).length > 0 && (
        <div className="space-y-2">
          {(data.alerts as any[]).map((a: any, i: number) => (
            <div key={i} className={`border rounded-xl px-4 py-3 flex items-center gap-3 ${a.type === 'ALERT' ? 'bg-red-50 border-red-200' : a.type === 'WARNING' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
              <AlertTriangle size={14} className={a.type === 'ALERT' ? 'text-red-500' : a.type === 'WARNING' ? 'text-amber-500' : 'text-blue-500'} />
              <p className="text-sm">{a.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Role distribution */}
      {(data?.usersPerRole ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-4">Utilizadores por Role</h4>
          {(data.usersPerRole as any[]).map((r: any, i: number) => {
            const max = data.usersPerRole[0].count;
            return (
              <div key={i} className="mb-2">
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-slate-600">{r.role?.name ?? 'N/A'}</span>
                  <span className="font-bold text-slate-700">{r.count}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full">
                  <div className="h-2 bg-indigo-400 rounded-full" style={{ width: `${(r.count / max) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Unused roles */}
      {(data?.unusedRoles ?? []).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h4 className="font-semibold text-amber-700 mb-2">⚠️ Roles sem Utilizadores</h4>
          <div className="flex flex-wrap gap-2">
            {(data.unusedRoles as any[]).map((r: any, i: number) => (
              <span key={i} className="text-xs font-mono bg-amber-100 text-amber-700 px-2 py-0.5 rounded">{r.name}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'roles',      label: 'Roles',       icon: Shield },
  { id: 'matrix',     label: 'Matriz',      icon: Key },
  { id: 'simulator',  label: 'Simulador',   icon: Brain },
  { id: 'governance', label: 'Governança',  icon: Activity },
];

export default function RolesPermissionsPage() {
  const [tab, setTab] = useState<Tab>('roles');

  const PANELS: Record<Tab, JSX.Element> = {
    roles:      <RolesTab />,
    matrix:     <MatrixTab />,
    simulator:  <SimulatorTab />,
    governance: <GovernanceTab />,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-indigo-100 rounded-lg"><Shield size={18} className="text-indigo-600" /></div>
            <h1 className="text-xl font-bold text-slate-800">Roles & Permissions</h1>
          </div>
          <p className="text-sm text-slate-400">Gestão de Roles · Matriz · Simulador · Templates · Governança</p>
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

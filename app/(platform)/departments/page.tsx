// src/app/(dashboard)/departments/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Department {
  id: number;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
  color: string | null;
  icon: string | null;
  costCenter: string | null;
  trainingBudget: number | null;
  parentId: number | null;
  headId: number | null;
  createdAt: string;
  updatedAt: string;
  head: { id: number; fullName: string; email: string } | null;
  parent: { id: number; name: string; code: string } | null;
  children: DepartmentNode[];
  _count: { users: number; children: number };
}

interface DepartmentNode extends Omit<Department, 'children'> {
  children: DepartmentNode[];
}

interface Member {
  id: number;
  fullName: string;
  email: string;
  active: boolean;
  position: { name: string } | null;
}

interface Metrics {
  departmentId: number;
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  transfers: { in: number; out: number };
  breadcrumb: Array<{ id: number; name: string; code: string }>;
}

interface PaginatedDepts {
  data: Department[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ComparativeRow {
  id: number;
  name: string;
  code: string;
  headName: string;
  totalMembers: number;
  active: boolean;
}

type View = 'list' | 'tree' | 'detail' | 'dashboard';

// ─── API helper ───────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Helpers / Micro components ───────────────────────────────────────────────

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {active ? 'Activo' : 'Inactivo'}
    </span>
  );
}

function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  const dim = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div className={`${dim} rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
}

function Breadcrumb({ items }: { items: Array<{ id: number; name: string; code: string }> }) {
  return (
    <div className="flex items-center gap-1 text-xs text-gray-400 flex-wrap">
      {items.map((item, i) => (
        <span key={item.id} className="flex items-center gap-1">
          {i > 0 && <span className="text-gray-300">›</span>}
          <span className={i === items.length - 1 ? 'text-gray-700 font-medium' : ''}>{item.name}</span>
        </span>
      ))}
    </div>
  );
}

function Skeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 bg-gray-100 rounded-xl" />
      ))}
    </div>
  );
}

function MetricCard({ label, value, sub, color = 'text-gray-900' }: {
  label: string; value: number | string; sub?: string; color?: string;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className={`text-2xl font-semibold font-mono ${color}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

// ─── Org chart node (recursive) ───────────────────────────────────────────────

function OrgNode({
  node,
  onSelect,
  level = 0,
}: {
  node: DepartmentNode;
  onSelect: (id: number) => void;
  level?: number;
}) {
  const [expanded, setExpanded] = useState(level < 2);
  const hasChildren = node.children.length > 0;

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors mb-1 ${
          !node.active ? 'opacity-50 bg-gray-50 border-gray-100' : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
        }`}
        style={{ marginLeft: level * 24 }}
        onClick={() => onSelect(node.id)}
      >
        {/* Expand toggle */}
        {hasChildren && (
          <button
            className="w-5 h-5 text-xs text-gray-400 hover:text-gray-700 flex-shrink-0"
            onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
          >
            {expanded ? '▼' : '▶'}
          </button>
        )}
        {!hasChildren && <div className="w-5 flex-shrink-0" />}

        {/* Color dot */}
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ background: node.color ?? '#94a3b8' }}
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 truncate">{node.name}</span>
            <span className="text-xs font-mono text-gray-400">{node.code}</span>
            {!node.active && <span className="text-xs text-gray-400">(inactivo)</span>}
          </div>
          <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-3">
            {node.head && (
              <span className="flex items-center gap-1">
                <Avatar name={node.head.fullName} size="sm" />
                {node.head.fullName}
              </span>
            )}
            <span>{node._count.users} membros</span>
            {hasChildren && <span>{node.children.length} subdeptos</span>}
          </div>
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {node.children.map(child => (
            <OrgNode key={child.id} node={child} onSelect={onSelect} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── View: List ───────────────────────────────────────────────────────────────

function ListView({ onSelect }: { onSelect: (id: number) => void }) {
  const [data, setData] = useState<PaginatedDepts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: '20',
        ...(search ? { search } : {}),
        ...(activeFilter !== '' ? { active: activeFilter } : {}),
      });
      const result = await apiFetch<PaginatedDepts>(`/departments?${params}`);
      setData(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, activeFilter, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="text"
          placeholder="Pesquisar por nome, código ou gestor…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-[220px] text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={activeFilter}
          onChange={e => { setActiveFilter(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os estados</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
        <span className="text-sm text-gray-400">{data?.total ?? 0} departamentos</span>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_90px_160px_80px_90px_70px] gap-3 px-4 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
          <div>Departamento</div>
          <div>Código</div>
          <div>Gestor</div>
          <div>Membros</div>
          <div>Estado</div>
          <div>Sub-deptos</div>
        </div>

        {loading && <div className="p-4"><Skeleton /></div>}
        {error && <div className="px-4 py-8 text-center text-sm text-red-500">{error}</div>}
        {!loading && data?.data.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-gray-400">Nenhum departamento encontrado</div>
        )}

        {!loading && data?.data.map(d => (
          <div
            key={d.id}
            className="grid grid-cols-[2fr_90px_160px_80px_90px_70px] gap-3 items-center px-4 py-3.5 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors last:border-0"
            onClick={() => onSelect(d.id)}
          >
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color ?? '#cbd5e1' }} />
              <div>
                <div className="text-sm font-medium text-gray-900">{d.name}</div>
                {d.parent && (
                  <div className="text-xs text-gray-400 mt-0.5">↳ {d.parent.name}</div>
                )}
              </div>
            </div>
            <div className="text-xs font-mono text-gray-500">{d.code}</div>
            <div>
              {d.head ? (
                <div className="flex items-center gap-2">
                  <Avatar name={d.head.fullName} size="sm" />
                  <span className="text-xs text-gray-700 truncate">{d.head.fullName}</span>
                </div>
              ) : (
                <span className="text-xs text-gray-400">—</span>
              )}
            </div>
            <div className="text-sm text-gray-500">{d._count.users}</div>
            <div><StatusBadge active={d.active} /></div>
            <div className="text-sm text-gray-400">{d._count.children}</div>
          </div>
        ))}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-gray-400">Página {data.page} de {data.totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
              ← Anterior
            </button>
            <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
              Próxima →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── View: Tree (Org Chart) ───────────────────────────────────────────────────

function TreeView({ onSelect }: { onSelect: (id: number) => void }) {
  const [tree, setTree] = useState<DepartmentNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<DepartmentNode[]>('/departments/tree')
      .then(setTree)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div><Skeleton rows={8} /></div>;
  if (error)   return <div className="text-sm text-red-500">{error}</div>;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
        <span>▼ expandir</span><span>·</span><span>▶ recolher</span><span>·</span><span>clique → ver detalhe</span>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        {tree.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">Sem departamentos na hierarquia</div>
        ) : (
          tree.map(node => (
            <OrgNode key={node.id} node={node} onSelect={onSelect} level={0} />
          ))
        )}
      </div>
    </div>
  );
}

// ─── View: Department Detail ──────────────────────────────────────────────────

function DetailView({ deptId, onBack }: { deptId: number; onBack: () => void }) {
  const [dept, setDept] = useState<Department & { users: Member[]; headHistory: any[] } | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'members' | 'subdepts' | 'history' | 'metrics'>('members');
  const [transferUserId, setTransferUserId] = useState('');
  const [transferTargetId, setTransferTargetId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, m] = await Promise.all([
        apiFetch<any>(`/departments/${deptId}`),
        apiFetch<Metrics>(`/departments/${deptId}/metrics`),
      ]);
      setDept(d);
      setMetrics(m);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }, [deptId]);

  useEffect(() => { load(); }, [load]);

  const handleToggleActive = async () => {
    if (!dept) return;
    setActionLoading(true);
    try {
      await apiFetch(`/departments/${deptId}/${dept.active ? 'deactivate' : 'activate'}`, { method: 'PATCH' });
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferUserId || !transferTargetId) return;
    setTransferLoading(true);
    try {
      await apiFetch('/departments/members/transfer', {
        method: 'POST',
        body: JSON.stringify({
          userId: parseInt(transferUserId),
          targetDepartmentId: parseInt(transferTargetId),
          reason: transferReason || undefined,
        }),
      });
      alert('Transferência realizada com sucesso');
      setTransferUserId(''); setTransferTargetId(''); setTransferReason('');
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setTransferLoading(false);
    }
  };

  if (loading || !dept) return <div><Skeleton rows={6} /></div>;

  const tabs: Array<{ id: typeof activeTab; label: string }> = [
    { id: 'members',  label: `Membros (${dept._count.users})` },
    { id: 'subdepts', label: `Sub-departamentos (${dept._count.children})` },
    { id: 'metrics',  label: 'Métricas' },
    { id: 'history',  label: 'Histórico gestores' },
  ];

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5">
        ← Voltar
      </button>

      {/* Breadcrumb */}
      {metrics && <div className="mb-4"><Breadcrumb items={metrics.breadcrumb} /></div>}

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: dept.color ? `${dept.color}20` : '#e2e8f0' }}
            >
              {dept.icon ?? '🏢'}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-sm text-gray-400">{dept.code}</span>
                <StatusBadge active={dept.active} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">{dept.name}</h2>
              {dept.description && <p className="text-sm text-gray-500 mt-1">{dept.description}</p>}
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400">
                {dept.parent && <span>Pertence a: <strong className="text-gray-700">{dept.parent.name}</strong></span>}
                {dept.costCenter && <span>Centro de custo: <strong className="text-gray-700">{dept.costCenter}</strong></span>}
                {dept.trainingBudget && <span>Budget formação: <strong className="text-gray-700">{dept.trainingBudget.toLocaleString('pt-AO')} Kz</strong></span>}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleToggleActive}
              disabled={actionLoading}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors disabled:opacity-50 ${
                dept.active
                  ? 'border-red-200 text-red-600 hover:bg-red-50'
                  : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              {dept.active ? 'Desactivar' : 'Reactivar'}
            </button>
          </div>
        </div>

        {/* Gestor */}
        {dept.head && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
            <Avatar name={dept.head.fullName} size="md" />
            <div>
              <div className="text-sm font-medium text-gray-900">{dept.head.fullName}</div>
              <div className="text-xs text-gray-400">{dept.head.email} · Responsável</div>
            </div>
          </div>
        )}
        {!dept.head && (
          <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
            ⚠ Departamento sem gestor definido
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Members tab */}
      {activeTab === 'members' && (
        <div>
          {/* Transfer form */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
            <div className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-3">Transferir colaborador</div>
            <div className="flex flex-wrap gap-3">
              <input
                type="number"
                placeholder="ID do colaborador"
                value={transferUserId}
                onChange={e => setTransferUserId(e.target.value)}
                className="flex-1 min-w-[140px] text-sm border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              />
              <input
                type="number"
                placeholder="ID do departamento destino"
                value={transferTargetId}
                onChange={e => setTransferTargetId(e.target.value)}
                className="flex-1 min-w-[180px] text-sm border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              />
              <input
                type="text"
                placeholder="Motivo (opcional)"
                value={transferReason}
                onChange={e => setTransferReason(e.target.value)}
                className="flex-1 min-w-[160px] text-sm border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              />
              <button
                onClick={handleTransfer}
                disabled={!transferUserId || !transferTargetId || transferLoading}
                className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 disabled:opacity-50"
              >
                {transferLoading ? 'A transferir…' : 'Transferir'}
              </button>
            </div>
          </div>

          {/* Members list */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_180px_80px] gap-3 px-4 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
              <div>Colaborador</div><div>Cargo</div><div>Estado</div>
            </div>
            {(dept.users as Member[]).length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">Sem membros neste departamento</div>
            ) : (
              (dept.users as Member[]).map(u => (
                <div key={u.id} className="grid grid-cols-[1fr_180px_80px] gap-3 items-center px-4 py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <Avatar name={u.fullName} size="sm" />
                    <div>
                      <div className="text-sm text-gray-900">{u.fullName}</div>
                      <div className="text-xs text-gray-400">{u.email}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">{u.position?.name ?? '—'}</div>
                  <div><StatusBadge active={u.active} /></div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Sub-departments tab */}
      {activeTab === 'subdepts' && (
        <div className="space-y-2">
          {dept.children.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Sem sub-departamentos
            </div>
          ) : (
            dept.children.map((child: any) => (
              <div key={child.id} className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: child.color ?? '#cbd5e1' }} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{child.name}</span>
                    <span className="text-xs font-mono text-gray-400">{child.code}</span>
                    <StatusBadge active={child.active} />
                  </div>
                  {child.head && <div className="text-xs text-gray-400 mt-0.5">{child.head.fullName}</div>}
                </div>
                <div className="text-sm text-gray-400">{child._count.users} membros</div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Metrics tab */}
      {activeTab === 'metrics' && metrics && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <MetricCard label="Total membros"   value={metrics.totalUsers}    />
            <MetricCard label="Activos"         value={metrics.activeUsers}   color="text-emerald-600" />
            <MetricCard label="Inactivos"       value={metrics.inactiveUsers} />
            <MetricCard label="Transferências ↑" value={metrics.transfers.in}  sub={`↓ saídas: ${metrics.transfers.out}`} />
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Hierarquia organizacional</div>
            <Breadcrumb items={metrics.breadcrumb} />
          </div>
        </div>
      )}

      {/* Head history tab */}
      {activeTab === 'history' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_160px_160px] gap-3 px-4 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            <div>Gestor</div><div>Início</div><div>Fim</div>
          </div>
          {dept.headHistory.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">Sem histórico de gestores</div>
          ) : (
            dept.headHistory.map((h: any) => (
              <div key={h.id} className="grid grid-cols-[1fr_160px_160px] gap-3 items-center px-4 py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  <Avatar name={h.head.fullName} size="sm" />
                  <span className="text-sm text-gray-800">{h.head.fullName}</span>
                </div>
                <div className="text-xs text-gray-500">{new Date(h.startedAt).toLocaleDateString('pt-AO')}</div>
                <div className="text-xs text-gray-500">{h.endedAt ? new Date(h.endedAt).toLocaleDateString('pt-AO') : <span className="text-emerald-600">Actual</span>}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── View: Comparative Dashboard ─────────────────────────────────────────────

function DashboardView({ onSelect }: { onSelect: (id: number) => void }) {
  const [rows, setRows] = useState<ComparativeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<ComparativeRow[]>('/departments/dashboard/comparative')
      .then(setRows)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton rows={5} />;
  if (error)   return <div className="text-sm text-red-500">{error}</div>;

  const maxMembers = Math.max(...rows.map(r => r.totalMembers), 1);
  const totalMembers = rows.reduce((s, r) => s + r.totalMembers, 0);
  const activeCount = rows.filter(r => r.active).length;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Total departamentos"  value={rows.length}     />
        <MetricCard label="Activos"              value={activeCount}     color="text-emerald-600" />
        <MetricCard label="Total colaboradores"  value={totalMembers}    />
      </div>

      {/* Distribution chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Distribuição de colaboradores</div>
        <div className="space-y-3">
          {rows
            .filter(r => r.active)
            .sort((a, b) => b.totalMembers - a.totalMembers)
            .map(r => {
              const pct = Math.round((r.totalMembers / maxMembers) * 100);
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => onSelect(r.id)}
                >
                  <div className="w-32 text-xs text-gray-700 truncate group-hover:text-blue-700">{r.name}</div>
                  <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded transition-all duration-500 group-hover:bg-blue-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-20 text-right text-xs font-mono text-gray-600">{r.totalMembers} membros</div>
                  <div className="w-24 text-xs text-gray-400 truncate">{r.headName}</div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Depts without head warning */}
      {rows.filter(r => r.active && r.headName === '—').length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-800">
          ⚠ <strong>{rows.filter(r => r.active && r.headName === '—').length}</strong> departamento(s) activo(s) sem gestor definido:
          {' '}{rows.filter(r => r.active && r.headName === '—').map(r => r.name).join(', ')}
        </div>
      )}
    </div>
  );
}

// ─── Page principal ───────────────────────────────────────────────────────────

const NAV: Array<{ id: View; label: string }> = [
  { id: 'list',      label: 'Lista' },
  { id: 'tree',      label: 'Organograma' },
  { id: 'dashboard', label: 'Dashboard' },
];

export default function DepartmentsPage() {
  const [view, setView] = useState<View>('list');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleSelect = (id: number) => {
    setSelectedId(id);
    setView('detail');
  };

  const handleBack = () => {
    setSelectedId(null);
    setView('list');
  };

  const titles: Record<View, string> = {
    list:      'Departamentos',
    tree:      'Organograma',
    detail:    'Detalhe do Departamento',
    dashboard: 'Dashboard Organizacional',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{titles[view]}</h1>
          <p className="text-sm text-gray-400 mt-0.5">INNOVA — Estrutura Organizacional</p>
        </div>
        {view === 'list' && (
          <button
            onClick={() => alert('Abrir formulário de criação de departamento')}
            className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800"
          >
            + Novo departamento
          </button>
        )}
      </div>

      {/* Tabs */}
      {view !== 'detail' && (
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === n.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
      )}

      {/* Views */}
      {view === 'list'      && <ListView onSelect={handleSelect} />}
      {view === 'tree'      && <TreeView onSelect={handleSelect} />}
      {view === 'detail' && selectedId !== null && (
        <DetailView deptId={selectedId} onBack={handleBack} />
      )}
      {view === 'dashboard' && <DashboardView onSelect={handleSelect} />}
    </div>
  );
}
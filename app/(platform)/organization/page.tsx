'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type DeptStatus   = 'ACTIVE' | 'INACTIVE';
type PosLevel     = 'INTERN' | 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'MANAGER' | 'DIRECTOR' | 'EXECUTIVE';
type ChangeType   = 'PROMOTION' | 'TRANSFER' | 'RESTRUCTURE' | 'HIRE' | 'TERMINATION' | 'MANAGER_CHANGE';

interface OrgStats {
  units: number;
  departments: number;
  positions: number;
  headcount: { total: number; occupied: number; planned: number; open: number };
  kpis: { spanOfControl: number; managerCount: number; maxHierarchyDepth: number };
  topDepartments: Array<{ id: number; name: string; color: string | null; _count: { users: number } }>;
}

interface Department {
  id: number;
  name: string;
  code: string;
  description: string | null;
  status: DeptStatus;
  color: string | null;
  annualBudget: number | null;
  costCenter: string | null;
  head: { id: number; fullName: string; avatarUrl: string | null } | null;
  parent: { id: number; name: string } | null;
  unit: { id: number; name: string } | null;
  _count: { users: number; children: number };
}

interface Position {
  id: number;
  name: string;
  code: string | null;
  level: PosLevel;
  headcountOccupied: number;
  headcountOpen: number;
  headcountPlanned: number | null;
  salaryMin: number | null;
  salaryMax: number | null;
}

interface OrgNode {
  id: number;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  managerId: number | null;
  position: { id: number; name: string; level: string } | null;
  department: { id: number; name: string; color: string | null } | null;
  _count: { subordinates: number };
  children: OrgNode[];
}

interface OrgChange {
  id: number;
  changeType: ChangeType;
  effectiveDate: string;
  reason: string | null;
  user: { id: number; fullName: string; avatarUrl: string | null };
  fromDepartment: { name: string } | null;
  toDepartment:   { name: string } | null;
  fromPosition:   { name: string } | null;
  toPosition:     { name: string } | null;
}

interface HeadcountRow {
  id: number;
  name: string;
  code: string;
  color: string | null;
  occupied: number;
  planned: number;
  open: number;
  occupancyPct: number | null;
}

type View = 'dashboard' | 'chart' | 'departments' | 'positions' | 'timeline';

// ─── API ──────────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erro' }));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtKz(v: number | null): string {
  if (!v) return '—';
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(v);
}

function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}
    </div>
  );
}

function Avatar({ name, avatarUrl, size = 'sm' }: { name: string; avatarUrl?: string | null; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return avatarUrl ? (
    <img src={avatarUrl} alt={name} className={`${dim} rounded-full object-cover flex-shrink-0`} />
  ) : (
    <div className={`${dim} rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold flex-shrink-0`}>
      {initials(name)}
    </div>
  );
}

// ─── Badges ───────────────────────────────────────────────────────────────────

const LEVEL_CFG: Record<PosLevel, { label: string; cls: string }> = {
  INTERN:    { label: 'Estagiário',  cls: 'bg-gray-100 text-gray-600' },
  JUNIOR:    { label: 'Júnior',      cls: 'bg-emerald-50 text-emerald-700' },
  MID:       { label: 'Pleno',       cls: 'bg-blue-50 text-blue-700' },
  SENIOR:    { label: 'Sénior',      cls: 'bg-purple-50 text-purple-700' },
  LEAD:      { label: 'Lead',        cls: 'bg-amber-50 text-amber-700' },
  MANAGER:   { label: 'Gestor',      cls: 'bg-orange-50 text-orange-700' },
  DIRECTOR:  { label: 'Director',    cls: 'bg-red-50 text-red-700' },
  EXECUTIVE: { label: 'Executivo',   cls: 'bg-red-100 text-red-800' },
};

const CHANGE_CFG: Record<ChangeType, { label: string; cls: string; icon: string }> = {
  PROMOTION:      { label: 'Promoção',       cls: 'bg-emerald-50 text-emerald-700', icon: '⬆️' },
  TRANSFER:       { label: 'Transferência',  cls: 'bg-blue-50 text-blue-700',       icon: '↔️' },
  RESTRUCTURE:    { label: 'Reestruturação', cls: 'bg-purple-50 text-purple-700',   icon: '🔄' },
  HIRE:           { label: 'Admissão',       cls: 'bg-amber-50 text-amber-700',     icon: '🆕' },
  TERMINATION:    { label: 'Desligamento',   cls: 'bg-red-50 text-red-700',         icon: '🔴' },
  MANAGER_CHANGE: { label: 'Mudança gestor', cls: 'bg-orange-50 text-orange-700',   icon: '👤' },
};

// ─── View: Dashboard ──────────────────────────────────────────────────────────

function DashboardView() {
  const [stats, setStats]       = useState<OrgStats | null>(null);
  const [headcount, setHeadcount] = useState<HeadcountRow[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<OrgStats>('/organization/stats'),
      apiFetch<HeadcountRow[]>('/organization/headcount').catch(() => []),
    ])
      .then(([s, h]) => { setStats(s); setHeadcount(h); })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) return <Skeleton rows={4} />;

  const { headcount: hc, kpis } = stats;

  return (
    <div className="space-y-6">
      {/* KPIs principais */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total colaboradores', value: hc.total,       },
          { label: 'Vagas abertas',       value: hc.open,        color: hc.open > 0 ? 'text-amber-600' : 'text-gray-900' },
          { label: 'Departamentos',       value: stats.departments },
          { label: 'Unidades',            value: stats.units     },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div className={`text-2xl font-semibold font-mono ${color ?? 'text-gray-900'}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* KPIs org */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-xs text-gray-400 mb-2">Span of Control médio</div>
          <div className="text-3xl font-bold font-mono text-blue-700">{kpis.spanOfControl}</div>
          <div className="text-xs text-gray-400 mt-1">liderados por gestor</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-xs text-gray-400 mb-2">Gestores activos</div>
          <div className="text-3xl font-bold font-mono text-gray-900">{kpis.managerCount}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-xs text-gray-400 mb-2">Profundidade hierárquica</div>
          <div className="text-3xl font-bold font-mono text-gray-900">{kpis.maxHierarchyDepth}</div>
          <div className="text-xs text-gray-400 mt-1">níveis máximos</div>
        </div>
      </div>

      {/* Headcount por departamento */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
          Headcount por departamento
        </div>
        {headcount.slice(0, 10).map(dept => {
          const pct  = dept.occupancyPct ?? 0;
          const color= pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-emerald-500' : 'bg-amber-500';
          return (
            <div key={dept.id} className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-2 w-48">
                {dept.color && (
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dept.color }} />
                )}
                <div className="text-sm font-medium text-gray-900 truncate">{dept.name}</div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{dept.occupied} pessoas</span>
                  <span>{dept.planned > 0 ? `${pct}%` : '—'}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
              </div>
              <div className="text-right w-20 flex-shrink-0">
                {dept.open > 0 && (
                  <span className="text-xs text-amber-600 font-medium">{dept.open} vagas</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Org Chart Node ───────────────────────────────────────────────────────────

function OrgChartNode({ node, depth = 0 }: { node: OrgNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 1);

  const hasChildren = node.children && node.children.length > 0;
  const subCount    = node._count.subordinates;

  return (
    <div className="flex flex-col items-center">
      {/* Card */}
      <div
        className={`relative bg-white border rounded-xl p-3 w-44 cursor-pointer hover:shadow-md transition-all ${
          subCount > 0 ? 'border-blue-200' : 'border-gray-200'
        }`}
        onClick={() => hasChildren && setExpanded(e => !e)}
      >
        <div className="flex flex-col items-center text-center gap-1.5">
          <Avatar name={node.fullName} avatarUrl={node.avatarUrl} size="md" />
          <div>
            <div className="text-xs font-semibold text-gray-900 leading-tight">{node.fullName}</div>
            <div className="text-xs text-gray-500 leading-tight mt-0.5">{node.position?.name ?? '—'}</div>
          </div>
          {node.department && (
            <div className="flex items-center gap-1">
              {node.department.color && (
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: node.department.color }} />
              )}
              <span className="text-xs text-gray-400">{node.department.name}</span>
            </div>
          )}
          {subCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <span>👥 {subCount}</span>
              <span>{expanded ? '▲' : '▼'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div className="flex flex-col items-center mt-2">
          {/* Connector down */}
          <div className="w-0.5 h-6 bg-gray-200" />
          <div className="flex items-start gap-4">
            {node.children.map((child, idx) => (
              <div key={child.id} className="flex flex-col items-center">
                {/* Horizontal connector */}
                {idx > 0 && <div className="absolute w-4 h-0.5 bg-gray-200 -ml-4 mt-6" />}
                <div className="w-0.5 h-4 bg-gray-200 mb-1" />
                <OrgChartNode node={child} depth={depth + 1} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── View: Org Chart ──────────────────────────────────────────────────────────

function OrgChartView() {
  const [data, setData]   = useState<OrgNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [depth, setDepth] = useState(3);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ depth: String(depth) });
      const res = await apiFetch<OrgNode[]>(`/organization/chart?${params}`);
      setData(res);
    } finally {
      setLoading(false);
    }
  }, [depth]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <input
          type="text" placeholder="Pesquisar colaborador…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 max-w-sm"
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Profundidade:</span>
          {[2, 3, 4].map(d => (
            <button key={d} onClick={() => setDepth(d)}
              className={`w-8 h-8 text-xs font-mono rounded-lg ${depth === d ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {loading ? <Skeleton rows={3} /> : (
        <div className="overflow-x-auto">
          <div className="flex gap-8 p-4 min-w-max">
            {data.map(root => <OrgChartNode key={root.id} node={root} />)}
            {data.length === 0 && (
              <div className="text-sm text-gray-400 text-center py-12 w-full">
                Sem dados para o organograma
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── View: Departments ────────────────────────────────────────────────────────

function DepartmentsView() {
  const [data, setData]       = useState<{ data: Department[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50', ...(search ? { search } : {}) });
      setData(await apiFetch(`/organization/departments?${params}`));
    } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const loadDetail = async (id: number) => {
    setLoadingDetail(true);
    try {
      setSelected(await apiFetch(`/organization/departments/${id}`));
    } finally { setLoadingDetail(false); }
  };

  return (
    <div className="grid grid-cols-[1fr_320px] gap-5">
      {/* List */}
      <div>
        <div className="mb-4">
          <input
            type="text" placeholder="Pesquisar departamentos…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-sm"
          />
        </div>

        {loading ? <Skeleton /> : (
          <div className="space-y-2">
            {data?.data.map(dept => (
              <div
                key={dept.id}
                onClick={() => loadDetail(dept.id)}
                className={`flex items-center gap-4 bg-white border rounded-xl p-4 cursor-pointer transition-all hover:shadow-sm ${
                  selected?.id === dept.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                }`}
              >
                {dept.color ? (
                  <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ background: dept.color }} />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0 flex items-center justify-center text-sm font-bold text-gray-400">
                    {dept.code.slice(0, 2)}
                  </div>
                )}
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">{dept.name}</div>
                  <div className="text-xs text-gray-400 flex items-center gap-3">
                    <span>Código: {dept.code}</span>
                    {dept.parent && <span>↑ {dept.parent.name}</span>}
                    {dept.unit && <span>📍 {dept.unit.name}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-mono font-medium text-gray-900">{dept._count.users}</div>
                  <div className="text-xs text-gray-400">pessoas</div>
                </div>
                {dept._count.children > 0 && (
                  <div className="text-xs text-gray-400 flex-shrink-0">
                    📂 {dept._count.children}
                  </div>
                )}
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dept.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
              </div>
            ))}
            {data?.data.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
                Sem departamentos
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail panel */}
      <div>
        {!selected && !loadingDetail && (
          <div className="h-48 flex items-center justify-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
            Seleccione um departamento
          </div>
        )}
        {loadingDetail && <Skeleton rows={4} />}
        {selected && !loadingDetail && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                {selected.color ? (
                  <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ background: selected.color }} />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0 flex items-center justify-center text-sm font-bold text-gray-400">
                    {selected.code.slice(0, 2)}
                  </div>
                )}
                <div>
                  <div className="text-sm font-semibold text-gray-900">{selected.name}</div>
                  <div className="text-xs text-gray-400">{selected.code}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  ['Colaboradores', selected._count.users],
                  ['Sub-depts',     selected._count.children],
                  ['Centro custo',  selected.costCenter ?? '—'],
                  ['Orçamento',     selected.annualBudget ? fmtKz(selected.annualBudget) : '—'],
                ].map(([l, v]) => (
                  <div key={String(l)} className="bg-gray-50 rounded-lg p-2">
                    <div className="text-gray-400">{l}</div>
                    <div className="font-medium text-gray-900">{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {selected.head && (
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                <Avatar name={selected.head.fullName} avatarUrl={selected.head.avatarUrl} size="sm" />
                <div>
                  <div className="text-xs text-gray-400">Responsável</div>
                  <div className="text-xs font-medium text-gray-900">{selected.head.fullName}</div>
                </div>
              </div>
            )}

            <div className="max-h-64 overflow-y-auto">
              {selected.users?.map((u: any) => (
                <div key={u.id} className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <Avatar name={u.fullName} avatarUrl={u.avatarUrl} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-900 truncate">{u.fullName}</div>
                    <div className="text-xs text-gray-400 truncate">{u.position?.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── View: Positions ─────────────────────────────────────────────────────────

function PositionsView() {
  const [data, setData]       = useState<{ data: Position[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50', ...(filter ? { level: filter } : {}) });
      setData(await apiFetch(`/organization/positions?${params}`));
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const levels: PosLevel[] = ['INTERN', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'MANAGER', 'DIRECTOR', 'EXECUTIVE'];

  if (loading) return <Skeleton />;

  return (
    <div>
      <div className="flex gap-2 mb-5 flex-wrap">
        <button onClick={() => setFilter('')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg ${!filter ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Todos
        </button>
        {levels.map(l => (
          <button key={l} onClick={() => setFilter(l)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg ${filter === l ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {LEVEL_CFG[l].label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_100px_100px_100px_150px] gap-3 px-4 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
          <div>Cargo</div><div>Nível</div><div>Activos</div><div>Vagas</div><div>Salário</div>
        </div>
        {data?.data.map(pos => (
          <div key={pos.id} className="grid grid-cols-[1fr_100px_100px_100px_150px] gap-3 items-center px-4 py-3.5 border-b border-gray-100 last:border-0 hover:bg-gray-50">
            <div>
              <div className="text-sm font-medium text-gray-900">{pos.name}</div>
              {pos.code && <div className="text-xs text-gray-400">{pos.code}</div>}
            </div>
            <div>
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${LEVEL_CFG[pos.level]?.cls ?? 'bg-gray-100 text-gray-600'}`}>
                {LEVEL_CFG[pos.level]?.label ?? pos.level}
              </span>
            </div>
            <div className="text-sm font-mono text-gray-900">{pos.headcountOccupied}</div>
            <div>
              {pos.headcountOpen > 0 ? (
                <span className="text-xs text-amber-600 font-medium">{pos.headcountOpen} abertas</span>
              ) : (
                <span className="text-xs text-gray-300">—</span>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {pos.salaryMin && pos.salaryMax
                ? `${fmtKz(pos.salaryMin)} – ${fmtKz(pos.salaryMax)}`
                : '—'}
            </div>
          </div>
        ))}
        {data?.data.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-gray-400">Sem cargos</div>
        )}
      </div>
    </div>
  );
}

// ─── View: Timeline ───────────────────────────────────────────────────────────

function TimelineView() {
  const [data, setData]     = useState<OrgChange[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<OrgChange[]>('/organization/timeline')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-3">
      {data.map(change => {
        const cfg = CHANGE_CFG[change.changeType] ?? { label: change.changeType, cls: 'bg-gray-100', icon: '📝' };
        return (
          <div key={change.id} className="flex items-start gap-4 bg-white border border-gray-200 rounded-xl p-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${cfg.cls}`}>
              {cfg.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Avatar name={change.user.fullName} avatarUrl={change.user.avatarUrl} size="sm" />
                <span className="text-sm font-medium text-gray-900">{change.user.fullName}</span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${cfg.cls}`}>{cfg.label}</span>
                <span className="text-xs text-gray-400 ml-auto">{fmtDate(change.effectiveDate)}</span>
              </div>
              <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                {change.fromDepartment && change.toDepartment && (
                  <span>{change.fromDepartment.name} → {change.toDepartment.name}</span>
                )}
                {change.fromPosition && change.toPosition && (
                  <span>{change.fromPosition.name} → {change.toPosition.name}</span>
                )}
                {change.reason && <span className="italic">"{change.reason}"</span>}
              </div>
            </div>
          </div>
        );
      })}
      {data.length === 0 && (
        <div className="py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
          Sem movimentações registadas
        </div>
      )}
    </div>
  );
}

// ─── Page principal ───────────────────────────────────────────────────────────

const NAV: Array<{ id: View; label: string }> = [
  { id: 'dashboard',   label: 'Dashboard' },
  { id: 'chart',       label: 'Organograma' },
  { id: 'departments', label: 'Departamentos' },
  { id: 'positions',   label: 'Cargos' },
  { id: 'timeline',    label: 'Timeline' },
];

const TITLES: Record<View, string> = {
  dashboard:   'Estrutura Organizacional',
  chart:       'Organograma',
  departments: 'Departamentos',
  positions:   'Cargos e Posições',
  timeline:    'Timeline Organizacional',
};

export default function OrganizationPage() {
  const [view, setView] = useState<View>('dashboard');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{TITLES[view]}</h1>
          <p className="text-sm text-gray-400 mt-0.5">INNOVA — Estrutura Organizacional</p>
        </div>
        {view === 'departments' && (
          <button
            onClick={() => alert('Abrir formulário de criação de departamento')}
            className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800"
          >
            + Departamento
          </button>
        )}
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {NAV.map(n => (
          <button key={n.id} onClick={() => setView(n.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              view === n.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {n.label}
          </button>
        ))}
      </div>

      {view === 'dashboard'   && <DashboardView />}
      {view === 'chart'       && <OrgChartView />}
      {view === 'departments' && <DepartmentsView />}
      {view === 'positions'   && <PositionsView />}
      {view === 'timeline'    && <TimelineView />}
    </div>
  );
}

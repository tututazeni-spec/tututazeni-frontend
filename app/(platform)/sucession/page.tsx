// src/app/(dashboard)/succession/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ReadinessLevel   = 'READY_NOW' | 'READY_SOON' | 'NEEDS_DEVELOPMENT';
type SuccessorPriority= 'PRIMARY' | 'SECONDARY' | 'TERTIARY';
type RiskLevel        = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type BusinessImpact   = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type CoverageStatus   = 'COVERED' | 'AT_RISK' | 'CRITICAL';

interface CriticalPosition {
  id: number;
  positionId: number;
  businessImpact: BusinessImpact;
  exitRisk: RiskLevel;
  expectedExitDate: string | null;
  keyPersonRisk: boolean;
  minSuccessorsRequired: number;
  criticalReason: string | null;
  coverageStatus: CoverageStatus;
  daysUntilExit: number | null;
  alert: string | null;
  position: {
    id: number; name: string; level: string | null;
    users: Array<{ id: number; fullName: string; avatarUrl: string | null }>;
    department: { id: number; name: string } | null;
  };
  successionPlans: SuccessionPlan[];
  _count: { successionPlans: number };
}

interface SuccessionPlan {
  id: number;
  readinessLevel: ReadinessLevel;
  priority: SuccessorPriority;
  matchScore: number | null;
  geographicMobility: boolean;
  available: boolean;
  notes: string | null;
  candidate: {
    id: number; fullName: string; avatarUrl: string | null;
    position: { name: string } | null;
    department: { name: string } | null;
  };
}

interface TalentPoolEntry {
  id: number;
  readinessLevel: ReadinessLevel;
  geographicMobility: boolean;
  notes: string | null;
  user: {
    id: number; fullName: string; avatarUrl: string | null; email: string; hireDate: string | null;
    position: { name: string } | null;
    department: { name: string } | null;
    performanceReviews: Array<{ score: number | null; category: string | null }>;
  };
  mentor: { id: number; fullName: string; position: { name: string } | null } | null;
}

interface OrgChartNode {
  id: number;
  position: { id: number; name: string; level: string | null; users: any[]; department: any };
  exitRisk: RiskLevel;
  businessImpact: BusinessImpact;
  keyPersonRisk: boolean;
  daysUntilExit: number | null;
  coverageStatus: CoverageStatus;
  successors: Array<{
    id: number; fullName: string; avatarUrl: string | null;
    readinessLevel: ReadinessLevel; priority: SuccessorPriority; matchScore: number | null;
  }>;
}

interface Dashboard {
  kpis: {
    totalCriticalPositions: number;
    withoutSuccessor: number;
    coverageRate: number;
    readinessIndex: number;
    highRiskPositions: number;
    avgMatchScore: number;
  };
  criticalAlerts: Array<{
    id: number; position: string; exitRisk: RiskLevel; alert: string | null; daysUntilExit: number | null;
  }>;
}

type View = 'dashboard' | 'org-chart' | 'talent-pool' | 'positions';

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

function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
    </div>
  );
}

function Avatar({ name, avatarUrl, size = 'sm' }: { name: string; avatarUrl?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const dim = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }[size];
  return avatarUrl ? (
    <img src={avatarUrl} alt={name} className={`${dim} rounded-full object-cover flex-shrink-0`} />
  ) : (
    <div className={`${dim} rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold flex-shrink-0`}>
      {initials(name)}
    </div>
  );
}

// ─── Badges ───────────────────────────────────────────────────────────────────

const READINESS_CFG: Record<ReadinessLevel, { label: string; cls: string; dot: string }> = {
  READY_NOW:          { label: 'Pronto agora',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  READY_SOON:         { label: 'Pronto em breve',   cls: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500' },
  NEEDS_DEVELOPMENT:  { label: 'Em desenvolvimento',cls: 'bg-blue-50 text-blue-700 border-blue-200',          dot: 'bg-blue-400' },
};

const RISK_CFG: Record<RiskLevel, { label: string; cls: string }> = {
  LOW:      { label: 'Baixo',    cls: 'bg-emerald-50 text-emerald-700' },
  MEDIUM:   { label: 'Médio',    cls: 'bg-amber-50 text-amber-700' },
  HIGH:     { label: 'Alto',     cls: 'bg-orange-50 text-orange-700' },
  CRITICAL: { label: 'Crítico',  cls: 'bg-red-100 text-red-800' },
};

const COVERAGE_CFG: Record<CoverageStatus, { label: string; cls: string }> = {
  COVERED:  { label: 'Coberto',   cls: 'bg-emerald-50 text-emerald-700' },
  AT_RISK:  { label: 'Em risco',  cls: 'bg-amber-50 text-amber-700' },
  CRITICAL: { label: 'Crítico',   cls: 'bg-red-50 text-red-700' },
};

function ReadinessBadge({ level }: { level: ReadinessLevel }) {
  const { label, cls, dot } = READINESS_CFG[level];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 border rounded-full text-xs font-medium ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />{label}
    </span>
  );
}

function RiskBadge({ risk }: { risk: RiskLevel }) {
  const { label, cls } = RISK_CFG[risk];
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>;
}

function MatchScore({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-gray-300">—</span>;
  const color = score >= 70 ? 'text-emerald-600' : score >= 45 ? 'text-amber-600' : 'text-red-600';
  const bg    = score >= 70 ? 'bg-emerald-500' : score >= 45 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${bg} rounded-full`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-mono font-bold ${color}`}>{score}%</span>
    </div>
  );
}

// ─── Successor Card ───────────────────────────────────────────────────────────

function SuccessorCard({ plan, rank }: { plan: SuccessionPlan; rank: number }) {
  const priorityLabel: Record<SuccessorPriority, string> = {
    PRIMARY: '1º', SECONDARY: '2º', TERTIARY: '3º',
  };

  return (
    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3">
      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
        {priorityLabel[plan.priority]}
      </div>
      <Avatar name={plan.candidate.fullName} avatarUrl={plan.candidate.avatarUrl} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-900 truncate">{plan.candidate.fullName}</div>
        <div className="text-xs text-gray-400 truncate">{plan.candidate.position?.name ?? '—'}</div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <ReadinessBadge level={plan.readinessLevel} />
        <MatchScore score={plan.matchScore} />
      </div>
    </div>
  );
}

// ─── View: Dashboard ──────────────────────────────────────────────────────────

function DashboardView() {
  const [data, setData]     = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Dashboard>('/succession/dashboard')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton rows={3} />;
  if (!data) return null;

  const { kpis, criticalAlerts } = data;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {/* Readiness Index */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-xs text-gray-400 mb-2">Índice de Prontidão</div>
          <div className="flex items-end gap-2 mb-2">
            <div className="text-4xl font-bold font-mono text-blue-700">{kpis.readinessIndex}%</div>
            <div className="text-xs text-gray-400 mb-1">meta &gt;80%</div>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${kpis.readinessIndex}%` }} />
          </div>
        </div>

        {/* Coverage */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-xs text-gray-400 mb-2">Cobertura de Sucessão</div>
          <div className="flex items-end gap-2 mb-2">
            <div className={`text-4xl font-bold font-mono ${kpis.coverageRate >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {kpis.coverageRate}%
            </div>
            <div className="text-xs text-gray-400 mb-1">meta &gt;80%</div>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${kpis.coverageRate >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${kpis.coverageRate}%` }}
            />
          </div>
        </div>

        {/* Match score médio */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-xs text-gray-400 mb-2">Score de Match Médio</div>
          <div className="text-4xl font-bold font-mono text-gray-900 mb-2">{kpis.avgMatchScore}%</div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${kpis.avgMatchScore}%` }} />
          </div>
        </div>
      </div>

      {/* Métricas secundárias */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Cargos críticos',    value: kpis.totalCriticalPositions,             },
          { label: 'Sem sucessores',     value: kpis.withoutSuccessor,   color: kpis.withoutSuccessor > 0 ? 'text-red-600' : 'text-gray-900' },
          { label: 'Risco alto/crítico', value: kpis.highRiskPositions,  color: kpis.highRiskPositions > 0 ? 'text-amber-600' : 'text-gray-900' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div className={`text-2xl font-semibold font-mono ${color ?? 'text-gray-900'}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Alertas críticos */}
      {criticalAlerts.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Alertas críticos
          </div>
          {criticalAlerts.map(alert => (
            <div key={alert.id} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-100 last:border-0">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                alert.exitRisk === 'CRITICAL' ? 'bg-red-500' :
                alert.exitRisk === 'HIGH'     ? 'bg-orange-500' :
                'bg-amber-400'
              }`} />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{alert.position}</div>
                {alert.alert && <div className="text-xs text-gray-500 mt-0.5">{alert.alert}</div>}
              </div>
              <RiskBadge risk={alert.exitRisk} />
              {alert.daysUntilExit !== null && alert.daysUntilExit <= 180 && (
                <div className={`text-xs font-mono ${alert.daysUntilExit <= 30 ? 'text-red-600 font-bold' : 'text-amber-600'}`}>
                  {alert.daysUntilExit}d
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── View: Org Chart ──────────────────────────────────────────────────────────

function OrgChartView() {
  const [nodes, setNodes]   = useState<OrgChartNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<OrgChartNode | null>(null);

  useEffect(() => {
    apiFetch<OrgChartNode[]>('/succession/org-chart')
      .then(setNodes)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton rows={4} />;

  const riskOrder: Record<RiskLevel, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

  return (
    <div className="flex gap-5">
      {/* Cards list */}
      <div className="flex-1 space-y-3">
        {nodes.sort((a, b) => riskOrder[b.exitRisk] - riskOrder[a.exitRisk]).map(node => (
          <div
            key={node.id}
            onClick={() => setSelected(selected?.id === node.id ? null : node)}
            className={`bg-white border rounded-xl p-4 cursor-pointer transition-all ${
              selected?.id === node.id ? 'border-blue-400 shadow-md' : 'border-gray-200 hover:shadow-sm'
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Cargo info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900">{node.position.name}</span>
                  {node.keyPersonRisk && (
                    <span className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">🔑 Key Person</span>
                  )}
                  <RiskBadge risk={node.exitRisk} />
                  <span className={`text-xs px-2 py-0.5 rounded ${COVERAGE_CFG[node.coverageStatus].cls}`}>
                    {COVERAGE_CFG[node.coverageStatus].label}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mb-2">
                  {node.position.department?.name ?? '—'}{node.position.level ? ` · ${node.position.level}` : ''}
                </div>

                {/* Titular */}
                {node.position.users[0] && (
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar name={node.position.users[0].fullName} avatarUrl={node.position.users[0].avatarUrl} size="sm" />
                    <span className="text-xs text-gray-600">{node.position.users[0].fullName}</span>
                    {node.daysUntilExit !== null && (
                      <span className={`text-xs font-mono ml-auto ${node.daysUntilExit <= 90 ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
                        Saída: {node.daysUntilExit}d
                      </span>
                    )}
                  </div>
                )}

                {/* Sucessores preview */}
                <div className="flex items-center gap-2">
                  {node.successors.slice(0, 3).map(s => (
                    <div key={s.id} className="flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1">
                      <Avatar name={s.fullName} avatarUrl={s.avatarUrl} size="sm" />
                      <div>
                        <div className="text-xs font-medium text-gray-800">{s.fullName.split(' ')[0]}</div>
                        <div className={`text-xs ${READINESS_CFG[s.readinessLevel].cls.split(' ')[1]}`}>
                          {READINESS_CFG[s.readinessLevel].label}
                        </div>
                      </div>
                    </div>
                  ))}
                  {node.successors.length === 0 && (
                    <span className="text-xs text-red-500 font-medium">⚠ Sem sucessores</span>
                  )}
                </div>
              </div>

              {/* Gauges */}
              <div className="flex-shrink-0 text-center">
                <div className="text-2xl font-bold font-mono text-gray-700">{node.successors.length}</div>
                <div className="text-xs text-gray-400">sucessores</div>
              </div>
            </div>

            {/* Expanded detail */}
            {selected?.id === node.id && node.successors.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Pipeline de sucessão</div>
                {node.successors.map(s => (
                  <div key={s.id} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                    <Avatar name={s.fullName} avatarUrl={s.avatarUrl} size="sm" />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-900">{s.fullName}</div>
                    </div>
                    <ReadinessBadge level={s.readinessLevel} />
                    <MatchScore score={s.matchScore} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {nodes.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
            Nenhum cargo crítico definido
          </div>
        )}
      </div>
    </div>
  );
}

// ─── View: Positions (Chair View) ─────────────────────────────────────────────

function PositionsView() {
  const [positions, setPositions] = useState<{ data: CriticalPosition[] } | null>(null);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<number | null>(null);
  const [summary, setSummary]     = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    apiFetch<{ data: CriticalPosition[] }>('/succession/critical-positions?limit=50')
      .then(setPositions)
      .finally(() => setLoading(false));
  }, []);

  const loadSummary = async (positionId: number) => {
    setSelected(positionId);
    setLoadingSummary(true);
    try {
      const s = await apiFetch<any>(`/succession/position/${positionId}/summary`);
      setSummary(s);
    } catch (e: any) { alert(e.message); }
    finally { setLoadingSummary(false); }
  };

  if (loading) return <Skeleton />;

  return (
    <div className="grid grid-cols-[280px_1fr] gap-5">
      {/* Position list */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
          Cargos críticos
        </div>
        {positions?.data.map(cp => (
          <div
            key={cp.id}
            onClick={() => loadSummary(cp.positionId)}
            className={`p-3 border rounded-xl cursor-pointer transition-colors ${
              selected === cp.positionId ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="text-xs font-medium text-gray-900 truncate">{cp.position.name}</div>
            <div className="flex items-center gap-1.5 mt-1">
              <RiskBadge risk={cp.exitRisk} />
              <span className={`text-xs ${COVERAGE_CFG[cp.coverageStatus].cls} px-1.5 rounded`}>
                {cp._count.successionPlans} suc.
              </span>
            </div>
            {cp.alert && <div className="text-xs text-red-600 mt-1 truncate">{cp.alert}</div>}
          </div>
        ))}
      </div>

      {/* Chair view detail */}
      <div>
        {!selected && (
          <div className="flex items-center justify-center h-48 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
            Seleccione um cargo para ver o pipeline de sucessão
          </div>
        )}

        {loadingSummary && <Skeleton rows={3} />}

        {summary && !loadingSummary && (
          <div className="space-y-4">
            {/* Position header */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-lg font-semibold text-gray-900">{summary.criticalPosition.position.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <RiskBadge risk={summary.criticalPosition.exitRisk} />
                    <span className={`text-xs px-2 py-0.5 rounded ${COVERAGE_CFG[summary.coverageStatus as CoverageStatus].cls}`}>
                      {COVERAGE_CFG[summary.coverageStatus as CoverageStatus].label}
                    </span>
                    {summary.criticalPosition.keyPersonRisk && (
                      <span className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">🔑 Key Person</span>
                    )}
                  </div>
                </div>
                {summary.daysUntilExit !== null && (
                  <div className={`text-center ${summary.daysUntilExit <= 90 ? 'text-red-600' : 'text-gray-500'}`}>
                    <div className="text-2xl font-bold font-mono">{summary.daysUntilExit}</div>
                    <div className="text-xs">dias até saída</div>
                  </div>
                )}
              </div>

              {/* Titular */}
              {summary.criticalPosition.position.users[0] && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Avatar name={summary.criticalPosition.position.users[0].fullName} size="md" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {summary.criticalPosition.position.users[0].fullName}
                    </div>
                    <div className="text-xs text-gray-400">Titular actual</div>
                  </div>
                </div>
              )}
            </div>

            {/* Pipeline por readiness */}
            {(['READY_NOW', 'READY_SOON', 'NEEDS_DEVELOPMENT'] as ReadinessLevel[]).map(level => {
              const plans: SuccessionPlan[] = summary.byReadiness[level] ?? [];
              return (
                <div key={level}>
                  <div className="flex items-center gap-2 mb-2">
                    <ReadinessBadge level={level} />
                    <span className="text-xs text-gray-400">{plans.length} candidatos</span>
                  </div>
                  {plans.length > 0 ? (
                    <div className="space-y-2">
                      {plans.map((plan: SuccessionPlan, idx: number) => (
                        <SuccessorCard key={plan.id} plan={plan} rank={idx + 1} />
                      ))}
                    </div>
                  ) : (
                    <div className={`text-xs py-2 px-3 rounded-lg ${level === 'READY_NOW' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}`}>
                      {level === 'READY_NOW' ? '⚠ Nenhum candidato pronto imediatamente' : 'Sem candidatos nesta fase'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── View: Talent Pool ────────────────────────────────────────────────────────

function TalentPoolView() {
  const [pool, setPool]   = useState<TalentPoolEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<ReadinessLevel | ''>('');

  useEffect(() => {
    apiFetch<TalentPoolEntry[]>('/succession/talent-pool/all')
      .then(setPool)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter ? pool.filter(p => p.readinessLevel === filter) : pool;

  if (loading) return <Skeleton />;

  return (
    <div>
      {/* Filter */}
      <div className="flex items-center gap-2 mb-5">
        {(['', 'READY_NOW', 'READY_SOON', 'NEEDS_DEVELOPMENT'] as const).map(r => (
          <button key={r} onClick={() => setFilter(r)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === r ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {r === '' ? 'Todos' : READINESS_CFG[r as ReadinessLevel].label}
          </button>
        ))}
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} talentos</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filtered.map(entry => {
          const latestReview = entry.user.performanceReviews?.[0];
          return (
            <div key={entry.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-all">
              <div className="flex items-start gap-3 mb-3">
                <Avatar name={entry.user.fullName} avatarUrl={entry.user.avatarUrl} size="md" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">{entry.user.fullName}</div>
                  <div className="text-xs text-gray-400">{entry.user.position?.name ?? '—'} · {entry.user.department?.name ?? '—'}</div>
                  <div className="mt-1">
                    <ReadinessBadge level={entry.readinessLevel} />
                  </div>
                </div>
                {latestReview?.score !== null && latestReview?.score !== undefined && (
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-bold font-mono text-blue-700">{latestReview.score}</div>
                    <div className="text-xs text-gray-400">perf.</div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                {entry.geographicMobility && (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded">🌍 Mobilidade</span>
                )}
                {entry.mentor && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                    👨‍🏫 Mentor: {entry.mentor.fullName.split(' ')[0]}
                  </span>
                )}
              </div>

              {entry.notes && (
                <p className="text-xs text-gray-500 mt-2 italic">"{entry.notes}"</p>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-2 py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
            Nenhum talento no pool com este filtro
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page principal ───────────────────────────────────────────────────────────

const NAV: Array<{ id: View; label: string }> = [
  { id: 'dashboard',  label: 'Dashboard' },
  { id: 'org-chart',  label: 'Mapa de Sucessão' },
  { id: 'positions',  label: 'Cargos Críticos' },
  { id: 'talent-pool',label: 'Talent Pool' },
];

const TITLES: Record<View, string> = {
  dashboard:    'Dashboard de Sucessão',
  'org-chart':  'Mapa de Sucessão',
  positions:    'Cargos Críticos e Pipeline',
  'talent-pool':'Talent Pool',
};

export default function SuccessionPage() {
  const [view, setView] = useState<View>('dashboard');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{TITLES[view]}</h1>
          <p className="text-sm text-gray-400 mt-0.5">INNOVA — Planeamento de Sucessão</p>
        </div>
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
      {view === 'org-chart'   && <OrgChartView />}
      {view === 'positions'   && <PositionsView />}
      {view === 'talent-pool' && <TalentPoolView />}
    </div>
  );
}
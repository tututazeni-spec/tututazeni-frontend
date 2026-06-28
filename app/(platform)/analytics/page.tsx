// src/app/(dashboard)/analytics/page.tsx
'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import Image from 'next/image';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrgOverview {
  users:       { total: number; active: number };
  courses:     { total: number; published: number };
  enrollments: { total: number; completed: number; completionRate: number };
  pdi:         { total: number; active: number; adoptionRate: number };
  engagement:  { totalXp: number; totalBadges: number; totalLearningPaths: number };
  performance: { avgScore: number };
}

interface CollaboratorDashboard {
  learning:    { completed: number; inProgress: number; totalHours: number; totalCourses: number };
  xp:          { total: number; badges: number };
  streak:      { current: number; longest: number };
  pdi:         any[];
  competencies:Array<{ name: string; category: string; currentLevel: number; targetLevel: number | null }>;
}

interface ManagerDashboard {
  team:          any[];
  metrics:       {
    headcount: number; enrollments: number; completions: number;
    completionRate: number; activePDIs: number; pdiAdoptionRate: number;
    avgPerformance: number; overdueActions: number;
  };
  competencyGaps:Array<{ name: string; avgGap: number; count: number }>;
  nineBox:       Array<{ userId: number; fullName: string; avatarUrl: string | null; performanceAxis: number; potentialAxis: number }>;
  alerts:        Array<{ type: string; message: string }>;
}

interface RiskAlert {
  summary:                { inactiveCount: number; overduePDICount: number; criticalActionCount: number };
  inactiveCollaborators:  Array<{ id: number; fullName: string; avatarUrl: string | null }>;
  overduePDIs:            Array<{ planId: number; planName: string; user: any; daysOverdue: number }>;
  criticalActions:        Array<{ actionId: number; actionTitle: string; user: any; daysOverdue: number }>;
}

type View = 'overview' | 'my' | 'manager' | 'hr' | 'risks';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function Avatar({ name, avatarUrl, size = 'sm' }: { name: string; avatarUrl?: string | null; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return avatarUrl ? (
    <div className={`${dim} rounded-full overflow-hidden relative flex-shrink-0`}>
      <Image src={avatarUrl} alt={name} fill className="object-cover" />
    </div>
  ) : (
    <div className={`${dim} rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold flex-shrink-0`}>
      {initials(name)}
    </div>
  );
}

function Skeleton({ rows = 3, h = 'h-16' }: { rows?: number; h?: string }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className={`${h} bg-gray-100 rounded-xl`} />)}
    </div>
  );
}

function KpiCard({ label, value, sub, color = 'text-gray-900', bg = 'bg-gray-50' }: {
  label: string; value: string | number; sub?: string; color?: string; bg?: string;
}) {
  return (
    <div className={`${bg} rounded-xl p-4`}>
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function ProgressBar({ pct, color = 'bg-blue-500', h = 'h-2' }: { pct: number; color?: string; h?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 ${h} bg-gray-100 rounded-full overflow-hidden`}>
        <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-xs font-mono text-gray-500 w-8 flex-shrink-0">{pct}%</span>
    </div>
  );
}

// ─── 9-Box Matrix ─────────────────────────────────────────────────────────────

function NineBox({ data }: { data: ManagerDashboard['nineBox'] }) {
  const labels: Record<string, string> = {
    '3-3': 'Alto Potencial',  '2-3': 'Potencial Emergente', '1-3': 'Enigma',
    '3-2': 'Profissional',    '2-2': 'Núcleo Sólido',       '1-2': 'Inconsistente',
    '3-1': 'Especialista',    '2-1': 'Eficiente Limitado',  '1-1': 'Alto Risco',
  };
  const colors: Record<string, string> = {
    '3-3': 'bg-emerald-200', '2-3': 'bg-emerald-100', '1-3': 'bg-amber-100',
    '3-2': 'bg-blue-100',    '2-2': 'bg-gray-100',    '1-2': 'bg-amber-50',
    '3-1': 'bg-blue-50',     '2-1': 'bg-red-50',      '1-1': 'bg-red-100',
  };

  return (
    <div>
      <div className="text-xs text-gray-400 text-center mb-1">Desempenho →</div>
      <div className="grid grid-cols-3 gap-1">
        {[3, 2, 1].map(pot =>
          [1, 2, 3].map(perf => {
            const key   = `${perf}-${pot}`;
            const users = data.filter(u => u.performanceAxis === perf && u.potentialAxis === pot);
            return (
              <div key={key} className={`${colors[key] ?? 'bg-gray-100'} rounded-lg p-2 min-h-[70px]`}>
                <div className="text-xs font-medium text-gray-600 mb-1 leading-tight">{labels[key]}</div>
                <div className="flex flex-wrap gap-1">
                  {users.map(u => (
                    <Avatar key={u.userId} name={u.fullName} avatarUrl={u.avatarUrl} size="sm" />
                  ))}
                  {users.length === 0 && <div className="text-xs text-gray-300">—</div>}
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="text-xs text-gray-400 text-right mt-1">← Potencial</div>
    </div>
  );
}

// ─── View: Overview ───────────────────────────────────────────────────────────

function OverviewView() {
  const { data, isLoading } = useApiQuery<OrgOverview>(
    queryKeys.analyticsPage.overview(), '/analytics/overview', { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={4} />;

  return (
    <div className="space-y-5">
      {/* KPIs principais */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Colaboradores activos" value={data.users.active}       bg="bg-blue-50"  color="text-blue-700" />
        <KpiCard label="Taxa de conclusão"      value={`${data.enrollments.completionRate}%`} bg="bg-emerald-50" color="text-emerald-700" />
        <KpiCard label="Adopção de PDI"         value={`${data.pdi.adoptionRate}%`}           bg="bg-purple-50"  color="text-purple-700" />
        <KpiCard label="Performance média"      value={data.performance.avgScore}              bg="bg-amber-50"   color="text-amber-700" />
      </div>

      {/* Segunda linha */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Cursos</div>
          <div className="grid grid-cols-2 gap-3">
            <KpiCard label="Total"     value={data.courses.total}     bg="bg-gray-50" />
            <KpiCard label="Publicados"value={data.courses.published}  bg="bg-gray-50" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Matrículas</div>
          <div className="grid grid-cols-2 gap-3">
            <KpiCard label="Total"     value={data.enrollments.total}     bg="bg-gray-50" />
            <KpiCard label="Concluídas"value={data.enrollments.completed}  bg="bg-gray-50" color="text-emerald-600" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Gamificação</div>
          <div className="grid grid-cols-2 gap-3">
            <KpiCard label="XP total"  value={data.engagement.totalXp}     bg="bg-gray-50" color="text-amber-600" />
            <KpiCard label="Badges"    value={data.engagement.totalBadges}  bg="bg-gray-50" color="text-purple-600" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── View: My Dashboard ───────────────────────────────────────────────────────

function MyDashboardView() {
  const { data, isLoading } = useApiQuery<CollaboratorDashboard>(
    queryKeys.analyticsPage.me(), '/analytics/me', { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading || !data) return <Skeleton />;

  return (
    <div className="space-y-5">
      {/* Stats pessoais */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Cursos concluídos"  value={data.learning.completed}  color="text-emerald-600" />
        <KpiCard label="Em progresso"        value={data.learning.inProgress} color="text-blue-600" />
        <KpiCard label="Horas de aprendizagem" value={`${data.learning.totalHours}h`} color="text-purple-600" />
        <KpiCard label="XP ganho"           value={data.xp.total}           color="text-amber-600" />
      </div>

      {/* Streak + Badges */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-5 text-white">
          <div className="text-sm text-amber-100 mb-1">Streak de aprendizagem</div>
          <div className="text-4xl font-bold">{data.streak.current}</div>
          <div className="text-sm text-amber-100 mt-1">dias consecutivos 🔥 (recorde: {data.streak.longest})</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-xs text-gray-400 mb-3">Competências top</div>
          <div className="space-y-2">
            {data.competencies.slice(0, 4).map(c => (
              <div key={c.name} className="flex items-center gap-3">
                <div className="text-xs text-gray-700 w-28 truncate">{c.name}</div>
                <div className="flex-1">
                  <ProgressBar
                    pct={Math.round((c.currentLevel / 5) * 100)}
                    color={c.targetLevel && c.currentLevel < c.targetLevel ? 'bg-amber-400' : 'bg-emerald-500'}
                  />
                </div>
                <div className="text-xs font-mono text-gray-500 flex-shrink-0">{c.currentLevel}/5</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PDI */}
      {data.pdi.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Os meus PDIs activos</div>
          <div className="space-y-3">
            {data.pdi.map((p: any) => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 mb-1">{p.name}</div>
                  <ProgressBar
                    pct={p.actionsTotal > 0 ? Math.round((p.actionsDone / p.actionsTotal) * 100) : 0}
                  />
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-mono font-bold text-blue-600">
                    {p.actionsDone}/{p.actionsTotal}
                  </div>
                  {p.overdueActions > 0 && (
                    <div className="text-xs text-red-600">⚠ {p.overdueActions} atrasadas</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── View: Manager ────────────────────────────────────────────────────────────

function ManagerView() {
  const [tab, setTab]       = useState<'overview' | 'ninebox' | 'gaps'>('overview');
  const { data, isLoading } = useApiQuery<ManagerDashboard>(
    queryKeys.analyticsPage.manager(), '/analytics/manager', { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading || !data) return <Skeleton rows={4} />;

  const { metrics, alerts, competencyGaps, nineBox } = data;

  return (
    <div className="space-y-5">
      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="text-sm font-semibold text-amber-800 mb-2">⚠ Alertas da equipa</div>
          {alerts.map((a, i) => (
            <div key={i} className="text-xs text-amber-700">• {a.message}</div>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Equipa"          value={metrics.headcount}       />
        <KpiCard label="PDIs activos"    value={`${metrics.pdiAdoptionRate}%`} color="text-blue-600" sub="adopção" />
        <KpiCard label="Conclusão cursos"value={`${metrics.completionRate}%`}  color="text-emerald-600" />
        <KpiCard label="Perf. média"     value={metrics.avgPerformance}         color="text-amber-600" />
      </div>
      {metrics.overdueActions > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-700">
          🔴 {metrics.overdueActions} acções de PDI atrasadas na equipa
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['overview', 'ninebox', 'gaps'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {{ overview: '👥 Equipa', ninebox: '🗃 9-Box', gaps: '📊 Gaps' }[t]}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-2">
          {data.team.map((u: any) => (
            <div key={u.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
              <Avatar name={u.fullName} avatarUrl={u.avatarUrl} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{u.fullName}</div>
                <div className="text-xs text-gray-400">{u.position?.name} · {u.department?.name}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'ninebox' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Matriz 9-Box</div>
          <NineBox data={nineBox} />
          {nineBox.length === 0 && (
            <div className="text-center text-sm text-gray-400 py-6">Sem dados de 9-box para a equipa</div>
          )}
        </div>
      )}

      {tab === 'gaps' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Top Gaps de Competências</div>
          <div className="space-y-3">
            {competencyGaps.map(g => (
              <div key={g.name} className="flex items-center gap-3">
                <div className="text-xs text-gray-700 w-40 truncate">{g.name}</div>
                <div className="flex-1">
                  <div className="h-2 bg-red-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.min(g.avgGap * 20, 100)}%` }} />
                  </div>
                </div>
                <div className="text-xs font-mono text-red-600 flex-shrink-0 w-12 text-right">Gap: {g.avgGap}</div>
                <div className="text-xs text-gray-400 flex-shrink-0">{g.count} pessoas</div>
              </div>
            ))}
            {competencyGaps.length === 0 && (
              <div className="text-center text-sm text-gray-400 py-4">Sem gaps identificados</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── View: Risk Alerts ────────────────────────────────────────────────────────

function RisksView() {
  const [tab, setTab]       = useState<'inactive' | 'pdis' | 'actions'>('inactive');
  const { data, isLoading } = useApiQuery<RiskAlert>(
    queryKeys.analyticsPage.risks(), '/analytics/risks', { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading || !data) return <Skeleton />;

  const { summary } = data;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Inactivos (+60 dias)" value={summary.inactiveCount}       color={summary.inactiveCount > 0 ? 'text-amber-600' : 'text-gray-900'} bg="bg-amber-50" />
        <KpiCard label="PDIs atrasados"        value={summary.overduePDICount}     color={summary.overduePDICount > 0 ? 'text-red-600' : 'text-gray-900'} bg="bg-red-50" />
        <KpiCard label="Acções críticas"        value={summary.criticalActionCount} color={summary.criticalActionCount > 0 ? 'text-red-600' : 'text-gray-900'} bg="bg-red-50" />
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['inactive', 'pdis', 'actions'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {{ inactive: '😴 Inactivos', pdis: '📋 PDIs', actions: '⚠ Acções' }[t]}
          </button>
        ))}
      </div>

      {tab === 'inactive' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {data.inactiveCollaborators.map(u => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0">
              <Avatar name={u.fullName} avatarUrl={u.avatarUrl} size="sm" />
              <div className="flex-1 text-sm text-gray-800">{u.fullName}</div>
              <span className="text-xs text-amber-600 font-medium">Sem actividade há +60 dias</span>
            </div>
          ))}
          {data.inactiveCollaborators.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">✅ Sem colaboradores inactivos</div>
          )}
        </div>
      )}

      {tab === 'pdis' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {data.overduePDIs.map(p => (
            <div key={p.planId} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0">
              <Avatar name={p.user.fullName} avatarUrl={p.user.avatarUrl} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{p.planName}</div>
                <div className="text-xs text-gray-400">{p.user.fullName}</div>
              </div>
              <span className="text-xs text-red-600 font-medium flex-shrink-0">
                ⚠ {p.daysOverdue} dias em atraso
              </span>
            </div>
          ))}
          {data.overduePDIs.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">✅ Sem PDIs atrasados</div>
          )}
        </div>
      )}

      {tab === 'actions' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {data.criticalActions.map(a => (
            <div key={a.actionId} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0">
              <Avatar name={a.user.fullName} avatarUrl={a.user.avatarUrl} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{a.actionTitle}</div>
                <div className="text-xs text-gray-400">{a.user.fullName}</div>
              </div>
              <span className="text-xs text-red-600 font-medium flex-shrink-0">
                🔴 {a.daysOverdue} dias
              </span>
            </div>
          ))}
          {data.criticalActions.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">✅ Sem acções críticas</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── View: HR Dashboard ───────────────────────────────────────────────────────

function HRDashboardView() {
  const { data, isLoading } = useApiQuery<any>(
    queryKeys.analyticsPage.hr(), '/analytics/hr', { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={5} />;

  return (
    <div className="space-y-5">
      {/* People */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">People Analytics</div>
        <div className="grid grid-cols-4 gap-3">
          <KpiCard label="Activos"   value={data.people.total}       />
          <KpiCard label="Admitidos" value={data.people.hired}        color="text-emerald-600" />
          <KpiCard label="Saídas"    value={data.people.terminated}   color="text-red-600" />
          <KpiCard label="Turnover"  value={`${data.people.turnoverRate}%`} color={data.people.turnoverRate > 10 ? 'text-red-600' : 'text-gray-900'} />
        </div>
      </div>

      {/* Learning */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Learning Analytics</div>
        <div className="grid grid-cols-4 gap-3">
          <KpiCard label="Matrículas"   value={data.learning.enrollments}           />
          <KpiCard label="Concluídas"   value={data.learning.completed}              color="text-emerald-600" />
          <KpiCard label="Taxa conclusão" value={`${data.learning.completionRate}%`} color="text-blue-600" />
          <KpiCard label="Abandonadas"  value={data.learning.abandoned}              color={data.learning.abandonRate > 20 ? 'text-red-600' : 'text-gray-900'} />
        </div>
      </div>

      {/* PDI */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">PDI Analytics</div>
        <div className="grid grid-cols-4 gap-3">
          <KpiCard label="PDIs activos"      value={data.pdi.active}              color="text-blue-600" />
          <KpiCard label="Adopção"           value={`${data.pdi.adoptionRate}%`}  color="text-purple-600" />
          <KpiCard label="Ag. aprovação"     value={data.pdi.pendingApproval}     color={data.pdi.pendingApproval > 0 ? 'text-amber-600' : 'text-gray-900'} />
          <KpiCard label="Concluídos (mês)"  value={data.pdi.completed}           color="text-emerald-600" />
        </div>
      </div>

      {/* Headcount por departamento */}
      {data.headcountByDept?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Headcount por departamento
          </div>
          {data.headcountByDept.map((d: any) => (
            <div key={d.id} className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0">
              <div className="text-sm font-medium text-gray-900 w-48 truncate">{d.name}</div>
              <div className="flex-1">
                <ProgressBar
                  pct={Math.round((d.count / data.people.total) * 100)}
                  color="bg-blue-400"
                  h="h-1.5"
                />
              </div>
              <div className="text-sm font-mono font-bold text-gray-900 w-8 text-right">{d.count}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page principal ───────────────────────────────────────────────────────────

const NAV: Array<{ id: View; label: string }> = [
  { id: 'overview', label: '🏢 Visão geral' },
  { id: 'my',       label: '👤 O meu progresso' },
  { id: 'manager',  label: '👥 Equipa' },
  { id: 'hr',       label: '📊 RH' },
  { id: 'risks',    label: '⚠ Riscos' },
];

const TITLES: Record<View, string> = {
  overview: 'Analytics INNOVA',
  my:       'O meu Dashboard',
  manager:  'Dashboard Gestor',
  hr:       'Dashboard RH',
  risks:    'Alertas de Risco',
};

export default function AnalyticsPage() {
  const [view, setView] = useState<View>('overview');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{TITLES[view]}</h1>
          <p className="text-sm text-gray-400 mt-0.5">INNOVA — Inteligência de dados de RH e Aprendizagem</p>
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

      {view === 'overview' && <OverviewView />}
      {view === 'my'       && <MyDashboardView />}
      {view === 'manager'  && <ManagerView />}
      {view === 'hr'       && <HRDashboardView />}
      {view === 'risks'    && <RisksView />}
    </div>
  );
}
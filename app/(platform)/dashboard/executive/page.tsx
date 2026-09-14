'use client';
import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';

// ─── Tipos ───────────────────────────────────────────────────────
// Espelha GET /dashboard-institutional/executive
// (src/dashboard-institutional/dashboard-institutional.service.ts#getExecutive)

type Period = 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';

interface OrganizationKpis {
  headcount: { total: number; active: number; new: number; newTrend: number };
  learning: {
    courses: number;
    enrollments: number;
    enrollmentsTrend: number;
    completions: number;
    completionsTrend: number;
    trainingHours: number;
  };
  performance: { avgScore: number | null };
  engagement: { activeSurveys: number; responses: number };
  development: { activePlans: number; completedPlans: number; coverage: number };
  talent: { hiPos: number; successionCoverage: number };
  pending: { evaluations: number };
}

interface Department {
  id: number;
  name: string;
  headcount: number;
}

interface TopContentEntry {
  content?: { id: number; title: string; type: string };
  views: number;
}

interface TalentHealth {
  healthScore: number;
  grade: string;
}

interface Enps {
  enps: number;
  promoterPct: number;
  total: number;
}

interface TopTalentEntry {
  id: number;
  fullName: string;
  position: string | null;
  points: number;
  score: number;
  talent: number;
}

interface Risk {
  type: string;
  label: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface Organization {
  period: string;
  generatedAt: string;
  kpis: OrganizationKpis;
  departments: Department[];
  topContent: TopContentEntry[];
  insights: string[];
  talentHealth: TalentHealth;
  enps: Enps | null;
  topTalent: TopTalentEntry[];
  risks: Risk[];
}

interface Summary {
  people: { total: number; newThisMonth: number };
  learning: {
    courses: number;
    activeEnrollments: number;
    completedThisYear: number;
    completionRate: number;
  };
  crm: { beneficiaries: number; partners: number; funders: number; totalFunding: number };
  knowledge: { libraryItems: number; certificates: number; badgesIssued: number };
}

interface TrendPoint {
  month: string;
  users: number;
  enrollments: number;
  completions: number;
}

interface Geographic {
  beneficiariesByProvince: { province: string | null; _count: { id: number } }[];
}

interface Alerts {
  critical: number;
  warnings: number;
  reminders: number;
  details: Record<string, number>;
}

interface ModuleMetric {
  [key: string]: number | string | null;
}

interface Modules {
  engagement: ModuleMetric;
  talentAndSuccession: ModuleMetric;
  onboarding: ModuleMetric;
  events: ModuleMetric;
  processes: ModuleMetric;
  declarations: ModuleMetric;
  audit: ModuleMetric;
  automation: ModuleMetric;
  platform: ModuleMetric;
  okr: ModuleMetric;
  evaluationCycles: ModuleMetric;
}

interface Executive {
  organization: Organization;
  summary: Summary;
  growthTrend: TrendPoint[];
  geographic: Geographic;
  alerts: Alerts;
  modules: Modules;
}

const PERIOD_LABEL: Record<Period, string> = {
  WEEK: 'Semana',
  MONTH: 'Mês',
  QUARTER: 'Trimestre',
  YEAR: 'Ano',
};

const MODULE_LABEL: Record<keyof Modules, string> = {
  engagement: 'Participação',
  talentAndSuccession: 'Talento & Sucessão',
  onboarding: 'Integração',
  events: 'Eventos',
  processes: 'Processos',
  declarations: 'Declarações',
  audit: 'Auditoria',
  automation: 'Automações',
  platform: 'Plataforma',
  okr: 'OKRs',
  evaluationCycles: 'Ciclos de Avaliação',
};

const SEVERITY_STYLE: Record<Risk['severity'], string> = {
  HIGH: 'bg-red-50 border-red-200 text-red-700',
  MEDIUM: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  LOW: 'bg-blue-50 border-blue-200 text-blue-700',
};

// ─── UI ──────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color || 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function TrendBadge({ value }: { value?: number }) {
  if (value === undefined || value === null || value === 0) return null;
  const positive = value > 0;
  return (
    <span className={`text-xs font-semibold ml-2 ${positive ? 'text-green-600' : 'text-red-600'}`}>
      {positive ? '▲' : '▼'} {Math.abs(value)}%
    </span>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function MiniBarChart({ data }: { data: TrendPoint[] }) {
  const max = Math.max(...data.map((d) => d.users), 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-blue-500 rounded-t"
            style={{ height: `${(d.users / max) * 100}%`, minHeight: '4px' }}
            title={`${d.month}: ${d.users}`}
          />
          <span className="text-[10px] text-gray-400">{d.month.split('/')[0]}</span>
        </div>
      ))}
    </div>
  );
}

function DepartmentBars({ departments }: { departments: Department[] }) {
  const max = Math.max(...departments.map((d) => d.headcount), 1);
  const sorted = [...departments].sort((a, b) => b.headcount - a.headcount);
  return (
    <div className="space-y-2">
      {sorted.map((d) => (
        <div key={d.id} className="flex items-center gap-3">
          <span className="text-sm text-gray-600 w-40 truncate" title={d.name}>
            {d.name}
          </span>
          <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-blue-500 h-3 rounded-full"
              style={{ width: `${(d.headcount / max) * 100}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-gray-900 w-8 text-right">
            {d.headcount}
          </span>
        </div>
      ))}
    </div>
  );
}

function ModuleTile({ label, metrics }: { label: string; metrics: ModuleMetric }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">{label}</p>
      <div className="space-y-1">
        {Object.entries(metrics).map(([key, value]) => (
          <div key={key} className="flex justify-between text-sm">
            <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
            <span className="font-semibold text-gray-900">
              {value === null ? '—' : String(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ExecutiveDashboardPage() {
  const [period, setPeriod] = useState<Period>('MONTH');

  const execQ = useApiQuery<Executive>(
    queryKeys.dashboard.executive(period),
    '/dashboard-institutional/executive',
    { params: { period }, staleTime: STALE_TIME.SEMI_STATIC },
  );

  const data = execQ.data ?? null;
  const loading = execQ.isLoading;
  const error = execQ.error?.message ?? '';

  if (loading)
    return (
      <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );

  if (error)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
          <button onClick={() => execQ.refetch()} className="ml-4 underline">
            Tentar novamente
          </button>
        </div>
      </div>
    );

  if (!data) return null;

  const { organization: org, summary, growthTrend, geographic, alerts, modules } = data;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Executivo</h1>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-sm rounded-md transition ${
                period === p ? 'bg-white shadow text-gray-900 font-semibold' : 'text-gray-500'
              }`}
            >
              {PERIOD_LABEL[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Riscos */}
      {org.risks.length > 0 && (
        <div className="flex gap-4 flex-wrap">
          {org.risks.map((risk, i) => (
            <div
              key={i}
              className={`border rounded-lg px-4 py-3 flex-1 min-w-[220px] ${SEVERITY_STYLE[risk.severity]}`}
            >
              <span className="font-semibold">{risk.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Alertas institucionais */}
      {(alerts.critical > 0 || alerts.warnings > 0 || alerts.reminders > 0) && (
        <div className="flex gap-4 flex-wrap">
          {alerts.critical > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex-1 min-w-[180px]">
              <span className="text-red-700 font-semibold">{alerts.critical} alertas críticos</span>
            </div>
          )}
          {alerts.warnings > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 flex-1 min-w-[180px]">
              <span className="text-yellow-700 font-semibold">{alerts.warnings} avisos</span>
            </div>
          )}
          {alerts.reminders > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex-1 min-w-[180px]">
              <span className="text-blue-700 font-semibold">{alerts.reminders} lembretes</span>
            </div>
          )}
        </div>
      )}

      {/* KPIs organização */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Funcionários</p>
          <p className="text-3xl font-bold mt-1 text-blue-600">
            {org.kpis.headcount.total}
            <TrendBadge value={org.kpis.headcount.newTrend} />
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {org.kpis.headcount.active} activos · +{org.kpis.headcount.new} novos
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Inscrições</p>
          <p className="text-3xl font-bold mt-1 text-green-600">
            {org.kpis.learning.enrollments}
            <TrendBadge value={org.kpis.learning.enrollmentsTrend} />
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {org.kpis.learning.completions} concluídas
            <TrendBadge value={org.kpis.learning.completionsTrend} />
          </p>
        </div>
        <KpiCard
          label="Desempenho Médio"
          value={org.kpis.performance.avgScore ?? '—'}
          color="text-purple-600"
        />
        <KpiCard
          label="Cobertura de Sucessão"
          value={`${org.kpis.talent.successionCoverage}%`}
          sub={`${org.kpis.talent.hiPos} hi-po`}
          color="text-orange-600"
        />
        <KpiCard
          label="PDIs Activos"
          value={org.kpis.development.activePlans}
          sub={`${org.kpis.development.coverage}% cobertura`}
        />
        <KpiCard
          label="Participação (Surveys)"
          value={org.kpis.engagement.responses}
          sub={`${org.kpis.engagement.activeSurveys} inquéritos activos`}
        />
        <KpiCard label="Avaliações Pendentes" value={org.kpis.pending.evaluations} />
        <KpiCard label="Horas de Formação" value={org.kpis.learning.trainingHours} />
      </div>

      {/* Talent Health + eNPS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Talent Health Score">
          <div className="flex items-center gap-4">
            <p className="text-4xl font-bold text-gray-900">{org.talentHealth.healthScore}</p>
            <span className="text-2xl font-bold text-gray-400">{org.talentHealth.grade}</span>
          </div>
        </SectionCard>
        <SectionCard title="eNPS">
          {org.enps ? (
            <div className="flex items-center gap-4">
              <p className="text-4xl font-bold text-gray-900">{org.enps.enps}</p>
              <p className="text-sm text-gray-500">
                {org.enps.promoterPct}% promotores · {org.enps.total} respostas
              </p>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Sem inquérito eNPS activo</p>
          )}
        </SectionCard>
      </div>

      {/* Insights */}
      {org.insights.length > 0 && (
        <SectionCard title="Insights">
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            {org.insights.map((insight, i) => (
              <li key={i}>{insight}</li>
            ))}
          </ul>
        </SectionCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Departamentos */}
        <SectionCard title="Colaboradores por Departamento">
          {org.departments.some((d) => d.headcount > 0) ? (
            <DepartmentBars departments={org.departments} />
          ) : (
            <p className="text-gray-400 text-sm">Sem dados de departamentos</p>
          )}
        </SectionCard>

        {/* Top Talento */}
        <SectionCard title="Top Talento">
          {org.topTalent.length > 0 ? (
            <ul className="space-y-2">
              {org.topTalent.map((t, i) => (
                <li key={t.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    <span className="text-gray-400 mr-2">{i + 1}.</span>
                    {t.fullName}
                    {t.position && <span className="text-gray-400"> — {t.position}</span>}
                  </span>
                  <span className="font-semibold text-gray-900">{t.points} pts</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm">Sem dados de talento</p>
          )}
        </SectionCard>
      </div>

      {/* Tendência de crescimento */}
      <SectionCard title="Novos Funcionários (6 meses)">
        {growthTrend.length > 0 ? (
          <MiniBarChart data={growthTrend} />
        ) : (
          <p className="text-gray-400 text-sm">Sem dados de tendência</p>
        )}
      </SectionCard>

      {/* Resumo institucional (Academia + CRM + Conhecimento) */}
      <SectionCard title="Resumo Institucional">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Beneficiários" value={summary.crm.beneficiaries} />
          <KpiCard
            label="Financiamento"
            value={`AOA ${(summary.crm.totalFunding / 1_000_000).toFixed(1)}M`}
            color="text-purple-600"
          />
          <KpiCard label="Parceiros" value={summary.crm.partners} />
          <KpiCard label="Financiadores" value={summary.crm.funders} />
          <KpiCard label="Cursos" value={summary.learning.courses} />
          <KpiCard label="Certificados" value={summary.knowledge.certificates} />
          <KpiCard label="Badges Emitidos" value={summary.knowledge.badgesIssued} />
          <KpiCard label="Biblioteca" value={summary.knowledge.libraryItems} sub="recursos" />
        </div>
      </SectionCard>

      {/* Distribuição geográfica */}
      {geographic.beneficiariesByProvince.length > 0 && (
        <SectionCard title="Beneficiários por Província">
          <ul className="space-y-1">
            {geographic.beneficiariesByProvince.map((p, i) => (
              <li key={i} className="flex justify-between text-sm">
                <span className="text-gray-600">{p.province ?? 'Sem província'}</span>
                <span className="font-semibold text-gray-900">{p._count.id}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {/* Conteúdos mais vistos */}
      {org.topContent.length > 0 && (
        <SectionCard title="Conteúdos Mais Vistos">
          <ul className="space-y-1">
            {org.topContent.map((c, i) => (
              <li key={i} className="flex justify-between text-sm">
                <span className="text-gray-600">{c.content?.title}</span>
                <span className="font-semibold text-gray-900">{c.views} vistas</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {/* Visão por módulo */}
      <SectionCard title="Visão por Módulo">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {(Object.keys(modules) as (keyof Modules)[]).map((key) => (
            <ModuleTile key={key} label={MODULE_LABEL[key]} metrics={modules[key]} />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

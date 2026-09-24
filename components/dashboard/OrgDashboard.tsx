// components/dashboard/OrgDashboard.tsx
// Separador "Executivo" — único ponto de consumo de
// GET /dashboard-institutional/executive (src/dashboard-institutional/
// dashboard-institutional.service.ts#getExecutive). Antes havia duas páginas
// (esta, ligada a /dashboard/organization, e /dashboard/institutional,
// entretanto removida) com dados sobrepostos; agora é uma só — nada do que
// as duas mostravam foi perdido, só deixou de estar em dois sítios.
// Mesmo padrão auto-contido usado em components/payslips/page.tsx (ListView/
// CompareView/AnnualView). Extraído de app/(platform)/dashboard/page.tsx.

'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AlertTriangle,
  Award,
  Brain,
  GitCompare,
  MapPin,
  Save,
  ShieldAlert,
} from 'lucide-react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import type {
  ExecutiveDashboardData,
  ExecutiveSnapshot,
  ExecutiveTrendPoint,
} from './types';

const PERIODS = [
  { id: 'WEEK', label: 'Semana' },
  { id: 'MONTH', label: 'Mês' },
  { id: 'QUARTER', label: 'Trimestre' },
  { id: 'YEAR', label: 'Ano' },
];

// Gráfico de barras simples em SVG (sem libraria externa — convenção do
// projecto, ver DASHBOARD-INSTITUCIONAL-GUIDE.md).
function MiniBarChart({ data }: { data: ExecutiveTrendPoint[] }) {
  const max = Math.max(...data.map((d) => d.users), 1);
  return (
    <div className="flex h-32 items-end gap-2">
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t-control bg-primary"
            style={{ height: `${(d.users / max) * 100}%`, minHeight: '4px' }}
            title={`${d.month}: ${d.users}`}
          />
          <span className="font-body text-[10px] text-ink-faint">
            {d.month.split(' ')[0]}
          </span>
        </div>
      ))}
    </div>
  );
}

// Linha label/valor dentro de um ModulePanel.
function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-body text-xs text-ink-muted">{label}</span>
      <span className="font-body text-sm font-semibold text-ink">{value}</span>
    </div>
  );
}

// Painel compacto por módulo — null (falhou na agregação, ver
// Promise.allSettled em getModulesOverview()) mostra aviso discreto em vez
// de desaparecer sem explicação.
function ModulePanel({
  title,
  data,
  children,
}: {
  title: string;
  data: unknown;
  children: ReactNode;
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <h3 className="mb-3 font-body font-semibold text-ink-muted">{title}</h3>
      {data ? (
        <div className="space-y-2">{children}</div>
      ) : (
        <p className="font-body text-xs text-ink-faint">
          Indisponível de momento
        </p>
      )}
    </div>
  );
}

const SEVERITY_INTENT: Record<string, 'danger' | 'warning'> = {
  HIGH: 'danger',
  MEDIUM: 'warning',
};

// Período corrente no formato usado pelos snapshots (ex.: "2026-09").
function currentPeriodKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

interface CompareResult {
  period1: string;
  period2: string;
  comparison: Record<
    string,
    { from: number; to: number; change: number; changePct: number }
  >;
}

const COMPARISON_LABELS: Record<string, string> = {
  users: 'Utilizadores',
  enrollments: 'Inscrições',
  beneficiaries: 'Beneficiários',
  funding: 'Financiamento',
  certificates: 'Certificados',
  completionRate: 'Taxa de Conclusão',
};

// Snapshots — histórico de KPIs + comparação entre períodos
// (GET/POST /dashboard-institutional/snapshots, GET .../snapshots/compare).
function SnapshotsPanel() {
  const notify = useToast();
  const snapshotsQ = useApiQuery<{ data: ExecutiveSnapshot[] }>(
    queryKeys.dashboard.executiveSnapshots(),
    '/dashboard-institutional/snapshots',
    { params: { page: 1, limit: 12 }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const snapshots = useMemo(() => snapshotsQ.data?.data ?? [], [snapshotsQ.data]);

  const saveSnapshot = useApiMutation<ExecutiveSnapshot, void>(
    () =>
      apiClient.post('/dashboard-institutional/snapshots', {
        period: currentPeriodKey(),
        type: 'MONTHLY',
      }),
    {
      invalidateKeys: [queryKeys.dashboard.executiveSnapshots()],
      onSuccess: () => notify({ title: 'Snapshot guardado', intent: 'success' }),
      onError: (err) =>
        notify({ title: err.message || 'Erro ao guardar snapshot', intent: 'danger' }),
    },
  );

  const [period1, setPeriod1] = useState<string>();
  const [period2, setPeriod2] = useState<string>();
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [comparing, setComparing] = useState(false);

  const periodOptions = useMemo(
    () => snapshots.map((s) => ({ value: s.period, label: s.period })),
    [snapshots],
  );

  async function handleCompare() {
    if (!period1 || !period2) return;
    setComparing(true);
    try {
      const result = await apiClient.get<CompareResult>(
        '/dashboard-institutional/snapshots/compare',
        { params: { period1, period2, type: 'MONTHLY' } },
      );
      setCompareResult(result);
    } catch (err) {
      notify({
        title: err instanceof Error ? err.message : 'Erro ao comparar snapshots',
        intent: 'danger',
      });
    } finally {
      setComparing(false);
    }
  }

  return (
    <Card>
      <CardBody>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display font-semibold text-ink">
            Snapshots (Histórico de KPIs)
          </h3>
          <Button
            size="sm"
            intent="secondary"
            onClick={() => saveSnapshot.mutate()}
            disabled={saveSnapshot.isPending}
          >
            <Save size={14} strokeWidth={1.75} />
            Guardar snapshot deste mês
          </Button>
        </div>

        {snapshots.length === 0 ? (
          <p className="font-body text-sm text-ink-faint">
            Sem snapshots guardados ainda.
          </p>
        ) : (
          <>
            <div className="mb-5 overflow-x-auto">
              <table className="w-full min-w-[480px] font-body text-sm">
                <thead>
                  <tr className="text-left text-xs text-ink-faint">
                    <th className="pb-2">Período</th>
                    <th className="pb-2">Utilizadores</th>
                    <th className="pb-2">Inscrições</th>
                    <th className="pb-2">Conclusão</th>
                    <th className="pb-2">Guardado por</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map((s) => (
                    <tr key={s.id} className="border-t border-border">
                      <td className="py-2 font-semibold text-ink">{s.period}</td>
                      <td className="py-2 text-ink-muted">{s.totalUsers}</td>
                      <td className="py-2 text-ink-muted">{s.totalEnrollments}</td>
                      <td className="py-2 text-ink-muted">{s.completionRate}%</td>
                      <td className="py-2 text-ink-faint">
                        {s.createdBy?.fullName ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
              <div>
                <p className="mb-1 font-body text-xs text-ink-faint">Período A</p>
                <Select
                  items={periodOptions}
                  value={period1}
                  onValueChange={setPeriod1}
                  placeholder="Escolher…"
                />
              </div>
              <div>
                <p className="mb-1 font-body text-xs text-ink-faint">Período B</p>
                <Select
                  items={periodOptions}
                  value={period2}
                  onValueChange={setPeriod2}
                  placeholder="Escolher…"
                />
              </div>
              <Button
                size="sm"
                onClick={handleCompare}
                disabled={!period1 || !period2 || comparing}
              >
                <GitCompare size={14} strokeWidth={1.75} />
                Comparar
              </Button>
            </div>

            {compareResult && (
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                {Object.entries(compareResult.comparison).map(([key, d]) => (
                  <div
                    key={key}
                    className="rounded-control border border-border bg-surface-sunken p-3"
                  >
                    <p className="font-body text-[11px] text-ink-faint">
                      {COMPARISON_LABELS[key] ?? key}
                    </p>
                    <p className="font-body text-sm font-semibold text-ink">
                      {d.from} → {d.to}
                    </p>
                    <p
                      className={`font-body text-xs font-medium ${
                        d.change >= 0 ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {d.change >= 0 ? '+' : ''}
                      {d.changePct}%
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}

export function OrgDashboard() {
  const [period, setPeriod] = useState('MONTH');

  // A key inclui o período → cada período tem cache própria; voltar a um
  // período já visto é instantâneo. Um único pedido devolve organização +
  // CRM/conhecimento + alertas + tendência + geografia + visão por módulo.
  const { data, isLoading } = useApiQuery<ExecutiveDashboardData>(
    queryKeys.dashboard.executive(period),
    '/dashboard-institutional/executive',
    { params: { period }, staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading)
    return (
      <Skeleton
        rows={6}
        wrapperClassName="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse"
        itemClassName="h-24 rounded-card bg-surface-sunken"
      />
    );

  const org = data?.organization ?? {};
  const k = org.kpis ?? {};
  const summary = data?.summary;
  const alerts = data?.alerts;
  const modules = data?.modules;

  return (
    <div className="space-y-6">
      {/* Period filter */}
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <Button
            key={p.id}
            size="sm"
            intent={period === p.id ? 'primary' : 'ghost'}
            onClick={() => setPeriod(p.id)}
          >
            {p.label}
          </Button>
        ))}
        <span className="ml-auto self-center font-body text-xs text-ink-faint">
          {new Date().toLocaleDateString('pt')}
        </span>
      </div>

      {/* Alertas institucionais */}
      {alerts && (alerts.critical > 0 || alerts.warnings > 0 || alerts.reminders > 0) && (
        <div className="flex flex-wrap gap-4">
          {alerts.critical > 0 && (
            <div className="min-w-[180px] flex-1 rounded-card border border-danger bg-danger-subtle px-4 py-3">
              <span className="font-body font-semibold text-danger-ink">
                {alerts.critical} alertas críticos
              </span>
            </div>
          )}
          {alerts.warnings > 0 && (
            <div className="min-w-[180px] flex-1 rounded-card border border-warning bg-warning-subtle px-4 py-3">
              <span className="font-body font-semibold text-warning-ink">
                {alerts.warnings} avisos
              </span>
            </div>
          )}
          {alerts.reminders > 0 && (
            <div className="min-w-[180px] flex-1 rounded-card border border-info bg-info-subtle px-4 py-3">
              <span className="font-body font-semibold text-info-ink">
                {alerts.reminders} lembretes
              </span>
            </div>
          )}
        </div>
      )}

      {/* KPIs — organização */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          label="Colaboradores Activos"
          value={k.headcount?.active ?? 0}
          sub={`+${k.headcount?.new ?? 0} no período`}
          trend={k.headcount?.newTrend}
        />
        <KpiCard
          label="Conclusões de Cursos"
          value={k.learning?.completions ?? 0}
          trend={k.learning?.completionsTrend}
          intent="info"
        />
        <KpiCard
          label="PDIs Activos"
          value={k.development?.activePlans ?? 0}
          sub={`Cobertura: ${k.development?.coverage ?? 0}%`}
        />
        <KpiCard
          label="Pontuação Média Geral"
          value={k.performance?.avgScore?.toFixed(1) ?? '–'}
          intent="warning"
        />
      </div>

      {/* KPIs — CRM & conhecimento (getExecutiveSummary) */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard label="Cursos" value={summary.learning.courses} intent="accent" />
          <KpiCard label="Beneficiários" value={summary.crm.beneficiaries} />
          <KpiCard
            label="Financiamento"
            value={`AOA ${(summary.crm.totalFunding / 1_000_000).toFixed(1)}M`}
            intent="accent"
          />
          <KpiCard label="Parceiros" value={summary.crm.partners} />
          <KpiCard label="Certificados" value={summary.knowledge.certificates} />
          <KpiCard
            label="Biblioteca"
            value={summary.knowledge.libraryItems}
            sub="recursos"
          />
          <KpiCard label="Badges Emitidos" value={summary.knowledge.badgesIssued} />
          <KpiCard
            label="eNPS"
            value={org.enps?.enps ?? '—'}
            sub={org.enps ? `${org.enps.total} respostas` : 'Sem dados'}
            intent="success"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Talent metrics */}
        <div className="rounded-card border border-border bg-surface p-5">
          <h3 className="mb-4 font-body font-semibold text-ink-muted">
            Talentos
          </h3>
          <div className="space-y-3">
            {[
              {
                label: 'Colaboradores de Alto Potencial',
                value: k.talent?.hiPos ?? 0,
              },
              {
                label: 'Sucessão Coberta',
                value: `${k.talent?.successionCoverage ?? 0}%`,
              },
              {
                label: 'Horas de Treino',
                value: k.learning?.trainingHours ?? 0,
              },
              {
                label: 'Inquéritos Activos',
                value: k.engagement?.activeSurveys ?? 0,
              },
              {
                label: 'Talent Health Score',
                value: org.talentHealth
                  ? `${org.talentHealth.healthScore} (${org.talentHealth.grade})`
                  : '—',
              },
            ].map((m) => (
              <div key={m.label} className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-body text-sm text-ink-muted">
                  {m.label}
                </span>
                <span className="font-body font-bold text-ink">{m.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Departments */}
        <div className="rounded-card border border-border bg-surface p-5">
          <h3 className="mb-4 font-body font-semibold text-ink-muted">
            Departamentos
          </h3>
          <div className="space-y-2">
            {(org.departments ?? []).slice(0, 6).map((d) => {
              const total = (org.departments ?? []).reduce(
                (a, x) => a + x.headcount,
                0,
              );
              const pct =
                total > 0 ? Math.round((d.headcount / total) * 100) : 0;
              return (
                <div key={d.id}>
                  <div className="mb-0.5 flex justify-between font-body text-xs">
                    <span className="truncate text-ink-muted">{d.name}</span>
                    <span className="font-semibold text-ink">
                      {d.headcount}
                    </span>
                  </div>
                  <ProgressBar value={pct} />
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Insights */}
        <div className="rounded-card border border-border bg-surface p-5">
          <h3 className="mb-4 flex items-center gap-2 font-body font-semibold text-ink-muted">
            <Brain size={14} strokeWidth={1.75} className="text-accent" />
            Análises de IA
          </h3>
          {(org.insights ?? []).length > 0 ? (
            <div className="space-y-2">
              {(org.insights ?? []).map((ins, i) => (
                <p
                  key={i}
                  className="rounded-control bg-accent-subtle px-3 py-2 font-body text-xs text-ink-muted"
                >
                  {ins}
                </p>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center font-body text-sm text-ink-faint">
              Sem insights gerados
            </p>
          )}
        </div>
      </div>

      {/* Riscos + Top Talento */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-card border border-border bg-surface p-5">
          <h3 className="mb-4 flex items-center gap-2 font-body font-semibold text-ink-muted">
            <ShieldAlert size={14} strokeWidth={1.75} className="text-danger" />
            Riscos Organizacionais
          </h3>
          {(org.risks?.length ?? 0) > 0 ? (
            <div className="space-y-2">
              {org.risks!.map((r, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 rounded-control px-3 py-2 font-body text-xs ${
                    SEVERITY_INTENT[r.severity] === 'danger'
                      ? 'bg-danger-subtle text-danger-ink'
                      : 'bg-warning-subtle text-warning-ink'
                  }`}
                >
                  <AlertTriangle size={12} strokeWidth={1.75} />
                  {r.label}
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center font-body text-sm text-ink-faint">
              Sem riscos identificados
            </p>
          )}
        </div>

        <div className="rounded-card border border-border bg-surface p-5">
          <h3 className="mb-4 flex items-center gap-2 font-body font-semibold text-ink-muted">
            <Award size={14} strokeWidth={1.75} className="text-accent" />
            Top Talento
          </h3>
          {(org.topTalent?.length ?? 0) > 0 ? (
            <div className="space-y-2">
              {org.topTalent!.map((t, i) => (
                <div key={t.id} className="flex items-center justify-between">
                  <span className="font-body text-sm text-ink-muted">
                    #{i + 1} {t.fullName}
                    {t.position?.name ? ` · ${t.position.name}` : ''}
                  </span>
                  <span className="font-body text-xs font-bold text-primary">
                    {t.talent}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center font-body text-sm text-ink-faint">
              Sem dados suficientes
            </p>
          )}
        </div>
      </div>

      {/* Tendência de crescimento */}
      {data?.growthTrend && data.growthTrend.length > 0 && (
        <Card>
          <CardBody>
            <h3 className="mb-4 font-display font-semibold text-ink">
              Novos Funcionários (6 meses)
            </h3>
            <MiniBarChart data={data.growthTrend} />
          </CardBody>
        </Card>
      )}

      {/* Distribuição geográfica */}
      {data?.geographic && data.geographic.beneficiariesByProvince.length > 0 && (
        <Card>
          <CardBody>
            <h3 className="mb-4 flex items-center gap-2 font-display font-semibold text-ink">
              <MapPin size={16} strokeWidth={1.75} className="text-accent" />
              Beneficiários por Província
            </h3>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {data.geographic.beneficiariesByProvince.map((p) => (
                <div
                  key={p.province ?? 'sem-provincia'}
                  className="flex items-center justify-between rounded-control border border-border px-3 py-2"
                >
                  <span className="font-body text-xs text-ink-muted">
                    {p.province ?? 'Sem província'}
                  </span>
                  <span className="font-body text-sm font-semibold text-ink">
                    {p._count.id}
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Top content */}
      {(org.topContent?.length ?? 0) > 0 && (
        <div className="rounded-card border border-border bg-surface p-5">
          <h3 className="mb-3 font-body font-semibold text-ink-muted">
            Conteúdos Mais Vistos
          </h3>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {(org.topContent ?? []).map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-control p-2 hover:bg-surface-sunken"
              >
                <span className="w-4 font-body text-xs font-bold text-ink-faint">
                  #{i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-sm font-medium text-ink">
                    {c.content?.title}
                  </p>
                  <p className="font-body text-[10px] text-ink-faint">
                    {c.content?.type}
                  </p>
                </div>
                <span className="shrink-0 font-body text-xs font-bold text-primary">
                  {c.views} views
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visão por módulo — onboarding, eventos, processos, declarações,
          auditoria, automação, plataforma, OKRs */}
      {modules && (
        <div>
          <h2 className="mb-4 font-display text-lg font-bold text-ink">
            Visão por Módulo
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ModulePanel title="Onboarding" data={modules.onboarding}>
              {modules.onboarding && (
                <>
                  <Stat label="Activos" value={modules.onboarding.active} />
                  <Stat
                    label="Tarefas atrasadas"
                    value={modules.onboarding.overdueTasks}
                  />
                  <Stat
                    label="Satisfação média"
                    value={modules.onboarding.avgSurveyScore}
                  />
                </>
              )}
            </ModulePanel>

            <ModulePanel title="Eventos" data={modules.events}>
              {modules.events && (
                <>
                  <Stat label="Total" value={modules.events.total} />
                  <Stat
                    label="Participantes confirmados"
                    value={modules.events.totalParticipants}
                  />
                </>
              )}
            </ModulePanel>

            <ModulePanel title="Processos" data={modules.processes}>
              {modules.processes && (
                <>
                  <Stat label="Activos" value={modules.processes.active} />
                  <Stat
                    label="Instâncias em curso"
                    value={modules.processes.inProgress}
                  />
                  <Stat
                    label="Passos atrasados"
                    value={modules.processes.overdueSteps}
                  />
                </>
              )}
            </ModulePanel>

            <ModulePanel title="Declarações" data={modules.declarations}>
              {modules.declarations && (
                <>
                  <Stat label="Pendentes" value={modules.declarations.pending} />
                  <Stat label="Emitidas" value={modules.declarations.issued} />
                  <Stat label="Total" value={modules.declarations.total} />
                </>
              )}
            </ModulePanel>

            <ModulePanel title="Auditoria" data={modules.audit}>
              {modules.audit && (
                <>
                  <Stat label="Eventos totais" value={modules.audit.totalEvents} />
                  <Stat label="Hoje" value={modules.audit.todayEvents} />
                  <Stat label="Críticos" value={modules.audit.criticalEvents} />
                </>
              )}
            </ModulePanel>

            <ModulePanel title="Automação" data={modules.automation}>
              {modules.automation && (
                <>
                  <Stat label="Regras" value={modules.automation.totalRules} />
                  <Stat label="Activas" value={modules.automation.activeRules} />
                  <Stat
                    label="Taxa de sucesso"
                    value={`${modules.automation.successRate}%`}
                  />
                </>
              )}
            </ModulePanel>

            <ModulePanel title="Plataforma" data={modules.platform}>
              {modules.platform && (
                <>
                  <Stat label="Uptime" value={`${modules.platform.uptimePercent}%`} />
                  <Stat label="Alertas abertos" value={modules.platform.openAlerts} />
                  <Stat
                    label="Alertas críticos"
                    value={modules.platform.criticalAlerts}
                  />
                  <Stat
                    label="Integrações com erro"
                    value={modules.platform.integrationsWithErrors}
                  />
                </>
              )}
            </ModulePanel>
          </div>
        </div>
      )}

      {/* Snapshots — histórico de KPIs + comparação entre períodos */}
      <SnapshotsPanel />
    </div>
  );
}

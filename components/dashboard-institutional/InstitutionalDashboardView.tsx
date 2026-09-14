// components/dashboard-institutional/InstitutionalDashboardView.tsx
//
// Apresentação pura do dashboard institucional — dados vêm 100% de
// useInstitutionalDashboard() via app/(platform)/dashboard/institutional/page.tsx.
// MiniBarChart é um gráfico de barras bespoke sem equivalente em
// components/ui/ — fica local (não exportado), só troca cores cruas por
// tokens da fundação de design.

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Alerts, ModulesOverview, Summary, TrendPoint } from './types';

interface InstitutionalDashboardViewProps {
  summary: Summary | null;
  trend: TrendPoint[];
  alerts: Alerts | null;
  modules: ModulesOverview | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
}

// Uma linha label/valor dentro de um ModulePanel.
function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-body text-xs text-ink-muted">{label}</span>
      <span className="font-body text-sm font-semibold text-ink">{value}</span>
    </div>
  );
}

// Painel compacto por módulo — mesmo espírito do bloco "Talentos" do
// OrgDashboard.tsx (components/dashboard/OrgDashboard.tsx), mas genérico:
// null (módulo falhou na agregação — ver Promise.allSettled no backend)
// mostra um aviso discreto em vez de rebentar ou desaparecer sem explicação.
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

function MiniBarChart({ data }: { data: TrendPoint[] }) {
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

export function InstitutionalDashboardView({
  summary,
  trend,
  alerts,
  modules,
  loading,
  error,
  onRetry,
}: InstitutionalDashboardViewProps) {
  if (loading)
    return (
      <Skeleton
        rows={8}
        wrapperClassName="grid grid-cols-2 gap-4 p-6 lg:grid-cols-4"
        itemClassName="skeleton-shimmer h-28 rounded-card"
      />
    );

  if (error)
    return (
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-4 rounded-card border border-danger bg-danger-subtle p-4">
          <p className="font-body text-sm text-danger-ink">{error}</p>
          <Button size="sm" intent="secondary" onClick={onRetry}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );

  return (
    <div className="space-y-6 p-6">
      <h1 className="font-display text-2xl font-bold text-ink">
        Dashboard Institucional
      </h1>

      {/* Alertas */}
      {alerts &&
        (alerts.critical > 0 ||
          alerts.warnings > 0 ||
          alerts.reminders > 0) && (
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

      {/* KPIs principais */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            label="Funcionários"
            value={summary.people.total}
            sub={`+${summary.people.newThisMonth} este mês`}
            intent="info"
          />
          <KpiCard
            label="Inscrições Activas"
            value={summary.learning.activeEnrollments}
            sub={`${summary.learning.completionRate}% conclusão`}
            intent="success"
          />
          <KpiCard label="Beneficiários" value={summary.crm.beneficiaries} />
          <KpiCard
            label="Financiamento"
            value={`AOA ${(summary.crm.totalFunding / 1_000_000).toFixed(1)}`}
            intent="accent"
          />
          <KpiCard label="Cursos" value={summary.learning.courses} />
          <KpiCard label="Parceiros" value={summary.crm.partners} />
          <KpiCard
            label="Certificados"
            value={summary.knowledge.certificates}
          />
          <KpiCard
            label="Biblioteca"
            value={summary.knowledge.libraryItems}
            sub="recursos"
          />
        </div>
      )}

      {/* Tendência */}
      <Card>
        <CardBody>
          <h3 className="mb-4 font-display font-semibold text-ink">
            Novos Funcionários (6 meses)
          </h3>
          {trend.length > 0 ? (
            <MiniBarChart data={trend} />
          ) : (
            <p className="font-body text-sm text-ink-faint">
              Sem dados de tendência
            </p>
          )}
        </CardBody>
      </Card>

      {/* Visão por módulo — agregação cruzada de engagement, sucessão,
          onboarding, eventos, processos, declarações, auditoria, automação,
          plataforma e OKRs/avaliação (GET /dashboard-institutional/modules) */}
      {modules && (
        <div>
          <h2 className="mb-4 font-display text-lg font-bold text-ink">
            Visão por Módulo
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ModulePanel title="Engagement" data={modules.engagement}>
              {modules.engagement && (
                <>
                  <Stat label="Índice" value={`${modules.engagement.index}%`} />
                  <Stat label="Nível" value={modules.engagement.level} />
                  <Stat
                    label="Participação"
                    value={`${modules.engagement.participationRate}%`}
                  />
                  <Stat
                    label="eNPS"
                    value={modules.engagement.enps ?? '—'}
                  />
                </>
              )}
            </ModulePanel>

            <ModulePanel title="Sucessão & Talento" data={modules.talentAndSuccession}>
              {modules.talentAndSuccession && (
                <>
                  <Stat
                    label="Posições críticas"
                    value={modules.talentAndSuccession.criticalPositions}
                  />
                  <Stat
                    label="Sem sucessor"
                    value={modules.talentAndSuccession.withoutSuccessor}
                  />
                  <Stat
                    label="Cobertura"
                    value={`${modules.talentAndSuccession.coverageRate}%`}
                  />
                  <Stat
                    label="Risco elevado"
                    value={modules.talentAndSuccession.highRiskPositions}
                  />
                </>
              )}
            </ModulePanel>

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
                  <Stat
                    label="Uptime"
                    value={`${modules.platform.uptimePercent}%`}
                  />
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

            <ModulePanel
              title="OKRs & Avaliação"
              data={modules.okr ?? modules.evaluationCycles}
            >
              {modules.okr && (
                <>
                  <Stat label="Ciclos OKR activos" value={modules.okr.activeCycles} />
                  <Stat
                    label="Objectivos concluídos"
                    value={`${modules.okr.objectiveCompletionRate}%`}
                  />
                </>
              )}
              {modules.evaluationCycles && (
                <>
                  <Stat
                    label="Avaliações pendentes"
                    value={modules.evaluationCycles.pendingEvaluations}
                  />
                  <Stat
                    label="Conclusão de avaliações"
                    value={`${modules.evaluationCycles.completionRate}%`}
                  />
                </>
              )}
            </ModulePanel>
          </div>
        </div>
      )}
    </div>
  );
}

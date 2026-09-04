// components/dashboard-institutional/InstitutionalDashboardView.tsx
//
// Apresentação pura do dashboard institucional — dados vêm 100% de
// useInstitutionalDashboard() via app/(platform)/dashboard/institutional/page.tsx.
// MiniBarChart é um gráfico de barras bespoke sem equivalente em
// components/ui/ — fica local (não exportado), só troca cores cruas por
// tokens da fundação de design.

import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Alerts, Summary, TrendPoint } from './types';

interface InstitutionalDashboardViewProps {
  summary: Summary | null;
  trend: TrendPoint[];
  alerts: Alerts | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
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
    </div>
  );
}

// components/dashboard-institutional/InstitutionalDashboardView.tsx

import { KpiCard, MiniBarChart } from './atoms';
import type { Alerts, Summary, TrendPoint } from './types';

interface InstitutionalDashboardViewProps {
  summary: Summary | null;
  trend: TrendPoint[];
  alerts: Alerts | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
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
          <button onClick={onRetry} className="ml-4 underline">
            Tentar novamente
          </button>
        </div>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Dashboard Institucional
      </h1>

      {/* Alertas */}
      {alerts &&
        (alerts.critical > 0 ||
          alerts.warnings > 0 ||
          alerts.reminders > 0) && (
          <div className="flex gap-4 flex-wrap">
            {alerts.critical > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex-1 min-w-[180px]">
                <span className="text-red-700 font-semibold">
                  {alerts.critical} alertas críticos
                </span>
              </div>
            )}
            {alerts.warnings > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 flex-1 min-w-[180px]">
                <span className="text-yellow-700 font-semibold">
                  {alerts.warnings} avisos
                </span>
              </div>
            )}
            {alerts.reminders > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex-1 min-w-[180px]">
                <span className="text-blue-700 font-semibold">
                  {alerts.reminders} lembretes
                </span>
              </div>
            )}
          </div>
        )}

      {/* KPIs principais */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Funcionários"
            value={summary.people.total}
            sub={`+${summary.people.newThisMonth} este mês`}
            color="text-blue-600"
          />
          <KpiCard
            label="Inscrições Activas"
            value={summary.learning.activeEnrollments}
            sub={`${summary.learning.completionRate}% conclusão`}
            color="text-green-600"
          />
          <KpiCard label="Beneficiários" value={summary.crm.beneficiaries} />
          <KpiCard
            label="Financiamento"
            value={`AOA ${(summary.crm.totalFunding / 1_000_000).toFixed(1)}M`}
            color="text-purple-600"
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
      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="font-semibold text-gray-900 mb-4">
          Novos Funcionários (6 meses)
        </h2>
        {trend.length > 0 ? (
          <MiniBarChart data={trend} />
        ) : (
          <p className="text-gray-400 text-sm">Sem dados de tendência</p>
        )}
      </div>
    </div>
  );
}

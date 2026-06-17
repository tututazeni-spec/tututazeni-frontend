'use client';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';

interface Summary {
  people: { total: number; newThisMonth: number };
  learning: {
    courses: number;
    activeEnrollments: number;
    completedThisYear: number;
    completionRate: number;
  };
  crm: {
    beneficiaries: number;
    partners: number;
    funders: number;
    totalFunding: number;
  };
  knowledge: { libraryItems: number; certificates: number; badgesIssued: number };
}

interface TrendPoint {
  month: string;
  users: number;
  enrollments: number;
  completions: number;
}

interface Alerts {
  critical: number;
  warnings: number;
  reminders: number;
  details: Record<string, number>;
}

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
      <p className={`text-3xl font-bold mt-1 ${color || 'text-gray-900'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

// Gráfico de barras simples (SVG/flex nativo — sem libraria externa)
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
          <span className="text-[10px] text-gray-400">
            {d.month.split(' ')[0]}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function InstitutionalDashboardPage() {
  // Três queries independentes → em paralelo (sem waterfall).
  const sumQ = useApiQuery<Summary>(
    queryKeys.dashboard.institutionalSummary(), '/dashboard-institutional/summary',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const trendQ = useApiQuery<TrendPoint[]>(
    queryKeys.dashboard.institutionalTrend(6), '/dashboard-institutional/growth-trend',
    { params: { months: 6 }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const alertsQ = useApiQuery<Alerts>(
    queryKeys.dashboard.institutionalAlerts(), '/dashboard-institutional/alerts',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const summary = sumQ.data ?? null;
  const trend = trendQ.data ?? [];
  const alerts = alertsQ.data ?? null;
  const loading = sumQ.isLoading;
  const error = sumQ.error?.message ?? '';
  const fetchAll = () => { sumQ.refetch(); trendQ.refetch(); alertsQ.refetch(); };

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
          <button onClick={fetchAll} className="ml-4 underline">
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
      {alerts && (alerts.critical > 0 || alerts.warnings > 0 || alerts.reminders > 0) && (
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
          <KpiCard label="Certificados" value={summary.knowledge.certificates} />
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

// components/dashboard-rh/OverviewPanel.tsx
// Painel "Visão Geral" — KPIs agregados + distribuição por departamento.
// Dados próprios (useApiQuery) + apresentação, mesmo padrão auto-contido
// usado em components/payslips/page.tsx. Extraído de
// app/(platform)/dashboard-rh/page.tsx.

'use client';

import {
  Activity,
  BookOpen,
  Shield,
  Star,
  Target,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { AlertStrip } from './AlertStrip';
import { KPICard, ProgressBar, Skeleton } from './atoms';
import type { Alert, OverviewData } from './types';

export function OverviewPanel() {
  const dataQ = useApiQuery<OverviewData>(
    queryKeys.dashboardRh.overview(),
    '/dashboard-rh',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const alertsQ = useApiQuery<Alert[]>(
    queryKeys.dashboardRh.alerts(),
    '/dashboard-rh/alerts',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const data = dataQ.data ?? null;
  const alerts = alertsQ.data ?? [];
  const loading = dataQ.isLoading;

  if (loading)
    return (
      <div className="space-y-4">
        <Skeleton count={6} />
      </div>
    );
  const k = data?.kpis ?? {};

  return (
    <div className="space-y-5">
      <AlertStrip alerts={alerts} />

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          icon={Users}
          label="Colaboradores Activos"
          value={k.headcount?.total ?? 0}
          status={k.headcount?.status}
        />
        <KPICard
          icon={UserMinus}
          label="Turnover"
          value={`${k.turnover?.rate ?? 0}%`}
          status={k.turnover?.status}
          color="text-red-500"
          bg="bg-red-50"
        />
        <KPICard
          icon={UserPlus}
          label="Novas Admissões (mês)"
          value={k.newHires?.count ?? 0}
          trend={k.newHires?.trend}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
        <KPICard
          icon={Star}
          label="Performance Média"
          value={k.performance?.avg?.toFixed(1) ?? '–'}
          color="text-amber-600"
          bg="bg-amber-50"
        />
        <KPICard
          icon={Target}
          label="Cobertura PDI"
          value={`${k.pdpCoverage?.pct ?? 0}%`}
          status={k.pdpCoverage?.status}
          color="text-indigo-600"
          bg="bg-indigo-50"
        />
        <KPICard
          icon={BookOpen}
          label="Conclusões (mês)"
          value={k.completions?.count ?? 0}
          color="text-teal-600"
          bg="bg-teal-50"
        />
        <KPICard
          icon={Activity}
          label="Respostas a Surveys"
          value={k.engagement?.surveyResponses ?? 0}
          color="text-violet-600"
          bg="bg-violet-50"
        />
        <KPICard
          icon={Shield}
          label="Formações Obrigatórias"
          value={k.mandatoryCompliance ?? 0}
          color="text-red-600"
          bg="bg-red-50"
        />
      </div>

      {/* Dept distribution */}
      {(data?.distribution?.byDepartment?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-4">
            Distribuição por Departamento
          </h3>
          <div className="space-y-2">
            {(data?.distribution?.byDepartment ?? [])
              .slice(0, 8)
              .map((d, i) => {
                const maxCount = Math.max(
                  ...(data?.distribution?.byDepartment ?? []).map(
                    (x) => x.count,
                  ),
                );
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-slate-600 truncate">
                        {d.name ?? `Dept ${d.id}`}
                      </span>
                      <span className="font-semibold text-slate-700">
                        {d.count}
                      </span>
                    </div>
                    <ProgressBar value={(d.count / maxCount) * 100} />
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

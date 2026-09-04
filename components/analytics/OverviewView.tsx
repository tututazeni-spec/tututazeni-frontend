// components/analytics/OverviewView.tsx
// Separador "Visão geral" — KPIs organizacionais. Dados próprios +
// apresentação. Extraído de app/(platform)/analytics/page.tsx.
// Migrado para a fundação de design: os 4 KPIs principais passam a
// components/ui/KpiCard (icon+intent); os pares agrupados (Cursos/
// Matrículas/Gamificação) usam o padrão de "tile" plano já estabelecido
// em components/micro-learning/DashboardView.tsx, mais leve do que
// aninhar KpiCard dentro de Card.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card, CardBody } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { OrgOverview } from './types';

function Tile({
  label,
  value,
  color = 'text-black',
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="rounded-card bg-surface-sunken p-3">
      <div className="mb-1 font-body text-xs text-black">{label}</div>
      <div className={`font-data text-xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

export function OverviewView() {
  const { data, isLoading } = useApiQuery<OrgOverview>(
    queryKeys.analyticsPage.overview(),
    '/analytics/overview',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={4} />;

  return (
    <div className="space-y-8">
      {/* KPIs principais */}
      <div className="mt-6 grid grid-cols-4 gap-3">
        <KpiCard
          label="Colaboradores activos"
          value={data.users.active}
          intent="info"
          className="w-full [&_p]:text-black"
        />
        <KpiCard
          label="Taxa de conclusão"
          value={`${data.enrollments.completionRate}%`}
          intent="success"
          className="w-full [&_p]:text-black"
        />
        <KpiCard
          label="Adopção de PDI"
          value={`${data.pdi.adoptionRate}%`}
          intent="accent"
          className="w-full [&_p]:text-black"
        />
        <KpiCard
          label="Performance média"
          value={data.performance.avgScore}
          intent="warning"
          className="w-full [&_p]:text-black"
        />
      </div>

      {/* Segunda linha */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardBody>
            <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-black">
              Cursos
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Tile label="Total" value={data.courses.total} />
              <Tile label="Publicados" value={data.courses.published} />
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-black">
              Matrículas
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Tile label="Total" value={data.enrollments.total} />
              <Tile label="Concluídas" value={data.enrollments.completed} />
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-black">
              Gamificação
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Tile
                label="Pontos de Experiência total"
                value={data.engagement.totalXp}
              />
              <Tile label="Distintivos" value={data.engagement.totalBadges} />
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

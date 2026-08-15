// components/analytics/OverviewView.tsx
// Separador "Visão geral" — KPIs organizacionais. Dados próprios +
// apresentação. Extraído de app/(platform)/analytics/page.tsx.
// Migrado para a fundação de design: os 4 KPIs principais passam a
// components/ui/KpiCard (icon+intent); os pares agrupados (Cursos/
// Matrículas/Gamificação) usam o padrão de "tile" plano já estabelecido
// em components/micro-learning/DashboardView.tsx, mais leve do que
// aninhar KpiCard dentro de Card.

'use client';

import { CheckCircle2, Target, TrendingUp, Users } from 'lucide-react';
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
  color = 'text-ink',
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="rounded-card bg-surface-sunken p-3">
      <div className="mb-1 font-body text-xs text-ink-faint">{label}</div>
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
    <div className="space-y-5">
      {/* KPIs principais */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard
          icon={Users}
          label="Colaboradores activos"
          value={data.users.active}
          intent="info"
          className="w-full"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Taxa de conclusão"
          value={`${data.enrollments.completionRate}%`}
          intent="success"
          className="w-full"
        />
        <KpiCard
          icon={Target}
          label="Adopção de PDI"
          value={`${data.pdi.adoptionRate}%`}
          intent="accent"
          className="w-full"
        />
        <KpiCard
          icon={TrendingUp}
          label="Performance média"
          value={data.performance.avgScore}
          intent="warning"
          className="w-full"
        />
      </div>

      {/* Segunda linha */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardBody>
            <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
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
            <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Matrículas
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Tile label="Total" value={data.enrollments.total} />
              <Tile
                label="Concluídas"
                value={data.enrollments.completed}
                color="text-success"
              />
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Gamificação
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Tile
                label="XP total"
                value={data.engagement.totalXp}
                color="text-warning"
              />
              <Tile
                label="Badges"
                value={data.engagement.totalBadges}
                color="text-accent"
              />
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

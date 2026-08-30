// components/analytics/HRDashboardView.tsx
// Separador "RH" — people/learning/PDI analytics e headcount por
// departamento. Dados próprios + apresentação. Extraído de
// app/(platform)/analytics/page.tsx. Migrado para a fundação de
// design: cada grupo de métricas usa o padrão de "tile" plano de
// components/micro-learning/DashboardView.tsx (evita aninhar
// components/ui/KpiCard, com o seu próprio border/shadow, dentro de
// outro Card). Por pedido do cliente, todos os números e percentagens
// são apresentados a preto — sem cor de estado por métrica.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card, CardBody } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import type { HRDashboard } from './types';

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-card bg-surface-sunken p-3">
      <div className="mb-1 font-body text-xs text-ink-faint">{label}</div>
      <div className="font-data text-xl font-bold text-black">{value}</div>
    </div>
  );
}

export function HRDashboardView() {
  const { data, isLoading } = useApiQuery<HRDashboard>(
    queryKeys.analyticsPage.hr(),
    '/analytics/hr',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={5} />;

  return (
    <div className="space-y-5">
      {/* People */}
      <Card>
        <CardBody>
          <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Análise de Dados de Pessoas
          </div>
          <div className="grid grid-cols-4 gap-3">
            <Tile label="Activos" value={data.people.total} />
            <Tile label="Admitidos" value={data.people.hired} />
            <Tile label="Saídas" value={data.people.terminated} />
            <Tile
              label="Taxa de Rotatividade"
              value={`${data.people.turnoverRate}%`}
            />
          </div>
        </CardBody>
      </Card>

      {/* Learning */}
      <Card>
        <CardBody>
          <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Análise da Aprendizagem
          </div>
          <div className="grid grid-cols-4 gap-3">
            <Tile label="Matrículas" value={data.learning.enrollments} />
            <Tile label="Concluídas" value={data.learning.completed} />
            <Tile
              label="Taxa conclusão"
              value={`${data.learning.completionRate}%`}
            />
            <Tile label="Abandonadas" value={data.learning.abandoned} />
          </div>
        </CardBody>
      </Card>

      {/* PDI */}
      <Card>
        <CardBody>
          <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Análise dos Planos de Desenvolvimento Individual
          </div>
          <div className="grid grid-cols-4 gap-3">
            <Tile label="PDIs activos" value={data.pdi.active} />
            <Tile label="Adopção" value={`${data.pdi.adoptionRate}%`} />
            <Tile
              label="Aguardando Aprovação"
              value={data.pdi.pendingApproval}
            />
            <Tile label="Concluídos (mês)" value={data.pdi.completed} />
          </div>
        </CardBody>
      </Card>

      {/* Headcount por departamento */}
      {(data.headcountByDept?.length ?? 0) > 0 && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border text-xs font-medium text-ink-faint uppercase tracking-wide">
            Colaboradores por Departamento
          </div>
          {(data.headcountByDept ?? []).map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0"
            >
              <div className="text-sm font-medium text-ink w-48 truncate">
                {d.name}
              </div>
              <div className="flex-1">
                <ProgressBar
                  value={Math.round((d.count / data.people.total) * 100)}
                />
              </div>
              <div className="text-sm font-data font-bold text-black w-8 text-right">
                {d.count}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

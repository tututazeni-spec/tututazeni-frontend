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
import { colorAt } from '@/lib/chartColors';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card, CardBody } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import {
  RATE_BANDS,
  SpeedometerStatCard,
  TURNOVER_BANDS,
  TURNOVER_MAX,
} from '@/components/ui/charts/SpeedometerStatCard';
import {
  Users,
  UserPlus,
  UserMinus,
  BookOpen,
  CheckCircle2,
  XCircle,
  Target,
  Clock,
  Award,
} from 'lucide-react';
import type { HRDashboard } from './types';

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
      <Card className="overflow-hidden">
        <div className="border-b border-border bg-[#0F1F3D]/60 px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-white">
          Análise de Dados de Pessoas
        </div>
        <CardBody>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <NavyStatCard
              icon={Users}
              label="Activos"
              value={data.people.total}
              tone="blue"
            />
            <NavyStatCard
              icon={UserPlus}
              label="Admitidos"
              value={data.people.hired}
              tone="green"
            />
            <NavyStatCard
              icon={UserMinus}
              label="Saídas"
              value={data.people.terminated}
              tone="red"
            />
            <SpeedometerStatCard
              label="Taxa de Rotatividade"
              value={data.people.turnoverRate}
              max={TURNOVER_MAX}
              bands={TURNOVER_BANDS}
              display={`${Math.round(data.people.turnoverRate)}%`}
            />
          </div>
        </CardBody>
      </Card>

      {/* Learning */}
      <Card className="overflow-hidden">
        <div className="border-b border-border bg-[#0F1F3D]/60 px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-white">
          Análise da Aprendizagem
        </div>
        <CardBody>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <NavyStatCard
              icon={BookOpen}
              label="Matrículas"
              value={data.learning.enrollments}
              tone="blue"
            />
            <NavyStatCard
              icon={CheckCircle2}
              label="Concluídas"
              value={data.learning.completed}
              tone="green"
            />
            <SpeedometerStatCard
              label="Taxa conclusão"
              value={data.learning.completionRate}
              bands={RATE_BANDS}
              display={`${Math.round(data.learning.completionRate)}%`}
            />
            <NavyStatCard
              icon={XCircle}
              label="Abandonadas"
              value={data.learning.abandoned}
              tone="red"
            />
          </div>
        </CardBody>
      </Card>

      {/* PDI */}
      <Card className="overflow-hidden">
        <div className="border-b border-border bg-[#0F1F3D]/60 px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-white">
          Análise dos Planos de Desenvolvimento Individual
        </div>
        <CardBody>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <NavyStatCard
              icon={Target}
              label="PDIs activos"
              value={data.pdi.active}
              tone="blue"
            />
            <SpeedometerStatCard
              label="Adopção"
              value={data.pdi.adoptionRate}
              bands={RATE_BANDS}
              display={`${Math.round(data.pdi.adoptionRate)}%`}
              caption={
                data.pdi.funnel
                  ? `${data.pdi.funnel.adopted} de ${data.pdi.funnel.eligible} elegíveis`
                  : undefined
              }
            />
            <NavyStatCard
              icon={Clock}
              label="Aguardando Aprovação"
              value={data.pdi.pendingApproval}
              tone="orange"
            />
            <NavyStatCard
              icon={Award}
              label="Concluídos (mês)"
              value={data.pdi.completed}
              tone="green"
            />
          </div>
        </CardBody>
      </Card>

      {/* Headcount por departamento */}
      {(data.headcountByDept?.length ?? 0) > 0 && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
            Colaboradores por Departamento
          </div>
          {(data.headcountByDept ?? []).map((d, idx) => (
            <div
              key={d.id}
              className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0"
            >
              <div className="text-sm font-medium text-ink w-48 truncate">
                {d.name}
              </div>
              <div className="flex-1">
                <div
                  role="progressbar"
                  aria-valuenow={Math.round(
                    (d.count / data.people.total) * 100,
                  )}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-1.5 w-full rounded-pill bg-surface-sunken"
                >
                  <div
                    className="h-full rounded-pill transition-[width] duration-300"
                    style={{
                      width: `${Math.round((d.count / data.people.total) * 100)}%`,
                      backgroundColor: colorAt(idx),
                    }}
                  />
                </div>
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

// components/analytics/PeopleAnalyticsView.tsx
// Separador "Pessoas" — GET /analytics/people, com drill-down por
// departamento via GET /analytics/departments/:id (modal). Ambos os
// endpoints já existiam no backend sem nenhum consumidor no frontend.

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card, CardBody } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import type { DepartmentAnalytics, PeopleAnalytics } from './types';

// Espelha o enum Gender em prisma/schema.prisma; 'N/D' é o fallback do
// próprio backend (analytics.service.ts#getPeopleAnalytics) para género nulo.
const GENDER_LABELS: Record<string, string> = {
  MALE: 'Masculino',
  FEMALE: 'Feminino',
  NON_BINARY: 'Não-binário',
  PREFER_NOT_TO_SAY: 'Prefere não dizer',
  'N/D': 'Não definido',
};

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-card bg-surface-sunken p-3">
      <div className="mb-1 font-body text-xs text-ink-faint">{label}</div>
      <div className="font-data text-xl font-bold text-black">{value}</div>
    </div>
  );
}

function DepartmentDetail({ departmentId }: { departmentId: number }) {
  const { data, isLoading } = useApiQuery<DepartmentAnalytics>(
    queryKeys.analyticsPage.department(departmentId),
    `/analytics/departments/${departmentId}`,
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={3} />;

  return (
    <div className="mt-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Tile label="Colaboradores" value={data.headcount} />
        <Tile label="Cursos concluídos" value={data.completedCourses} />
        <Tile label="Performance média" value={data.avgPerformanceScore} />
        <Tile
          label="Adopção de PDI"
          value={`${data.pdiAdoptionRate}% (${data.activePDIs} activos)`}
        />
      </div>
      {data.topCompetencies.length > 0 && (
        <div>
          <div className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Top competências
          </div>
          <div className="space-y-2">
            {data.topCompetencies.map((c) => (
              <div key={c.name} className="flex items-center gap-3">
                <div className="w-32 truncate text-xs text-ink-muted">{c.name}</div>
                <div className="flex-1">
                  <ProgressBar value={Math.round((c.avgLevel / 5) * 100)} />
                </div>
                <div className="w-16 flex-shrink-0 text-right text-xs font-data text-black">
                  {c.avgLevel}/5
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function PeopleAnalyticsView() {
  const [openDeptId, setOpenDeptId] = useState<number | null>(null);
  const { data, isLoading } = useApiQuery<PeopleAnalytics>(
    queryKeys.analyticsPage.people(),
    '/analytics/people',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={5} />;

  const openDept = data.byDepartment.find((d) => d.id === openDeptId);

  return (
    <div className="space-y-5">
      {/* Headcount */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard
          label="Colaboradores activos"
          value={data.headcount.total}
          intent="primary"
          className="w-full [&_p]:text-black"
        />
        <KpiCard
          label="Admitidos (período)"
          value={data.headcount.hired}
          intent="success"
          className="w-full [&_p]:text-black"
        />
        <KpiCard
          label="Saídas (período)"
          value={data.headcount.terminated}
          intent="danger"
          className="w-full [&_p]:text-black"
        />
        <KpiCard
          label="Taxa de rotatividade"
          value={`${data.headcount.turnoverRate}%`}
          intent="warning"
          className="w-full [&_p]:text-black"
        />
      </div>
      {data.headcount.onLeave > 0 && (
        <div className="rounded-control border border-info/30 bg-info-subtle px-4 py-2.5 text-sm text-black">
          {data.headcount.onLeave} colaboradores de licença
        </div>
      )}

      {/* Diversidade */}
      <Card>
        <CardBody>
          <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Diversidade — género
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(data.diversity.gender).map(([gender, count]) => (
              <Tile key={gender} label={GENDER_LABELS[gender] ?? gender} value={count} />
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Departamentos */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-xs font-medium text-ink-faint uppercase tracking-wide">
          Colaboradores por departamento — clicar para detalhe
        </div>
        {data.byDepartment.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setOpenDeptId(d.id)}
            className="flex w-full items-center gap-4 px-4 py-3 border-b border-border last:border-0 text-left hover:bg-surface-sunken/60 transition-colors duration-150"
          >
            <div className="text-sm font-medium text-ink w-48 truncate">{d.name}</div>
            <div className="flex-1">
              <ProgressBar
                value={Math.round((d.count / Math.max(data.headcount.total, 1)) * 100)}
              />
            </div>
            <div className="text-sm font-data font-bold text-black w-8 text-right">
              {d.count}
            </div>
          </button>
        ))}
      </Card>

      {/* Cargos */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-xs font-medium text-ink-faint uppercase tracking-wide">
          Top cargos
        </div>
        {data.byPosition.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0"
          >
            <div className="text-sm font-medium text-ink flex-1 truncate">{p.name}</div>
            <div className="text-sm font-data font-bold text-black">{p.count}</div>
          </div>
        ))}
        {data.byPosition.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-ink-faint">Sem dados de cargos</div>
        )}
      </Card>

      <Modal open={openDeptId !== null} onOpenChange={(o) => !o && setOpenDeptId(null)}>
        <ModalContent title={openDept?.name ?? 'Departamento'}>
          {openDeptId !== null && <DepartmentDetail departmentId={openDeptId} />}
        </ModalContent>
      </Modal>
    </div>
  );
}

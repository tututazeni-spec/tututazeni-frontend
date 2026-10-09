// components/analytics/PeopleAnalyticsView.tsx
// Separador "Pessoas" — GET /analytics/people, com drill-down por
// departamento via GET /analytics/departments/:id (modal). Ambos os
// endpoints já existiam no backend sem nenhum consumidor no frontend.

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { colorAt } from '@/lib/chartColors';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card, CardBody } from '@/components/ui/Card';
import { TrendingDown, UserMinus, UserPlus, Users } from 'lucide-react';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import type { DepartmentAnalytics, PeopleAnalytics } from './types';

// Barra azul-marinho (#0F1F3D) — o ProgressBar partilhado só tem cores de
// intenção (accent = laranja), por isso estes cards desenham a sua.
function NavyBar({ value, color }: { value: number; color?: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-1.5 w-full rounded-pill bg-surface-sunken"
    >
      <div
        className="h-full rounded-pill bg-[#0F1F3D] transition-[width] duration-300"
        style={{
          width: `${clamped}%`,
          ...(color ? { backgroundColor: color } : {}),
        }}
      />
    </div>
  );
}

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
                <div className="w-32 truncate text-xs text-ink-muted">
                  {c.name}
                </div>
                <div className="flex-1">
                  <NavyBar value={Math.round((c.avgLevel / 5) * 100)} />
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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <NavyStatCard
          icon={Users}
          label="Colaboradores activos"
          value={data.headcount.total}
          tone="blue"
        />
        <NavyStatCard
          icon={UserPlus}
          label="Admitidos (período)"
          value={data.headcount.hired}
          tone="green"
        />
        <NavyStatCard
          icon={UserMinus}
          label="Saídas (período)"
          value={data.headcount.terminated}
          tone="red"
        />
        <NavyStatCard
          icon={TrendingDown}
          label="Taxa de rotatividade"
          value={`${data.headcount.turnoverRate}%`}
          tone="orange"
        />
      </div>
      {data.headcount.onLeave > 0 && (
        <div className="rounded-control border border-info/30 bg-info-subtle px-4 py-2.5 text-sm text-black">
          {data.headcount.onLeave} colaboradores de licença
        </div>
      )}

      {/* Diversidade */}
      {/* Diversidade */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting">
        <div className="h-1.5 w-full bg-[#0F1F3D]" />
        <div className="p-5">
          <div className="mb-3 font-body text-sm font-semibold text-ink-muted">
            Diversidade — género
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(data.diversity.gender).map(([gender, count]) => (
              <div
                key={gender}
                className="rounded-2xl bg-[#0F1F3D] p-4 opacity-70"
              >
                <Users size={18} strokeWidth={1.75} className="text-white" />
                <p className="mt-2 font-display text-2xl font-bold text-white">
                  {count}
                </p>
                <p className="mt-0.5 font-body text-xs font-medium text-white">
                  {GENDER_LABELS[gender] ?? gender}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Departamentos */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
          Colaboradores por departamento — clicar para detalhe
        </div>
        {data.byDepartment.map((d, idx) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setOpenDeptId(d.id)}
            className="flex w-full items-center gap-4 px-4 py-3 border-b border-border last:border-0 text-left hover:bg-surface-sunken/60 transition-colors duration-150"
          >
            <div className="text-sm font-medium text-ink w-48 truncate">
              {d.name}
            </div>
            <div className="flex-1">
              <NavyBar
                value={Math.round(
                  (d.count / Math.max(data.headcount.total, 1)) * 100,
                )}
                color={colorAt(idx)}
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
            <div className="text-sm font-medium text-ink flex-1 truncate">
              {p.name}
            </div>
            <div className="text-sm font-data font-bold text-black">
              {p.count}
            </div>
          </div>
        ))}
        {data.byPosition.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-ink-faint">
            Sem dados de cargos
          </div>
        )}
      </Card>

      <Modal
        open={openDeptId !== null}
        onOpenChange={(o) => !o && setOpenDeptId(null)}
      >
        <ModalContent title={openDept?.name ?? 'Departamento'}>
          {openDeptId !== null && (
            <DepartmentDetail departmentId={openDeptId} />
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

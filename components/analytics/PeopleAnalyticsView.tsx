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
import type { LucideIcon } from 'lucide-react';
import { TrendingDown, UserMinus, UserPlus, Users } from 'lucide-react';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import type { DepartmentAnalytics, PeopleAnalytics } from './types';

type Tone = 'blue' | 'green' | 'gold' | 'red';

const TONES: Record<Tone, { bar: string; text: string; stroke: string }> = {
  blue: { bar: 'bg-[#2B6CC4]', text: 'text-[#2B6CC4]', stroke: '#2B6CC4' },
  green: { bar: 'bg-[#2E8B3E]', text: 'text-[#2E8B3E]', stroke: '#2E8B3E' },
  gold: { bar: 'bg-[#C9A227]', text: 'text-[#B8912A]', stroke: '#C9A227' },
  red: { bar: 'bg-[#C0453F]', text: 'text-[#C0453F]', stroke: '#C0453F' },
};

// Barra azul-marinho (#0F1F3D) — o ProgressBar partilhado só tem cores de
// intenção (accent = laranja), por isso estes cards desenham a sua.
function NavyBar({ value }: { value: number }) {
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
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

function TopBarKpiCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone: Tone;
}) {
  const t = TONES[tone];
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting transition-all duration-200 hover:scale-105 hover:shadow-md motion-reduce:hover:scale-100">
      <div className={`h-1.5 w-full ${t.bar}`} />
      <div className="p-5 pt-6">
        <Icon size={22} strokeWidth={1.75} className={t.text} />
        <p className={`mt-3 font-display text-3xl font-bold ${t.text}`}>
          {value}
        </p>
        <p className="mt-1 font-body text-sm font-medium text-ink-muted">
          {label}
        </p>
      </div>
    </div>
  );
}

// TODO: substituir por dados reais quando soubermos o campo da API
// (ex.: data.headcount.turnoverTrend) com o histórico mensal da rotatividade.
const MOCK_TURNOVER_TREND = [5.1, 5.6, 4.9, 6.2, 5.8, 6.5];

function TrendKpiCard({
  icon: Icon,
  label,
  value,
  trendData,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trendData: number[];
  tone: Tone;
}) {
  const t = TONES[tone];
  const width = 100;
  const height = 28;
  const max = Math.max(...trendData, 1);
  const min = Math.min(...trendData, 0);
  const range = max - min || 1;
  const points = trendData
    .map((v, i) => {
      const x = (i / Math.max(trendData.length - 1, 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting transition-all duration-200 hover:scale-105 hover:shadow-md motion-reduce:hover:scale-100">
      <div className={`h-1.5 w-full ${t.bar}`} />
      <div className="p-5 pt-6">
        <Icon size={22} strokeWidth={1.75} className={t.text} />
        <p className={`mt-3 font-display text-3xl font-bold ${t.text}`}>
          {value}
        </p>
        <p className="mt-1 font-body text-sm font-medium text-ink-muted">
          {label}
        </p>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="mt-2 h-7 w-full"
          preserveAspectRatio="none"
        >
          <polyline
            points={points}
            fill="none"
            stroke={t.stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
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
      <div className="grid grid-cols-4 gap-4">
        <TopBarKpiCard
          icon={Users}
          label="Colaboradores activos"
          value={data.headcount.total}
          tone="blue"
        />
        <TopBarKpiCard
          icon={UserPlus}
          label="Admitidos (período)"
          value={data.headcount.hired}
          tone="green"
        />
        <TopBarKpiCard
          icon={UserMinus}
          label="Saídas (período)"
          value={data.headcount.terminated}
          tone="red"
        />
        <TrendKpiCard
          icon={TrendingDown}
          label="Taxa de rotatividade"
          value={`${data.headcount.turnoverRate}%`}
          trendData={MOCK_TURNOVER_TREND}
          tone="gold"
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
                <Users
                  size={18}
                  strokeWidth={1.75}
                  className="text-white"
                />
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
            <div className="text-sm font-medium text-ink w-48 truncate">
              {d.name}
            </div>
            <div className="flex-1">
              <NavyBar
                value={Math.round(
                  (d.count / Math.max(data.headcount.total, 1)) * 100,
                )}
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

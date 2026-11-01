// components/evaluation/ReportsTab.tsx
// Separador "Relatórios" (docs/modulo_evaluation.md ponto 11) — filtros por
// ciclo/departamento/unidade/cargo/gestor, KPIs, distribuição, evolução,
// gaps de competências, objetivos alcançados e exportação Excel/PDF/CSV.
// Dados próprios (useApiMutation, pesquisa manual) + apresentação, mesmo
// padrão que ResultsTab/CalibrationTab.

'use client';

import {
  CalendarDays,
  ClipboardList,
  Download,
  Filter,
  Star,
} from 'lucide-react';
import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { Button, buttonVariants } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { DepartmentUserPicker } from '@/components/departments/DepartmentUserPicker';
import type { DirectoryUser } from '@/components/departments/departmentFormData';
import { useUnits } from '@/components/departments/departmentFormData';
import { usePositionOptions } from '@/components/competencies/modelFormData';
import { Skeleton } from '@/components/ui/Skeleton';
import { QueryError } from '@/components/ui/QueryError';
import {
  RATE_BANDS,
  SpeedometerStatCard,
} from '@/components/ui/charts/SpeedometerStatCard';
import { DonutStatCard } from '@/components/ui/charts/DonutStatCard';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import { SCORE_COLOR, SCORE_TONE } from './constants';
import { ALL, useCycleOptions, useDepartmentOptions } from './filterOptions';
import type { EvaluationReportGroup, EvaluationReportsOverview } from './types';
import { PerformanceIndicatorsPanel } from './performance/PerformanceIndicatorsPanel';
import { RECOMMENDATION_STATUS_LABELS } from './performance/apiTypes';
import { AlertCard } from '@/components/ui/AlertCard';
import { useHasRole } from '@/hooks/useCurrentRole';
import { ADMIN_ROLES } from '@/lib/roles';

function GroupTable({
  title,
  rows,
}: {
  title: string;
  rows: EvaluationReportGroup[];
}) {
  if (!rows.length) return null;
  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-brand/60 text-xs font-medium text-white uppercase tracking-wide">
        {title}
      </div>
      <CardBody>
        <div className="space-y-2">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-ink-muted">{r.name}</span>
              <span className={`font-bold ${SCORE_COLOR(r.avgScore)}`}>
                {r.avgScore.toFixed(1)} ({r.count})
              </span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

const TYPE_ITEMS = [
  { value: ALL, label: 'Todos os tipos de avaliação' },
  { value: 'MANAGER', label: 'Chefia' },
  { value: 'SELF', label: 'Autoavaliação' },
  { value: 'PEER', label: 'Colegas' },
  { value: 'SUBORDINATE', label: 'Subordinados' },
  { value: 'CLIENT', label: 'Clientes' },
];

const ACTION_STATUS_ITEMS = [
  { value: ALL, label: 'Todos os estados das ações' },
  ...Object.entries(RECOMMENDATION_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

/** Aviso quando a regra de privacidade ocultou grupos ou restringiu o relatório. */
function PrivacyNotice({
  privacy,
}: {
  privacy: NonNullable<EvaluationReportsOverview['privacy']>;
}) {
  const hidden = Object.values(privacy.suppressed).reduce((a, b) => a + b, 0);
  if (!privacy.restricted && hidden === 0) return null;
  return (
    <AlertCard
      variant="info"
      title="Alguns dados estão ocultos para proteger a privacidade"
      message={
        privacy.restricted
          ? `Há menos de ${privacy.minGroupSize} avaliações neste filtro: as listas por competência e classificação não são mostradas.`
          : `Os grupos com menos de ${privacy.minGroupSize} avaliações não são mostrados, nem nos ficheiros exportados.`
      }
      detail={hidden > 0 ? `${hidden} grupo(s) ocultos` : undefined}
    />
  );
}

export function ReportsTab() {
  // ADMIN/RH veem toda a organização e exportam; chefias só a sua equipa direta.
  const isOrgWide = useHasRole(ADMIN_ROLES);

  const [filters, setFilters] = useState({
    cycleId: '',
    departmentId: '',
    unitId: '',
    positionId: '',
    managerId: '',
    period: '',
    type: '',
    recommendationStatus: '',
  });
  const [manager, setManager] = useState<DirectoryUser | null>(null);
  const cycleItems = [
    { value: ALL, label: 'Todos os ciclos' },
    ...useCycleOptions(),
  ];
  const departmentItems = [
    { value: ALL, label: 'Todos os departamentos' },
    ...useDepartmentOptions(),
  ];
  const { units } = useUnits();
  const unitItems = [
    { value: ALL, label: 'Todas as unidades' },
    ...units.map((u) => ({ value: String(u.id), label: u.name })),
  ];
  const positionItems = [
    { value: ALL, label: 'Todos os cargos' },
    ...usePositionOptions().options,
  ];

  const load = useApiMutation((qs: string) =>
    apiClient.get<EvaluationReportsOverview>(
      `/evaluations/reports/overview${qs}`,
    ),
  );
  const data = load.data ?? null;

  const buildQuery = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  };

  const run = () => load.mutate(buildQuery());

  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="space-y-5">
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-3">
            <Select
              variant="underline"
              icon={Filter}
              items={cycleItems}
              value={filters.cycleId || ALL}
              onValueChange={(v) =>
                setFilters((f) => ({ ...f, cycleId: v === ALL ? '' : v }))
              }
            />
            <Select
              variant="underline"
              icon={Filter}
              items={departmentItems}
              value={filters.departmentId || ALL}
              onValueChange={(v) =>
                setFilters((f) => ({ ...f, departmentId: v === ALL ? '' : v }))
              }
            />
            <Select
              variant="underline"
              icon={Filter}
              items={unitItems}
              value={filters.unitId || ALL}
              onValueChange={(v) =>
                setFilters((f) => ({ ...f, unitId: v === ALL ? '' : v }))
              }
            />
            <Select
              variant="underline"
              icon={Filter}
              items={positionItems}
              value={filters.positionId || ALL}
              onValueChange={(v) =>
                setFilters((f) => ({ ...f, positionId: v === ALL ? '' : v }))
              }
            />
            <Select
              variant="underline"
              icon={Filter}
              items={TYPE_ITEMS}
              value={filters.type || ALL}
              onValueChange={(v) =>
                setFilters((f) => ({ ...f, type: v === ALL ? '' : v }))
              }
            />
            <Select
              variant="underline"
              icon={Filter}
              items={ACTION_STATUS_ITEMS}
              value={filters.recommendationStatus || ALL}
              onValueChange={(v) =>
                setFilters((f) => ({
                  ...f,
                  recommendationStatus: v === ALL ? '' : v,
                }))
              }
            />
            <div className="flex min-h-[44px] items-center gap-3 border-b border-brand-line bg-transparent px-1 pb-2.5 pt-3 transition-colors focus-within:border-brand hover:border-brand-muted">
              <CalendarDays
                size={20}
                strokeWidth={1.5}
                className="shrink-0 text-brand-muted"
                aria-hidden
              />
              <input
                type="text"
                aria-label="Período"
                value={filters.period}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, period: e.target.value }))
                }
                placeholder="Período (2026 ou 2026-03)"
                className="min-w-0 flex-1 bg-transparent font-body text-sm text-brand outline-none placeholder:text-brand-muted"
              />
            </div>
            {isOrgWide && (
              <DepartmentUserPicker
                label="Gestor"
                htmlFor="rep-manager"
                value={manager}
                onChange={(u) => {
                  setManager(u);
                  setFilters((f) => ({
                    ...f,
                    managerId: u ? String(u.id) : '',
                  }));
                }}
              />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={run} loading={load.isPending}>
              Gerar Relatório
            </Button>
            {isOrgWide && (
              <>
                <a
                  href={`/api/evaluations/reports/export.csv${buildQuery()}`}
                  className={buttonVariants({
                    intent: 'secondary',
                    size: 'md',
                  })}
                >
                  <Download size={14} strokeWidth={1.75} /> CSV
                </a>
                <a
                  href={`/api/evaluations/reports/export.xlsx${buildQuery()}`}
                  className={buttonVariants({
                    intent: 'secondary',
                    size: 'md',
                  })}
                >
                  <Download size={14} strokeWidth={1.75} /> Excel
                </a>
                <a
                  href={`/api/evaluations/reports/export.pdf${buildQuery()}`}
                  className={buttonVariants({
                    intent: 'secondary',
                    size: 'md',
                  })}
                >
                  <Download size={14} strokeWidth={1.75} /> PDF
                </a>
              </>
            )}
          </div>
        </CardBody>
      </Card>

      {!isOrgWide && (
        <p className="text-xs text-ink-muted">
          Estes relatórios mostram apenas a equipa que lidera diretamente.
        </p>
      )}

      {load.isPending && (
        <Skeleton
          rows={4}
          wrapperClassName="space-y-3"
          itemClassName="skeleton-shimmer h-24 rounded-card"
        />
      )}

      {load.isError && <QueryError error={load.error} onRetry={run} />}

      {!load.isPending && !data && !load.isError && (
        <EmptyState
          title="Sem relatório gerado"
          description="Ajusta os filtros e carrega em «Gerar Relatório»."
        />
      )}

      {data && (
        <div className="space-y-4">
          {data.privacy && <PrivacyNotice privacy={data.privacy} />}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <NavyStatCard
              tab="evaluations"
              icon={ClipboardList}
              label="Total de Avaliações"
              value={data.totalEvaluations}
              tone="blue"
            />
            <NavyStatCard
              icon={Star}
              label="Score Médio"
              value={data.avgScore.toFixed(1)}
              tone={SCORE_TONE(data.avgScore)}
            />
            <SpeedometerStatCard
              label="Taxa de Conclusão"
              value={data.completionRate}
              bands={RATE_BANDS}
              display={`${Math.round(data.completionRate)}%`}
            />
            <DonutStatCard
              label="Objetivos Alcançados"
              value={data.objectivesAchieved.avgAchievement ?? 0}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GroupTable title="Por Departamento" rows={data.byDepartment} />
            <GroupTable title="Por Unidade" rows={data.byUnit} />
            <GroupTable title="Por Cargo" rows={data.byPosition} />
            <GroupTable title="Por Gestor" rows={data.byManager} />
          </div>

          {data.competencyGaps.length > 0 && (
            <Card className="overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-brand/60 text-xs font-medium text-white uppercase tracking-wide">
                Lacunas de Competências
              </div>
              <CardBody>
                <div className="space-y-2">
                  {data.competencyGaps.map((c) => (
                    <div
                      key={c.competencyId}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-ink-muted">{c.name}</span>
                      <span className="font-bold text-danger-ink">
                        média {c.avgScore.toFixed(1)} · gap {c.gap.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {data.evolution.length > 1 && (
            <Card className="overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-brand/60 text-xs font-medium text-white uppercase tracking-wide">
                Evolução do Desempenho
              </div>
              <CardBody>
                <div className="flex items-end gap-2 h-24">
                  {data.evolution.map((e) => (
                    <div
                      key={e.period}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <div
                        className="w-full rounded-t bg-primary-subtle border-primary"
                        style={{ height: `${(e.avgScore / 5) * 100}%` }}
                      />
                      <span className="text-micro text-ink-faint">
                        {e.period}
                      </span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {data.performance && (
            <PerformanceIndicatorsPanel data={data.performance} />
          )}
        </div>
      )}
    </div>
  );
}

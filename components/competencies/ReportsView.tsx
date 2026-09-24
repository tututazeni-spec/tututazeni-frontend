// components/competencies/ReportsView.tsx
// Separador "Relatórios" (docs/módulo_competencies.md §9) — os 14
// relatórios pedidos são todos derivados no backend a partir de
// UserCompetency no momento da leitura (GET /competencies/reports/overview),
// sem tabela própria (mesma filosofia de §7/§8). Filtros (Período, Unidade,
// Departamento, Subdepartamento, Cargo, Competência, Categoria, Nível
// hierárquico, Estado) + exportação CSV, mesmo padrão de
// components/trainings/ReportsView.tsx.

'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { KpiCard } from '@/components/ui/KpiCard';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { buttonVariants } from '@/components/ui/Button';
import { CATEGORY_CFG, POSITION_LEVEL_CFG, STATUS_CFG } from './constants';
import {
  useCompetencyOptions,
  useDepartmentOptions,
  usePositionOptions,
  useSubDepartmentOptions,
  useUnitOptions,
} from './modelFormData';
import type {
  CompetencyReport,
  CompetencyReportGapGroup,
  CompetencyReportGroup,
} from './types';

const ALL = 'ALL';

function RankedList({
  rows,
  empty,
  valueLabel,
}: {
  rows: { label: string; value: number; sub?: string }[];
  empty: string;
  valueLabel?: (v: number) => string;
}) {
  if (rows.length === 0) {
    return (
      <p className="px-4 py-6 text-center font-body text-sm text-ink-faint">
        {empty}
      </p>
    );
  }
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="space-y-2 p-4">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span
            className="w-32 shrink-0 truncate font-body text-xs text-ink-muted"
            title={r.label}
          >
            {r.label}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.round((r.value / max) * 100)}%` }}
            />
          </div>
          <span className="w-16 shrink-0 text-right font-mono text-xs text-ink-faint">
            {valueLabel ? valueLabel(r.value) : r.value}
            {r.sub ? (
              <span className="ml-1 text-ink-faint/70">{r.sub}</span>
            ) : null}
          </span>
        </div>
      ))}
    </div>
  );
}

function GroupTable({
  title,
  rows,
  kind,
}: {
  title: string;
  rows: CompetencyReportGroup[] | CompetencyReportGapGroup[];
  kind: 'competencies' | 'gaps';
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
        {title}
      </div>
      {kind === 'competencies' ? (
        <RankedList
          rows={(rows as CompetencyReportGroup[]).map((r) => ({
            label: r.label,
            value: r.totalCompetencies,
            sub: `nv. ${r.avgLevel}`,
          }))}
          empty="Sem dados"
        />
      ) : (
        <RankedList
          rows={(rows as CompetencyReportGapGroup[]).map((r) => ({
            label: r.label,
            value: r.count,
            sub: `gap méd. ${r.avgGap}`,
          }))}
          empty="Sem gaps"
        />
      )}
    </Card>
  );
}

export function ReportsView() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [unitId, setUnitId] = useState(ALL);
  const [departmentId, setDepartmentId] = useState(ALL);
  const [subDepartmentId, setSubDepartmentId] = useState(ALL);
  const [positionId, setPositionId] = useState(ALL);
  const [competencyId, setCompetencyId] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [hierarchyLevel, setHierarchyLevel] = useState(ALL);
  const [status, setStatus] = useState(ALL);

  const { options: unitOptions } = useUnitOptions();
  const { options: departmentOptions } = useDepartmentOptions();
  const { options: subDepartmentOptions } = useSubDepartmentOptions(
    departmentId === ALL ? undefined : Number(departmentId),
  );
  const { options: positionOptions } = usePositionOptions();
  const { options: competencyOptions } = useCompetencyOptions();

  const params = {
    from: from || undefined,
    to: to || undefined,
    unitId: unitId === ALL ? undefined : unitId,
    departmentId: departmentId === ALL ? undefined : departmentId,
    subDepartmentId: subDepartmentId === ALL ? undefined : subDepartmentId,
    positionId: positionId === ALL ? undefined : positionId,
    competencyId: competencyId === ALL ? undefined : competencyId,
    category: category === ALL ? undefined : category,
    hierarchyLevel: hierarchyLevel === ALL ? undefined : hierarchyLevel,
    status: status === ALL ? undefined : status,
  };

  const { data, isLoading } = useApiQuery<CompetencyReport>(
    queryKeys.competencies.reports(params),
    '/competencies/reports/overview',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );

  const exportQuery = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null) as [string, string][],
  ).toString();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-40"
          />
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-40"
          />
          <Select
            items={[{ value: ALL, label: 'Todas as unidades' }, ...unitOptions]}
            value={unitId}
            onValueChange={setUnitId}
          />
          <Select
            items={[
              { value: ALL, label: 'Todos os departamentos' },
              ...departmentOptions,
            ]}
            value={departmentId}
            onValueChange={(v) => {
              setDepartmentId(v);
              setSubDepartmentId(ALL);
            }}
          />
          <Select
            items={[
              { value: ALL, label: 'Todos os subdepartamentos' },
              ...subDepartmentOptions,
            ]}
            value={subDepartmentId}
            onValueChange={setSubDepartmentId}
          />
          <Select
            items={[
              { value: ALL, label: 'Todos os cargos' },
              ...positionOptions,
            ]}
            value={positionId}
            onValueChange={setPositionId}
          />
          <Select
            items={[
              { value: ALL, label: 'Todas as competências' },
              ...competencyOptions,
            ]}
            value={competencyId}
            onValueChange={setCompetencyId}
          />
          <Select
            items={[
              { value: ALL, label: 'Todas as categorias' },
              ...Object.entries(CATEGORY_CFG).map(([value, cfg]) => ({
                value,
                label: cfg.label,
              })),
            ]}
            value={category}
            onValueChange={setCategory}
          />
          <Select
            items={[
              { value: ALL, label: 'Todos os níveis hierárquicos' },
              ...Object.entries(POSITION_LEVEL_CFG).map(([value, cfg]) => ({
                value,
                label: cfg.label,
              })),
            ]}
            value={hierarchyLevel}
            onValueChange={setHierarchyLevel}
          />
          <Select
            items={[
              { value: ALL, label: 'Todos os estados' },
              ...Object.entries(STATUS_CFG).map(([value, cfg]) => ({
                value,
                label: cfg.label,
              })),
            ]}
            value={status}
            onValueChange={setStatus}
          />
        </div>
        <a
          href={`/api/competencies/reports/export${exportQuery ? `?${exportQuery}` : ''}`}
          className={buttonVariants({ intent: 'ghost', size: 'sm' })}
        >
          <Download size={14} strokeWidth={1.75} />
          Exportar CSV
        </a>
      </div>

      {isLoading || !data ? (
        <Skeleton
          rows={3}
          wrapperClassName="space-y-3"
          itemClassName="skeleton-shimmer h-24 rounded-card"
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <KpiCard
              label="Competências"
              value={data.mapaGeral.totalCompetencies}
              intent="primary"
            />
            <KpiCard
              label="Críticas"
              value={data.mapaGeral.critical}
              intent="danger"
            />
            <KpiCard
              label="Estratégicas"
              value={data.mapaGeral.strategic}
              intent="accent"
            />
            <KpiCard
              label="Colaboradores avaliados"
              value={data.mapaGeral.usersAssessed}
              intent="info"
            />
            <KpiCard
              label="Nível médio de proficiência"
              value={`${data.nivelMedioProficiencia.geral} / 5`}
              intent="success"
            />
          </div>

          <div>
            <h3 className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Gaps de competências
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard
                label="Gaps identificados"
                value={data.gaps.total}
                intent="warning"
              />
              <KpiCard
                label="Colaboradores com gap"
                value={data.gaps.usersWithGap}
                intent="danger"
              />
              <KpiCard label="Gap médio" value={data.gaps.avgGap} />
              <KpiCard
                label="Abaixo do nível esperado"
                value={data.colaboradoresAbaixoDoEsperado.total}
                intent="danger"
              />
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Impacto das formações na proficiência
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <KpiCard
                label="Eventos com evolução"
                value={data.impactoFormacoes.events}
                intent="primary"
              />
              <KpiCard
                label="Colaboradores que melhoraram"
                value={data.impactoFormacoes.improved}
                intent="success"
              />
              <KpiCard
                label="Aumento médio de nível"
                value={`+${data.impactoFormacoes.avgLevelIncrease}`}
                intent="success"
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <GroupTable
              title="Competências por departamento"
              rows={data.porDepartamento}
              kind="competencies"
            />
            <GroupTable
              title="Competências por cargo"
              rows={data.porCargo}
              kind="competencies"
            />
            <GroupTable
              title="Competências por unidade"
              rows={data.porUnidade}
              kind="competencies"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <GroupTable
              title="Gaps por departamento"
              rows={data.gapsPorDepartamento}
              kind="gaps"
            />
            <GroupTable
              title="Gaps por cargo"
              rows={data.gapsPorCargo}
              kind="gaps"
            />
          </div>

          <GroupTable
            title="Competências por nível hierárquico"
            rows={data.porNivelHierarquico}
            kind="competencies"
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="overflow-hidden p-0">
              <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
                Competências críticas
              </div>
              <RankedList
                rows={data.competenciasCriticas.map((c) => ({
                  label: c.name,
                  value: c.usersWithGap,
                  sub: `nv. ${c.avgLevel}`,
                }))}
                empty="Sem competências críticas"
              />
            </Card>
            <Card className="overflow-hidden p-0">
              <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
                Competências mais desenvolvidas
              </div>
              <RankedList
                rows={data.maisDesenvolvidas.map((c) => ({
                  label: c.name,
                  value: c.usersAssessed,
                }))}
                empty="Sem dados"
              />
            </Card>
          </div>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Competências com maior défice
            </div>
            <RankedList
              rows={data.maiorDefice.map((c) => ({
                label: c.name,
                value: c.totalGap,
              }))}
              empty="Sem défices identificados"
            />
          </Card>
        </>
      )}
    </div>
  );
}

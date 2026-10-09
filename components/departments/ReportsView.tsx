// components/departments/ReportsView.tsx
// Separador "Relatórios" (docs/modulo_departments.md Ponto 9). Cobre os
// relatórios suportados por dados já existentes no schema (headcount,
// cargos ocupados/vagas, distribuição, admissões/saídas, rotatividade,
// antiguidade) — ver DepartmentsService.getReports(). Formação, Avaliações,
// Competências, PDI, Férias e Custos exigem dados de outros módulos e ficam
// fora deste âmbito (ver memória do projecto).

'use client';

import { useState } from 'react';
import {
  Briefcase,
  Clock,
  LogIn,
  LogOut,
  Repeat,
  Users,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useUnits } from './departmentFormData';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import type { DepartmentNode, ReportsData } from './types';

function flattenTree(
  nodes: DepartmentNode[],
  depth = 0,
): Array<{ value: string; label: string }> {
  return nodes.flatMap((n) => [
    { value: String(n.id), label: `${'— '.repeat(depth)}${n.name}` },
    ...flattenTree(n.children ?? [], depth + 1),
  ]);
}

function BarList({
  title,
  items,
  suffix = '',
}: {
  title: string;
  items: Array<{ label: string; count: number }>;
  suffix?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <Card className="p-4">
      <div className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-faint">
        {title}
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-ink-faint">Sem dados</p>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 10).map((item, i) => (
            <div key={i}>
              <div className="mb-0.5 flex items-start justify-between text-xs">
                <span className="min-w-0 break-words pr-2 text-ink-muted">{item.label}</span>
                <span className="flex-shrink-0 font-data text-ink-faint">
                  {item.count}
                  {suffix}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

const ACTIVE_ITEMS = [
  { value: 'ALL', label: 'Todos os estados' },
  { value: 'true', label: 'Activos' },
  { value: 'false', label: 'Inactivos' },
];

export function ReportsView() {
  const [departmentId, setDepartmentId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [active, setActive] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const params = {
    departmentId: departmentId || undefined,
    unitId: unitId || undefined,
    active: active || undefined,
    from: from || undefined,
    to: to || undefined,
  };

  const { data: tree } = useApiQuery<DepartmentNode[]>(
    queryKeys.departments.tree(),
    '/departments/tree',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const deptItems = [
    { value: 'ALL', label: 'Todos os departamentos' },
    ...flattenTree(tree ?? []),
  ];
  const { units } = useUnits();
  const unitItems = [
    { value: 'ALL', label: 'Todas as unidades' },
    ...units.map((u) => ({ value: String(u.id), label: u.name })),
  ];

  const { data, isLoading, error } = useApiQuery<ReportsData>(
    queryKeys.departments.reports(params),
    '/departments/reports',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );

  return (
    <div>
      {/* Filtros */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Select
          items={deptItems}
          value={departmentId || 'ALL'}
          onValueChange={(v) => setDepartmentId(v === 'ALL' ? '' : v)}
          className="w-full"
        />
        <Select
          items={unitItems}
          value={unitId || 'ALL'}
          onValueChange={(v) => setUnitId(v === 'ALL' ? '' : v)}
          className="w-full"
        />
        <Select
          items={ACTIVE_ITEMS}
          value={active || 'ALL'}
          onValueChange={(v) => setActive(v === 'ALL' ? '' : v)}
          className="w-full"
        />
        <Input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="w-full"
          aria-label="Admissões/saídas a partir de"
        />
        <Input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-full"
          aria-label="Admissões/saídas até"
        />
      </div>

      {isLoading && <Skeleton rows={5} />}
      {error && <div className="px-4 py-8 text-center text-sm text-danger">{error.message}</div>}

      {!isLoading && !error && data && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <NavyStatCard
              icon={Users}
              tone="blue"
              label="Colaboradores"
              value={data.employeeDistribution.total}
              sub={`${data.employeeDistribution.active} activos · ${data.employeeDistribution.inactive} inactivos`}
            />
            <NavyStatCard
              icon={Briefcase}
              tone={data.positionsOccupiedVsVacant.vacancies > 0 ? 'orange' : 'green'}
              label="Cargos ocupados vs. vagas"
              value={`${data.positionsOccupiedVsVacant.occupied}/${data.positionsOccupiedVsVacant.planned}`}
              sub={`${data.positionsOccupiedVsVacant.vacancies} vagas`}
            />
            <NavyStatCard
              icon={LogIn}
              tone="green"
              label="Admissões no período"
              value={data.admissions.total}
            />
            <NavyStatCard
              icon={LogOut}
              tone={data.exits.total > 0 ? 'red' : 'blue'}
              label="Saídas no período"
              value={data.exits.total}
            />
            <NavyStatCard
              icon={Repeat}
              tone="orange"
              label="Taxa de rotatividade"
              value={`${data.turnoverRate.toFixed(1)}%`}
              sub="saídas / efectivo actual"
            />
            <NavyStatCard
              icon={Clock}
              tone="blue"
              label="Antiguidade média"
              value={`${data.seniority.avgYears.toFixed(1)} anos`}
            />
          </div>

          {/* Headcount */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <BarList
              title="Headcount por departamento (actual)"
              items={data.headcountByDepartment.map((d) => ({ label: d.name, count: d.actual }))}
            />
            <BarList
              title="Headcount por unidade"
              items={data.headcountByUnit.map((u) => ({ label: u.name, count: u.actual }))}
            />
            <BarList
              title="Cargos ocupados vs. vagas"
              items={data.headcountByPosition
                .filter((p) => p.vacancies > 0)
                .map((p) => ({
                  label: `${p.name}${p.department ? ` (${p.department.name})` : ''}`,
                  count: p.vacancies,
                }))}
              suffix=" vagas"
            />
            <BarList
              title="Distribuição por localização"
              items={data.employeeDistribution.byLocation}
            />
            <BarList
              title="Distribuição por tipo de vínculo"
              items={data.employeeDistribution.byContractType}
            />
            <BarList
              title="Antiguidade (distribuição)"
              items={data.seniority.buckets}
            />
          </div>

          {/* Headcount por departamento: previsto vs. actual */}
          <Card className="overflow-hidden">
            <div className="border-b border-border px-4 py-3 text-xs font-medium uppercase tracking-wide text-ink-faint">
              Headcount previsto vs. actual, por departamento
            </div>
            {data.headcountByDepartment.length === 0 ? (
              <p className="p-4 text-xs text-ink-faint">Sem dados</p>
            ) : (
              data.headcountByDepartment.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 text-sm last:border-0"
                >
                  <span className="min-w-0 flex-1 break-words text-ink">{d.name}</span>
                  <span className="flex-shrink-0 font-mono text-xs text-ink-muted">
                    {d.actual} actual · {d.expected ?? '—'} previsto · {d.max ?? '—'} limite
                  </span>
                </div>
              ))
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

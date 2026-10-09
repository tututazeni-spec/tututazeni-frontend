// components/leave/PlanningTab.tsx
// Separador "Planeamento de Equipas" (docs/Modulo_Leave.md §8) — para gestores
// e RH manterem a continuidade operacional: disponibilidade por equipa e por
// dia, cobertura mínima, sobreposições, pedidos pendentes em conflito com
// períodos críticos e alertas de falta de cobertura. É informativo: o sistema
// avisa mas nunca recusa um pedido por si.

'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CalendarOff,
  GitCompareArrows,
  Info,
  Users,
  UsersRound,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import {
  useDepartmentOptions,
  useUnitOptions,
} from '@/components/competencies/modelFormData';
import { usePlanning, type PlanningFilters } from '@/hooks/useLeave';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import type { PlanningDay, PlanningTeam } from './types';

const ALL = 'ALL';

function defaultRange() {
  const now = new Date();
  const from = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const to = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 2, 0));
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function dayClass(d: PlanningDay): string {
  if (d.belowMinimum) return 'bg-danger';
  if (d.projectedBelowMinimum) return 'bg-warning';
  if (d.overlap) return 'bg-info';
  return 'bg-success';
}

function dayTitle(d: PlanningDay): string {
  const pending = d.pendingAbsent ? ` (+${d.pendingAbsent} por aprovar)` : '';
  return `${formatDate(d.date)} — ${d.availabilityPercent}% disponível, ${d.absent} ausente(s)${pending}`;
}

function AvailabilityStrip({ team }: { team: PlanningTeam }) {
  return (
    <div
      className="flex gap-px"
      role="img"
      aria-label={`Disponibilidade diária de ${team.department ?? 'sem departamento'}`}
    >
      {team.days.map((d) => (
        <span
          key={d.date}
          title={dayTitle(d)}
          className={cn('h-5 min-w-[3px] flex-1 rounded-sm', dayClass(d))}
        />
      ))}
    </div>
  );
}

export function PlanningTab() {
  const [filters, setFilters] = useState<PlanningFilters>({
    ...defaultRange(),
    unitId: '',
    departmentId: '',
  });
  const { data, loading } = usePlanning(filters);
  const departments = useDepartmentOptions();
  const units = useUnitOptions();
  const set = (patch: Partial<PlanningFilters>) =>
    setFilters((f) => ({ ...f, ...patch }));
  const pick = (v: string) => (v === ALL ? '' : v);

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Input
            type="date"
            aria-label="Desde"
            value={filters.from}
            onChange={(e) => set({ from: e.target.value })}
            className="w-full"
          />
          <Input
            type="date"
            aria-label="Até"
            min={filters.from}
            value={filters.to}
            onChange={(e) => set({ to: e.target.value })}
            className="w-full"
          />
          <Select
            className="w-full"
            value={filters.unitId || ALL}
            onValueChange={(v) => set({ unitId: pick(v) })}
            items={[{ value: ALL, label: 'Todas as unidades' }, ...units.options]}
          />
          <Select
            className="w-full"
            value={filters.departmentId || ALL}
            onValueChange={(v) => set({ departmentId: pick(v) })}
            items={[
              { value: ALL, label: 'Todos os departamentos' },
              ...departments.options,
            ]}
          />
        </div>
      </Card>

      {loading && !data ? (
        <Skeleton
          rows={5}
          wrapperClassName="space-y-2 animate-pulse"
          itemClassName="h-12 bg-surface-sunken rounded-control"
        />
      ) : !data ? (
        <EmptyState
          title="Sem dados de planeamento"
          description="Ajuste o período ou os filtros."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
            <NavyStatCard
              icon={Users}
              tone="blue"
              label="Colaboradores"
              value={data.summary.headcount}
            />
            <NavyStatCard
              icon={CalendarOff}
              tone="blue"
              label="Ausentes hoje"
              value={data.summary.absentToday}
            />
            <NavyStatCard
              icon={CalendarClock}
              tone="orange"
              label="Pedidos pendentes"
              value={data.summary.pendingRequests}
            />
            <NavyStatCard
              icon={UsersRound}
              tone={data.summary.teamsBelowMinimum ? 'red' : 'green'}
              label="Equipas abaixo do mínimo"
              value={data.summary.teamsBelowMinimum}
            />
            <NavyStatCard
              icon={GitCompareArrows}
              tone={data.summary.conflictingRequests ? 'red' : 'green'}
              label="Pedidos em conflito"
              value={data.summary.conflictingRequests}
            />
          </div>

          <p className="flex items-center gap-1.5 text-xs text-ink-faint">
            <Info size={13} strokeWidth={1.75} /> {data.policyNote}
          </p>

          {data.alerts.length > 0 && (
            <Card className="overflow-hidden p-4 space-y-2">
              <h3 className="-mx-4 -mt-4 flex items-center gap-2 bg-[#0F1F3D]/60 px-4 py-3 text-sm font-semibold text-white">
                <AlertTriangle size={15} strokeWidth={1.75} />
                Alertas de falta de cobertura
              </h3>
              <ul className="space-y-1 text-xs text-ink-muted max-h-48 overflow-y-auto">
                {data.alerts.map((a) => (
                  <li key={`${a.date}-${a.departmentId}`}>
                    <span className="font-medium text-ink">
                      {formatDate(a.date)}
                    </span>{' '}
                    — {a.department ?? 'Sem departamento'}: {a.absent} de{' '}
                    {a.headcount} ausentes ({a.availabilityPercent}% disponível,
                    mínimo {a.minAvailabilityPercent}%)
                    {a.causedByPending ? ' — se os pendentes forem aprovados' : ''}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="overflow-hidden p-4 space-y-3">
            <div className="-mx-4 -mt-4 flex flex-wrap items-center justify-between gap-2 bg-[#0F1F3D]/60 px-4 py-3">
              <h3 className="text-sm font-semibold text-white">
                Disponibilidade por equipa
              </h3>
              <p className="flex flex-wrap items-center gap-3 text-xs text-white/90">
                <Legend cls="bg-success" label="Dentro do mínimo" />
                <Legend cls="bg-info" label="Sobreposição" />
                <Legend cls="bg-warning" label="Abaixo se aprovar pendentes" />
                <Legend cls="bg-danger" label="Abaixo do mínimo" />
              </p>
            </div>
            {data.teams.length === 0 ? (
              <EmptyState
                title="Sem equipas no âmbito seleccionado"
                description="Não há colaboradores activos para estes filtros."
              />
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Equipa</TableHeaderCell>
                    <TableHeaderCell>Colab.</TableHeaderCell>
                    <TableHeaderCell>Mínimo</TableHeaderCell>
                    <TableHeaderCell>Média</TableHeaderCell>
                    <TableHeaderCell>Pior dia</TableHeaderCell>
                    <TableHeaderCell>Dias abaixo</TableHeaderCell>
                    <TableHeaderCell>Sobreposição</TableHeaderCell>
                    <TableHeaderCell className="min-w-[14rem]">
                      Período
                    </TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.teams.map((t) => (
                    <TableRow key={t.departmentId ?? 'none'}>
                      <TableCell className="font-medium">
                        {t.department ?? 'Sem departamento'}
                      </TableCell>
                      <TableCell>{t.headcount}</TableCell>
                      <TableCell>
                        {t.minAvailabilityPercent}% ({t.minPeople} pessoas)
                      </TableCell>
                      <TableCell>{t.averageAvailabilityPercent}%</TableCell>
                      <TableCell
                        className={cn(
                          t.worstAvailabilityPercent < t.minAvailabilityPercent &&
                            'text-danger-ink font-semibold',
                        )}
                      >
                        {t.worstAvailabilityPercent}%
                      </TableCell>
                      <TableCell>{t.belowMinimumDays}</TableCell>
                      <TableCell>{t.overlapDays} dia(s)</TableCell>
                      <TableCell>
                        <AvailabilityStrip team={t} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          <Card className="overflow-hidden p-4 space-y-3">
            <h3 className="-mx-4 -mt-4 bg-[#0F1F3D]/60 px-4 py-3 text-sm font-semibold text-white">
              Pedidos pendentes no período
            </h3>
            {data.pendingRequests.length === 0 ? (
              <p className="text-xs text-ink-faint">
                Sem pedidos pendentes neste período.
              </p>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Colaborador</TableHeaderCell>
                    <TableHeaderCell>Pedido</TableHeaderCell>
                    <TableHeaderCell>Sobreposição</TableHeaderCell>
                    <TableHeaderCell>Cobertura</TableHeaderCell>
                    <TableHeaderCell>Período crítico</TableHeaderCell>
                    <TableHeaderCell>Substituto</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.pendingRequests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <p className="font-medium text-ink">{r.user.fullName}</p>
                        <p className="text-xs text-ink-faint">
                          {r.department ?? '—'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p>{r.type.name}</p>
                        <p className="text-xs text-ink-faint">
                          {formatDate(r.startDate)} → {formatDate(r.endDate)} ·{' '}
                          {r.workDays} dia(s)
                        </p>
                      </TableCell>
                      <TableCell>
                        {r.overlappingPeople
                          ? `${r.overlappingPeople} colega(s)`
                          : '—'}
                      </TableCell>
                      <TableCell
                        className={cn(
                          r.coverageBreachDays > 0 && 'text-danger-ink',
                        )}
                      >
                        {r.coverageBreachDays > 0
                          ? `${r.coverageBreachDays} dia(s) abaixo do mínimo`
                          : 'Ok'}
                      </TableCell>
                      <TableCell
                        className={cn(
                          r.criticalPeriods.length > 0 && 'text-warning-ink',
                        )}
                      >
                        {r.criticalPeriods.length
                          ? r.criticalPeriods.join(', ')
                          : '—'}
                      </TableCell>
                      <TableCell>{r.substitute?.fullName ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          {data.absentPeople.length > 0 && (
            <Card className="overflow-hidden p-4 space-y-2">
              <h3 className="-mx-4 -mt-4 bg-[#0F1F3D]/60 px-4 py-3 text-sm font-semibold text-white">
                Férias aprovadas e ausências previstas
              </h3>
              <ul className="space-y-1 text-xs text-ink-muted max-h-64 overflow-y-auto">
                {data.absentPeople.map((p) => (
                  <li key={p.userId}>
                    <span className="font-medium text-ink">{p.fullName}</span>
                    {p.department ? ` (${p.department})` : ''}:{' '}
                    {p.periods.join('; ')}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function Legend({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn('inline-block h-2.5 w-2.5 rounded-sm', cls)} />
      {label}
    </span>
  );
}

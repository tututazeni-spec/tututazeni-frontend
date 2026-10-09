// components/leave/VacationsTab.tsx
// Separador "Férias" (docs/Modulo_Leave.md §3) — tabela anual de saldos e
// plano por colaborador (§3.1) e entrada para o modal "Novo pedido de
// férias" (§3.2). O colaborador vê só a sua linha; gestor a equipa; RH/ADMIN
// a organização — o âmbito é aplicado no backend.

'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
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
import { useDebounce } from '@/hooks/useDebounce';
import { useVacations, type VacationFilters } from '@/hooks/useLeave';
import { formatDate } from '@/lib/format';
import { PLAN_STATE_CFG } from './constants';
import { NewVacationModal } from './NewVacationModal';

const ALL = 'ALL';
const HEADERS = [
  'Colaborador',
  'Departamento',
  'Unidade',
  'Ano',
  'Atribuídos',
  'Transitados',
  'Reservados',
  'Gozados',
  'Disponível',
  'Próximo período',
  'Estado do plano',
];

export function VacationsTab() {
  const thisYear = new Date().getFullYear();
  const [filters, setFilters] = useState<VacationFilters>({
    year: thisYear,
    unitId: '',
    departmentId: '',
    search: '',
    planState: '',
    page: 1,
  });
  const [showModal, setShowModal] = useState(false);
  const debouncedSearch = useDebounce(filters.search, 300);
  const { data, loading, refetch } = useVacations({
    ...filters,
    search: debouncedSearch,
  });
  const units = useUnitOptions();
  const departments = useDepartmentOptions();

  const set = (patch: Partial<VacationFilters>) =>
    setFilters((f) => ({ ...f, page: 1, ...patch }));
  const pick = (v: string) => (v === ALL ? '' : v);
  const withAll = (items: { value: string; label: string }[], label: string) => [
    { value: ALL, label },
    ...items,
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">Plano anual de férias</h2>
          <p className="text-xs text-ink-faint">
            Dias reservados = aprovados ainda não gozados. O saldo é debitado
            uma única vez, na aprovação.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={15} strokeWidth={1.75} /> Novo pedido de férias
        </Button>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Input
            placeholder="Procurar nome ou n.º interno"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            className="w-full col-span-2 md:col-span-1"
          />
          <Select
            className="w-full"
            value={String(filters.year)}
            onValueChange={(v) => set({ year: Number(v) })}
            items={[thisYear - 1, thisYear, thisYear + 1].map((y) => ({
              value: String(y),
              label: `Ano ${y}`,
            }))}
          />
          <Select
            className="w-full"
            value={filters.unitId || ALL}
            onValueChange={(v) => set({ unitId: pick(v) })}
            items={withAll(units.options, 'Todas as unidades')}
          />
          <Select
            className="w-full"
            value={filters.departmentId || ALL}
            onValueChange={(v) => set({ departmentId: pick(v) })}
            items={withAll(departments.options, 'Todos os departamentos')}
          />
          <Select
            className="w-full"
            value={filters.planState || ALL}
            onValueChange={(v) => set({ planState: pick(v) })}
            items={withAll(
              Object.entries(PLAN_STATE_CFG).map(([value, c]) => ({
                value,
                label: c.label,
              })),
              'Todos os estados',
            )}
          />
        </div>
      </Card>

      {loading && !data ? (
        <Skeleton
          rows={6}
          wrapperClassName="space-y-2 animate-pulse"
          itemClassName="h-10 bg-surface-sunken rounded-control"
        />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title="Sem colaboradores para os filtros seleccionados"
          description="Ajuste os filtros ou verifique se existem colaboradores no seu âmbito."
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHead className="bg-[#0F1F3D]/60 [&_th]:text-white">
                <TableRow>
                  {HEADERS.map((h) => (
                    <TableHeaderCell key={h}>{h}</TableHeaderCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.data.map((r) => (
                  <TableRow key={r.userId}>
                    <TableCell>
                      <p className="font-medium text-ink">{r.fullName}</p>
                      <p className="text-xs text-ink-faint">
                        {r.employeeNumber ?? '—'}
                      </p>
                    </TableCell>
                    <TableCell>{r.department?.name ?? '—'}</TableCell>
                    <TableCell>{r.unit?.name ?? '—'}</TableCell>
                    <TableCell>{r.referenceYear}</TableCell>
                    <TableCell>{r.assignedDays}</TableCell>
                    <TableCell>{r.carriedOverDays}</TableCell>
                    <TableCell>{r.reservedDays}</TableCell>
                    <TableCell>{r.takenDays}</TableCell>
                    <TableCell className="font-semibold">
                      {r.availableDays}
                    </TableCell>
                    <TableCell>
                      {r.nextPeriod
                        ? `${formatDate(r.nextPeriod.startDate)} → ${formatDate(r.nextPeriod.endDate)}`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        value={r.planState}
                        map={PLAN_STATE_CFG}
                        variant="dot"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-ink-faint">
            {data.meta.total} colaborador(es). Os saldos mostram a posição
            actual; reservados, gozados e plano respeitam o ano seleccionado.
          </p>
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
          />
        </>
      )}

      {showModal && (
        <NewVacationModal
          onClose={() => setShowModal(false)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}

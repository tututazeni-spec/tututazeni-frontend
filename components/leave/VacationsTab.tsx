// components/leave/VacationsTab.tsx
// Separador "Férias" (docs/Modulo_Leave.md §3) — tabela anual de saldos e
// plano por colaborador (§3.1) e entrada para o modal "Novo pedido de
// férias" (§3.2). O colaborador vê só a sua linha; gestor a equipa; RH/ADMIN
// a organização — o âmbito é aplicado no backend.

'use client';

import { useState } from 'react';
import {
  BarChart3,
  Briefcase,
  Building2,
  ChevronRight,
  Plus,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
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

// Colaborador e Departamento à esquerda; restantes centrados.
const HEADERS: { label: string; center: boolean }[] = [
  { label: 'Colaborador', center: false },
  { label: 'Departamento', center: false },
  { label: 'Unidade', center: true },
  { label: 'Ano', center: true },
  { label: 'Atribuídos', center: true },
  { label: 'Transitados', center: true },
  { label: 'Reservados', center: true },
  { label: 'Gozados', center: true },
  { label: 'Disponível', center: true },
  { label: 'Próximo período', center: true },
  { label: 'Estado do plano', center: true },
];

const HEADER_CELL =
  'px-4 py-4 text-xs font-semibold uppercase tracking-wide text-[#0F2E5E] whitespace-nowrap';
const BODY_CELL = 'px-4 py-4 text-sm text-[#0F2E5E]';

/* ── Badge de departamento (cor + ícone) ───────────────────── */
interface DeptStyle {
  bg: string;
  text: string;
  icon: LucideIcon;
}

const DEPT_STYLES: Record<string, DeptStyle> = {
  Engenharia: { bg: '#E6F0FF', text: '#1D6BF3', icon: Settings },
  'Recursos Humanos': { bg: '#F1E8FF', text: '#6D2FD6', icon: Users },
  Marketing: { bg: '#DDF5EA', text: '#16995F', icon: BarChart3 },
  Administração: { bg: '#E3ECFD', text: '#2F55C8', icon: Briefcase },
};
const DEPT_FALLBACK: DeptStyle = {
  bg: '#EEF1F6',
  text: '#475569',
  icon: Building2,
};

function DepartmentBadge({ name }: { name: string | undefined }) {
  if (!name) return <span className="text-[#9DB3D9]">—</span>;
  const s = DEPT_STYLES[name] ?? DEPT_FALLBACK;
  const Icon = s.icon;
  return (
    <span
      className="inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      <Icon size={16} strokeWidth={2} />
      {name}
    </span>
  );
}

/* ── Pílula numérica ───────────────────────────────────────── */
function NumberPill({
  value,
  tone,
}: {
  value: number | string;
  tone: 'blue' | 'grey';
}) {
  const cls =
    tone === 'blue'
      ? 'bg-[#E6F0FF] text-[#1D6BF3]'
      : 'bg-slate-100 text-slate-500';
  return (
    <span
      className={`inline-flex min-w-[56px] items-center justify-center rounded-full px-4 py-2 text-sm font-medium ${cls}`}
    >
      {value}
    </span>
  );
}

interface VacationsTabProps {
  /** Opcional: chamado ao clicar numa linha (ou na seta). */
  onSelectUser?: (userId: number) => void;
}

export function VacationsTab({ onSelectUser }: VacationsTabProps = {}) {
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

      <Card className="overflow-hidden p-4">
        <h3 className="-mx-4 -mt-4 mb-3 bg-[#0F1F3D]/60 px-4 py-3 text-sm font-semibold text-white">Filtros</h3>
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
          itemClassName="h-16 bg-surface-sunken rounded-2xl"
        />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title="Sem colaboradores para os filtros seleccionados"
          description="Ajuste os filtros ou verifique se existem colaboradores no seu âmbito."
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
            {/* Barra de título */}
            <div className="flex items-center gap-4 bg-[#0F2E5E] px-6 py-5">
              <Users size={24} strokeWidth={1.75} className="text-[#3B82F6]" />
              <h3 className="text-xl font-semibold text-white">Colaboradores</h3>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[1200px]">
                <Table>
                  <TableHead className="bg-[#EEF4FD]">
                    <TableRow>
                      {HEADERS.map((h) => (
                        <TableHeaderCell
                          key={h.label}
                          className={`${HEADER_CELL} ${
                            h.center ? 'text-center' : 'text-left'
                          }`}
                        >
                          {h.label}
                        </TableHeaderCell>
                      ))}
                      <TableHeaderCell className="w-16 px-4 py-4">
                        <span className="sr-only">Abrir</span>
                      </TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.data.map((r) => (
                      <TableRow
                        key={r.userId}
                        onClick={
                          onSelectUser ? () => onSelectUser(r.userId) : undefined
                        }
                        className={`border-t border-slate-100 transition-colors hover:bg-slate-50/70 ${
                          onSelectUser ? 'cursor-pointer' : ''
                        }`}
                      >
                        <TableCell className={BODY_CELL}>
                          <div className="flex items-center gap-4">
                            <Avatar
                              name={r.fullName}
                              url={r.avatarUrl ?? undefined}
                              size="lg"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-[#0F2E5E]">
                                {r.fullName}
                              </p>
                              <p className="text-xs text-ink-faint">
                                {r.employeeNumber ?? '—'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className={BODY_CELL}>
                          <DepartmentBadge name={r.department?.name} />
                        </TableCell>
                        <TableCell className={`${BODY_CELL} text-center`}>
                          {r.unit?.name ?? (
                            <span className="text-[#9DB3D9]">—</span>
                          )}
                        </TableCell>
                        <TableCell
                          className={`${BODY_CELL} text-center font-medium`}
                        >
                          {r.referenceYear}
                        </TableCell>
                        <TableCell className={`${BODY_CELL} text-center`}>
                          <NumberPill value={r.assignedDays} tone="blue" />
                        </TableCell>
                        <TableCell className={`${BODY_CELL} text-center`}>
                          <NumberPill value={r.carriedOverDays} tone="grey" />
                        </TableCell>
                        <TableCell className={`${BODY_CELL} text-center`}>
                          <NumberPill value={r.reservedDays} tone="grey" />
                        </TableCell>
                        <TableCell className={`${BODY_CELL} text-center`}>
                          <NumberPill value={r.takenDays} tone="grey" />
                        </TableCell>
                        <TableCell className={`${BODY_CELL} text-center`}>
                          <NumberPill value={r.availableDays} tone="blue" />
                        </TableCell>
                        <TableCell
                          className={`${BODY_CELL} whitespace-nowrap text-center`}
                        >
                          {r.nextPeriod ? (
                            `${formatDate(r.nextPeriod.startDate)} → ${formatDate(r.nextPeriod.endDate)}`
                          ) : (
                            <span className="text-[#9DB3D9]">—</span>
                          )}
                        </TableCell>
                        <TableCell className={`${BODY_CELL} text-center`}>
                          <div className="flex justify-center">
                            <StatusBadge
                              value={r.planState}
                              map={PLAN_STATE_CFG}
                              variant="dot"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <span
                            aria-hidden
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF4FD] text-[#1D6BF3]"
                          >
                            <ChevronRight size={18} strokeWidth={2} />
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
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
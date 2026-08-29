'use client';

// ─── app/(dashboard)/employees/page.tsx ──────────────────────────────────────
// INNOVA — Módulo de Colaboradores
//
// Container: gere estado de UI (view/página/filtros/modais) e liga os dados
// já separados em hooks/useEmployees.ts (useEmployees/useHeadcount) à
// apresentação, agora repartida em components/employees/. Ver memory
// project_innova_component_separation_audit. Migrado para a fundação de
// design (Fase A): classes Tailwind cruas passam a tokens; KpiCard/Skeleton
// locais passam aos equivalentes de components/ui/; tabela da list view
// passa a components/ui/Table.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Download,
  LayoutGrid,
  List,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  useEmployees,
  useHeadcount,
  type Employee,
  type FilterState,
} from '@/hooks/useEmployees';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import { reportError } from '@/lib/errorReporting';
import { Button, buttonVariants } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { CreateEmployeeModal } from '@/components/employees/CreateEmployeeModal';
import { EmployeeCard } from '@/components/employees/EmployeeCard';
import { EmployeeDrawer } from '@/components/employees/EmployeeDrawer';
import { EmployeeRow } from '@/components/employees/EmployeeRow';
import { FilterPanel } from '@/components/employees/FilterPanel';
import { Pagination } from '@/components/ui/Pagination';

const LIST_COLUMNS = [
  'Colaborador',
  'Cargo / Depto',
  'Localidade',
  'Senioridade',
  'Status',
  'Admissão',
  '',
];

export default function EmployeesPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    department: '',
    status: 'ACTIVE',
    seniority: '',
    workMode: '',
    contractType: '',
  });

  const { data, loading, error, refetch } = useEmployees(filters, page);
  const { stats } = useHeadcount();

  const updateFilters = useCallback((f: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...f }));
    setPage(1);
  }, []);

  const activeFilterCount =
    Object.entries(filters).filter(
      ([k, v]) => k !== 'search' && v !== '' && v !== 'ACTIVE',
    ).length + (filters.status && filters.status !== 'ACTIVE' ? 1 : 0);

  const handleExport = async () => {
    try {
      const result = await apiClient.get<{
        data: Array<Record<string, unknown>>;
      }>('/employees/export');
      const csv = [
        Object.keys(result.data[0] ?? {}).join(','),
        ...result.data.map((row) => Object.values(row).join(',')),
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `colaboradores-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      reportError(e, { source: 'EmployeesPage.handleExport' });
    }
  };

  const onLeaveCount =
    stats?.byStatus?.find((s) => s.status === 'ON_LEAVE')?._count ?? 0;

  return (
    <div className="min-h-screen bg-canvas">
      {/* ── Header */}
      <div className="bg-surface border-b border-border px-6 py-5 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h1 className="text-xl font-bold text-ink">Colaboradores</h1>
              <p className="text-sm text-ink-muted">
                {stats
                  ? `${stats.total} ativos`
                  : 'Gestão de pessoas e talentos'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button intent="secondary" onClick={handleExport}>
                <Download size={16} strokeWidth={1.75} /> CSV
              </Button>
              <a
                href="/api/employees/export/xlsx"
                className={buttonVariants({ intent: 'secondary' })}
              >
                <Download size={16} strokeWidth={1.75} /> XLSX
              </a>
              <Button onClick={() => setShowCreate(true)}>
                <UserPlus size={16} strokeWidth={1.75} /> Novo Colaborador
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* ── KPIs */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              label="Total Ativos"
              value={stats.total}
              intent="primary"
              sub={`+${stats.recentHires} este mês`}
              className="w-full"
            />
            {stats.byStatus?.find((s) => s.status === 'ON_LEAVE') && (
              <KpiCard
                label="Afastados"
                value={onLeaveCount}
                intent="warning"
                className="w-full"
              />
            )}
            <KpiCard
              label="Departamentos"
              value={stats.byDepartment?.length ?? '—'}
              intent="accent"
              className="w-full"
            />
            <KpiCard
              label="Admissões Recentes"
              value={stats.recentHires ?? 0}
              intent="success"
              sub="últimos 30 dias"
              className="w-full"
            />
          </div>
        )}

        {/* ── Toolbar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search
              size={16}
              strokeWidth={1.75}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <Input
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              placeholder="Buscar por nome, e-mail, matrícula, cargo..."
              className="w-full pl-9 pr-9 shadow-resting"
            />
            {filters.search && (
              <button
                onClick={() => updateFilters({ search: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-muted"
              >
                <X size={14} strokeWidth={1.75} />
              </button>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm rounded-control border transition-colors shadow-resting',
                showFilters || activeFilterCount > 0
                  ? 'border-primary bg-primary-subtle text-primary'
                  : 'border-border bg-surface text-ink-muted hover:bg-surface-sunken',
              )}
            >
              <SlidersHorizontal size={16} strokeWidth={1.75} />
              Filtros
              {activeFilterCount > 0 && (
                <span className="bg-primary text-canvas text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {showFilters && (
              <FilterPanel
                filters={filters}
                onChange={updateFilters}
                onClose={() => setShowFilters(false)}
              />
            )}
          </div>

          <div className="flex items-center bg-surface border border-border rounded-control overflow-hidden shadow-resting">
            <button
              onClick={() => setView('grid')}
              className={cn(
                'p-2.5 transition-colors',
                view === 'grid'
                  ? 'bg-primary text-canvas'
                  : 'text-ink-muted hover:bg-surface-sunken',
              )}
            >
              <LayoutGrid size={16} strokeWidth={1.75} />
            </button>
            <button
              onClick={() => setView('list')}
              className={cn(
                'p-2.5 transition-colors',
                view === 'list'
                  ? 'bg-primary text-canvas'
                  : 'text-ink-muted hover:bg-surface-sunken',
              )}
            >
              <List size={16} strokeWidth={1.75} />
            </button>
          </div>

          <button
            onClick={() => refetch()}
            className="p-2.5 text-ink-muted hover:text-ink bg-surface border border-border rounded-control hover:bg-surface-sunken transition-colors shadow-resting"
          >
            <RefreshCcw
              size={16}
              strokeWidth={1.75}
              className={loading ? 'animate-spin' : ''}
            />
          </button>
        </div>

        {/* ── Result count */}
        {data && !loading && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink-muted">
              <span className="font-semibold text-ink">{data.meta.total}</span>{' '}
              colaboradores encontrados
            </p>
            {data.meta.total > 0 && (
              <p className="text-xs text-ink-faint">
                Página {data.meta.page} de {data.meta.totalPages}
              </p>
            )}
          </div>
        )}

        {/* ── Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-danger-subtle border border-danger/20 rounded-card text-sm text-danger-ink">
            <AlertCircle
              size={18}
              strokeWidth={1.75}
              className="flex-shrink-0"
            />
            <div>
              <p className="font-medium">Erro ao carregar colaboradores</p>
              <p className="text-xs mt-0.5 opacity-80">{error}</p>
            </div>
            <button
              onClick={() => refetch()}
              className="ml-auto text-xs underline hover:no-underline"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* ── Grid View */}
        {view === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {loading ? (
              <Skeleton
                rows={8}
                wrapperClassName="contents"
                itemClassName="skeleton-shimmer h-40 rounded-card"
              />
            ) : (
              data?.data.map((emp) => (
                <EmployeeCard
                  key={emp.id}
                  employee={emp}
                  onView={setSelected}
                  onEdit={(e) => setSelected(e)} // edição abre o perfil; navegação dedicada a definir
                />
              ))
            )}
            {!loading && data?.data.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-ink-faint">
                <Users
                  size={48}
                  strokeWidth={1.75}
                  className="mb-4 opacity-30"
                />
                <p className="text-lg font-medium">
                  Nenhum colaborador encontrado
                </p>
                <p className="text-sm mt-1">
                  Tente ajustar os filtros ou adicione um novo colaborador
                </p>
                <Button
                  intent="secondary"
                  className="mt-4"
                  onClick={() => setShowCreate(true)}
                >
                  <UserPlus size={16} strokeWidth={1.75} /> Adicionar
                  Colaborador
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── List View */}
        {view === 'list' && (
          <Table>
            <TableHead>
              <TableRow>
                {LIST_COLUMNS.map((h) => (
                  <TableHeaderCell key={h} className="whitespace-nowrap">
                    {h}
                  </TableHeaderCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <div
                          className="h-4 skeleton-shimmer rounded"
                          style={{ width: j === 0 ? '140px' : '80px' }}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={LIST_COLUMNS.length}
                    className="py-16 text-center"
                  >
                    <div className="flex flex-col items-center justify-center text-ink-faint">
                      <Users
                        size={40}
                        strokeWidth={1.75}
                        className="mb-3 opacity-30"
                      />
                      <p className="text-sm font-medium">Nenhum resultado</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((emp) => (
                  <EmployeeRow
                    key={emp.id}
                    employee={emp}
                    onView={setSelected}
                    onEdit={(e) => setSelected(e)}
                  />
                ))
              )}
            </TableBody>
          </Table>
        )}

        {/* ── Pagination */}
        {data && (
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* ── Create Modal */}
      {showCreate && (
        <CreateEmployeeModal
          onClose={() => setShowCreate(false)}
          onSuccess={refetch}
        />
      )}

      {/* ── Quick Preview Drawer */}
      {selected && (
        <EmployeeDrawer employee={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

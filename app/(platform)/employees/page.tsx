'use client';

// ─── app/(dashboard)/employees/page.tsx ──────────────────────────────────────
// INNOVA — Módulo de Colaboradores
//
// Container: gere estado de UI (view/página/filtros/modais) e liga os dados
// já separados em hooks/useEmployees.ts (useEmployees/useHeadcount) à
// apresentação, agora repartida em components/employees/. Ver memory
// project_innova_component_separation_audit.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Download,
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
import { CreateEmployeeModal } from '@/components/employees/CreateEmployeeModal';
import { EmployeeCard } from '@/components/employees/EmployeeCard';
import { EmployeeDrawer } from '@/components/employees/EmployeeDrawer';
import { EmployeeRow } from '@/components/employees/EmployeeRow';
import { FilterPanel } from '@/components/employees/FilterPanel';
import { KpiCard } from '@/components/employees/KpiCard';
import { Pagination } from '@/components/employees/Pagination';
import { SkeletonCard } from '@/components/employees/SkeletonCard';

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
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* ── Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Colaboradores</h1>
              <p className="text-sm text-gray-500">
                {stats
                  ? `${stats.total} ativos`
                  : 'Gestão de pessoas e talentos'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Download size={15} /> Exportar
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
              >
                <UserPlus size={15} /> Novo Colaborador
              </button>
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
              icon={Users}
              color="blue"
              trend={`+${stats.recentHires} este mês`}
            />
            {stats.byStatus?.find((s) => s.status === 'ON_LEAVE') && (
              <KpiCard
                label="Afastados"
                value={
                  stats.byStatus.find((s) => s.status === 'ON_LEAVE')?._count ??
                  0
                }
                icon={AlertCircle}
                color="amber"
              />
            )}
            <KpiCard
              label="Departamentos"
              value={stats.byDepartment?.length ?? '—'}
              icon={Building2}
              color="violet"
            />
            <KpiCard
              label="Admissões Recentes"
              value={stats.recentHires ?? 0}
              icon={UserPlus}
              color="emerald"
              trend="últimos 30 dias"
            />
          </div>
        )}

        {/* ── Toolbar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              placeholder="Buscar por nome, e-mail, matrícula, cargo..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
            {filters.search && (
              <button
                onClick={() => updateFilters({ search: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm border rounded-xl transition-colors shadow-sm ${
                showFilters || activeFilterCount > 0
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal size={15} />
              Filtros
              {activeFilterCount > 0 && (
                <span className="bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
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

          <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <button
              onClick={() => setView('grid')}
              className={`p-2.5 transition-colors ${view === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <rect
                  x="1"
                  y="1"
                  width="5.5"
                  height="5.5"
                  rx="1"
                  fill="currentColor"
                />
                <rect
                  x="8.5"
                  y="1"
                  width="5.5"
                  height="5.5"
                  rx="1"
                  fill="currentColor"
                />
                <rect
                  x="1"
                  y="8.5"
                  width="5.5"
                  height="5.5"
                  rx="1"
                  fill="currentColor"
                />
                <rect
                  x="8.5"
                  y="8.5"
                  width="5.5"
                  height="5.5"
                  rx="1"
                  fill="currentColor"
                />
              </svg>
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2.5 transition-colors ${view === 'list' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <rect
                  x="1"
                  y="2"
                  width="13"
                  height="2"
                  rx="1"
                  fill="currentColor"
                />
                <rect
                  x="1"
                  y="6.5"
                  width="13"
                  height="2"
                  rx="1"
                  fill="currentColor"
                />
                <rect
                  x="1"
                  y="11"
                  width="13"
                  height="2"
                  rx="1"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>

          <button
            onClick={() => refetch()}
            className="p-2.5 text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <RefreshCcw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* ── Result count */}
        {data && !loading && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-900">
                {data.meta.total}
              </span>{' '}
              colaboradores encontrados
            </p>
            {data.meta.total > 0 && (
              <p className="text-xs text-gray-400">
                Página {data.meta.page} de {data.meta.totalPages}
              </p>
            )}
          </div>
        )}

        {/* ── Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700">
            <AlertCircle size={18} className="flex-shrink-0" />
            <div>
              <p className="font-medium">Erro ao carregar colaboradores</p>
              <p className="text-xs text-red-500 mt-0.5">{error}</p>
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
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))
              : data?.data.map((emp) => (
                  <EmployeeCard
                    key={emp.id}
                    employee={emp}
                    onView={setSelected}
                    onEdit={(e) => setSelected(e)} // edição abre o perfil; navegação dedicada a definir
                  />
                ))}
            {!loading && data?.data.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                <Users size={48} className="mb-4 opacity-30" />
                <p className="text-lg font-medium">
                  Nenhum colaborador encontrado
                </p>
                <p className="text-sm mt-1">
                  Tente ajustar os filtros ou adicione um novo colaborador
                </p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-4 flex items-center gap-2 px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
                >
                  <UserPlus size={15} /> Adicionar Colaborador
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── List View */}
        {view === 'list' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-100">
                    {[
                      'Colaborador',
                      'Cargo / Depto',
                      'Localidade',
                      'Senioridade',
                      'Status',
                      'Admissão',
                      '',
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i}>
                          {Array.from({ length: 7 }).map((_, j) => (
                            <td key={j} className="px-4 py-3">
                              <div
                                className="h-4 bg-gray-100 rounded animate-pulse"
                                style={{ width: j === 0 ? '140px' : '80px' }}
                              />
                            </td>
                          ))}
                        </tr>
                      ))
                    : data?.data.map((emp) => (
                        <EmployeeRow
                          key={emp.id}
                          employee={emp}
                          onView={setSelected}
                          onEdit={(e) => setSelected(e)}
                        />
                      ))}
                </tbody>
              </table>
              {!loading && data?.data.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Users size={40} className="mb-3 opacity-30" />
                  <p className="text-sm font-medium">Nenhum resultado</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Pagination */}
        {data && (
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            onPage={setPage}
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

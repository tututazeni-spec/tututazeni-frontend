'use client';

import { useState, useId } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { useUserProfile, type ProfileTab } from '@/hooks/useUserProfile';
import { useDebounce } from '@/hooks/useDebounce';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { useFormValidation } from '@/hooks/useFormValidation';
import {
  email as emailValidator,
  required as requiredRule,
} from '@/lib/validation';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar, MetricCard, Skeleton } from '@/components/users/shared';
import {
  ACCOUNT_STATUS_MAP,
  HR_STATUS_MAP,
  type AccountStatus,
  type HrStatus,
  type User,
  type UserStats,
} from '@/components/users/types';
import { UserProfileView as UserProfileDetailView } from '@/components/users/UserProfileView';

// ─── Types ────────────────────────────────────────────────────────────────────
// AccountStatus/HrStatus/User/UserStats/AuditLogEntry/TeamMember/TeamResponse
// e os mapas de badge vivem em components/users/types.ts (partilhados com
// UserProfileView/TeamView).

interface DirectoryUser {
  id: number;
  fullName: string;
  avatarUrl: string | null;
  email?: string;
  position?: { name: string } | null;
  department?: { name: string } | null;
}

interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AdminDashboard {
  users: {
    total: number;
    active: number;
    inactive: number;
    pending: number;
    suspended: number;
  };
  byDepartment: Array<{ id: number; name: string; count: number }>;
}

type View = 'list' | 'detail' | 'create' | 'dashboard' | 'directory';

// Avatar/Skeleton/MetricCard vivem em components/users/shared.tsx.

// ─── View: User List ──────────────────────────────────────────────────────────

interface UserListViewProps {
  onSelect: (id: number) => void;
  onCreate: () => void;
}

function UserListView({ onSelect, onCreate }: UserListViewProps) {
  // Um só objecto para os filtros + page: mudar qualquer filtro repõe a
  // página a 1 automaticamente, em vez de cada handler repetir setPage(1).
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    hrStatus: '',
    page: 1,
  });
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState('');

  function updateFilters(patch: Partial<Omit<typeof filters, 'page'>>) {
    setFilters((f) => ({ ...f, ...patch, page: 1 }));
  }
  function goToPage(delta: number) {
    setFilters((f) => ({ ...f, page: f.page + delta }));
  }

  const debouncedSearch = useDebounce(filters.search);
  const params = {
    page: filters.page,
    limit: 20,
    search: debouncedSearch,
    accountStatus: filters.status,
    hrStatus: filters.hrStatus,
  };

  const {
    data,
    isLoading: loading,
    error,
  } = useApiQuery<PaginatedUsers>(queryKeys.users.list(params), '/users', {
    params,
    staleTime: STALE_TIME.DYNAMIC,
    placeholderData: keepPreviousData,
  });

  // Bulk action como mutação: ao concluir, invalida as listas de utilizadores.
  const bulk = useApiMutation(
    () =>
      apiClient.post('/users/bulk-action', {
        userIds: selected,
        action: bulkAction,
      }),
    {
      invalidateKeys: [queryKeys.users.lists()],
      onSuccess: () => {
        setSelected([]);
        setBulkAction('');
      },
      onError: (e) => alert(e.message),
    },
  );

  const handleBulkAction = () => {
    if (!bulkAction || selected.length === 0) return;
    bulk.mutate(undefined);
  };
  const bulkLoading = bulk.isPending;

  const toggleSelect = (id: number) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="text"
          placeholder="Pesquisar por nome, email, nº funcionário…"
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          className="flex-1 min-w-[200px] text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filters.status}
          onChange={(e) => updateFilters({ status: e.target.value })}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os estados</option>
          <option value="ACTIVE">Activo</option>
          <option value="PENDING">Pendente</option>
          <option value="SUSPENDED">Suspenso</option>
          <option value="INACTIVE">Inactivo</option>
        </select>
        <select
          value={filters.hrStatus}
          onChange={(e) => updateFilters({ hrStatus: e.target.value })}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Estado RH: Todos</option>
          <option value="ACTIVE">Activo</option>
          <option value="ON_LEAVE">Em licença</option>
          <option value="TERMINATED">Desligado</option>
        </select>
        <span className="text-sm text-gray-400">
          {data?.total ?? 0} utilizadores
        </span>
      </div>

      {/* Bulk actions */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl">
          <span className="text-sm font-medium text-blue-700">
            {selected.length} seleccionados
          </span>
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="text-sm border border-blue-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none"
          >
            <option value="">Escolher acção…</option>
            <option value="activate">Activar</option>
            <option value="deactivate">Desactivar</option>
            <option value="suspend">Suspender</option>
          </select>
          <button
            onClick={handleBulkAction}
            disabled={!bulkAction || bulkLoading}
            className="px-3 py-1.5 bg-blue-700 text-white text-xs font-medium rounded-lg disabled:opacity-50"
          >
            {bulkLoading ? 'A aplicar…' : 'Aplicar'}
          </button>
          <button
            onClick={() => setSelected([])}
            className="text-xs text-blue-600 ml-auto"
          >
            Limpar selecção
          </button>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[32px_1fr_160px_140px_130px_100px_80px] gap-3 px-4 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
          <div />
          <div>Utilizador</div>
          <div>Cargo</div>
          <div>Departamento</div>
          <div>Estado conta</div>
          <div>Estado RH</div>
          <div>Acções</div>
        </div>

        {loading && (
          <div className="p-4">
            <Skeleton />
          </div>
        )}
        {error && (
          <div className="px-4 py-8 text-center text-sm text-red-500">
            {error.message}
          </div>
        )}
        {!loading && data?.data.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-gray-400">
            Nenhum utilizador encontrado
          </div>
        )}

        {!loading &&
          data?.data.map((user) => (
            <div
              key={user.id}
              className="grid grid-cols-[32px_1fr_160px_140px_130px_100px_80px] gap-3 items-center px-4 py-3 border-b border-gray-100 hover:bg-gray-50 last:border-0 transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.includes(user.id)}
                onChange={() => toggleSelect(user.id)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => onSelect(user.id)}
              >
                <Avatar user={user} size="sm" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {user.fullName}
                  </div>
                  <div className="text-xs text-gray-400">{user.email}</div>
                  {user.employeeNumber && (
                    <div className="text-xs font-mono text-gray-300">
                      {user.employeeNumber}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {user.position?.name ?? '—'}
              </div>
              <div className="text-xs text-gray-500">
                {user.department?.name ?? '—'}
              </div>
              <div>
                <StatusBadge
                  value={user.accountStatus}
                  map={ACCOUNT_STATUS_MAP}
                  variant="dot"
                />
              </div>
              <div>
                <StatusBadge value={user.hrStatus} map={HR_STATUS_MAP} />
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => onSelect(user.id)}
                  className="w-7 h-7 border border-gray-200 rounded-lg text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-700 flex items-center justify-center"
                  title="Ver perfil"
                >
                  →
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* Paginação */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-gray-400">
            Página {data.page} de {data.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={filters.page === 1}
              onClick={() => goToPage(-1)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              ← Anterior
            </button>
            <button
              disabled={filters.page === data.totalPages}
              onClick={() => goToPage(1)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Próxima →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── View: User Profile Detail ────────────────────────────────────────────────

// Container: useUserProfile trata as 3 queries + mutação de acção; a
// apresentação (header, tabs, TeamView) vive em
// components/users/UserProfileView.tsx.
interface UserProfileViewProps {
  userId: number;
  onBack: () => void;
}

function UserProfileView({ userId, onBack }: UserProfileViewProps) {
  const [tab, setTab] = useState<ProfileTab>('overview');
  const { user, loadingUser, stats, auditLogs, actionLoading, handleAction } =
    useUserProfile(userId, tab);

  return (
    <UserProfileDetailView
      userId={userId}
      onBack={onBack}
      tab={tab}
      onTabChange={setTab}
      user={user}
      loadingUser={loadingUser}
      stats={stats}
      auditLogs={auditLogs}
      actionLoading={actionLoading}
      onAction={handleAction}
    />
  );
}

// ─── View: Create User ────────────────────────────────────────────────────────

interface CreateUserViewProps {
  onBack: () => void;
  onCreated: () => void;
}

function CreateUserView({ onBack, onCreated }: CreateUserViewProps) {
  const {
    values: form,
    setField,
    errorMessage: validationError,
    handleSubmit: withValidation,
  } = useFormValidation(
    {
      fullName: '',
      email: '',
      password: '',
      employeeNumber: '',
      phone: '',
      departmentId: '',
      positionId: '',
      hireDate: '',
      accountStatus: 'PENDING',
    },
    {
      fullName: [requiredRule()],
      email: [requiredRule(), emailValidator()],
    },
  );
  const [submitError, setSubmitError] = useState('');
  const error = validationError || submitError;

  const handle =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setField(k, e.target.value);

  const create = useApiMutation(
    () =>
      apiClient.post('/users', {
        ...form,
        departmentId: form.departmentId
          ? parseInt(form.departmentId)
          : undefined,
        positionId: form.positionId ? parseInt(form.positionId) : undefined,
        hireDate: form.hireDate || undefined,
        password: form.password || undefined,
      }),
    {
      invalidateKeys: [queryKeys.users.lists()],
      onSuccess: () => onCreated(),
      onError: (e) => setSubmitError(e.message),
    },
  );
  const saving = create.isPending;

  const handleSubmit = withValidation(() => {
    setSubmitError('');
    create.mutate(undefined);
  });

  interface FieldProps {
    label: string;
    id: keyof typeof form;
    type?: string;
    required?: boolean;
  }

  const Field = ({
    label,
    id,
    type = 'text',
    required = false,
  }: FieldProps) => {
    const fieldId = useId();
    return (
      <div>
        <label
          htmlFor={fieldId}
          className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5"
        >
          {label}
          {required && ' *'}
        </label>
        <input
          id={fieldId}
          type={type}
          value={form[id]}
          onChange={handle(id)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    );
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5"
      >
        ← Cancelar
      </button>
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="text-base font-semibold text-gray-900 mb-5">
          Novo colaborador
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-5 mb-6">
          <div className="col-span-2">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3 pb-2 border-b border-gray-100">
              Dados básicos
            </div>
          </div>
          <Field label="Nome completo" id="fullName" required />
          <Field label="Email" id="email" type="email" required />
          <Field label="Password provisória" id="password" type="password" />
          <Field label="Nº funcionário" id="employeeNumber" />
          <Field label="Telefone" id="phone" type="tel" />
          <Field label="Data de admissão" id="hireDate" type="date" />

          <div className="col-span-2 mt-2">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3 pb-2 border-b border-gray-100">
              Organização
            </div>
          </div>
          <Field label="ID Departamento" id="departmentId" type="number" />
          <Field label="ID Cargo / Posição" id="positionId" type="number" />

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
              Estado inicial
            </label>
            <select
              value={form.accountStatus}
              onChange={handle('accountStatus')}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PENDING">Pendente (convite enviado)</option>
              <option value="ACTIVE">Activo</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2.5 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 disabled:opacity-50"
          >
            {saving ? 'A criar…' : 'Criar colaborador'}
          </button>
          <button
            onClick={onBack}
            className="px-5 py-2.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── View: Admin Dashboard ────────────────────────────────────────────────────

function DashboardView() {
  const { data, isLoading } = useApiQuery<AdminDashboard>(
    queryKeys.users.adminDashboard(),
    '/users/admin/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={3} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-5 gap-3">
        <MetricCard label="Total colaboradores" value={data.users.total} />
        <MetricCard
          label="Activos"
          value={data.users.active}
          color="text-emerald-600"
        />
        <MetricCard label="Inactivos" value={data.users.inactive} />
        <MetricCard
          label="Pendentes"
          value={data.users.pending}
          color="text-blue-600"
        />
        <MetricCard
          label="Suspensos"
          value={data.users.suspended}
          color={data.users.suspended > 0 ? 'text-amber-600' : undefined}
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
          Distribuição por departamento
        </div>
        {data.byDepartment.map((dept) => {
          const max = data.byDepartment[0]?.count ?? 1;
          const pct = Math.round((dept.count / max) * 100);
          return (
            <div
              key={dept.id}
              className="flex items-center gap-4 px-4 py-2.5 border-b border-gray-100 last:border-0"
            >
              <div className="w-36 text-xs text-gray-700 truncate">
                {dept.name}
              </div>
              <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="w-12 text-right text-xs font-mono text-gray-500">
                {dept.count}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── View: Internal Directory ─────────────────────────────────────────────────

interface DirectoryViewProps {
  onSelect: (id: number) => void;
}

function DirectoryView({ onSelect }: DirectoryViewProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);

  const { data = [], isLoading: loading } = useApiQuery<DirectoryUser[]>(
    queryKeys.users.directory(debouncedSearch),
    '/users/directory',
    {
      params: { search: debouncedSearch },
      staleTime: STALE_TIME.SEMI_STATIC,
      placeholderData: keepPreviousData,
    },
  );

  return (
    <div>
      <input
        type="text"
        placeholder="Pesquisar colaborador, cargo, departamento…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
      />
      {loading ? (
        <Skeleton />
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {data.map((user) => (
            <div
              key={user.id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
              onClick={() => onSelect(user.id)}
            >
              <Avatar user={user} size="md" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {user.fullName}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {user.position?.name ?? '—'}
                </div>
                <div className="text-xs text-gray-400 truncate">
                  {user.department?.name ?? '—'}
                </div>
                {user.email && (
                  <div className="text-xs text-blue-600 truncate">
                    {user.email}
                  </div>
                )}
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <div className="col-span-3 py-12 text-center text-sm text-gray-400">
              Nenhum colaborador encontrado
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page principal ───────────────────────────────────────────────────────────

const NAV: Array<{ id: Exclude<View, 'detail' | 'create'>; label: string }> = [
  { id: 'list', label: 'Utilizadores' },
  { id: 'directory', label: 'Diretório' },
  { id: 'dashboard', label: 'Dashboard' },
];

const TITLES: Record<View, string> = {
  list: 'Gestão de Utilizadores',
  detail: 'Perfil do Colaborador',
  create: 'Novo Colaborador',
  dashboard: 'Dashboard de RH',
  directory: 'Diretório Interno',
};

// view e selectedId eram dois useState separados sempre definidos em conjunto
// — um único estado torna "detail sem id" irrepresentável.
type Nav =
  { view: Exclude<View, 'detail'> } | { view: 'detail'; selectedId: number };

export default function UsersPage() {
  const [nav, setNav] = useState<Nav>({ view: 'list' });

  const handleSelect = (id: number) =>
    setNav({ view: 'detail', selectedId: id });
  const handleBack = () => setNav({ view: 'list' });
  const handleCreate = () => setNav({ view: 'create' });
  const handleCreated = () => setNav({ view: 'list' });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {TITLES[nav.view]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            INNOVA — Recursos Humanos
          </p>
        </div>
        {nav.view === 'list' && (
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800"
            >
              + Novo colaborador
            </button>
            <button
              onClick={() => alert('Abrir modal de importação CSV/Excel')}
              className="px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50"
            >
              ⬆ Importar
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      {nav.view !== 'detail' && nav.view !== 'create' && (
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setNav({ view: n.id })}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                nav.view === n.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
      )}

      {nav.view === 'list' && (
        <UserListView onSelect={handleSelect} onCreate={handleCreate} />
      )}
      {nav.view === 'detail' && (
        <UserProfileView userId={nav.selectedId} onBack={handleBack} />
      )}
      {nav.view === 'create' && (
        <CreateUserView onBack={handleBack} onCreated={handleCreated} />
      )}
      {nav.view === 'dashboard' && <DashboardView />}
      {nav.view === 'directory' && <DirectoryView onSelect={handleSelect} />}
    </div>
  );
}

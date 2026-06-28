
'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import Image from 'next/image';

// ─── Types ────────────────────────────────────────────────────────────────────

type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BLOCKED' | 'PENDING';
type HrStatus      = 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';

interface User {
  id: number;
  fullName: string;
  email: string;
  employeeNumber: string | null;
  phone: string | null;
  avatarUrl: string | null;
  country: string | null;
  city: string | null;
  language: string | null;
  active: boolean;
  accountStatus: AccountStatus;
  hrStatus: HrStatus;
  hireDate: string | null;
  createdAt: string;
  role: { id: number; name: string } | null;
  department: { id: number; name: string; code: string } | null;
  position: { id: number; name: string; level: string | null } | null;
  manager: { id: number; fullName: string; avatarUrl: string | null } | null;
  profile: { bio: string | null; interests: string[]; careerGoals: string | null } | null;
  points: { points: number } | null;
  _count?: { enrollments: number; certificates: number; badgeAwards: number };
}

interface UserStats {
  userId: number;
  enrollments: { total: number; completed: number; inProgress: number; overdue: number };
  completionRate: number;
  gamification: { points: number; badges: number };
  competencies: number;
  recentActivity: any[];
}

interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AdminDashboard {
  users: { total: number; active: number; inactive: number; pending: number; suspended: number };
  byDepartment: Array<{ id: number; name: string; count: number }>;
}

type View = 'list' | 'detail' | 'create' | 'dashboard' | 'directory';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

// ─── Badge components ─────────────────────────────────────────────────────────

function AccountBadge({ status }: { status: AccountStatus }) {
  const cfg: Record<AccountStatus, { label: string; cls: string }> = {
    ACTIVE:    { label: 'Activo',    cls: 'bg-emerald-50 text-emerald-700' },
    INACTIVE:  { label: 'Inactivo', cls: 'bg-gray-100 text-gray-500' },
    SUSPENDED: { label: 'Suspenso', cls: 'bg-amber-50 text-amber-700' },
    BLOCKED:   { label: 'Bloqueado',cls: 'bg-red-50 text-red-700' },
    PENDING:   { label: 'Pendente', cls: 'bg-blue-50 text-blue-700' },
  };
  const { label, cls } = cfg[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />{label}
    </span>
  );
}

function HrBadge({ status }: { status: HrStatus }) {
  const cfg: Record<HrStatus, { label: string; cls: string }> = {
    ACTIVE:     { label: 'Activo',      cls: 'bg-emerald-50 text-emerald-700' },
    ON_LEAVE:   { label: 'Em licença',  cls: 'bg-amber-50 text-amber-700' },
    TERMINATED: { label: 'Desligado',   cls: 'bg-red-50 text-red-600' },
  };
  const { label, cls } = cfg[status];
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>;
}

function Avatar({ user, size = 'sm' }: { user: Pick<User, 'fullName' | 'avatarUrl'>; size?: 'sm' | 'md' | 'lg' }) {
  const dim = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-xl' }[size];
  return user.avatarUrl ? (
    <div className={`${dim} rounded-full overflow-hidden relative flex-shrink-0`}>
      <Image src={user.avatarUrl} alt={user.fullName} fill className="object-cover" />
    </div>
  ) : (
    <div className={`${dim} rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold flex-shrink-0`}>
      {initials(user.fullName)}
    </div>
  );
}

function Skeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}
    </div>
  );
}

function MetricCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color?: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className={`text-2xl font-semibold font-mono ${color ?? 'text-gray-900'}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

// ─── View: User List ──────────────────────────────────────────────────────────

function UserListView({
  onSelect,
  onCreate,
}: {
  onSelect: (id: number) => void;
  onCreate: () => void;
}) {
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState('');
  const [hrStatus, setHrStatus] = useState('');
  const [page, setPage]         = useState(1);
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState('');

  const debouncedSearch = useDebounce(search);
  const params = {
    page, limit: 20,
    search: debouncedSearch,
    accountStatus: status,
    hrStatus,
  };

  const { data, isLoading: loading, error } = useApiQuery<PaginatedUsers>(
    queryKeys.users.list(params), '/users',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );

  // Bulk action como mutação: ao concluir, invalida as listas de utilizadores.
  const bulk = useApiMutation(
    () => apiClient.post('/users/bulk-action', { userIds: selected, action: bulkAction }),
    {
      invalidateKeys: [queryKeys.users.lists()],
      onSuccess: () => { setSelected([]); setBulkAction(''); },
      onError: (e) => alert(e.message),
    },
  );

  const handleBulkAction = () => {
    if (!bulkAction || selected.length === 0) return;
    bulk.mutate(undefined);
  };
  const bulkLoading = bulk.isPending;

  const toggleSelect = (id: number) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="text"
          placeholder="Pesquisar por nome, email, nº funcionário…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-[200px] text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos os estados</option>
          <option value="ACTIVE">Activo</option>
          <option value="PENDING">Pendente</option>
          <option value="SUSPENDED">Suspenso</option>
          <option value="INACTIVE">Inactivo</option>
        </select>
        <select value={hrStatus} onChange={e => { setHrStatus(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Estado RH: Todos</option>
          <option value="ACTIVE">Activo</option>
          <option value="ON_LEAVE">Em licença</option>
          <option value="TERMINATED">Desligado</option>
        </select>
        <span className="text-sm text-gray-400">{data?.total ?? 0} utilizadores</span>
      </div>

      {/* Bulk actions */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl">
          <span className="text-sm font-medium text-blue-700">{selected.length} seleccionados</span>
          <select
            value={bulkAction}
            onChange={e => setBulkAction(e.target.value)}
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
          <button onClick={() => setSelected([])} className="text-xs text-blue-600 ml-auto">
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

        {loading && <div className="p-4"><Skeleton /></div>}
        {error    && <div className="px-4 py-8 text-center text-sm text-red-500">{error.message}</div>}
        {!loading && data?.data.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-gray-400">Nenhum utilizador encontrado</div>
        )}

        {!loading && data?.data.map(user => (
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
                <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                <div className="text-xs text-gray-400">{user.email}</div>
                {user.employeeNumber && (
                  <div className="text-xs font-mono text-gray-300">{user.employeeNumber}</div>
                )}
              </div>
            </div>
            <div className="text-xs text-gray-500">{user.position?.name ?? '—'}</div>
            <div className="text-xs text-gray-500">{user.department?.name ?? '—'}</div>
            <div><AccountBadge status={user.accountStatus} /></div>
            <div><HrBadge status={user.hrStatus} /></div>
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
          <span className="text-xs text-gray-400">Página {data.page} de {data.totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
              ← Anterior
            </button>
            <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
              Próxima →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── View: User Profile Detail ────────────────────────────────────────────────

function UserProfileView({ userId, onBack }: { userId: number; onBack: () => void }) {
  const [tab, setTab] = useState<'overview' | 'learning' | 'team' | 'audit'>('overview');

  // user e stats correm em paralelo (sem waterfall).
  const { data: user, isLoading: loadingUser } = useApiQuery<User>(
    queryKeys.users.detail(userId), `/users/${userId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const { data: stats } = useApiQuery<UserStats>(
    queryKeys.users.stats(userId), `/users/${userId}/stats`,
    { staleTime: STALE_TIME.DYNAMIC },
  );
  // Auditoria só é pedida quando o separador é aberto (lazy).
  const { data: auditData } = useApiQuery<{ data: any[] }>(
    queryKeys.users.auditLogs(userId), `/users/${userId}/audit-logs`,
    { enabled: tab === 'audit', staleTime: STALE_TIME.DYNAMIC },
  );
  const auditLogs = auditData?.data ?? [];

  // Acções (activate/deactivate/suspend): invalidam detalhe + listas após sucesso.
  const action = useApiMutation(
    (act: 'activate' | 'deactivate' | 'suspend') =>
      apiClient.patch(`/users/${userId}/${act}`, {}),
    {
      invalidateKeys: [queryKeys.users.detail(userId), queryKeys.users.lists()],
      onError: (e) => alert(e.message),
    },
  );
  const actionLoading = action.isPending;

  const handleAction = (act: 'activate' | 'deactivate' | 'suspend') => {
    if (!confirm(`${act} este utilizador?`)) return;
    action.mutate(act);
  };

  if (loadingUser || !user) return <div><Skeleton rows={6} /></div>;

  const tabs: Array<{ id: typeof tab; label: string }> = [
    { id: 'overview', label: 'Visão geral' },
    { id: 'learning', label: 'Formação' },
    { id: 'team',     label: 'Equipa' },
    { id: 'audit',    label: 'Auditoria' },
  ];

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5">
        ← Voltar
      </button>

      {/* Profile header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
        <div className="flex items-start gap-5">
          <Avatar user={user} size="lg" />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h2 className="text-xl font-semibold text-gray-900">{user.fullName}</h2>
              <AccountBadge status={user.accountStatus} />
              <HrBadge status={user.hrStatus} />
            </div>
            <div className="text-sm text-gray-500 mb-2">{user.email}</div>
            <div className="flex flex-wrap gap-4 text-xs text-gray-400">
              {user.employeeNumber && <span className="font-mono">{user.employeeNumber}</span>}
              {user.position && <span>{user.position.name}</span>}
              {user.department && <span>{user.department.name}</span>}
              {user.city && user.country && <span>{user.city}, {user.country}</span>}
              {user.hireDate && <span>Admissão: {fmtDate(user.hireDate)}</span>}
            </div>
            {user.manager && (
              <div className="flex items-center gap-2 mt-2">
                <Avatar user={user.manager} size="sm" />
                <span className="text-xs text-gray-500">Gestor: <strong>{user.manager.fullName}</strong></span>
              </div>
            )}
          </div>

          {/* Acções */}
          <div className="flex flex-col gap-2">
            {user.accountStatus === 'ACTIVE' && (
              <button
                onClick={() => handleAction('deactivate')}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Desactivar
              </button>
            )}
            {user.accountStatus !== 'ACTIVE' && (
              <button
                onClick={() => handleAction('activate')}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 disabled:opacity-50"
              >
                Activar
              </button>
            )}
            {user.accountStatus === 'ACTIVE' && (
              <button
                onClick={() => handleAction('suspend')}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 disabled:opacity-50"
              >
                Suspender
              </button>
            )}
          </div>
        </div>

        {/* Bio */}
        {user.profile?.bio && (
          <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
            {user.profile.bio}
          </div>
        )}

        {/* Tags de interesses */}
        {user.profile?.interests && user.profile.interests.length > 0 && (
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {user.profile.interests.map((i, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded">{i}</span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && stats && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-3">
            <MetricCard label="Matrículas"     value={stats.enrollments.total}   />
            <MetricCard label="Concluídos"     value={stats.enrollments.completed} color="text-emerald-600" />
            <MetricCard label="Taxa conclusão" value={`${stats.completionRate}%`} color="text-blue-600" />
            <MetricCard label="Pontos"         value={stats.gamification.points}  sub={`${stats.gamification.badges} badges`} />
          </div>
          {stats.enrollments.overdue > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
              ⚠ <strong>{stats.enrollments.overdue}</strong> curso(s) com deadline expirado
            </div>
          )}

          {/* Info pessoal e organizacional */}
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Dados pessoais</div>
              {[
                ['Email',    user.email],
                ['Telefone', user.phone ?? '—'],
                ['País',     user.country ?? '—'],
                ['Cidade',   user.city ?? '—'],
                ['Idioma',   user.language ?? '—'],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
                  <span className="text-xs text-gray-500">{l}</span>
                  <span className="text-xs font-medium text-gray-900">{v}</span>
                </div>
              ))}
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Organização</div>
              {[
                ['Departamento', user.department?.name ?? '—'],
                ['Cargo',        user.position?.name  ?? '—'],
                ['Unidade',      '—'],
                ['Admissão',     fmtDate(user.hireDate)],
                ['Role sistema', user.role?.name ?? '—'],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
                  <span className="text-xs text-gray-500">{l}</span>
                  <span className="text-xs font-medium text-gray-900">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Learning tab */}
      {tab === 'learning' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="Em progresso" value={stats.enrollments.inProgress} color="text-blue-600" />
            <MetricCard label="Concluídos"   value={stats.enrollments.completed}  color="text-emerald-600" />
            <MetricCard label="Badges"       value={stats.gamification.badges} />
          </div>
          {stats.recentActivity.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
                Actividade recente
              </div>
              {stats.recentActivity.map((e: any) => (
                <div key={e.id} className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                    {e.course?.thumbnailUrl ? (
                      <Image src={e.course.thumbnailUrl} alt="" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">📚</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-900">{e.course?.title}</div>
                    <div className="text-xs text-gray-400">{e.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Team tab */}
      {tab === 'team' && (
        <TeamView managerId={userId} />
      )}

      {/* Audit tab */}
      {tab === 'audit' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_160px_200px] gap-3 px-4 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            <div>Acção</div><div>Por</div><div>Data</div>
          </div>
          {auditLogs.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">Sem logs de auditoria</div>
          ) : (
            auditLogs.map((log: any) => (
              <div key={log.id} className="grid grid-cols-[1fr_160px_200px] gap-3 items-center px-4 py-3 border-b border-gray-100 last:border-0">
                <div>
                  <div className="text-xs font-medium font-mono text-gray-700">{log.action}</div>
                  {log.meta && <div className="text-xs text-gray-400">{log.meta}</div>}
                </div>
                <div className="text-xs text-gray-500">{log.performedBy?.fullName ?? '—'}</div>
                <div className="text-xs text-gray-400">{fmtDate(log.createdAt)}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── View: Team ───────────────────────────────────────────────────────────────

function TeamView({ managerId }: { managerId: number }) {
  const { data, isLoading: loading } = useApiQuery<any>(
    queryKeys.users.team(managerId), `/users/${managerId}/team`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (loading) return <Skeleton rows={4} />;
  if (!data || data.team.length === 0) return (
    <div className="py-8 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
      Sem subordinados directos
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="grid grid-cols-[1fr_100px_100px_100px_100px] gap-3 px-4 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
        <div>Colaborador</div>
        <div>Concluídos</div>
        <div>Em curso</div>
        <div>Atrasos</div>
        <div>Estado</div>
      </div>
      {data.team.map((member: any) => (
        <div key={member.id} className="grid grid-cols-[1fr_100px_100px_100px_100px] gap-3 items-center px-4 py-3 border-b border-gray-100 last:border-0">
          <div className="flex items-center gap-3">
            <Avatar user={member} size="sm" />
            <div>
              <div className="text-sm font-medium text-gray-900">{member.fullName}</div>
              <div className="text-xs text-gray-400">{member.position?.name ?? '—'}</div>
            </div>
          </div>
          <div className="text-sm text-emerald-600 font-mono">{member.learningStats.completed}</div>
          <div className="text-sm text-blue-600 font-mono">{member.learningStats.inProgress}</div>
          <div className={`text-sm font-mono ${member.learningStats.overdue > 0 ? 'text-red-600' : 'text-gray-400'}`}>
            {member.learningStats.overdue}
          </div>
          <div><AccountBadge status={member.accountStatus} /></div>
        </div>
      ))}
    </div>
  );
}

// ─── View: Create User ────────────────────────────────────────────────────────

function CreateUserView({ onBack, onCreated }: { onBack: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', employeeNumber: '',
    phone: '', departmentId: '', positionId: '', hireDate: '',
    accountStatus: 'PENDING',
  });

  const handle = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const create = useApiMutation(
    () => apiClient.post('/users', {
      ...form,
      departmentId: form.departmentId ? parseInt(form.departmentId) : undefined,
      positionId:   form.positionId   ? parseInt(form.positionId)   : undefined,
      hireDate:     form.hireDate     || undefined,
      password:     form.password     || undefined,
    }),
    {
      invalidateKeys: [queryKeys.users.lists()],
      onSuccess: () => onCreated(),
      onError: (e) => alert(e.message),
    },
  );
  const saving = create.isPending;

  const handleSubmit = () => {
    if (!form.fullName || !form.email) return;
    create.mutate(undefined);
  };

  const Field = ({ label, id, type = 'text', required = false }: {
    label: string; id: keyof typeof form; type?: string; required?: boolean;
  }) => (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">{label}{required && ' *'}</label>
      <input
        type={type}
        value={form[id]}
        onChange={handle(id)}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5">
        ← Cancelar
      </button>
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="text-base font-semibold text-gray-900 mb-5">Novo colaborador</div>

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
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Estado inicial</label>
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
            disabled={!form.fullName || !form.email || saving}
            className="px-5 py-2.5 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 disabled:opacity-50"
          >
            {saving ? 'A criar…' : 'Criar colaborador'}
          </button>
          <button onClick={onBack} className="px-5 py-2.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
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
    queryKeys.users.adminDashboard(), '/users/admin/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={3} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-5 gap-3">
        <MetricCard label="Total colaboradores"  value={data.users.total} />
        <MetricCard label="Activos"              value={data.users.active}    color="text-emerald-600" />
        <MetricCard label="Inactivos"            value={data.users.inactive} />
        <MetricCard label="Pendentes"            value={data.users.pending}   color="text-blue-600" />
        <MetricCard label="Suspensos"            value={data.users.suspended} color={data.users.suspended > 0 ? 'text-amber-600' : undefined} />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
          Distribuição por departamento
        </div>
        {data.byDepartment.map(dept => {
          const max = data.byDepartment[0]?.count ?? 1;
          const pct = Math.round((dept.count / max) * 100);
          return (
            <div key={dept.id} className="flex items-center gap-4 px-4 py-2.5 border-b border-gray-100 last:border-0">
              <div className="w-36 text-xs text-gray-700 truncate">{dept.name}</div>
              <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                <div className="h-full bg-blue-500 rounded" style={{ width: `${pct}%` }} />
              </div>
              <div className="w-12 text-right text-xs font-mono text-gray-500">{dept.count}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── View: Internal Directory ─────────────────────────────────────────────────

function DirectoryView({ onSelect }: { onSelect: (id: number) => void }) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);

  const { data = [], isLoading: loading } = useApiQuery<any[]>(
    queryKeys.users.directory(debouncedSearch), '/users/directory',
    { params: { search: debouncedSearch }, staleTime: STALE_TIME.SEMI_STATIC,
      placeholderData: keepPreviousData },
  );

  return (
    <div>
      <input
        type="text"
        placeholder="Pesquisar colaborador, cargo, departamento…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
      />
      {loading ? <Skeleton /> : (
        <div className="grid grid-cols-3 gap-3">
          {data.map((user: any) => (
            <div
              key={user.id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
              onClick={() => onSelect(user.id)}
            >
              <Avatar user={user} size="md" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{user.fullName}</div>
                <div className="text-xs text-gray-500 truncate">{user.position?.name ?? '—'}</div>
                <div className="text-xs text-gray-400 truncate">{user.department?.name ?? '—'}</div>
                {user.email && (
                  <div className="text-xs text-blue-600 truncate">{user.email}</div>
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
  { id: 'list',      label: 'Utilizadores' },
  { id: 'directory', label: 'Diretório' },
  { id: 'dashboard', label: 'Dashboard' },
];

const TITLES: Record<View, string> = {
  list:      'Gestão de Utilizadores',
  detail:    'Perfil do Colaborador',
  create:    'Novo Colaborador',
  dashboard: 'Dashboard de RH',
  directory: 'Diretório Interno',
};

export default function UsersPage() {
  const [view, setView]         = useState<View>('list');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleSelect = (id: number) => { setSelectedId(id); setView('detail'); };
  const handleBack   = () => { setSelectedId(null); setView('list'); };
  const handleCreate = () => setView('create');
  const handleCreated = () => { setView('list'); };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{TITLES[view]}</h1>
          <p className="text-sm text-gray-400 mt-0.5">INNOVA — Recursos Humanos</p>
        </div>
        {view === 'list' && (
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
      {view !== 'detail' && view !== 'create' && (
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setView(n.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === n.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
      )}

      {view === 'list'      && <UserListView onSelect={handleSelect} onCreate={handleCreate} />}
      {view === 'detail' && selectedId !== null && (
        <UserProfileView userId={selectedId} onBack={handleBack} />
      )}
      {view === 'create'    && <CreateUserView onBack={handleBack} onCreated={handleCreated} />}
      {view === 'dashboard' && <DashboardView />}
      {view === 'directory' && <DirectoryView onSelect={handleSelect} />}
    </div>
  );
}

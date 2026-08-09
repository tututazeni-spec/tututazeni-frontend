// components/users/UserProfileView.tsx
// Vista apresentacional do perfil de um utilizador — sem fetch de user/
// stats/audit-logs, sem mutação de acção (tudo isso vem do container,
// hooks/useUserProfile.ts, usado em UserProfileView dentro de
// app/(platform)/users/page.tsx). `TeamView` fica aqui porque só é usado
// no separador "Equipa" deste perfil — continua a fazer o seu próprio
// fetch (widget autónomo), tal como já fazia antes desta separação.
// Ver memory project_innova_component_separation_audit, item 3.3.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import Image from 'next/image';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { ProfileTab, UserAction } from '@/hooks/useUserProfile';
import { Avatar, MetricCard, Skeleton } from './shared';
import {
  ACCOUNT_STATUS_MAP,
  HR_STATUS_MAP,
  type AuditLogEntry,
  type TeamResponse,
  type User,
  type UserStats,
} from './types';

interface TeamViewProps {
  managerId: number;
}

function TeamView({ managerId }: TeamViewProps) {
  const { data, isLoading: loading } = useApiQuery<TeamResponse>(
    queryKeys.users.team(managerId),
    `/users/${managerId}/team`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (loading) return <Skeleton rows={4} />;
  if (!data || data.team.length === 0)
    return (
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
      {data.team.map((member) => (
        <div
          key={member.id}
          className="grid grid-cols-[1fr_100px_100px_100px_100px] gap-3 items-center px-4 py-3 border-b border-gray-100 last:border-0"
        >
          <div className="flex items-center gap-3">
            <Avatar user={member} size="sm" />
            <div>
              <div className="text-sm font-medium text-gray-900">
                {member.fullName}
              </div>
              <div className="text-xs text-gray-400">
                {member.position?.name ?? '—'}
              </div>
            </div>
          </div>
          <div className="text-sm text-emerald-600 font-mono">
            {member.learningStats.completed}
          </div>
          <div className="text-sm text-blue-600 font-mono">
            {member.learningStats.inProgress}
          </div>
          <div
            className={`text-sm font-mono ${member.learningStats.overdue > 0 ? 'text-red-600' : 'text-gray-400'}`}
          >
            {member.learningStats.overdue}
          </div>
          <div>
            <StatusBadge
              value={member.accountStatus}
              map={ACCOUNT_STATUS_MAP}
              variant="dot"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export interface UserProfileViewProps {
  userId: number;
  onBack: () => void;
  tab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  user: User | undefined;
  loadingUser: boolean;
  stats: UserStats | undefined;
  auditLogs: AuditLogEntry[];
  actionLoading: boolean;
  onAction: (action: UserAction) => void;
}

export function UserProfileView({
  userId,
  onBack,
  tab,
  onTabChange,
  user,
  loadingUser,
  stats,
  auditLogs,
  actionLoading,
  onAction,
}: UserProfileViewProps) {
  if (loadingUser || !user)
    return (
      <div>
        <Skeleton rows={6} />
      </div>
    );

  const tabs: Array<{ id: ProfileTab; label: string }> = [
    { id: 'overview', label: 'Visão geral' },
    { id: 'learning', label: 'Formação' },
    { id: 'team', label: 'Equipa' },
    { id: 'audit', label: 'Auditoria' },
  ];

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5"
      >
        ← Voltar
      </button>

      {/* Profile header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
        <div className="flex items-start gap-5">
          <Avatar user={user} size="lg" />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h2 className="text-xl font-semibold text-gray-900">
                {user.fullName}
              </h2>
              <StatusBadge
                value={user.accountStatus}
                map={ACCOUNT_STATUS_MAP}
                variant="dot"
              />
              <StatusBadge value={user.hrStatus} map={HR_STATUS_MAP} />
            </div>
            <div className="text-sm text-gray-500 mb-2">{user.email}</div>
            <div className="flex flex-wrap gap-4 text-xs text-gray-400">
              {user.employeeNumber && (
                <span className="font-mono">{user.employeeNumber}</span>
              )}
              {user.position && <span>{user.position.name}</span>}
              {user.department && <span>{user.department.name}</span>}
              {user.city && user.country && (
                <span>
                  {user.city}, {user.country}
                </span>
              )}
              {user.hireDate && <span>Admissão: {fmtDate(user.hireDate)}</span>}
            </div>
            {user.manager && (
              <div className="flex items-center gap-2 mt-2">
                <Avatar user={user.manager} size="sm" />
                <span className="text-xs text-gray-500">
                  Gestor: <strong>{user.manager.fullName}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Acções */}
          <div className="flex flex-col gap-2">
            {user.accountStatus === 'ACTIVE' && (
              <button
                onClick={() => onAction('deactivate')}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Desactivar
              </button>
            )}
            {user.accountStatus !== 'ACTIVE' && (
              <button
                onClick={() => onAction('activate')}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 disabled:opacity-50"
              >
                Activar
              </button>
            )}
            {user.accountStatus === 'ACTIVE' && (
              <button
                onClick={() => onAction('suspend')}
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
              <span
                key={idx}
                className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded"
              >
                {i}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
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
            <MetricCard label="Matrículas" value={stats.enrollments.total} />
            <MetricCard
              label="Concluídos"
              value={stats.enrollments.completed}
              color="text-emerald-600"
            />
            <MetricCard
              label="Taxa conclusão"
              value={`${stats.completionRate}%`}
              color="text-blue-600"
            />
            <MetricCard
              label="Pontos"
              value={stats.gamification.points}
              sub={`${stats.gamification.badges} badges`}
            />
          </div>
          {stats.enrollments.overdue > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
              ⚠ <strong>{stats.enrollments.overdue}</strong> curso(s) com
              deadline expirado
            </div>
          )}

          {/* Info pessoal e organizacional */}
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                Dados pessoais
              </div>
              {[
                ['Email', user.email],
                ['Telefone', user.phone ?? '—'],
                ['País', user.country ?? '—'],
                ['Cidade', user.city ?? '—'],
                ['Idioma', user.language ?? '—'],
              ].map(([l, v]) => (
                <div
                  key={l}
                  className="flex justify-between py-1.5 border-b border-gray-100 last:border-0"
                >
                  <span className="text-xs text-gray-500">{l}</span>
                  <span className="text-xs font-medium text-gray-900">{v}</span>
                </div>
              ))}
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                Organização
              </div>
              {[
                ['Departamento', user.department?.name ?? '—'],
                ['Cargo', user.position?.name ?? '—'],
                ['Unidade', '—'],
                ['Admissão', fmtDate(user.hireDate)],
                ['Role sistema', user.role?.name ?? '—'],
              ].map(([l, v]) => (
                <div
                  key={l}
                  className="flex justify-between py-1.5 border-b border-gray-100 last:border-0"
                >
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
            <MetricCard
              label="Em progresso"
              value={stats.enrollments.inProgress}
              color="text-blue-600"
            />
            <MetricCard
              label="Concluídos"
              value={stats.enrollments.completed}
              color="text-emerald-600"
            />
            <MetricCard label="Badges" value={stats.gamification.badges} />
          </div>
          {stats.recentActivity.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
                Actividade recente
              </div>
              {stats.recentActivity.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                    {e.course?.thumbnailUrl ? (
                      <Image
                        src={e.course.thumbnailUrl}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">
                        📚
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-900">
                      {e.course?.title}
                    </div>
                    <div className="text-xs text-gray-400">{e.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Team tab */}
      {tab === 'team' && <TeamView managerId={userId} />}

      {/* Audit tab */}
      {tab === 'audit' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_160px_200px] gap-3 px-4 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            <div>Acção</div>
            <div>Por</div>
            <div>Data</div>
          </div>
          {auditLogs.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              Sem logs de auditoria
            </div>
          ) : (
            auditLogs.map((log) => (
              <div
                key={log.id}
                className="grid grid-cols-[1fr_160px_200px] gap-3 items-center px-4 py-3 border-b border-gray-100 last:border-0"
              >
                <div>
                  <div className="text-xs font-medium font-mono text-gray-700">
                    {log.action}
                  </div>
                  {log.meta && (
                    <div className="text-xs text-gray-400">{log.meta}</div>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {log.performedBy?.fullName ?? '—'}
                </div>
                <div className="text-xs text-gray-400">
                  {fmtDate(log.createdAt)}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

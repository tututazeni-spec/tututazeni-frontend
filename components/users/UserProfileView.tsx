// components/users/UserProfileView.tsx
// Vista apresentacional do perfil de um utilizador — sem fetch de user/
// stats/audit-logs, sem mutação de acção (tudo isso vem do container,
// hooks/useUserProfile.ts, usado em UserProfileView dentro de
// app/(platform)/users/page.tsx). `TeamView` fica aqui porque só é usado
// no separador "Equipa" deste perfil — continua a fazer o seu próprio
// fetch (widget autónomo), tal como já fazia antes desta separação.
// Ver memory project_innova_component_separation_audit, item 3.3.

'use client';

import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Trophy,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import Image from 'next/image';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
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
import type { ProfileTab, UserAction } from '@/hooks/useUserProfile';
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

  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-2 animate-pulse"
        itemClassName="h-14 rounded-card bg-surface-sunken"
      />
    );
  if (!data || data.team.length === 0)
    return (
      <div className="py-8 text-center text-sm text-ink-faint border border-dashed border-border-strong rounded-card">
        Sem subordinados directos
      </div>
    );

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Colaborador</TableHeaderCell>
          <TableHeaderCell>Concluídos</TableHeaderCell>
          <TableHeaderCell>Em curso</TableHeaderCell>
          <TableHeaderCell>Atrasos</TableHeaderCell>
          <TableHeaderCell>Estado</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.team.map((member) => (
          <TableRow key={member.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar
                  name={member.fullName}
                  url={member.avatarUrl ?? undefined}
                  size="sm"
                />
                <div>
                  <div className="text-sm font-medium text-ink">
                    {member.fullName}
                  </div>
                  <div className="text-xs text-ink-faint">
                    {member.position?.name ?? '—'}
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-sm text-success font-mono">
              {member.learningStats.completed}
            </TableCell>
            <TableCell className="text-sm text-info font-mono">
              {member.learningStats.inProgress}
            </TableCell>
            <TableCell
              className={`text-sm font-mono ${member.learningStats.overdue > 0 ? 'text-danger' : 'text-ink-faint'}`}
            >
              {member.learningStats.overdue}
            </TableCell>
            <TableCell>
              <StatusBadge
                value={member.accountStatus}
                map={ACCOUNT_STATUS_MAP}
                variant="dot"
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
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
        <Skeleton
          rows={6}
          wrapperClassName="space-y-2 animate-pulse"
          itemClassName="h-14 rounded-card bg-surface-sunken"
        />
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
      <Button intent="ghost" size="sm" className="mb-5" onClick={onBack}>
        <ArrowLeft size={14} strokeWidth={1.75} />
        Voltar
      </Button>

      {/* Profile header */}
      <Card className="p-6 mb-5">
        <div className="flex items-start gap-5">
          <Avatar
            name={user.fullName}
            url={user.avatarUrl ?? undefined}
            size="lg"
          />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h2 className="text-xl font-semibold text-ink">
                {user.fullName}
              </h2>
              <StatusBadge
                value={user.accountStatus}
                map={ACCOUNT_STATUS_MAP}
                variant="dot"
              />
              <StatusBadge value={user.hrStatus} map={HR_STATUS_MAP} />
            </div>
            <div className="text-sm text-ink-muted mb-2">{user.email}</div>
            <div className="flex flex-wrap gap-4 text-xs text-ink-faint">
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
                <Avatar
                  name={user.manager.fullName}
                  url={user.manager.avatarUrl ?? undefined}
                  size="sm"
                />
                <span className="text-xs text-ink-muted">
                  Gestor: <strong>{user.manager.fullName}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Acções */}
          <div className="flex flex-col gap-2">
            {user.accountStatus === 'ACTIVE' && (
              <Button
                intent="secondary"
                size="sm"
                onClick={() => onAction('deactivate')}
                disabled={actionLoading}
              >
                Desactivar
              </Button>
            )}
            {user.accountStatus !== 'ACTIVE' && (
              <Button
                intent="success"
                size="sm"
                onClick={() => onAction('activate')}
                disabled={actionLoading}
              >
                Activar
              </Button>
            )}
            {user.accountStatus === 'ACTIVE' && (
              <Button
                intent="warning"
                size="sm"
                onClick={() => onAction('suspend')}
                disabled={actionLoading}
              >
                Suspender
              </Button>
            )}
          </div>
        </div>

        {/* Bio */}
        {user.profile?.bio && (
          <div className="mt-4 pt-4 border-t border-border text-sm text-ink-muted">
            {user.profile.bio}
          </div>
        )}

        {/* Tags de interesses */}
        {user.profile?.interests && user.profile.interests.length > 0 && (
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {user.profile.interests.map((i, idx) => (
              <Badge key={idx} intent="info">
                {i}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      {/* Tabs */}
      <div className="flex w-fit gap-1 mb-5 rounded-control bg-surface-sunken p-1">
        {tabs.map((t) => (
          <Button
            key={t.id}
            size="sm"
            intent={tab === t.id ? 'primary' : 'ghost'}
            onClick={() => onTabChange(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && stats && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-3">
            <KpiCard
              icon={BookOpen}
              label="Matrículas"
              value={stats.enrollments.total}
            />
            <KpiCard
              icon={CheckCircle2}
              label="Concluídos"
              value={stats.enrollments.completed}
              intent="success"
            />
            <KpiCard
              icon={Clock}
              label="Taxa conclusão"
              value={`${stats.completionRate}%`}
              intent="info"
            />
            <KpiCard
              icon={Trophy}
              label="Pontos"
              value={stats.gamification.points}
              sub={`${stats.gamification.badges} badges`}
              intent="accent"
            />
          </div>
          {stats.enrollments.overdue > 0 && (
            <div className="bg-danger-subtle border border-danger/30 rounded-card px-4 py-3 text-sm text-danger-ink">
              ⚠ <strong>{stats.enrollments.overdue}</strong> curso(s) com
              deadline expirado
            </div>
          )}

          {/* Info pessoal e organizacional */}
          <div className="grid grid-cols-2 gap-5">
            <Card className="p-5">
              <div className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-3">
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
                  className="flex justify-between py-1.5 border-b border-border last:border-0"
                >
                  <span className="text-xs text-ink-muted">{l}</span>
                  <span className="text-xs font-medium text-ink">{v}</span>
                </div>
              ))}
            </Card>
            <Card className="p-5">
              <div className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-3">
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
                  className="flex justify-between py-1.5 border-b border-border last:border-0"
                >
                  <span className="text-xs text-ink-muted">{l}</span>
                  <span className="text-xs font-medium text-ink">{v}</span>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}

      {/* Learning tab */}
      {tab === 'learning' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <KpiCard
              icon={Clock}
              label="Em progresso"
              value={stats.enrollments.inProgress}
              intent="info"
            />
            <KpiCard
              icon={CheckCircle2}
              label="Concluídos"
              value={stats.enrollments.completed}
              intent="success"
            />
            <KpiCard
              icon={Award}
              label="Badges"
              value={stats.gamification.badges}
              intent="accent"
            />
          </div>
          {stats.recentActivity.length > 0 && (
            <Card className="overflow-hidden">
              <div className="px-4 py-3 border-b border-border text-xs font-medium text-ink-faint uppercase tracking-wide">
                Actividade recente
              </div>
              {stats.recentActivity.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0"
                >
                  <div className="w-10 h-10 bg-surface-sunken rounded-control overflow-hidden flex-shrink-0 relative">
                    {e.course?.thumbnailUrl ? (
                      <Image
                        src={e.course.thumbnailUrl}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink-faint">
                        <BookOpen size={18} strokeWidth={1.75} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-ink">{e.course?.title}</div>
                    <div className="text-xs text-ink-faint">{e.status}</div>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      {/* Team tab */}
      {tab === 'team' && <TeamView managerId={userId} />}

      {/* Audit tab */}
      {tab === 'audit' && (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Acção</TableHeaderCell>
              <TableHeaderCell>Por</TableHeaderCell>
              <TableHeaderCell>Data</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {auditLogs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="py-8 text-center text-ink-faint"
                >
                  Sem logs de auditoria
                </TableCell>
              </TableRow>
            ) : (
              auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="text-xs font-medium font-mono text-ink">
                      {log.action}
                    </div>
                    {log.meta && (
                      <div className="text-xs text-ink-faint">{log.meta}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    {log.performedBy?.fullName ?? '—'}
                  </TableCell>
                  <TableCell className="text-xs text-ink-faint">
                    {fmtDate(log.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

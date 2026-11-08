// components/users/UserProfileView.tsx
// Vista apresentacional do perfil de um utilizador — sem fetch de user/
// stats, sem mutação de acção (tudo isso vem do container,
// hooks/useUserProfile.ts, usado em UserProfile dentro de
// app/(platform)/users/page.tsx). Os separadores "Dados Pessoais" a
// "Atividade" (docs/modulo_users.md Ponto 3) vivem em ./ProfileTabs.tsx,
// cada um com o seu próprio fetch lazy — só pedido quando o separador activo
// os monta (mesmo padrão que a antiga TeamView já usava antes desta
// extracção).
// Ver memory project_innova_component_separation_audit, item 3.3.

'use client';

import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Trophy,
  AlertTriangle,
} from 'lucide-react';
import { formatDate as fmtDate } from '@/lib/format';
import Image from 'next/image';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { RateGauge } from './profile/shared';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { ProfileTab, UserAction } from '@/hooks/useUserProfile';
import {
  ACCOUNT_STATUS_MAP,
  HR_STATUS_MAP,
  type User,
  type UserStats,
} from './types';
import {
  AccessTab,
  ActivityTab,
  AttendanceTab,
  CareerTab,
  CompetenciesTab,
  CoursesTab,
  DocumentsTab,
  EvaluationsTab,
  HistoryTab,
  LeaveTab,
  OrganizationTab,
  PdiTab,
  PerformanceTab,
  PersonalDataTab,
  ProfessionalDataTab,
  TrainingTab,
} from './ProfileTabs';
import { QualificationsTab } from './QualificationsTab';
import { STATUS_CFG } from '@/components/enrollments/constants';
import { ProfileTabNav } from './ProfileTabNav';

// Estado da matrícula em português (os valores vêm da API em inglês).
function enrollmentStatusLabel(status: string): string {
  if (status === 'PENDING_APPROVAL') return 'Aguarda aprovação';
  return (
    (STATUS_CFG as Record<string, { label: string }>)[status]?.label ?? status
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
  actionLoading: boolean;
  onAction: (action: UserAction) => void;
}

// docs/modulo_users.md Ponto 3 — ordem e rótulos exactos dos 17 separadores.
const TABS: Array<{ id: ProfileTab; label: string }> = [
  { id: 'overview', label: 'Resumo' },
  { id: 'personal', label: 'Dados Pessoais' },
  { id: 'professional', label: 'Dados Profissionais' },
  { id: 'organization', label: 'Organização' },
  { id: 'access', label: 'Acesso & Permissões' },
  { id: 'training', label: 'Formação' },
  { id: 'courses', label: 'Cursos' },
  { id: 'competencies', label: 'Competências' },
  { id: 'qualifications', label: 'Qualificações' },
  { id: 'performance', label: 'Desempenho' },
  { id: 'evaluations', label: 'Avaliações' },
  { id: 'pdi', label: 'PDI' },
  { id: 'career', label: 'Carreira' },
  { id: 'documents', label: 'Documentos' },
  { id: 'leave', label: 'Férias & Licenças' },
  { id: 'attendance', label: 'Presenças' },
  { id: 'history', label: 'Histórico' },
  { id: 'activity', label: 'Atividade' },
];

export function UserProfileView({
  userId,
  onBack,
  tab,
  onTabChange,
  user,
  loadingUser,
  stats,
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

  return (
    <div>
      <Button intent="ghost" size="sm" className="mb-5" onClick={onBack}>
        <ArrowLeft size={14} strokeWidth={1.75} />
        Voltar
      </Button>

      {/* Profile header */}
      <div className="relative mb-5 flex items-stretch gap-6 overflow-hidden rounded-[24px] border border-brand-line bg-surface shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
        {/* Círculo da foto: ocupa a altura toda do cartão, de ponta a ponta */}
        <div className="flex aspect-square min-h-[11rem] shrink-0 items-center justify-center self-stretch">
          <Avatar
            name={user.fullName}
            url={user.avatarUrl ?? undefined}
            className="!h-[95%] !w-[95%] !text-5xl"
          />
        </div>
        <div className="min-w-0 flex-1 py-6 pr-6">
          <div className="flex items-start gap-5">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h2 className="text-xl font-semibold text-brand">
                  {user.fullName}
                </h2>
                <StatusBadge
                  value={user.accountStatus}
                  map={ACCOUNT_STATUS_MAP}
                  variant="dot"
                />
                <StatusBadge value={user.hrStatus} map={HR_STATUS_MAP} />
              </div>
              <div className="text-sm text-brand-muted mb-2">{user.email}</div>
              <div className="flex flex-wrap gap-4 text-xs text-brand-muted">
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
                {user.hireDate && (
                  <span>Admissão: {fmtDate(user.hireDate)}</span>
                )}
              </div>
              {user.manager && (
                <div className="mt-2 text-xs text-ink-muted">
                  Gestor: <strong>{user.manager.fullName}</strong>
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
                  intent="danger"
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
        </div>
      </div>

      {/* Tabs */}
      <ProfileTabNav
        className="mb-5"
        items={TABS}
        value={tab}
        onChange={(id) => onTabChange(id as ProfileTab)}
      />

      {/* Resumo */}
      {tab === 'overview' && stats && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <NavyStatCard
              icon={BookOpen}
              tone="blue"
              label="Matrículas"
              value={stats.enrollments.total}
            />
            <NavyStatCard
              icon={CheckCircle2}
              tone="green"
              label="Concluídos"
              value={stats.enrollments.completed}
            />
            <RateGauge label="Taxa conclusão" value={stats.completionRate} />
            <NavyStatCard
              icon={Trophy}
              tone="blue"
              label="Pontos"
              value={stats.gamification.points}
              sub={`${stats.gamification.badges} badges`}
            />
          </div>
          {stats.enrollments.overdue > 0 && (
            <div className="bg-danger-subtle border border-danger/30 rounded-card px-4 py-3 text-sm text-danger-ink">
              <AlertTriangle
                size={13}
                strokeWidth={1.75}
                className="inline align-[-2px]"
              />{' '}
              <strong>{stats.enrollments.overdue}</strong> curso(s) com deadline
              expirado
            </div>
          )}

          <div className="grid grid-cols-2 gap-5">
            <Card className="overflow-hidden">
              <div className="bg-brand/60 px-4 py-3 text-xs font-medium uppercase tracking-wide text-white">
                Dados pessoais
              </div>
              <div className="p-5">
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
              </div>
            </Card>
            <Card className="overflow-hidden">
              <div className="bg-brand/60 px-4 py-3 text-xs font-medium uppercase tracking-wide text-white">
                Organização
              </div>
              <div className="p-5">
                {[
                  ['Departamento', user.department?.name ?? '—'],
                  ['Cargo', user.position?.name ?? '—'],
                  ['Unidade', user.unit?.name ?? '—'],
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
              </div>
            </Card>
          </div>

          {stats.recentActivity.length > 0 && (
            <Card className="overflow-hidden">
              <div className="bg-brand/60 px-4 py-3 text-xs font-medium uppercase tracking-wide text-white">
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
                    <div className="text-xs text-ink-faint">
                      {enrollmentStatusLabel(e.status)}
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      {tab === 'personal' && <PersonalDataTab user={user} />}
      {tab === 'professional' && <ProfessionalDataTab user={user} />}
      {tab === 'organization' && <OrganizationTab user={user} />}
      {tab === 'access' && <AccessTab userId={userId} />}
      {tab === 'training' && <TrainingTab userId={userId} />}
      {tab === 'courses' && <CoursesTab userId={userId} />}
      {tab === 'competencies' && <CompetenciesTab userId={userId} />}
      {tab === 'qualifications' && <QualificationsTab userId={userId} />}
      {tab === 'performance' && <PerformanceTab userId={userId} />}
      {tab === 'evaluations' && <EvaluationsTab userId={userId} />}
      {tab === 'pdi' && <PdiTab userId={userId} />}
      {tab === 'career' && <CareerTab userId={userId} />}
      {tab === 'documents' && <DocumentsTab userId={userId} />}
      {tab === 'leave' && <LeaveTab userId={userId} />}
      {tab === 'attendance' && <AttendanceTab userId={userId} />}
      {tab === 'history' && <HistoryTab userId={userId} />}
      {tab === 'activity' && <ActivityTab userId={userId} />}
    </div>
  );
}

// components/users/ProfileTabs.tsx
// Corpo dos separadores do Perfil do Colaborador (docs/modulo_users.md Ponto
// 3) que NÃO são "Resumo"/"Cursos" (esses ficam em UserProfileView.tsx, já
// alimentados por hooks/useUserProfile.ts). Cada separador aqui é o seu
// próprio componente, com fetch próprio (useApiQuery), montado (e portanto
// só pedido à API) apenas quando `tab === 'x'` em UserProfileView — mesmo
// padrão lazy que já existia para TeamView antes desta extracção.
//
// Fonte dos dados: por regra de arquitectura do próprio módulo (ver secção
// final de docs/modulo_users.md — "Users não deve ser responsável por tudo o
// que pertence ao RH"), cada separador aqui chama o endpoint do módulo DONO
// do dado, filtrado por userId — nunca duplica essa leitura dentro de Users.

'use client';

import type { ReactNode } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
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
import type { EvalResults } from '@/components/evaluation/types';
import {
  ACCOUNT_STATUS_MAP,
  HR_STATUS_MAP,
  type AccessOverview,
  type AttendanceResponse,
  type CareerProfile,
  type DevelopmentPlansResponse,
  type DocumentsResponse,
  type LeaveBalanceEntry,
  type LeaveRequestsResponse,
  type TeamResponse,
  type TrainingParticipation,
  type User,
  type UserActivityStats,
  type UserCompetencyEntry,
  type UserEnrollmentsResponse,
  type UserEval360CycleEntry,
  type UserTimelineResponse,
} from './types';

// ─── Helpers partilhados ────────────────────────────────────────────────────

function InfoCard({ title, rows }: { title: string; rows: Array<[string, ReactNode]> }) {
  return (
    <Card className="p-5">
      <div className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-3">
        {title}
      </div>
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex justify-between gap-4 py-1.5 border-b border-border last:border-0"
        >
          <span className="text-xs text-ink-muted">{label}</span>
          <span className="text-xs font-medium text-ink text-right">
            {value === null || value === undefined || value === '' ? '—' : value}
          </span>
        </div>
      ))}
    </Card>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="py-8 text-center text-sm text-ink-faint border border-dashed border-border-strong rounded-card">
      {children}
    </div>
  );
}

function LoadingRows() {
  return (
    <Skeleton
      rows={4}
      wrapperClassName="space-y-2 animate-pulse"
      itemClassName="h-14 rounded-card bg-surface-sunken"
    />
  );
}

// ─── Dados Pessoais ─────────────────────────────────────────────────────────

export function PersonalDataTab({ user }: { user: User }) {
  return (
    <div className="grid grid-cols-2 gap-5">
      <InfoCard
        title="Identificação"
        rows={[
          ['Nome completo', user.fullName],
          ['Nome preferencial', user.preferredName],
          ['Género', user.gender],
          ['Data de nascimento', user.birthDate && fmtDate(user.birthDate)],
          ['Nacionalidade', user.nationality],
          ['País de residência', user.country],
          ['Nº de identificação', user.identificationNumber],
          ['NIF', user.nif],
          ['NIB', user.nib],
        ]}
      />
      <InfoCard
        title="Contacto"
        rows={[
          ['Email profissional', user.email],
          ['Email pessoal', user.personalEmail],
          ['Telefone', user.phone],
          ['Telefone alternativo', user.alternatePhone],
          ['Endereço', user.address],
          ['Contacto de emergência', user.emergencyContactName],
          ['Telefone de emergência', user.emergencyContactPhone],
        ]}
      />
    </div>
  );
}

// ─── Dados Profissionais ────────────────────────────────────────────────────

export function ProfessionalDataTab({ user }: { user: User }) {
  return (
    <div className="grid grid-cols-2 gap-5">
      <InfoCard
        title="Vínculo"
        rows={[
          ['Nº de colaborador', user.employeeNumber],
          ['Empresa', user.companyName],
          ['Área', user.area],
          ['Função', user.jobFunction],
          ['Categoria profissional', user.professionalCategory],
          ['Localização', user.workLocation],
          ['Data de admissão', user.hireDate && fmtDate(user.hireDate)],
          ['Data de saída', user.exitDate && fmtDate(user.exitDate)],
        ]}
      />
      <InfoCard
        title="Regime"
        rows={[
          ['Tipo de contrato', user.contractType],
          ['Regime de trabalho', user.workMode],
          ['Horário', user.workSchedule],
          ['Centro de custo', user.costCenter],
          [
            'Estado do colaborador',
            <StatusBadge key="hr" value={user.hrStatus} map={HR_STATUS_MAP} />,
          ],
        ]}
      />
    </div>
  );
}

// ─── Organização (+ Equipa, se gestor) ──────────────────────────────────────

function TeamView({ managerId }: { managerId: number }) {
  const { data, isLoading: loading } = useApiQuery<TeamResponse>(
    queryKeys.users.team(managerId),
    `/users/${managerId}/team`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (loading) return <LoadingRows />;
  if (!data || data.team.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-border text-xs font-medium text-ink-faint uppercase tracking-wide">
        Equipa directa
      </div>
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
                  <Avatar name={member.fullName} url={member.avatarUrl ?? undefined} size="sm" />
                  <div>
                    <div className="text-sm font-medium text-ink">{member.fullName}</div>
                    <div className="text-xs text-ink-faint">{member.position?.name ?? '—'}</div>
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
                <StatusBadge value={member.accountStatus} map={ACCOUNT_STATUS_MAP} variant="dot" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

export function OrganizationTab({ user }: { user: User }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-5">
        <InfoCard
          title="Estrutura"
          rows={[
            ['Unidade', user.unit?.name],
            ['Empresa', user.companyName],
            ['Departamento', user.department?.name],
            ['Área', user.area],
            ['Cargo', user.position?.name],
          ]}
        />
        <InfoCard
          title="Hierarquia"
          rows={[
            [
              'Gestor directo',
              user.manager ? (
                <span key="mgr" className="inline-flex items-center gap-2">
                  <Avatar name={user.manager.fullName} url={user.manager.avatarUrl ?? undefined} size="sm" />
                  {user.manager.fullName}
                </span>
              ) : null,
            ],
            ['Subordinados directos', user._count?.subordinates ?? 0],
          ]}
        />
      </div>
      {(user._count?.subordinates ?? 0) > 0 && <TeamView managerId={user.id} />}
    </div>
  );
}

// ─── Acesso & Permissões (Ponto 4) ──────────────────────────────────────────

export function AccessTab({ userId }: { userId: number }) {
  const { data, isLoading } = useApiQuery<AccessOverview>(
    queryKeys.users.access(userId),
    `/users/${userId}/access`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading) return <LoadingRows />;
  if (!data) return <EmptyState>Sem dados de acesso</EmptyState>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-5">
        <InfoCard
          title="Perfil de acesso"
          rows={[
            ['Perfil', data.profile?.name],
            ['Função no sistema', data.systemFunction],
            ['Nível de acesso a conteúdos', data.contentAccessLevel],
            ['MFA', data.mfaEnabled ? 'Activado' : 'Desactivado'],
          ]}
        />
        <InfoCard
          title="Sessão"
          rows={[
            ['Data de criação da conta', fmtDate(data.accountCreatedAt)],
            ['Último login', data.lastLoginAt ? fmtDate(data.lastLoginAt) : 'Sem registo'],
            ['Sessões activas', data.activeSessions],
            ['Dispositivos', 'Não disponível — não existe registo de dispositivos'],
            ['Tentativas de login', 'Não disponível — não existe registo de tentativas'],
            ['Histórico de bloqueios', 'Não disponível — não existe histórico de bloqueios'],
          ]}
        />
      </div>

      {data.authorizedModules.length > 0 && (
        <Card className="p-5">
          <div className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-3">
            Módulos autorizados
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.authorizedModules.map((m) => (
              <Badge key={m} intent="info">
                {m}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-xs font-medium text-ink-faint uppercase tracking-wide">
          Permissões do perfil ({data.permissions.length})
        </div>
        {data.permissions.length === 0 ? (
          <EmptyState>Sem permissões atribuídas ao perfil</EmptyState>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Permissão</TableHeaderCell>
                <TableHeaderCell>Acção</TableHeaderCell>
                <TableHeaderCell>Módulo</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.permissions.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs font-medium text-ink">{p.name}</TableCell>
                  <TableCell className="text-xs text-ink-muted">{p.action}</TableCell>
                  <TableCell className="text-xs text-ink-muted">{p.subject}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-xs font-medium text-ink-faint uppercase tracking-wide">
          Permissões especiais ({data.specialPermissions.length})
        </div>
        {data.specialPermissions.length === 0 ? (
          <EmptyState>Sem permissões especiais concedidas</EmptyState>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Permissão</TableHeaderCell>
                <TableHeaderCell>Concedida em</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.specialPermissions.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs font-medium text-ink">{p.name}</TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    {p.grantedAt ? fmtDate(p.grantedAt) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

// ─── Formação ────────────────────────────────────────────────────────────────

export function TrainingTab({ userId }: { userId: number }) {
  const { data, isLoading } = useApiQuery<TrainingParticipation[]>(
    queryKeys.trainings.byUser(userId),
    `/trainings/user/${userId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading) return <LoadingRows />;
  if (!data || data.length === 0) return <EmptyState>Sem formações registadas</EmptyState>;

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Formação</TableHeaderCell>
          <TableHeaderCell>Instrutor</TableHeaderCell>
          <TableHeaderCell>Carga horária</TableHeaderCell>
          <TableHeaderCell>Estado</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((p) => (
          <TableRow key={p.id}>
            <TableCell>
              <div className="text-sm font-medium text-ink">{p.session?.training.title ?? '—'}</div>
              <div className="text-xs text-ink-faint">{p.session?.training.type}</div>
            </TableCell>
            <TableCell className="text-xs text-ink-muted">
              {p.session?.training.instructor?.fullName ?? '—'}
            </TableCell>
            <TableCell className="text-xs text-ink-muted font-mono">
              {p.session?.training.workloadHours ?? '—'}h
            </TableCell>
            <TableCell>
              <Badge intent="info">{p.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ─── Cursos ──────────────────────────────────────────────────────────────────

export function CoursesTab({ userId }: { userId: number }) {
  const { data, isLoading } = useApiQuery<UserEnrollmentsResponse>(
    queryKeys.enrollments.byUser(userId),
    `/enrollments/users/${userId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading) return <LoadingRows />;
  if (!data || data.enrollments.length === 0) return <EmptyState>Sem matrículas</EmptyState>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Concluídos" value={data.groups.completed.length} intent="success" />
        <KpiCard label="Em curso" value={data.groups.inProgress.length} intent="info" />
        <KpiCard label="Não iniciados" value={data.groups.notStarted.length} />
        <KpiCard label="Atrasados" value={data.groups.overdue.length} intent="danger" />
      </div>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Curso</TableHeaderCell>
            <TableHeaderCell>Progresso</TableHeaderCell>
            <TableHeaderCell>Prazo</TableHeaderCell>
            <TableHeaderCell>Estado</TableHeaderCell>
            <TableHeaderCell>Certificado</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.enrollments.map((e) => (
            <TableRow key={e.id}>
              <TableCell>
                <div className="text-sm font-medium text-ink">{e.course.title}</div>
                <div className="text-xs text-ink-faint">{e.course.category ?? '—'}</div>
              </TableCell>
              <TableCell className="text-xs font-mono text-ink-muted">
                {e.progress ?? 0}%
              </TableCell>
              <TableCell className="text-xs text-ink-faint">
                {e.deadline ? fmtDate(e.deadline) : '—'}
              </TableCell>
              <TableCell>
                <Badge intent={e.status === 'COMPLETED' ? 'success' : 'info'}>{e.status}</Badge>
              </TableCell>
              <TableCell className="text-xs text-ink-muted">
                {e.certificate ? fmtDate(e.certificate.issuedAt) : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Competências ────────────────────────────────────────────────────────────

export function CompetenciesTab({ userId }: { userId: number }) {
  const { data, isLoading } = useApiQuery<UserCompetencyEntry[]>(
    queryKeys.competencies.byUser(userId),
    `/competencies/user/${userId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading) return <LoadingRows />;
  if (!data || data.length === 0) return <EmptyState>Sem competências avaliadas</EmptyState>;

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Competência</TableHeaderCell>
          <TableHeaderCell>Actual</TableHeaderCell>
          <TableHeaderCell>Alvo</TableHeaderCell>
          <TableHeaderCell>Gap</TableHeaderCell>
          <TableHeaderCell>Avaliado em</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((c) => (
          <TableRow key={c.id}>
            <TableCell>
              <div className="text-sm font-medium text-ink">{c.competency.name}</div>
              <div className="text-xs text-ink-faint">{c.competency.category ?? '—'}</div>
            </TableCell>
            <TableCell className="text-xs font-mono text-ink-muted">{c.currentLevel}</TableCell>
            <TableCell className="text-xs font-mono text-ink-muted">{c.targetLevel ?? '—'}</TableCell>
            <TableCell
              className={`text-xs font-mono ${c.gap && c.gap > 0 ? 'text-danger' : 'text-success'}`}
            >
              {c.gap ?? '—'}
            </TableCell>
            <TableCell className="text-xs text-ink-faint">{fmtDate(c.evaluatedAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ─── Desempenho ──────────────────────────────────────────────────────────────

export function PerformanceTab({ userId }: { userId: number }) {
  const { data, isLoading } = useApiQuery<EvalResults>(
    queryKeys.evaluation.results(userId),
    `/evaluations/results/${userId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading) return <LoadingRows />;
  if (!data || data.hasResults === false) return <EmptyState>Sem avaliações de desempenho</EmptyState>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Score final" value={data.finalScore} sub={data.scoreLabel} intent="primary" />
        <KpiCard label="Avaliadores" value={data.totalEvaluators} intent="info" />
        {data.concordance && (
          <KpiCard label="Gap auto vs. outros" value={data.concordance.gap} sub={data.concordance.label} intent="warning" />
        )}
      </div>
      {data.qualitative && (
        <div className="grid grid-cols-3 gap-3">
          {(['strengths', 'improvements', 'recommendations'] as const).map((key) => (
            <Card key={key} className="p-4">
              <div className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-2">
                {key === 'strengths' ? 'Pontos fortes' : key === 'improvements' ? 'A melhorar' : 'Recomendações'}
              </div>
              {data.qualitative[key].length === 0 ? (
                <div className="text-xs text-ink-faint">—</div>
              ) : (
                <ul className="text-xs text-ink-muted space-y-1 list-disc list-inside">
                  {data.qualitative[key].map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Avaliações (Eval360) ────────────────────────────────────────────────────

export function EvaluationsTab({ userId }: { userId: number }) {
  const { data, isLoading } = useApiQuery<UserEval360CycleEntry[]>(
    queryKeys.evaluation360.userCycles(String(userId)),
    `/evaluation360/user/${userId}/cycles`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading) return <LoadingRows />;
  if (!data || data.length === 0) return <EmptyState>Sem avaliações 360° registadas</EmptyState>;

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Ciclo</TableHeaderCell>
          <TableHeaderCell>Período</TableHeaderCell>
          <TableHeaderCell>Estado</TableHeaderCell>
          <TableHeaderCell>Score final</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((c) => (
          <TableRow key={c.cycleId}>
            <TableCell>
              <div className="text-sm font-medium text-ink">{c.cycleName}</div>
              <div className="text-xs text-ink-faint">{c.cycleType}</div>
            </TableCell>
            <TableCell className="text-xs text-ink-faint">
              {fmtDate(c.startDate)} — {fmtDate(c.endDate)}
            </TableCell>
            <TableCell>
              <Badge intent={c.participantStatus === 'COMPLETED' ? 'success' : 'info'}>
                {c.participantStatus}
              </Badge>
            </TableCell>
            <TableCell className="text-xs font-mono text-ink-muted">
              {c.finalScore ?? '— (sem permissão para ver)'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ─── PDI ──────────────────────────────────────────────────────────────────────

export function PdiTab({ userId }: { userId: number }) {
  const { data, isLoading } = useApiQuery<DevelopmentPlansResponse>(
    queryKeys.developmentPlans.byUser(userId),
    '/development-plans',
    { params: { userId }, staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading) return <LoadingRows />;
  if (!data || data.data.length === 0) return <EmptyState>Sem PDI registados</EmptyState>;

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Plano</TableHeaderCell>
          <TableHeaderCell>Prioridade</TableHeaderCell>
          <TableHeaderCell>Progresso</TableHeaderCell>
          <TableHeaderCell>Período</TableHeaderCell>
          <TableHeaderCell>Estado</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.data.map((p) => (
          <TableRow key={p.id}>
            <TableCell>
              <div className="text-sm font-medium text-ink">{p.name}</div>
              <div className="text-xs text-ink-faint">{p.manager?.fullName ?? '—'}</div>
            </TableCell>
            <TableCell>
              <Badge intent={p.priority === 'HIGH' ? 'danger' : 'neutral'}>{p.priority}</Badge>
            </TableCell>
            <TableCell className="text-xs font-mono text-ink-muted">{p.overallProgress}%</TableCell>
            <TableCell className="text-xs text-ink-faint">{p.period ?? '—'}</TableCell>
            <TableCell>
              <Badge intent={p.status === 'COMPLETED' ? 'success' : 'info'}>{p.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ─── Carreira ─────────────────────────────────────────────────────────────────

export function CareerTab({ userId }: { userId: number }) {
  const { data, isLoading } = useApiQuery<CareerProfile>(
    queryKeys.career.profileByUser(userId),
    `/career/users/${userId}/profile`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading) return <LoadingRows />;
  if (!data) return <EmptyState>Sem dados de carreira</EmptyState>;

  return (
    <div className="space-y-4">
      <InfoCard
        title="Plano de carreira activo"
        rows={[
          ['Estado', data.careerPlan?.status ?? 'Sem plano activo'],
          ['Objectivos', data.careerPlan?.goals.length ?? 0],
        ]}
      />
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-xs font-medium text-ink-faint uppercase tracking-wide">
          Histórico de cargos
        </div>
        {data.careerHistory.length === 0 ? (
          <EmptyState>Sem histórico de cargos</EmptyState>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Cargo</TableHeaderCell>
                <TableHeaderCell>Início</TableHeaderCell>
                <TableHeaderCell>Fim</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.careerHistory.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="text-sm text-ink">{h.position?.title ?? '—'}</TableCell>
                  <TableCell className="text-xs text-ink-faint">{fmtDate(h.startedAt)}</TableCell>
                  <TableCell className="text-xs text-ink-faint">
                    {h.endedAt ? fmtDate(h.endedAt) : 'Actual'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      {data.successionPlan && (
        <InfoCard
          title="Plano de sucessão"
          rows={[['Posição-alvo', data.successionPlan.position?.name]]}
        />
      )}
    </div>
  );
}

// ─── Documentos ───────────────────────────────────────────────────────────────

export function DocumentsTab({ userId }: { userId: number }) {
  const { data, isLoading } = useApiQuery<DocumentsResponse>(
    queryKeys.documents.byOwner(userId),
    '/documents',
    { params: { ownerId: userId }, staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading) return <LoadingRows />;
  if (!data || data.data.length === 0) return <EmptyState>Sem documentos associados</EmptyState>;

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Documento</TableHeaderCell>
          <TableHeaderCell>Categoria</TableHeaderCell>
          <TableHeaderCell>Sensibilidade</TableHeaderCell>
          <TableHeaderCell>Criado em</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.data.map((d) => (
          <TableRow key={d.id}>
            <TableCell className="text-sm font-medium text-ink">{d.title}</TableCell>
            <TableCell className="text-xs text-ink-muted">{d.category ?? '—'}</TableCell>
            <TableCell>
              <Badge intent={d.sensitivity === 'CONFIDENTIAL' ? 'warning' : 'neutral'}>
                {d.sensitivity}
              </Badge>
            </TableCell>
            <TableCell className="text-xs text-ink-faint">{fmtDate(d.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ─── Férias & Licenças ────────────────────────────────────────────────────────

export function LeaveTab({ userId }: { userId: number }) {
  const requests = useApiQuery<LeaveRequestsResponse>(
    queryKeys.leave.byUser(userId),
    '/leave',
    { params: { userId }, staleTime: STALE_TIME.DYNAMIC },
  );
  const balance = useApiQuery<LeaveBalanceEntry[]>(
    queryKeys.leave.balanceByUser(userId),
    `/leave/balance/${userId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (requests.isLoading || balance.isLoading) return <LoadingRows />;

  return (
    <div className="space-y-4">
      {balance.data && balance.data.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {balance.data.map((b) => (
            <KpiCard
              key={b.leaveTypeCode}
              label={b.leaveTypeCode}
              value={b.balance}
              sub={`${b.used} usados`}
              intent="info"
            />
          ))}
        </div>
      )}
      {!requests.data || requests.data.data.length === 0 ? (
        <EmptyState>Sem pedidos de férias/licença</EmptyState>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Tipo</TableHeaderCell>
              <TableHeaderCell>Período</TableHeaderCell>
              <TableHeaderCell>Dias</TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.data.data.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-sm text-ink">{r.leaveTypeCode}</TableCell>
                <TableCell className="text-xs text-ink-faint">
                  {fmtDate(r.startDate)} — {fmtDate(r.endDate)}
                </TableCell>
                <TableCell className="text-xs font-mono text-ink-muted">{r.workDays}</TableCell>
                <TableCell>
                  <Badge intent={r.status === 'APPROVED' ? 'success' : 'info'}>{r.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

// ─── Presenças ────────────────────────────────────────────────────────────────

export function AttendanceTab({ userId }: { userId: number }) {
  const { data, isLoading } = useApiQuery<AttendanceResponse>(
    queryKeys.attendance.byUser(userId),
    `/attendance/user/${userId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading) return <LoadingRows />;
  if (!data || data.records.length === 0) return <EmptyState>Sem registos de presença</EmptyState>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Taxa de presença" value={`${data.summary.attendanceRate}%`} intent="success" />
        <KpiCard label="Presente" value={data.summary.presentDays} intent="info" />
        <KpiCard label="Atrasos" value={data.summary.lateDays} intent="warning" />
        <KpiCard label="Ausências" value={data.summary.absentDays} intent="danger" />
      </div>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Data</TableHeaderCell>
            <TableHeaderCell>Entrada</TableHeaderCell>
            <TableHeaderCell>Saída</TableHeaderCell>
            <TableHeaderCell>Estado</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.records.slice(0, 30).map((r) => (
            <TableRow key={r.id}>
              <TableCell className="text-xs text-ink-faint">{fmtDate(r.date)}</TableCell>
              <TableCell className="text-xs font-mono text-ink-muted">{r.clockIn ?? '—'}</TableCell>
              <TableCell className="text-xs font-mono text-ink-muted">{r.clockOut ?? '—'}</TableCell>
              <TableCell>
                <Badge intent={r.status === 'PRESENT' ? 'success' : r.status === 'ABSENT' ? 'danger' : 'warning'}>
                  {r.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Histórico ────────────────────────────────────────────────────────────────

export function HistoryTab({ userId }: { userId: number }) {
  const { data, isLoading } = useApiQuery<UserTimelineResponse>(
    queryKeys.history.timelineByUser(userId),
    `/history/timeline/user/${userId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading) return <LoadingRows />;
  if (!data || data.data.length === 0) return <EmptyState>Sem histórico registado</EmptyState>;

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Evento</TableHeaderCell>
          <TableHeaderCell>Módulo</TableHeaderCell>
          <TableHeaderCell>Data</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.data.map((e) => (
          <TableRow key={e.id}>
            <TableCell>
              <span className="mr-2">{e.icon}</span>
              <span className="text-sm text-ink">{e.title ?? e.category}</span>
              {e.milestone && (
                <Badge intent="warning" className="ml-2">
                  Marco
                </Badge>
              )}
            </TableCell>
            <TableCell className="text-xs text-ink-muted">{e.module}</TableCell>
            <TableCell className="text-xs text-ink-faint">{fmtDate(e.timestamp)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ─── Atividade ────────────────────────────────────────────────────────────────

export function ActivityTab({ userId }: { userId: number }) {
  const { data, isLoading } = useApiQuery<UserActivityStats>(
    queryKeys.history.statsByUser(userId),
    `/history/stats/user/${userId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading) return <LoadingRows />;
  if (!data) return <EmptyState>Sem dados de actividade</EmptyState>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Sequência activa" value={`${data.streak} dias`} intent="accent" />
        <KpiCard label="Dias activos (1 ano)" value={data.activeDays} intent="info" />
        <KpiCard label="Taxa de conclusão" value={`${data.completionRate}%`} intent="success" />
        <KpiCard label="Pontos (XP)" value={data.xpPoints} intent="primary" />
      </div>
      <Card className="p-5">
        <div className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-3">
          Actividade por categoria
        </div>
        {Object.keys(data.byCategory).length === 0 ? (
          <div className="text-xs text-ink-faint">Sem eventos no último ano</div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(data.byCategory).map(([cat, count]) => (
              <Badge key={cat} intent="neutral">
                {cat}: {count}
              </Badge>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

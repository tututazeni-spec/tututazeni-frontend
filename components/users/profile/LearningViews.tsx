// components/users/profile/LearningViews.tsx
// Formação, cursos e competências (apresentação).

import {
  AlertTriangle,
  CheckCircle2,
  Hourglass,
  PlayCircle,
} from 'lucide-react';
import { formatDate as fmtDate } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import type { QueryData } from '@/hooks/useUserProfileData';
import { LoadingRows } from './shared';
import { completedIntent, gapClass } from './logic';
import {
  type TrainingParticipation,
  type UserEnrollmentsResponse,
  type UserCompetencyEntry,
} from '../types';
import { EmptyState } from '@/components/ui/EmptyState';

export function TrainingView({
  data,
  isLoading,
}: QueryData<TrainingParticipation[]>) {
  if (isLoading) return <LoadingRows />;
  if (!data || data.length === 0)
    return <EmptyState title="Sem formações registadas" />;

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
              <div className="text-sm font-medium text-ink">
                {p.session?.training.title ?? '—'}
              </div>
              <div className="text-xs text-ink-faint">
                {p.session?.training.type}
              </div>
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

export function CoursesView({
  data,
  isLoading,
}: QueryData<UserEnrollmentsResponse>) {
  if (isLoading) return <LoadingRows />;
  if (!data || data.enrollments.length === 0)
    return <EmptyState title="Sem matrículas" />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <NavyStatCard
          icon={CheckCircle2}
          tone="green"
          label="Concluídos"
          value={data.groups.completed.length}
        />
        <NavyStatCard
          icon={PlayCircle}
          tone="blue"
          label="Em curso"
          value={data.groups.inProgress.length}
        />
        <NavyStatCard
          icon={Hourglass}
          tone="orange"
          label="Não iniciados"
          value={data.groups.notStarted.length}
        />
        <NavyStatCard
          icon={AlertTriangle}
          tone="red"
          label="Atrasados"
          value={data.groups.overdue.length}
        />
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
                <div className="text-sm font-medium text-ink">
                  {e.course.title}
                </div>
                <div className="text-xs text-ink-faint">
                  {e.course.category ?? '—'}
                </div>
              </TableCell>
              <TableCell className="text-xs font-mono text-ink-muted">
                {e.progress ?? 0}%
              </TableCell>
              <TableCell className="text-xs text-ink-faint">
                {e.deadline ? fmtDate(e.deadline) : '—'}
              </TableCell>
              <TableCell>
                <Badge intent={completedIntent(e.status)}>{e.status}</Badge>
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

export function CompetenciesView({
  data,
  isLoading,
}: QueryData<UserCompetencyEntry[]>) {
  if (isLoading) return <LoadingRows />;
  if (!data || data.length === 0)
    return <EmptyState title="Sem competências avaliadas" />;

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
              <div className="text-sm font-medium text-ink">
                {c.competency.name}
              </div>
              <div className="text-xs text-ink-faint">
                {c.competency.category ?? '—'}
              </div>
            </TableCell>
            <TableCell className="text-xs font-mono text-ink-muted">
              {c.currentLevel}
            </TableCell>
            <TableCell className="text-xs font-mono text-ink-muted">
              {c.targetLevel ?? '—'}
            </TableCell>
            <TableCell className={`text-xs font-mono ${gapClass(c.gap)}`}>
              {c.gap ?? '—'}
            </TableCell>
            <TableCell className="text-xs text-ink-faint">
              {fmtDate(c.evaluatedAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

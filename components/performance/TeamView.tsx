// components/performance/TeamView.tsx
// Separador "A minha equipa" — tabela de performance dos liderados.
// Dados próprios + apresentação. Extraído de
// app/(platform)/performance/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
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
import { PERF_CATEGORY_MAP, REVIEW_STATUS_MAP } from './constants';
import type { Cycle, ReviewStatus, TeamMember } from './types';

export function TeamView() {
  const dataQ = useApiQuery<{ team: TeamMember[]; total: number }>(
    queryKeys.performance.team(),
    '/performance/team',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const cycleQ = useApiQuery<Cycle | null>(
    queryKeys.performance.currentCycle(),
    '/performance/cycles/current',
    { staleTime: STALE_TIME.SEMI_STATIC, retry: false },
  );
  const data = dataQ.data ?? null;
  const cycle = cycleQ.data ?? null;
  const loading = dataQ.isLoading;

  if (loading) return <Skeleton />;
  if (!data) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="text-sm text-ink-muted">
          {data.total} membros na equipa
        </div>
        {cycle && (
          <div className="text-xs text-ink-faint">Ciclo: {cycle.name}</div>
        )}
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Colaborador</TableHeaderCell>
            <TableHeaderCell>Goals (%)</TableHeaderCell>
            <TableHeaderCell>Score</TableHeaderCell>
            <TableHeaderCell>Estado</TableHeaderCell>
            <TableHeaderCell>Pendências</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.team.map((member) => (
            <TableRow key={member.user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar
                    name={member.user.fullName}
                    url={member.user.avatarUrl ?? undefined}
                    size="sm"
                  />
                  <div>
                    <div className="text-sm font-medium text-ink">
                      {member.user.fullName}
                    </div>
                    <div className="text-xs text-ink-faint">
                      {member.user.position?.name ?? '—'}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="w-32">
                <ProgressBar value={member.avgGoalProgress} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 font-data text-sm font-medium text-ink">
                  {member.latestReview?.score !== null &&
                  member.latestReview?.score !== undefined
                    ? member.latestReview.score
                    : '—'}
                  {member.latestReview?.category && (
                    <StatusBadge
                      value={member.latestReview.category}
                      map={PERF_CATEGORY_MAP}
                    />
                  )}
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge
                  value={(member.latestReview?.status ?? 'DRAFT') as ReviewStatus}
                  map={REVIEW_STATUS_MAP}
                  variant="dot"
                />
              </TableCell>
              <TableCell>
                {member.pendingSelfReview && (
                  <Badge intent="warning">⏳ Self pendente</Badge>
                )}
                {!member.pendingSelfReview &&
                  member.status === 'NOT_STARTED' && (
                    <span className="text-xs text-ink-faint">
                      Não iniciado
                    </span>
                  )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {data.team.length === 0 && (
        <div className="px-4 py-12 text-center text-sm text-ink-faint">
          Sem membros de equipa
        </div>
      )}
    </div>
  );
}

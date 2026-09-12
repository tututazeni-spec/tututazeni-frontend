// components/performance/TeamView.tsx
// Separador "A minha equipa" — tabela de performance dos liderados.
// Dados próprios + apresentação. Extraído de
// app/(platform)/performance/page.tsx.

'use client';

import { useState } from 'react';
import { CalendarPlus, ClipboardCheck, Target } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
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
import { ScheduleFeedbackMeetingModal } from './ScheduleFeedbackMeetingModal';
import { SubmitReviewModal } from './SubmitReviewModal';
import type { Cycle, ReviewStatus, TeamMember } from './types';

export function TeamView() {
  const notify = useToast();
  const confirm = useConfirm();
  const [meetingFor, setMeetingFor] = useState<{ reviewId: number; userName: string } | null>(null);
  const [evaluating, setEvaluating] = useState<{ reviewId: number; userName: string } | null>(
    null,
  );

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

  // Secção 16 do formulário — "Criar PDI" a partir de uma avaliação
  // publicada. reviewId vem sempre de latestReview (type=MANAGER, ver
  // getTeamPerformance no backend) — só aparece quando já está PUBLISHED.
  const createPdi = useApiMutation(
    (reviewId: number) => apiClient.post(`/performance/${reviewId}/pdi`),
    {
      onSuccess: () => notify({ title: 'PDI criado a partir da avaliação', intent: 'success' }),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const handleCreatePdi = async (member: TeamMember) => {
    if (!member.latestReview) return;
    const ok = await confirm({
      title: 'Criar PDI',
      message: `Criar um plano de desenvolvimento para ${member.user.fullName} a partir desta avaliação?`,
    });
    if (ok) createPdi.mutate(member.latestReview.id);
  };

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
            <TableHeaderCell>Objectivos (%)</TableHeaderCell>
            <TableHeaderCell>Pontuações</TableHeaderCell>
            <TableHeaderCell>Estado</TableHeaderCell>
            <TableHeaderCell>Pendências</TableHeaderCell>
            <TableHeaderCell>Acções</TableHeaderCell>
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
                  value={
                    (member.latestReview?.status ?? 'DRAFT') as ReviewStatus
                  }
                  map={REVIEW_STATUS_MAP}
                  variant="dot"
                />
              </TableCell>
              <TableCell>
                {member.pendingSelfReview && (
                  <Badge intent="warning">Self pendente</Badge>
                )}
                {!member.pendingSelfReview &&
                  member.status === 'NOT_STARTED' && (
                    <span className="text-xs text-ink-faint">Não iniciado</span>
                  )}
              </TableCell>
              <TableCell>
                {member.latestReview?.status === 'PENDING_MANAGER' && (
                  <button
                    type="button"
                    onClick={() =>
                      setEvaluating({
                        reviewId: member.latestReview!.id,
                        userName: member.user.fullName,
                      })
                    }
                    aria-label="Avaliar"
                    title="Avaliar"
                    className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-hover"
                  >
                    <ClipboardCheck size={16} strokeWidth={1.75} />
                    Avaliar
                  </button>
                )}
                {member.latestReview?.status === 'PUBLISHED' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCreatePdi(member)}
                      aria-label="Criar PDI"
                      title="Criar PDI"
                      className="text-ink-faint hover:text-primary"
                    >
                      <Target size={16} strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setMeetingFor({
                          reviewId: member.latestReview!.id,
                          userName: member.user.fullName,
                        })
                      }
                      aria-label="Agendar reunião de feedback"
                      title="Agendar reunião de feedback"
                      className="text-ink-faint hover:text-primary"
                    >
                      <CalendarPlus size={16} strokeWidth={1.75} />
                    </button>
                  </div>
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

      {meetingFor && (
        <ScheduleFeedbackMeetingModal
          reviewId={meetingFor.reviewId}
          userName={meetingFor.userName}
          onClose={() => setMeetingFor(null)}
        />
      )}

      {evaluating && (
        <SubmitReviewModal
          reviewId={evaluating.reviewId}
          userName={evaluating.userName}
          mode="manager"
          scoreMax={(cycle?.scoreScale ?? 5) * 20}
          onClose={() => setEvaluating(null)}
        />
      )}
    </div>
  );
}

// components/evaluation/PendingTab.tsx
// Separador "Avaliações Pendentes" (docs/modulo_evaluation.md pt.7).
// Duas vistas, ambas visíveis ao mesmo utilizador quando aplicável:
// - Gestor: fila de avaliações que EU (como avaliador) ainda tenho de
//   preencher para a minha equipa — GET /evaluations/requests?evaluatorId=me,
//   filtrado a não-concluídas no cliente (mesmo endpoint que a aba
//   "Avaliações" usa para gestão, aqui com o âmbito do próprio avaliador).
// - Colaborador: "Minhas avaliações" pendentes (GET /evaluations/pending,
//   já existia), "Avaliações concluídas" e "Feedback recebido" — as duas
//   últimas vêm de GET /evaluations/my-evaluations (findByUser), endpoint
//   que já existia no backend mas nada no frontend chamava.

'use client';

import { useState } from 'react';
import { AlertTriangle, AlarmClock, ClipboardList, MessageSquare } from 'lucide-react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { useToast } from '@/providers/ToastProvider';
import { MGMT_ROLES } from '@/lib/roles';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
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
import { EVAL_TYPE_MAP, REQUEST_STATUS_MAP, SCORE_COLOR } from './constants';
import { SubmitEvaluationModal } from './SubmitEvaluationModal';
import type { EvalRequest, EvaluationRequestRow, ReceivedEvaluation } from './types';

function ManagerQueue() {
  const { data: me } = useCurrentUser();
  const notify = useToast();
  const [toSubmit, setToSubmit] = useState<EvalRequest | null>(null);

  const params = { evaluatorId: me?.id, limit: 100 };
  const { data, isLoading: loading } = useApiQuery<{ data: EvaluationRequestRow[] }>(
    queryKeys.evaluation.requests(params),
    '/evaluations/requests',
    { params, staleTime: STALE_TIME.DYNAMIC, enabled: !!me?.id },
  );

  const remind = useApiMutation(
    (id: number) => apiClient.post(`/evaluations/requests/${id}/remind`, {}),
    {
      onSuccess: () => notify({ title: 'Lembrete enviado', intent: 'success' }),
      onError: (e) =>
        notify({ title: e instanceof Error ? e.message : 'Erro ao enviar lembrete', intent: 'danger' }),
    },
  );

  const rows = (data?.data ?? []).filter((r) => r.status !== 'COMPLETED');

  if (loading)
    return <Skeleton rows={3} wrapperClassName="space-y-2" itemClassName="skeleton-shimmer h-12 rounded-card" />;

  if (rows.length === 0)
    return (
      <EmptyState
        title="Sem avaliações pendentes para preencher"
        description="Não tens avaliações da tua equipa à espera de resposta."
      />
    );

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            {['Colaborador', 'Avaliação', 'Prazo', 'Progresso', 'Estado', ''].map((h) => (
              <TableHeaderCell key={h}>{h}</TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => {
            const isOverdue = r.dueDate && new Date(r.dueDate) < new Date();
            return (
              <TableRow key={r.key}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar name={r.evaluated.fullName} url={r.evaluated.avatarUrl} size="sm" />
                    <span className="text-ink">{r.evaluated.fullName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-ink-muted">
                  {r.name ?? r.cycle?.name ?? '—'}
                </TableCell>
                <TableCell>
                  {r.dueDate ? (
                    <span className={isOverdue ? 'text-danger-ink font-medium' : 'text-ink-muted'}>
                      {isOverdue ? (
                        <AlertTriangle size={13} strokeWidth={1.75} className="inline mr-1" />
                      ) : (
                        <AlarmClock size={13} strokeWidth={1.75} className="inline mr-1" />
                      )}
                      {new Date(r.dueDate).toLocaleDateString('pt')}
                    </span>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="w-32">
                  <ProgressBar value={r.progress} />
                </TableCell>
                <TableCell>
                  <StatusBadge value={r.status} map={REQUEST_STATUS_MAP} variant="pill" />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        setToSubmit({
                          id: r.id,
                          type: r.type,
                          status: r.status,
                          dueDate: r.dueDate ?? undefined,
                          evaluated: {
                            id: r.evaluated.id,
                            fullName: r.evaluated.fullName,
                            avatarUrl: r.evaluated.avatarUrl,
                            position: r.evaluated.position ?? undefined,
                            department: r.evaluated.department ?? undefined,
                          },
                          cycle: r.cycle ?? undefined,
                        })
                      }
                    >
                      {r.status === 'IN_PROGRESS' ? 'Continuar' : 'Avaliar'}
                    </Button>
                    <Button size="sm" intent="ghost" onClick={() => remind.mutate(r.id)}>
                      Lembrar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {toSubmit && (
        <SubmitEvaluationModal
          requestId={toSubmit.id}
          cycleId={toSubmit.cycle?.id}
          evaluatedName={toSubmit.evaluated.fullName}
          onClose={() => setToSubmit(null)}
        />
      )}
    </>
  );
}

function MyPendingList() {
  const { data: pending = [], isLoading: loading } = useApiQuery<EvalRequest[]>(
    queryKeys.evaluation.pending(),
    '/evaluations/pending',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const [toSubmit, setToSubmit] = useState<EvalRequest | null>(null);

  if (loading)
    return <Skeleton rows={4} wrapperClassName="space-y-3" itemClassName="skeleton-shimmer h-24 rounded-card" />;

  if (pending.length === 0)
    return (
      <EmptyState
        title="Sem avaliações pendentes"
        description="Não tens avaliações à espera de resposta."
      />
    );

  return (
    <div className="space-y-3">
      {pending.map((r) => {
        const isOverdue = r.dueDate && new Date(r.dueDate) < new Date();
        return (
          <Card key={r.id} className={isOverdue ? 'border-danger bg-danger-subtle' : undefined}>
            <CardBody>
              <div className="flex items-center gap-4">
                <Avatar name={r.evaluated.fullName} url={r.evaluated.avatarUrl} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-sm font-semibold text-ink">{r.evaluated.fullName}</p>
                    <StatusBadge value={r.type} map={EVAL_TYPE_MAP} variant="pill" />
                    {isOverdue && <Badge intent="danger">ATRASADO</Badge>}
                  </div>
                  <p className="text-xs text-ink-faint">
                    {r.evaluated.position?.name} · {r.evaluated.department?.name}
                  </p>
                  {r.cycle && (
                    <p className="text-xs text-ink-faint">
                      <ClipboardList size={13} strokeWidth={1.75} className="inline align-[-2px]" />{' '}
                      {r.cycle.name}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {r.dueDate && (
                    <p className={cn('text-xs font-medium', isOverdue ? 'text-danger-ink' : 'text-ink-muted')}>
                      {isOverdue ? (
                        <AlertTriangle size={13} strokeWidth={1.75} className="inline" />
                      ) : (
                        <AlarmClock size={13} strokeWidth={1.75} className="inline" />
                      )}{' '}
                      {new Date(r.dueDate).toLocaleDateString('pt')}
                    </p>
                  )}
                  <Button size="sm" className="mt-2" onClick={() => setToSubmit(r)}>
                    Avaliar →
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        );
      })}

      {toSubmit && (
        <SubmitEvaluationModal
          requestId={toSubmit.id}
          cycleId={toSubmit.cycle?.id}
          evaluatedName={toSubmit.evaluated.fullName}
          onClose={() => setToSubmit(null)}
        />
      )}
    </div>
  );
}

function MyCompletedAndFeedback() {
  const { data: received = [], isLoading: loading } = useApiQuery<ReceivedEvaluation[]>(
    queryKeys.evaluation.myEvaluations(),
    '/evaluations/my-evaluations',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading)
    return <Skeleton rows={2} wrapperClassName="space-y-3" itemClassName="skeleton-shimmer h-16 rounded-card" />;

  if (received.length === 0)
    return (
      <EmptyState
        title="Ainda sem avaliações concluídas"
        description="Quando teres avaliações finalizadas, aparecem aqui com o feedback recebido."
      />
    );

  const feedback = received.filter((r) => r.strengths || r.improvements || r.recommendations || r.generalComment);

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-body text-sm font-semibold text-ink mb-2">Avaliações concluídas</h4>
        <Table>
          <TableHead>
            <TableRow>
              {['Período', 'Avaliador', 'Tipo', 'Resultado', 'Data'].map((h) => (
                <TableHeaderCell key={h}>{h}</TableHeaderCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {received.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-ink-muted">{r.period}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar name={r.evaluator.fullName} url={r.evaluator.avatarUrl ?? undefined} size="sm" />
                    <span className="text-ink">{r.evaluator.fullName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge value={r.type} map={EVAL_TYPE_MAP} variant="pill" />
                </TableCell>
                <TableCell className={SCORE_COLOR(r.overallScore)}>
                  {r.overallScore.toFixed(1)}
                </TableCell>
                <TableCell className="text-ink-faint">
                  {new Date(r.createdAt).toLocaleDateString('pt')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {feedback.length > 0 && (
        <div>
          <h4 className="font-body text-sm font-semibold text-ink mb-2">
            <MessageSquare size={14} strokeWidth={1.75} className="inline align-[-2px] mr-1" />
            Feedback recebido
          </h4>
          <div className="space-y-3">
            {feedback.map((r) => (
              <Card key={r.id}>
                <CardBody>
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar name={r.evaluator.fullName} url={r.evaluator.avatarUrl ?? undefined} size="sm" />
                    <span className="text-sm font-medium text-ink">{r.evaluator.fullName}</span>
                    <span className="text-xs text-ink-faint">
                      · {new Date(r.createdAt).toLocaleDateString('pt')}
                    </span>
                  </div>
                  {r.strengths && (
                    <p className="text-sm text-ink-muted">
                      <span className="font-medium text-success-ink">Pontos fortes: </span>
                      {r.strengths}
                    </p>
                  )}
                  {r.improvements && (
                    <p className="text-sm text-ink-muted mt-1">
                      <span className="font-medium text-warning-ink">A melhorar: </span>
                      {r.improvements}
                    </p>
                  )}
                  {r.recommendations && (
                    <p className="text-sm text-ink-muted mt-1">
                      <span className="font-medium text-info-ink">Recomendações: </span>
                      {r.recommendations}
                    </p>
                  )}
                  {!r.strengths && !r.improvements && !r.recommendations && r.generalComment && (
                    <p className="text-sm text-ink-muted">{r.generalComment}</p>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function PendingTab() {
  const role = useCurrentRole();
  const isMgmt = !!role && MGMT_ROLES.includes(role);

  return (
    <div className="space-y-8">
      {isMgmt && (
        <div className="space-y-3">
          <h3 className="font-display font-semibold text-ink">
            Avaliações Pendentes — Para Avaliar
          </h3>
          <ManagerQueue />
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-ink">Minhas Avaliações</h3>
        </div>
        <MyPendingList />
      </div>

      <div className="space-y-3">
        <MyCompletedAndFeedback />
      </div>
    </div>
  );
}

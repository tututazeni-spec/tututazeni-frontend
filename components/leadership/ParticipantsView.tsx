// components/leadership/ParticipantsView.tsx
// Separador "Participantes" do workspace. Gestores veem a lista completa e
// podem abrir o percurso individual (baseline, PDI, avaliações) de cada
// participante. Um não-gestor não vê o percurso individual de ninguém — a
// leitura self-only vive no painel pessoal, não aqui.

'use client';

import { Fragment, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { reportError } from '@/lib/errorReporting';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import {
  ASSESSMENT_STAGE_LABELS,
  PARTICIPANT_STATUS_CFG,
  READINESS_CFG,
  READINESS_ITEMS,
} from './constants';
import type {
  LeadershipProgramDetail,
  ParticipantDetail,
  ReadinessLevel,
} from './types';

export interface ParticipantsViewProps {
  programId: number;
  detail: LeadershipProgramDetail;
  canManage: boolean;
}

export function ParticipantsView({ programId, detail, canManage }: ParticipantsViewProps) {
  const [openUserId, setOpenUserId] = useState<number | null>(null);

  if (detail.participants.length === 0) {
    return <EmptyState title="Sem participantes" description="Ainda não há participantes selecionados para este programa." />;
  }

  return (
    <div className="space-y-3">
      {!canManage && (
        <p className="rounded-card bg-surface-sunken p-3 font-body text-xs text-ink-muted">
          Apenas gestores do programa podem ver o percurso individual de cada participante.
        </p>
      )}
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Participante</TableHeaderCell>
            <TableHeaderCell>Estado</TableHeaderCell>
            <TableHeaderCell>Progresso</TableHeaderCell>
            <TableHeaderCell>Readiness</TableHeaderCell>
            {canManage && <TableHeaderCell aria-label="Ações" />}
          </TableRow>
        </TableHead>
        <TableBody>
          {detail.participants.map((p) => (
            <Fragment key={p.userId}>
              <TableRow>
                <TableCell>{p.user.fullName}</TableCell>
                <TableCell>
                  <StatusBadge value={p.status} map={PARTICIPANT_STATUS_CFG} />
                </TableCell>
                <TableCell>{p.progress}%</TableCell>
                <TableCell>
                  {p.readinessLevel ? (
                    <span className={`rounded-full px-2 py-0.5 text-xs ${READINESS_CFG[p.readinessLevel].cls}`}>
                      {READINESS_CFG[p.readinessLevel].label}
                    </span>
                  ) : (
                    <span className="text-ink-faint">—</span>
                  )}
                </TableCell>
                {canManage && (
                  <TableCell>
                    <Button
                      size="sm"
                      intent="ghost"
                      onClick={() => setOpenUserId(openUserId === p.userId ? null : p.userId)}
                    >
                      {openUserId === p.userId ? (
                        <ChevronDown size={14} strokeWidth={1.75} />
                      ) : (
                        <ChevronRight size={14} strokeWidth={1.75} />
                      )}
                      Percurso
                    </Button>
                  </TableCell>
                )}
              </TableRow>
              {canManage && openUserId === p.userId && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <ParticipantJourney programId={programId} userId={p.userId} />
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ParticipantJourney({ programId, userId }: { programId: number; userId: number }) {
  const notify = useToast();
  const { data, isLoading } = useApiQuery<ParticipantDetail>(
    queryKeys.leadership.participant(programId, userId),
    `/leadership/programs/${programId}/participants/${userId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const [baselineScore, setBaselineScore] = useState('');
  const [readiness, setReadiness] = useState('');
  const [planId, setPlanId] = useState('');

  const baseKey = queryKeys.leadership.participant(programId, userId);

  const saveBaseline = useApiMutation(
    () =>
      apiClient.put(`/leadership/programs/${programId}/participants/${userId}/baseline`, {
        baselineScore: baselineScore ? Number(baselineScore) : undefined,
        readinessLevel: readiness || undefined,
      }),
    {
      invalidateKeys: [baseKey, queryKeys.leadership.programDetail(programId)],
      onSuccess: () => notify({ title: 'Baseline guardado', intent: 'success' }),
      onError: (e) => {
        reportError(e, { source: 'ParticipantJourney.baseline' });
        notify({ title: e.message, intent: 'danger' });
      },
    },
  );

  const linkPdi = useApiMutation(
    () =>
      apiClient.put(
        `/leadership/programs/${programId}/participants/${userId}/development-plan`,
        { developmentPlanId: planId ? Number(planId) : undefined },
      ),
    {
      invalidateKeys: [baseKey],
      onSuccess: () => notify({ title: 'PDI ligado', intent: 'success' }),
      onError: (e) => {
        reportError(e, { source: 'ParticipantJourney.linkPdi' });
        notify({ title: e.message, intent: 'danger' });
      },
    },
  );

  if (isLoading) return <p className="font-body text-xs text-ink-faint">A carregar percurso…</p>;

  return (
    <div className="grid gap-6 py-2 md:grid-cols-2">
      <div className="space-y-3">
        <h4 className="font-body text-sm font-semibold text-ink">Baseline & readiness</h4>
        <div className="flex items-end gap-2">
          <FormField label="Baseline (0-100)" htmlFor={`bs-${userId}`}>
            <Input
              id={`bs-${userId}`}
              type="number"
              className="w-24"
              value={baselineScore}
              onChange={(e) => setBaselineScore(e.target.value)}
              placeholder={data?.baselineScore != null ? String(data.baselineScore) : ''}
            />
          </FormField>
          <FormField label="Readiness" htmlFor={`rl-${userId}`}>
            <Select
              items={READINESS_ITEMS}
              value={readiness || undefined}
              onValueChange={setReadiness}
              className="w-44"
              placeholder={
                data?.readinessLevel
                  ? READINESS_CFG[data.readinessLevel as ReadinessLevel].label
                  : 'Selecionar'
              }
            />
          </FormField>
          <Button size="sm" onClick={() => saveBaseline.mutate(undefined)} loading={saveBaseline.isPending}>
            Guardar
          </Button>
        </div>

        <h4 className="pt-2 font-body text-sm font-semibold text-ink">Plano de Desenvolvimento (PDI)</h4>
        <div className="flex items-end gap-2">
          <FormField label="DevelopmentPlan ID" htmlFor={`pdi-${userId}`}>
            <Input
              id={`pdi-${userId}`}
              type="number"
              className="w-32"
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              placeholder={data?.plan?.developmentPlanId ? String(data.plan.developmentPlanId) : ''}
            />
          </FormField>
          <Button size="sm" onClick={() => linkPdi.mutate(undefined)} loading={linkPdi.isPending}>
            Ligar
          </Button>
        </div>
        {data?.plan?.developmentPlan && (
          <p className="font-body text-xs text-ink-muted">
            Ligado a: <strong>{data.plan.developmentPlan.name}</strong> ({data.plan.developmentPlan.status})
          </p>
        )}
      </div>

      <div className="space-y-2">
        <h4 className="font-body text-sm font-semibold text-ink">Avaliações</h4>
        {data?.assessments.length === 0 && (
          <p className="font-body text-xs text-ink-faint">Sem avaliações registadas.</p>
        )}
        {data?.assessments.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between rounded-card border border-border px-3 py-2 font-body text-xs"
          >
            <span>{ASSESSMENT_STAGE_LABELS[a.stage] ?? a.stage}</span>
            <span className="text-ink-muted">
              {a.score != null ? `${a.score}${a.maxScore ? `/${a.maxScore}` : ''}` : '—'} · {a.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

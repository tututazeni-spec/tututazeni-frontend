// components/evaluation360/PendingEvaluationsCard.tsx
// Secção "Avaliações pendentes" da Visão Geral pessoal (docs/evaluation360.md
// §1) — lista TODAS as atribuições reais de avaliador do utilizador
// autenticado neste ciclo (GET /evaluation360/cycles/:cycleId/my-assignments),
// incluindo a própria autoavaliação (role SELF), e deixa escolher uma para
// preencher (EvaluationFormTab). Substitui os antigos separadores de topo
// "Auto-avaliação"/"Avaliar" — a acção de preencher fica junto do resto da
// Visão Geral pessoal em vez de ocupar dois separadores próprios.

'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, ClipboardCheck } from 'lucide-react';
import type { EvaluationQuestion, EvaluatorRole } from './types';
import { EvaluationFormTab } from './EvaluationFormTab';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';

interface RawAssignment {
  id: string;
  evaluateeId: string;
  evaluateeName: string;
  evaluateeDepartment: string | null;
  evaluateeAvatarUrl: string | null;
  role: EvaluatorRole;
  status: 'PENDING' | 'INVITED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
}

interface RawQuestion {
  id: string;
  text: string;
  type: string;
  isRequired: boolean;
  competency?: { name: string } | null;
}

function toQuestion(q: RawQuestion): EvaluationQuestion {
  return {
    id: q.id,
    text: q.text,
    type:
      q.type === 'FREQUENCY'
        ? 'FREQUENCY'
        : q.type === 'OPEN_TEXT'
          ? 'OPEN_TEXT'
          : 'LIKERT',
    competency: q.competency?.name ?? '',
    isRequired: q.isRequired,
  };
}

const ROLE_LABEL: Record<EvaluatorRole, string> = {
  SELF: 'Autoavaliação',
  MANAGER: 'Gestor',
  PEER: 'Par',
  SUBORDINATE: 'Subordinado',
  EXTERNAL: 'Externo',
};

const STATUS_LABEL: Record<RawAssignment['status'], string> = {
  PENDING: 'Por convidar',
  INVITED: 'Convidado',
  IN_PROGRESS: 'Em curso',
  COMPLETED: 'Concluída',
  EXPIRED: 'Expirada',
};

export interface PendingEvaluationsCardProps {
  cycleId: string;
}

export function PendingEvaluationsCard({
  cycleId,
}: PendingEvaluationsCardProps) {
  const { data, isLoading } = useApiQuery<RawAssignment[]>(
    queryKeys.evaluation360.myAssignments(cycleId),
    `/evaluation360/cycles/${cycleId}/my-assignments`,
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const { data: me } = useCurrentUser();
  const [selected, setSelected] = useState<RawAssignment | null>(null);

  const assignments = (data ?? []).filter(
    (a) => a.status !== 'COMPLETED' && a.status !== 'EXPIRED',
  );

  const { data: formData } = useApiQuery<{ questions: RawQuestion[] }>(
    queryKeys.evaluation360.form(cycleId, selected?.evaluateeId ?? ''),
    selected ? `/evaluation360/cycles/${cycleId}/form` : '',
    {
      params: { evaluateeId: selected?.evaluateeId },
      enabled: !!selected,
      staleTime: STALE_TIME.DYNAMIC,
    },
  );

  if (selected) {
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="flex w-fit items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <ChevronLeft size={16} strokeWidth={1.75} />
          Voltar à lista
        </button>
        <EvaluationFormTab
          questions={(formData?.questions ?? []).map(toQuestion)}
          participantName={
            selected.role === 'SELF'
              ? (me?.fullName ?? 'Eu')
              : selected.evaluateeName
          }
          participantAvatarUrl={
            selected.role === 'SELF'
              ? me?.avatarUrl
              : selected.evaluateeAvatarUrl
          }
          participantDepartment={
            selected.role === 'SELF' ? null : selected.evaluateeDepartment
          }
          evaluatorRole={selected.role}
          cycleId={cycleId}
          evaluateeId={selected.evaluateeId}
          onSubmitted={() => setSelected(null)}
        />
      </div>
    );
  }

  if (isLoading) return <Skeleton rows={3} />;
  if (assignments.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-card border border-border bg-gradient-to-r from-[#E8EFFC] via-[#F4F7FD] to-[#F8FAFE] p-5">
      <div className="flex items-stretch gap-5">
        <div
          aria-hidden="true"
          className="hidden shrink-0 items-center justify-center sm:flex"
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/70 text-[#1E4FB5] shadow-sm">
            <ClipboardCheck size={52} strokeWidth={1.5} />
          </div>
        </div>
        <div aria-hidden="true" className="hidden w-px bg-border sm:block" />
        <div className="min-w-0 flex-1">
          <h3 className="m-0 text-lg font-bold text-[#0F1F3D]">
            Avaliações Pendentes
          </h3>
          <p className="m-0 mt-1 text-sm text-ink-muted">
            Inclui a tua autoavaliação e as avaliações de colegas/equipa que te
            foram distribuídas.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {assignments.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelected(a)}
                className="group flex items-center justify-between gap-3 rounded-control bg-transparent text-left"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar
                    name={
                      a.role === 'SELF'
                        ? (me?.fullName ?? 'Eu')
                        : a.evaluateeName
                    }
                    url={
                      (a.role === 'SELF'
                        ? me?.avatarUrl
                        : a.evaluateeAvatarUrl) ?? undefined
                    }
                    size="lg"
                    className="!h-14 !w-14 shrink-0 text-base"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-[#0F1F3D]">
                      {a.role === 'SELF'
                        ? 'A minha autoavaliação'
                        : a.evaluateeName}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-ink-muted">
                      {a.role === 'SELF'
                        ? ROLE_LABEL.SELF
                        : `${a.evaluateeDepartment ?? '—'} · ${ROLE_LABEL[a.role]}`}
                      <span className="ml-2 font-semibold">
                        · {STATUS_LABEL[a.status]}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0F1F3D] text-white transition-transform group-hover:translate-x-0.5">
                  <ChevronRight size={20} strokeWidth={2} />
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

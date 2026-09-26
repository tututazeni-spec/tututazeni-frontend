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
import { ChevronLeft } from 'lucide-react';
import type { EvaluationQuestion, EvaluatorRole } from './types';
import { EvaluationFormTab } from './EvaluationFormTab';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';

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
    type: q.type === 'FREQUENCY' ? 'FREQUENCY' : q.type === 'OPEN_TEXT' ? 'OPEN_TEXT' : 'LIKERT',
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

export function PendingEvaluationsCard({ cycleId }: PendingEvaluationsCardProps) {
  const { data, isLoading } = useApiQuery<RawAssignment[]>(
    queryKeys.evaluation360.myAssignments(cycleId),
    `/evaluation360/cycles/${cycleId}/my-assignments`,
    { staleTime: STALE_TIME.DYNAMIC },
  );
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
          participantName={selected.role === 'SELF' ? 'Eu' : selected.evaluateeName}
          evaluatorRole={selected.role}
          cycleId={cycleId}
          evaluateeId={selected.evaluateeId}
          onSubmitted={() => setSelected(null)}
        />
      </div>
    );
  }

  if (isLoading) return <div className="text-sm text-ink-muted">A carregar…</div>;
  if (assignments.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-3">
        <h3 className="m-0 text-sm font-bold text-ink">Avaliações Pendentes</h3>
        <p className="m-0 mt-0.5 text-xs text-ink-muted">
          Inclui a tua autoavaliação e as avaliações de colegas/equipa que te foram distribuídas.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {assignments.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setSelected(a)}
            className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-left transition-colors hover:bg-surface-sunken"
          >
            <div className="flex items-center gap-3">
              {a.role === 'SELF' ? (
                <Avatar name="Eu" size="sm" />
              ) : (
                <Avatar name={a.evaluateeName} url={a.evaluateeAvatarUrl ?? undefined} size="sm" />
              )}
              <div>
                <div className="text-sm font-semibold text-ink">
                  {a.role === 'SELF' ? 'A minha autoavaliação' : a.evaluateeName}
                </div>
                <div className="text-xs text-ink-muted mt-0.5">
                  {a.role === 'SELF' ? ROLE_LABEL.SELF : `${a.evaluateeDepartment ?? '—'} · ${ROLE_LABEL[a.role]}`}
                </div>
              </div>
            </div>
            <span className="text-xs font-semibold text-ink-muted">{STATUS_LABEL[a.status]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

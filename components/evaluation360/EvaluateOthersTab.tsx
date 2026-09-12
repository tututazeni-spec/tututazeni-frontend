// components/evaluation360/EvaluateOthersTab.tsx
// Separador "Avaliar": lista as atribuições reais de avaliador do utilizador
// autenticado neste ciclo (GET /evaluation360/cycles/:cycleId/my-assignments
// — gestor/pares do departamento/subordinados que lhe foram distribuídos,
// ver evaluation360.service.ts#distributeCycle) e deixa escolher uma para
// preencher. Antes disto não existia forma nenhuma de descobrir quem se
// pode avaliar — o módulo era 100% mock. Cada card mostra nome, departamento
// e a fotografia carregada pelo próprio avaliado (evaluateeAvatarUrl).

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

export interface EvaluateOthersTabProps {
  cycleId: string;
}

export function EvaluateOthersTab({ cycleId }: EvaluateOthersTabProps) {
  const { data, isLoading } = useApiQuery<RawAssignment[]>(
    queryKeys.evaluation360.myAssignments(cycleId),
    `/evaluation360/cycles/${cycleId}/my-assignments`,
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const [selected, setSelected] = useState<RawAssignment | null>(null);

  // SELF fica no separador "Auto-avaliação" — aqui só colegas/gestor/equipa.
  const assignments = (data ?? []).filter((a) => a.role !== 'SELF');

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
          participantName={selected.evaluateeName}
          evaluatorRole={selected.role}
          cycleId={cycleId}
          evaluateeId={selected.evaluateeId}
          onSubmitted={() => setSelected(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="m-0 text-lg font-bold text-ink">Avaliações a Realizar</h2>
        <p className="m-0 mt-1 text-sm text-ink-muted">
          Colegas do teu departamento, o teu gestor directo e a tua equipa,
          conforme foram distribuídos neste ciclo.
        </p>
      </div>
      {isLoading && <div className="text-sm text-ink-muted">A carregar…</div>}
      {!isLoading && assignments.length === 0 && (
        <div className="rounded-lg border border-border bg-surface p-5 text-sm text-ink-muted">
          Não tens nenhuma avaliação atribuída neste ciclo.
        </div>
      )}
      {assignments.map((a) => (
        <button
          key={a.id}
          type="button"
          disabled={a.status === 'COMPLETED' || a.status === 'EXPIRED'}
          onClick={() => setSelected(a)}
          className="flex items-center justify-between rounded-lg border border-border bg-surface px-5 py-4 text-left transition-colors enabled:hover:bg-surface-sunken disabled:opacity-60"
        >
          <div className="flex items-center gap-3">
            <Avatar name={a.evaluateeName} url={a.evaluateeAvatarUrl ?? undefined} size="md" />
            <div>
              <div className="text-sm font-semibold text-ink">{a.evaluateeName}</div>
              <div className="text-xs text-ink-muted mt-0.5">
                {a.evaluateeDepartment ?? '—'} · {ROLE_LABEL[a.role]}
              </div>
            </div>
          </div>
          <span className="text-xs font-semibold text-ink-muted">{STATUS_LABEL[a.status]}</span>
        </button>
      ))}
    </div>
  );
}

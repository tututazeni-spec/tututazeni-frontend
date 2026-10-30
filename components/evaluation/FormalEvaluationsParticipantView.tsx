// components/evaluation/FormalEvaluationsParticipantView.tsx
// Experiência de COLABORADOR/AUDITOR/INSTRUCTOR: listar avaliações formais disponíveis
// (GET /assessments/available — já filtrado por departamento + janela de
// disponibilidade) e participar reaproveitando o AssessmentPlayer genérico
// do módulo assessments (mesma lógica de perguntas/temporizador/autosave).

'use client';

import { useState } from 'react';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { AssessmentPlayer } from '@/components/assessments/AssessmentPlayer';
import { Skeleton } from '@/components/assessments/Skeleton';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import type { FormalEvaluation } from './formalEvaluationTypes';
import { FormalEvaluationCard } from './FormalEvaluationCard';
import { FormalEvaluationMyResult } from './FormalEvaluationMyResult';

type Nav =
  | { view: 'list' }
  | { view: 'player'; id: number }
  | { view: 'result'; evaluation: FormalEvaluation };

export function FormalEvaluationsParticipantView() {
  const [nav, setNav] = useState<Nav>({ view: 'list' });

  const { data, isLoading } = useApiQuery<FormalEvaluation[]>(
    queryKeys.formalEvaluations.available(),
    '/assessments/available',
  );
  const evaluations = data ?? [];

  if (nav.view === 'player') {
    return (
      <div>
        <Button
          intent="ghost"
          size="sm"
          onClick={() => setNav({ view: 'list' })}
          className="mb-4"
        >
          <ArrowLeft size={14} strokeWidth={1.75} />
          Voltar
        </Button>
        <AssessmentPlayer
          assessmentId={nav.id}
          onBack={() => setNav({ view: 'list' })}
        />
      </div>
    );
  }

  if (nav.view === 'result') {
    return (
      <div>
        <Button
          intent="ghost"
          size="sm"
          onClick={() => setNav({ view: 'list' })}
          className="mb-4"
        >
          <ArrowLeft size={14} strokeWidth={1.75} />
          Voltar
        </Button>
        <FormalEvaluationMyResult evaluation={nav.evaluation} />
      </div>
    );
  }

  if (isLoading) return <Skeleton />;

  if (evaluations.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Sem avaliações disponíveis"
        description="Não há avaliações formais abertas para ti neste momento."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {evaluations.map((e) => (
        <FormalEvaluationCard
          key={e.id}
          evaluation={e}
          participant
          onSelect={() =>
            setNav(
              e.myAttempt
                ? { view: 'result', evaluation: e }
                : { view: 'player', id: e.id },
            )
          }
          footer={
            e.myAttempt ? (
              <Button
                intent="onDark"
                size="sm"
                onClick={() => setNav({ view: 'result', evaluation: e })}
              >
                Ver resultado
              </Button>
            ) : (
              <Button
                intent="onDark"
                size="sm"
                onClick={() => setNav({ view: 'player', id: e.id })}
              >
                Iniciar
              </Button>
            )
          }
        />
      ))}
    </div>
  );
}

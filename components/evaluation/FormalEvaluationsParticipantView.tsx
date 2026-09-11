// components/evaluation/FormalEvaluationsParticipantView.tsx
// Experiência de COLABORADOR/AUDITOR: listar avaliações formais disponíveis
// (GET /assessments/available — já filtrado por departamento + janela de
// disponibilidade) e participar reaproveitando o AssessmentPlayer genérico
// do módulo assessments (mesma lógica de perguntas/temporizador/autosave).

'use client';

import { useState } from 'react';
import { ArrowLeft, ClipboardList, Timer } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { AssessmentPlayer } from '@/components/assessments/AssessmentPlayer';
import { Skeleton } from '@/components/assessments/Skeleton';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import type { FormalEvaluation } from './formalEvaluationTypes';

type Nav = { view: 'list' } | { view: 'player'; id: number };

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
        <AssessmentPlayer assessmentId={nav.id} onBack={() => setNav({ view: 'list' })} />
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
    <div className="space-y-3">
      {evaluations.map((e) => (
        <div
          key={e.id}
          className="flex items-center gap-4 rounded-card border border-border bg-surface p-5 transition-shadow hover:shadow-hover"
        >
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-card bg-accent-subtle">
            <ClipboardList size={20} strokeWidth={1.75} />
          </div>
          <div className="flex-1">
            <div className="mb-0.5 text-sm font-semibold text-ink">{e.title}</div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-ink-faint">
              <span>{e._count.questions} perguntas</span>
              <span>Nota máxima: {e.maxGrade}</span>
              {e.availableUntil && (
                <span className="inline-flex items-center gap-1">
                  <Timer size={12} strokeWidth={1.75} />
                  Até {new Date(e.availableUntil).toLocaleString('pt-PT')}
                </span>
              )}
            </div>
          </div>
          <Button size="sm" onClick={() => setNav({ view: 'player', id: e.id })}>
            Iniciar
          </Button>
        </div>
      ))}
    </div>
  );
}

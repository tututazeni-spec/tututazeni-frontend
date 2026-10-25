// components/avatar-training/room/AssignmentsView.tsx
// Sessões atribuídas ao formando (apresentação). Dados e arranque:
// hooks/useTrainingAssignments.ts.

import { Bot } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import type { TrainingAssignmentsController } from '@/hooks/useTrainingAssignments';
import { AssignmentNavyCard, AssignmentPhotoCard, CardGrid } from '../cards';
import { assignmentAction } from './logic';
import { Button } from '@/components/ui/Button';

interface AssignmentsViewProps {
  ctl: TrainingAssignmentsController;
  /** photo = design "cursos criados" (Sala); navy = design "inscrições" (Simulações). */
  variant: 'photo' | 'navy';
  emptyTitle: string;
}

export function AssignmentsView({
  ctl,
  variant,
  emptyTitle,
}: AssignmentsViewProps) {
  const { list, isLoading, error, refetch, start, isStarting } = ctl;

  if (error) return <QueryError error={error} onRetry={() => refetch()} />;
  if (isLoading || !list)
    return (
      <Skeleton
        rows={3}
        itemClassName="h-20 rounded-card bg-surface-sunken animate-pulse"
      />
    );
  if (list.length === 0)
    return (
      <EmptyState
        icon={Bot}
        title={emptyTitle}
        description="Quando lhe for atribuída uma formação com avatar, ela aparece aqui."
      />
    );

  return (
    <CardGrid>
      {list.map((a) => {
        const { done, resuming, label } = assignmentAction(a);
        const footer = !done && (
          <Button
            type="button"
            intent="onDark"
            size="sm"
            disabled={isStarting(a.sessionId)}
            onClick={() => start(a.sessionId)}
          >
            {label}
          </Button>
        );
        return variant === 'navy' ? (
          <AssignmentNavyCard key={a.id} assignment={a} footer={footer} />
        ) : (
          <AssignmentPhotoCard key={a.id} assignment={a} footer={footer} />
        );
      })}
    </CardGrid>
  );
}

// components/avatar-training/room/AssignmentsView.tsx
// Sessões atribuídas ao formando (apresentação). Dados e arranque:
// hooks/useTrainingAssignments.ts.

import { useState } from 'react';
import { Bot, Filter, List } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import {
  ASSIGNMENT_STATUS,
  EXPERIENCE_LABEL,
  SIMULATION_TYPES,
} from '../constants';
import { EmptyState } from '@/components/ui/EmptyState';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import type { TrainingAssignmentsController } from '@/hooks/useTrainingAssignments';
import { AssignmentNavyCard, AssignmentPhotoCard, CardGrid } from '../cards';
import { assignmentAction } from './logic';
import { Button } from '@/components/ui/Button';

const TYPE_ITEMS = [
  { value: 'ALL', label: 'Todos os tipos' },
  ...SIMULATION_TYPES.map((t) => ({ value: t, label: EXPERIENCE_LABEL[t] })),
];
const STATUS_ITEMS = [
  { value: 'ALL', label: 'Todos os estados' },
  ...Object.entries(ASSIGNMENT_STATUS).map(([value, s]) => ({
    value,
    label: s.label,
  })),
];

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
  const [search, setSearch] = useState('');
  const [type, setType] = useState('ALL');
  const [status, setStatus] = useState('ALL');

  if (error) return <QueryError error={error} onRetry={() => refetch()} />;
  if (isLoading || !list)
    return (
      <Skeleton rows={3} itemClassName="h-20 rounded-card bg-surface-sunken" />
    );
  if (list.length === 0)
    return (
      <EmptyState
        icon={Bot}
        title={emptyTitle}
        description="Quando lhe for atribuída uma formação com avatar, ela aparece aqui."
      />
    );

  const q = search.trim().toLowerCase();
  const shown =
    variant === 'navy'
      ? list.filter(
          (a) =>
            (!q ||
              a.session.title.toLowerCase().includes(q) ||
              a.session.program.title.toLowerCase().includes(q)) &&
            (type === 'ALL' || a.session.experienceType === type) &&
            (status === 'ALL' || a.status === status),
        )
      : list;

  return (
    <>
      {variant === 'navy' && (
        <Card className="mb-6">
          <CardBody className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-3">
            <SearchInput
              variant="underline"
              placeholder="Pesquisar simulações…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              variant="underline"
              icon={Filter}
              items={TYPE_ITEMS}
              value={type}
              onValueChange={setType}
            />
            <Select
              variant="underline"
              icon={List}
              items={STATUS_ITEMS}
              value={status}
              onValueChange={setStatus}
            />
          </CardBody>
        </Card>
      )}
      {shown.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="Nenhuma simulação encontrada"
          description="Ajuste a pesquisa ou os filtros."
        />
      ) : (
        <CardGrid>
          {shown.map((a) => {
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
      )}
    </>
  );
}

// components/enrollments/MyEnrollmentsView.tsx
// Separador "As minhas matrículas" — tabs por grupo + cancelamento.
// Dados próprios + apresentação. Extraído de
// app/(platform)/enrollments/page.tsx.
//
// Mistura duas fontes — /enrollments/my (cursos, Enrollment) e
// /trainings/my (formações, TrainingParticipant) — para que a lista mostre
// as duas matrículas de qualquer role, ver [[project_innova_enrollments_bugs]].
// Training não tem conceito de "atrasado" (sem deadline/lições), por isso o
// bucket `overdue` fica exclusivo de cursos.

'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EnrollmentCard } from './EnrollmentCard';
import { TrainingEnrollmentCard } from './TrainingEnrollmentCard';
import type { MatriculaItem, MyEnrollmentsResponse } from './types';
import type {
  MyTrainingEntry,
  ParticipantStatus,
} from '@/components/trainings/types';

type Bucket = 'overdue' | 'inProgress' | 'notStarted' | 'completed' | 'cancelled';

/** Mapa Training → mesmos buckets usados para Enrollment/curso, para que as
 * tabs "Em progresso"/"Não iniciados"/"Concluídos" cubram as duas fontes. */
function trainingBucket(status: ParticipantStatus): Bucket | null {
  switch (status) {
    case 'REGISTERED':
    case 'WAITLIST':
      return 'notStarted';
    case 'ATTENDED':
      return 'inProgress';
    case 'COMPLETED':
      return 'completed';
    case 'ABSENT':
    case 'CANCELLED':
      return 'cancelled';
    default:
      return null;
  }
}

function groupTrainings(trainings: MyTrainingEntry[]) {
  const groups: Record<Bucket, MyTrainingEntry[]> = {
    overdue: [],
    inProgress: [],
    notStarted: [],
    completed: [],
    cancelled: [],
  };
  for (const t of trainings) {
    const bucket = trainingBucket(t.status);
    if (bucket) groups[bucket].push(t);
  }
  return groups;
}

function toItems(
  courses: MyEnrollmentsResponse['enrollments'],
  trainings: MyTrainingEntry[],
): MatriculaItem[] {
  return [
    ...courses.map((data) => ({ kind: 'course' as const, id: `course-${data.id}`, data })),
    ...trainings.map((data) => ({
      kind: 'training' as const,
      id: `training-${data.id}`,
      data,
    })),
  ];
}

export function MyEnrollmentsView() {
  const notify = useToast();
  const [tab, setTab] = useState<
    'all' | 'overdue' | 'inProgress' | 'notStarted' | 'completed'
  >('all');

  const { data, isLoading: coursesLoading } = useApiQuery<MyEnrollmentsResponse>(
    queryKeys.enrollments.my(),
    '/enrollments/my',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const { data: trainings = [], isLoading: trainingsLoading } = useApiQuery<
    MyTrainingEntry[]
  >(queryKeys.trainings.my(), '/trainings/my', {
    staleTime: STALE_TIME.DYNAMIC,
  });

  const trainingGroups = useMemo(() => groupTrainings(trainings), [trainings]);

  const cancel = useApiMutation(
    (id: number) => apiClient.patch(`/enrollments/my/${id}/cancel`, {}),
    {
      invalidateKeys: [queryKeys.enrollments.my()],
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const confirm = useConfirm();
  const handleCancel = async (id: number) => {
    if (
      !(await confirm({
        title: 'Cancelar esta matrícula?',
        confirmLabel: 'Cancelar matrícula',
        destructive: true,
      }))
    )
      return;
    cancel.mutate(id);
  };

  if (coursesLoading || trainingsLoading || !data)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-2 animate-pulse"
        itemClassName="h-16 rounded-card bg-surface-sunken"
      />
    );

  const tabs: Array<{ id: typeof tab; label: string; count: number }> = [
    {
      id: 'all',
      label: 'Todos',
      count: data.enrollments.length + trainings.length,
    },
    { id: 'overdue', label: 'Atrasados', count: data.groups.overdue.length },
    {
      id: 'inProgress',
      label: 'Em progresso',
      count: data.groups.inProgress.length + trainingGroups.inProgress.length,
    },
    {
      id: 'notStarted',
      label: 'Não iniciados',
      count: data.groups.notStarted.length + trainingGroups.notStarted.length,
    },
    {
      id: 'completed',
      label: 'Concluídos',
      count: data.groups.completed.length + trainingGroups.completed.length,
    },
  ];

  const displayed: MatriculaItem[] =
    tab === 'all'
      ? toItems(data.enrollments, trainings)
      : toItems(data.groups[tab] ?? [], trainingGroups[tab] ?? []);

  return (
    <div>
      {/* Alertas de overdue (cursos — formação não tem conceito de prazo) */}
      {data.groups.overdue.length > 0 && (
        <div className="mb-5 flex items-center gap-3 rounded-card border border-danger bg-danger-subtle px-4 py-3">
          <AlertTriangle
            size={20}
            strokeWidth={1.75}
            className="flex-shrink-0 text-danger"
          />
          <div>
            <div className="text-sm font-medium text-danger-ink">
              {data.groups.overdue.length} curso(s) com prazo expirado
            </div>
            <div className="text-xs text-danger-ink">
              {data.groups.overdue.filter((e) => e.mandatory).length}{' '}
              obrigatório(s) — conclua o mais rapidamente possível
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-5 flex w-fit flex-wrap gap-1 rounded-card bg-surface-sunken p-1">
        {tabs.map((t) => (
          <Button
            key={t.id}
            size="sm"
            intent={tab === t.id ? 'primary' : 'ghost'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.count > 0 && (
              <Badge
                intent={t.id === 'overdue' ? 'danger' : 'neutral'}
                className="px-1.5 py-0"
              >
                {t.count}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {displayed.length === 0 ? (
          <div className="rounded-card border border-dashed border-border py-12 text-center text-sm text-ink-faint">
            Sem matrículas nesta categoria
          </div>
        ) : (
          displayed.map((item) =>
            item.kind === 'course' ? (
              <EnrollmentCard
                key={item.id}
                enrollment={item.data}
                onCancel={handleCancel}
              />
            ) : (
              <TrainingEnrollmentCard key={item.id} entry={item.data} />
            ),
          )
        )}
      </div>
    </div>
  );
}

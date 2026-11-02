// components/avatar-training/programs/ProgramsRecycleView.tsx
// Reciclagem de formações com avatar: as eliminadas ficam aqui 30 dias e podem
// ser restauradas; passado o prazo o backend apaga-as em definitivo
// (AvatarTrainingProgramsService.purgeExpiredPrograms).

'use client';

import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateNumeric } from '@/lib/format';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import type { AvatarProgram } from '../types';

interface DeletedProgram extends AvatarProgram {
  deletedAt: string;
  daysLeft: number;
}

export function ProgramsRecycleView() {
  const notify = useToast();
  const { data, isLoading, error, refetch } = useApiQuery<DeletedProgram[]>(
    queryKeys.avatarTraining.programsRecycle(),
    '/avatar-training/programs/recycle',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const restore = useApiMutation(
    (id: number) => apiClient.post(`/avatar-training/programs/${id}/restore`),
    {
      invalidateKeys: [queryKeys.avatarTraining.all],
      onSuccess: () =>
        notify({ title: 'Formação restaurada', intent: 'success' }),
      onError: (e) =>
        notify({
          title: 'Não foi possível restaurar',
          description: e.message,
          intent: 'danger',
        }),
    },
  );

  if (error) return <QueryError error={error} onRetry={() => refetch()} />;
  if (isLoading || !data)
    return (
      <Skeleton rows={3} itemClassName="h-20 rounded-card bg-surface-sunken" />
    );

  if (data.length === 0) {
    return (
      <EmptyState
        title="A reciclagem está vazia"
        description="As formações eliminadas ficam aqui durante 30 dias e podem ser restauradas."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink-muted">
        As formações eliminadas ficam aqui durante 30 dias. Passado esse prazo
        são apagadas em definitivo.
      </p>
      {data.map((p) => (
        <Card key={p.id}>
          <CardBody>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{p.title}</p>
                <p className="text-xs text-ink-muted">
                  {p.category ? `${p.category} · ` : ''}
                  {p._count?.sessions ?? 0} sessões · eliminada em{' '}
                  {formatDateNumeric(p.deletedAt)} ·{' '}
                  {p.daysLeft === 1
                    ? 'resta 1 dia'
                    : `restam ${p.daysLeft} dias`}
                </p>
              </div>
              <Button
                intent="secondary"
                size="sm"
                loading={restore.isPending && restore.variables === p.id}
                onClick={() => restore.mutate(p.id)}
              >
                Restaurar
              </Button>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

// components/courses/RecycleBinView.tsx
// Reciclagem de cursos (ADMIN/RH): cursos eliminados ficam 30 dias aqui e
// podem ser restaurados — depois o backend apaga-os em definitivo
// (CoursesService.purgeExpiredDeleted). Montada por GestaoView.

'use client';

import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from './shared';

interface DeletedCourse {
  id: number;
  title: string;
  category: string | null;
  deletedAt: string;
  daysLeft: number;
  _count: { modules: number; enrollments: number };
}

export function RecycleBinView() {
  const toast = useToast();
  const { data = [], isLoading } = useApiQuery<DeletedCourse[]>(
    [...queryKeys.courses.all, 'deleted'],
    '/courses/deleted',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const restore = useApiMutation(
    (id: number) => apiClient.post(`/courses/${id}/restore`),
    {
      invalidateKeys: [queryKeys.courses.all],
      onSuccess: () =>
        toast({ title: 'Curso restaurado.', intent: 'success' }),
      onError: (e: Error) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  if (isLoading) return <Skeleton rows={3} />;

  if (data.length === 0) {
    return (
      <EmptyState
        title="A reciclagem está vazia"
        description="Os cursos eliminados ficam aqui durante 30 dias e podem ser restaurados."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink-muted">
        Os cursos eliminados ficam aqui durante 30 dias. Passado esse prazo são
        apagados em definitivo.
      </p>
      {data.map((c) => (
        <Card key={c.id}>
          <CardBody>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{c.title}</p>
                <p className="text-xs text-ink-muted">
                  {c.category ? `${c.category} · ` : ''}
                  {c._count.modules} módulos · eliminado em{' '}
                  {new Date(c.deletedAt).toLocaleDateString('pt-PT')} ·{' '}
                  {c.daysLeft === 1
                    ? 'resta 1 dia'
                    : `restam ${c.daysLeft} dias`}
                </p>
              </div>
              <Button
                intent="secondary"
                size="sm"
                loading={restore.isPending && restore.variables === c.id}
                onClick={() => restore.mutate(c.id)}
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

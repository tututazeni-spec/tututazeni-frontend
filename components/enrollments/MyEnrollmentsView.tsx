// components/enrollments/MyEnrollmentsView.tsx
// Separador "As minhas matrículas" — tabs por grupo + cancelamento.
// Dados próprios + apresentação. Extraído de
// app/(platform)/enrollments/page.tsx.

'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useConfirm } from '@/providers/ConfirmProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EnrollmentCard } from './EnrollmentCard';
import type { MyEnrollmentsResponse } from './types';

export function MyEnrollmentsView() {
  const [tab, setTab] = useState<
    'all' | 'overdue' | 'inProgress' | 'notStarted' | 'completed'
  >('all');

  const { data, isLoading } = useApiQuery<MyEnrollmentsResponse>(
    queryKeys.enrollments.my(),
    '/enrollments/my',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const cancel = useApiMutation(
    (id: number) => apiClient.patch(`/enrollments/my/${id}/cancel`, {}),
    {
      invalidateKeys: [queryKeys.enrollments.my()],
      onError: (e) => alert(e.message),
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

  if (isLoading || !data)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-2 animate-pulse"
        itemClassName="h-16 rounded-card bg-surface-sunken"
      />
    );

  const tabs: Array<{ id: typeof tab; label: string; count: number }> = [
    { id: 'all', label: 'Todos', count: data.enrollments.length },
    { id: 'overdue', label: 'Atrasados', count: data.groups.overdue.length },
    {
      id: 'inProgress',
      label: 'Em progresso',
      count: data.groups.inProgress.length,
    },
    {
      id: 'notStarted',
      label: 'Não iniciados',
      count: data.groups.notStarted.length,
    },
    {
      id: 'completed',
      label: 'Concluídos',
      count: data.groups.completed.length,
    },
  ];

  const displayed = tab === 'all' ? data.enrollments : (data.groups[tab] ?? []);

  return (
    <div>
      {/* Alertas de overdue */}
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
              <Badge intent={t.id === 'overdue' ? 'danger' : 'neutral'} className="px-1.5 py-0">
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
          displayed.map((e) => (
            <EnrollmentCard key={e.id} enrollment={e} onCancel={handleCancel} />
          ))
        )}
      </div>
    </div>
  );
}

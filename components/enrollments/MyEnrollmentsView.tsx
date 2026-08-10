// components/enrollments/MyEnrollmentsView.tsx
// Separador "As minhas matrículas" — tabs por grupo + cancelamento.
// Dados próprios + apresentação. Extraído de
// app/(platform)/enrollments/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useConfirm } from '@/providers/ConfirmProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
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

  if (isLoading || !data) return <Skeleton rows={4} />;

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
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
          <span className="text-red-600 text-lg">⚠</span>
          <div>
            <div className="text-sm font-medium text-red-800">
              {data.groups.overdue.length} curso(s) com prazo expirado
            </div>
            <div className="text-xs text-red-600">
              {data.groups.overdue.filter((e) => e.mandatory).length}{' '}
              obrigatório(s) — conclua o mais rapidamente possível
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
              tab === t.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span
                className={`px-1.5 py-0 rounded-full text-xs ${
                  t.id === 'overdue'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {displayed.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
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

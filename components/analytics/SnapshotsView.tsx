// components/analytics/SnapshotsView.tsx
// Separador "Snapshots" — GET /analytics/snapshots + POST
// /analytics/snapshots/generate. Ambos os endpoints já existiam no backend
// sem nenhum consumidor no frontend (histórico executivo de KPIs no tempo).

'use client';

import { RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import type { DashboardSnapshot } from './types';

export function SnapshotsView() {
  const notify = useToast();
  const { data, isLoading } = useApiQuery<DashboardSnapshot[]>(
    queryKeys.analyticsPage.snapshots(),
    '/analytics/snapshots',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const generate = useApiMutation<DashboardSnapshot, void>(
    () => apiClient.post<DashboardSnapshot>('/analytics/snapshots/generate'),
    {
      invalidateKeys: [queryKeys.analyticsPage.snapshots()],
      onSuccess: () => notify({ title: 'Snapshot gerado', intent: 'success' }),
      onError: (err) =>
        notify({ title: err.message || 'Falha ao gerar snapshot', intent: 'danger' }),
    },
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          intent="secondary"
          loading={generate.isPending}
          onClick={() => generate.mutate()}
        >
          <RefreshCw size={14} strokeWidth={1.75} />
          Gerar snapshot agora
        </Button>
      </div>

      {isLoading || !data ? (
        <Skeleton rows={5} />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Data</TableHeaderCell>
              <TableHeaderCell>Departamento</TableHeaderCell>
              <TableHeaderCell>Colaboradores</TableHeaderCell>
              <TableHeaderCell>Cursos concluídos</TableHeaderCell>
              <TableHeaderCell>Performance média</TableHeaderCell>
              <TableHeaderCell>PDIs activos</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{new Date(s.generatedAt).toLocaleString('pt-PT')}</TableCell>
                <TableCell>{s.department?.name ?? 'Organização'}</TableCell>
                <TableCell>{s.totalUsers}</TableCell>
                <TableCell>{s.totalCoursesCompleted}</TableCell>
                <TableCell>{s.averageScore.toFixed(1)}</TableCell>
                <TableCell>{s.activePlans}</TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-ink-faint py-6">
                  Sem snapshots gerados ainda
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

// components/courses/TurmasView.tsx
// Aba "Turmas" (docs/modulo_courses.md secção 5, ADMIN/RH/INSTRUCTOR) —
// cursos presenciais/híbridos. Escolhe-se um curso no Combobox e gere-se as
// suas turmas (criar/editar/encerrar); detalhe/participantes/presenças
// vivem em CohortDetailModal.

'use client';

import { useState } from 'react';
import { Plus, Users2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { useCourseOptions } from '@/components/enrollments/enrollData';
import { CohortDetailModal } from './CohortDetailModal';
import { CreateCohortModal } from './CreateCohortModal';
import { Skeleton } from './shared';
import type { Cohort, CohortStatus } from './types';

const COHORT_STATUS_MAP: Record<CohortStatus, { label: string; cls: string }> = {
  DRAFT: { label: 'Rascunho', cls: 'bg-surface-sunken text-ink-muted' },
  OPEN: { label: 'Inscrições abertas', cls: 'bg-info-subtle text-info-ink' },
  ACTIVE: { label: 'A decorrer', cls: 'bg-success-subtle text-success-ink' },
  CLOSED: { label: 'Encerrada', cls: 'bg-surface-sunken text-ink-faint' },
  CANCELLED: { label: 'Cancelada', cls: 'bg-danger-subtle text-danger-ink' },
};

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-PT');
}

export function TurmasView() {
  const confirm = useConfirm();
  const toast = useToast();
  const { options: courseOptions } = useCourseOptions();
  const [courseId, setCourseId] = useState<string | undefined>(undefined);
  const [showCreate, setShowCreate] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);

  const { data = [], isLoading } = useApiQuery<Cohort[]>(
    queryKeys.courses.cohorts(Number(courseId)),
    `/courses/${courseId}/cohorts`,
    { staleTime: STALE_TIME.DYNAMIC, enabled: !!courseId },
  );

  const close = useApiMutation(
    (id: number) => apiClient.patch(`/courses/cohorts/${id}/close`),
    {
      invalidateKeys: [queryKeys.courses.cohorts(Number(courseId))],
      onSuccess: () => toast({ title: 'Turma encerrada', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  async function onClose(cohort: Cohort) {
    const ok = await confirm({
      title: `Encerrar a turma "${cohort.name}"?`,
      confirmLabel: 'Encerrar',
      destructive: true,
    });
    if (ok) close.mutate(cohort.id);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="w-72">
          <Combobox
            items={courseOptions}
            value={courseId}
            onValueChange={setCourseId}
            placeholder="Selecionar curso"
            searchPlaceholder="Escreva para filtrar cursos…"
            emptyText="Nenhum curso encontrado"
          />
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} disabled={!courseId}>
          <Plus size={14} strokeWidth={1.75} />
          Criar turma
        </Button>
      </div>

      {!courseId && (
        <EmptyState
          title="Escolhe um curso"
          description="Selecciona um curso presencial ou híbrido para ver e gerir as suas turmas."
        />
      )}

      {courseId && isLoading && <Skeleton rows={3} />}

      {courseId && !isLoading && data.length === 0 && (
        <EmptyState
          title="Ainda não há turmas"
          description="Cria a primeira turma para este curso."
        />
      )}

      {courseId && !isLoading && data.length > 0 && (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Turma</TableHeaderCell>
              <TableHeaderCell>Formador</TableHeaderCell>
              <TableHeaderCell>Local / Sala</TableHeaderCell>
              <TableHeaderCell>Datas</TableHeaderCell>
              <TableHeaderCell>Horário</TableHeaderCell>
              <TableHeaderCell>Inscritos</TableHeaderCell>
              <TableHeaderCell>Vagas</TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
              <TableHeaderCell></TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((c) => (
              <TableRow key={c.id} className="cursor-pointer" onClick={() => setDetailId(c.id)}>
                <TableCell className="font-medium text-ink">{c.name}</TableCell>
                <TableCell className="text-ink-muted">
                  {c.instructor?.fullName ?? '—'}
                </TableCell>
                <TableCell className="text-ink-muted">
                  {[c.location, c.room].filter(Boolean).join(' · ') || '—'}
                </TableCell>
                <TableCell className="text-ink-muted">
                  {fmtDate(c.startDate)} — {fmtDate(c.endDate)}
                </TableCell>
                <TableCell className="text-ink-muted">{c.schedule ?? '—'}</TableCell>
                <TableCell className="text-ink-muted">
                  {c.enrolled}/{c.capacity}
                </TableCell>
                <TableCell className="text-ink-muted">{c.availableSlots}</TableCell>
                <TableCell>
                  <StatusBadge value={c.status} map={COHORT_STATUS_MAP} variant="dot" />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-1">
                    <Button size="sm" intent="ghost" onClick={() => setDetailId(c.id)}>
                      <Users2 size={14} strokeWidth={1.75} />
                    </Button>
                    {c.status !== 'CLOSED' && c.status !== 'CANCELLED' && (
                      <Button size="sm" intent="secondary" onClick={() => onClose(c)}>
                        Encerrar
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {showCreate && courseId && (
        <CreateCohortModal courseId={Number(courseId)} onClose={() => setShowCreate(false)} />
      )}
      {detailId && (
        <CohortDetailModal cohortId={detailId} onClose={() => setDetailId(null)} />
      )}
    </div>
  );
}

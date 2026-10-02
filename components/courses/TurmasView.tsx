// components/courses/TurmasView.tsx
// Aba "Turmas" (docs/modulo_courses.md secção 5, ADMIN/RH/INSTRUCTOR) —
// cursos presenciais/híbridos. Escolhe-se um curso no Combobox e gere-se as
// suas turmas (criar/editar/encerrar); detalhe/participantes/presenças
// vivem em CohortDetailModal.

'use client';

import { useState } from 'react';
import { CalendarDays, Clock, MapPin, Plus, Trash2, Users2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useCourseOptions } from '@/components/enrollments/enrollData';
import { CohortDetailModal } from './CohortDetailModal';
import { CreateCohortModal } from './CreateCohortModal';
import { Skeleton } from './shared';
import type { Cohort, CohortStatus } from './types';

const COHORT_STATUS_MAP: Record<CohortStatus, { label: string; cls: string }> =
  {
    DRAFT: { label: 'Rascunho', cls: 'bg-surface-sunken text-ink-muted' },
    OPEN: { label: 'Inscrições abertas', cls: 'bg-info-subtle text-info-ink' },
    ACTIVE: { label: 'A decorrer', cls: 'bg-success-subtle text-success-ink' },
    CLOSED: { label: 'Encerrada', cls: 'bg-surface-sunken text-ink-faint' },
    CANCELLED: { label: 'Cancelada', cls: 'bg-danger-subtle text-danger-ink' },
  };

const GRID =
  'min-w-[1000px] grid-cols-[1.3fr_1.4fr_1.4fr_1.1fr_1fr_200px]';
const PANEL = 'rounded-xl border border-border/60 bg-surface-sunken/40 p-3';

const STATUS_ACCENT: Record<string, string> = {
  DRAFT: 'border-l-amber-400',
  OPEN: 'border-l-blue-500',
  ACTIVE: 'border-l-emerald-500',
  CLOSED: 'border-l-slate-400',
  CANCELLED: 'border-l-rose-500',
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

  const remove = useApiMutation(
    (id: number) => apiClient.delete(`/courses/cohorts/${id}`),
    {
      invalidateKeys: [queryKeys.courses.cohorts(Number(courseId))],
      onSuccess: () => toast({ title: 'Turma eliminada', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  async function onDelete(cohort: Cohort) {
    const ok = await confirm({
      title: `Eliminar a turma "${cohort.name}"?`,
      message: `Os ${cohort.enrolled} participante(s) inscritos nesta turma serão removidos. Esta acção não pode ser desfeita.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (ok) remove.mutate(cohort.id);
  }

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
        <Button
          size="sm"
          onClick={() => setShowCreate(true)}
          disabled={!courseId}
        >
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
        <div className="overflow-x-auto">
          {/* Cabeçalho agrupado */}
          <div className={`grid ${GRID} gap-3 px-4 pb-2 text-xs font-medium uppercase tracking-wide text-ink-faint`}>
            <div>Turma</div>
            <div>Formador &amp; Local / Sala</div>
            <div>Datas &amp; Horário</div>
            <div>Inscritos &amp; Vagas</div>
            <div>Estado</div>
            <div />
          </div>

          <div className="space-y-3">
            {data.map((c) => {
              const place = [c.location, c.room].filter(Boolean).join(' · ');
              const pct =
                c.capacity > 0
                  ? Math.min(100, Math.round((c.enrolled / c.capacity) * 100))
                  : 0;
              return (
                <div
                  key={c.id}
                  onClick={() => setDetailId(c.id)}
                  className={`grid ${GRID} cursor-pointer items-stretch gap-3 rounded-2xl border border-l-4 border-border bg-surface/60 p-3 shadow-sm backdrop-blur-md hover:bg-surface ${STATUS_ACCENT[c.status] ?? ''}`}
                >
                  {/* 1. Turma */}
                  <div className="flex min-w-0 flex-col justify-center">
                    <div className="line-clamp-2 text-sm font-semibold uppercase text-ink">
                      {c.name}
                    </div>
                  </div>

                  {/* 2. Formador & Local / Sala */}
                  <div className={`${PANEL} flex min-w-0 flex-col items-center justify-center gap-1`}>
                    {c.instructor ? (
                      <>
                        <Avatar
                          name={c.instructor.fullName}
                          url={c.instructor.avatarUrl ?? undefined}
                          size="sm"
                        />
                        <span className="max-w-full truncate text-xs font-medium text-ink">
                          {c.instructor.fullName}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-ink-faint">Sem formador</span>
                    )}
                    <span className="flex max-w-full items-center gap-1 text-xs text-ink-faint">
                      <MapPin size={12} strokeWidth={1.75} className="shrink-0" />
                      <span className="truncate">{place || '—'}</span>
                    </span>
                  </div>

                  {/* 3. Datas & Horário */}
                  <div className={`${PANEL} flex flex-col items-center justify-center gap-1.5`}>
                    <span className="flex items-center gap-1 text-xs text-ink">
                      <CalendarDays size={12} strokeWidth={1.75} />
                      {fmtDate(c.startDate)} — {fmtDate(c.endDate)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-ink-muted">
                      <Clock size={12} strokeWidth={1.75} />
                      {c.schedule ?? '—'}
                    </span>
                  </div>

                  {/* 4. Inscritos & Vagas */}
                  <div className={`${PANEL} flex flex-col items-center justify-center gap-1.5`}>
                    <span className="font-mono text-sm font-semibold text-ink">
                      {c.enrolled}/{c.capacity}
                    </span>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                      <div
                        className={`h-full rounded-full ${pct >= 90 ? 'bg-orange-400' : 'bg-blue-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-ink-muted">
                      Vagas: <span className="font-mono">{c.availableSlots}</span>
                    </span>
                  </div>

                  {/* 5. Estado */}
                  <div className={`${PANEL} flex items-center`}>
                    <StatusBadge
                      value={c.status}
                      map={COHORT_STATUS_MAP}
                      variant="dot"
                    />
                  </div>

                  {/* 6. Acções */}
                  <div
                    className="flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      size="sm"
                      intent="ghost"
                      onClick={() => setDetailId(c.id)}
                    >
                      <Users2 size={14} strokeWidth={1.75} />
                    </Button>
                    <Button
                      size="sm"
                      intent="ghost"
                      aria-label={`Eliminar turma ${c.name}`}
                      title="Eliminar turma"
                      onClick={() => onDelete(c)}
                    >
                      <Trash2 size={14} strokeWidth={1.75} className="text-danger-ink" />
                    </Button>
                    {c.status !== 'CLOSED' && c.status !== 'CANCELLED' && (
                      <Button
                        size="sm"
                        intent="secondary"
                        onClick={() => onClose(c)}
                      >
                        Encerrar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showCreate && courseId && (
        <CreateCohortModal
          courseId={Number(courseId)}
          onClose={() => setShowCreate(false)}
        />
      )}
      {detailId && (
        <CohortDetailModal
          cohortId={detailId}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  );
}

// components/courses/TurmasView.tsx
// Aba "Turmas" (docs/modulo_courses.md secção 5, ADMIN/RH/INSTRUCTOR) —
// cursos presenciais/híbridos. Escolhe-se um curso no Combobox e gere-se as
// suas turmas (criar/editar/encerrar); detalhe/participantes/presenças
// vivem em CohortDetailModal.

'use client';

import { useState } from 'react';
import {
  CalendarDays,
  Clock,
  Plus,
  Ticket,
  Trash2,
  Users2,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCourseOptions } from '@/components/enrollments/enrollData';
import { CohortDetailModal } from './CohortDetailModal';
import { CreateCohortModal } from './CreateCohortModal';
import { Skeleton } from './shared';
import { NAVY_ACTION, NavyBadge, NavyCard, type NavyTone } from './NavyCard';
import { PeriodPills } from '@/components/ui/Pills';
import { cn } from '@/lib/cn';
import type { Cohort, CohortDetail, CohortStatus } from './types';
import { formatDateNumeric } from '@/lib/format';

const COHORT_STATUS_MAP: Record<CohortStatus, { label: string; cls: string }> =
  {
    DRAFT: { label: 'Rascunho', cls: 'bg-surface-sunken text-ink-muted' },
    OPEN: { label: 'Inscrições abertas', cls: 'bg-info-subtle text-info-ink' },
    ACTIVE: { label: 'A decorrer', cls: 'bg-success-subtle text-success-ink' },
    CLOSED: { label: 'Encerrada', cls: 'bg-surface-sunken text-ink-faint' },
    CANCELLED: { label: 'Cancelada', cls: 'bg-danger-subtle text-danger-ink' },
  };

/** Foto do cartão de turma aberta (recorte do desenho em public/images). */
const OPEN_COHORT_PHOTO = '/images/turma-aberta-foto.jpg';

/** Botões redondos escuros do cartão de turma aberta. */
const OPEN_ROUND_BTN =
  'h-10 w-10 rounded-full bg-[#0F1F3D]/85 p-0 text-white hover:bg-[#0F1F3D]';

const COHORT_TONE: Record<CohortStatus, NavyTone> = {
  DRAFT: 'neutral',
  OPEN: 'info',
  ACTIVE: 'success',
  CLOSED: 'neutral',
  CANCELLED: 'danger',
};

interface CohortCardProps {
  c: Cohort;
  onOpen: () => void;
  onDelete: () => void;
  onClose: () => void;
}

function CohortCard({ c, onOpen, onDelete, onClose }: CohortCardProps) {
  const place = [c.location, c.room].filter(Boolean).join(' • ');
  const statusCfg = COHORT_STATUS_MAP[c.status];
  // Turma com inscrições abertas: desenho "turmas abertas" (foto + azul profundo).
  const open = c.status === 'OPEN';
  return (
    <NavyCard
      variant={open ? 'photo' : 'default'}
      image={open ? OPEN_COHORT_PHOTO : undefined}
      onClick={onOpen}
      seed={c.id}
      kicker={c.instructor?.fullName ?? 'Sem formador'}
      kickerIcon={Users2}
      title={c.name}
      subtitle={place || undefined}
      infos={[
        {
          icon: CalendarDays,
          value: formatDateNumeric(c.startDate),
          label: `até ${formatDateNumeric(c.endDate)}`,
        },
        { icon: Clock, value: c.schedule ?? '—', label: 'Horário' },
        {
          icon: Users2,
          value: `${c.enrolled}/${c.capacity}`,
          label: 'Inscritos',
        },
        {
          icon: Ticket,
          value: String(c.availableSlots),
          label: 'Vagas',
        },
      ]}
      badge={
        <NavyBadge
          tone={open ? 'light' : (COHORT_TONE[c.status] ?? 'neutral')}
          large={open}
        >
          {statusCfg?.label ?? c.status}
        </NavyBadge>
      }
      actions={
        <>
          <Button
            type="button"
            intent="onDarkGhost"
            size="sm"
            aria-label="Ver participantes"
            title="Ver participantes"
            className={open ? OPEN_ROUND_BTN : undefined}
            onClick={onOpen}
          >
            <Users2 size={15} strokeWidth={1.75} />
          </Button>
          <Button
            type="button"
            intent="onDarkGhost"
            size="sm"
            aria-label={`Eliminar turma ${c.name}`}
            title="Eliminar turma"
            className={open ? OPEN_ROUND_BTN : undefined}
            onClick={onDelete}
          >
            <Trash2 size={15} strokeWidth={1.75} />
          </Button>
          {c.status !== 'CLOSED' && c.status !== 'CANCELLED' && (
            <button
              type="button"
              className={
                open
                  ? 'inline-flex h-10 items-center justify-center rounded-full bg-[#0F1F3D]/85 px-5 text-sm font-bold text-white hover:bg-[#0F1F3D]'
                  : `${NAVY_ACTION} border border-white/25`
              }
              onClick={onClose}
            >
              Encerrar
            </button>
          )}
        </>
      }
    />
  );
}

export function TurmasView() {
  const confirm = useConfirm();
  const toast = useToast();
  const { options: courseOptions } = useCourseOptions();
  const [courseId, setCourseId] = useState<string | undefined>(undefined);
  const [showCreate, setShowCreate] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [panel, setPanel] = useState<'OPEN' | 'ACTIVE' | null>(null);
  const showOpen = panel !== null;

  type CohortWithCourse = Cohort & { course: CohortDetail['course'] };
  const openQuery = useApiQuery<CohortWithCourse[]>(
    queryKeys.courses.openCohorts('OPEN'),
    '/courses/cohorts/open?status=OPEN',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const activeQuery = useApiQuery<CohortWithCourse[]>(
    queryKeys.courses.openCohorts('ACTIVE'),
    '/courses/cohorts/open?status=ACTIVE',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const panelQuery = panel === 'ACTIVE' ? activeQuery : openQuery;
  const openCohorts = panelQuery.data ?? [];
  const openLoading = panelQuery.isLoading;
  const panelCards: Array<{
    key: 'OPEN' | 'ACTIVE';
    label: string;
    count: number;
  }> = [
    {
      key: 'OPEN',
      label: 'Turmas Abertas',
      count: openQuery.data?.length ?? 0,
    },
    {
      key: 'ACTIVE',
      label: 'Turmas Activas',
      count: activeQuery.data?.length ?? 0,
    },
  ];

  const { data = [], isLoading } = useApiQuery<Cohort[]>(
    queryKeys.courses.cohorts(Number(courseId)),
    `/courses/${courseId}/cohorts`,
    { staleTime: STALE_TIME.DYNAMIC, enabled: !!courseId },
  );

  const close = useApiMutation(
    (id: number) => apiClient.patch(`/courses/cohorts/${id}/close`),
    {
      invalidateKeys: [
        queryKeys.courses.cohorts(Number(courseId)),
        queryKeys.courses.openCohorts('OPEN'),
        queryKeys.courses.openCohorts('ACTIVE'),
      ],
      onSuccess: () => toast({ title: 'Turma encerrada', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const remove = useApiMutation(
    (id: number) => apiClient.delete(`/courses/cohorts/${id}`),
    {
      invalidateKeys: [
        queryKeys.courses.cohorts(Number(courseId)),
        queryKeys.courses.openCohorts('OPEN'),
        queryKeys.courses.openCohorts('ACTIVE'),
      ],
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <div className="w-full sm:w-72">
            <Combobox
              items={courseOptions}
              value={courseId}
              onValueChange={(v) => {
                setCourseId(v);
                if (v) setPanel(null);
              }}
              placeholder="Selecionar curso"
              searchPlaceholder="Escreva para filtrar cursos…"
              emptyText="Nenhum curso encontrado"
            />
          </div>
          <PeriodPills
            label="Turmas"
            value={panel ?? ''}
            onChange={(v) => setPanel((p) => (p === v ? null : v || null))}
            options={panelCards.map(({ key, label, count }) => ({
              value: key as 'OPEN' | 'ACTIVE' | '',
              label: `${label} (${count})`,
            }))}
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

      {showOpen && (
        <div>
          {openLoading && <Skeleton rows={3} />}
          {!openLoading && openCohorts.length === 0 && (
            <EmptyState
              title={
                panel === 'ACTIVE' ? 'Sem turmas activas' : 'Sem turmas abertas'
              }
              description={
                panel === 'ACTIVE'
                  ? 'Não há turmas a decorrer neste momento.'
                  : 'Não há turmas com inscrições abertas neste momento.'
              }
            />
          )}
          {!openLoading && openCohorts.length > 0 && (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {openCohorts.map((c) => (
                <CohortCard
                  key={c.id}
                  c={{ ...c, name: `${c.name} • ${c.course.title}` }}
                  onOpen={() => setDetailId(c.id)}
                  onDelete={() => onDelete(c)}
                  onClose={() => onClose(c)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {!showOpen && !courseId && (
        <EmptyState
          title="Escolhe um curso"
          description="Selecciona um curso presencial ou híbrido para ver e gerir as suas turmas."
        />
      )}

      {!showOpen && courseId && isLoading && <Skeleton rows={3} />}

      {!showOpen && courseId && !isLoading && data.length === 0 && (
        <EmptyState
          title="Ainda não há turmas"
          description="Cria a primeira turma para este curso."
        />
      )}

      {!showOpen && courseId && !isLoading && data.length > 0 && (
        <div>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {data.map((c) => (
              <CohortCard
                key={c.id}
                c={c}
                onOpen={() => setDetailId(c.id)}
                onDelete={() => onDelete(c)}
                onClose={() => onClose(c)}
              />
            ))}
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

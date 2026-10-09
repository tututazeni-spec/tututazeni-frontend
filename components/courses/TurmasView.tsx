// components/courses/TurmasView.tsx
// Aba "Turmas" (docs/modulo_courses.md secção 5, ADMIN/RH/INSTRUCTOR) —
// cursos presenciais/híbridos. Escolhe-se um curso no Combobox e gere-se as
// suas turmas (criar/editar/encerrar); detalhe/participantes/presenças
// vivem em CohortDetailModal.

'use client';

import { useState } from 'react';
import {
  Briefcase,
  CalendarDays,
  DoorOpen,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Users,
  Users2,
  type LucideIcon,
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
import type { Cohort, CohortDetail, CohortStatus } from './types';

const COHORT_STATUS_MAP: Record<CohortStatus, { label: string; cls: string }> =
  {
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

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

interface CohortInfoProps {
  icon: LucideIcon;
  value: string;
  label: string;
}

function CohortInfo({ icon: Icon, value, label }: CohortInfoProps) {
  return (
    <div className="flex min-w-0 items-center gap-2 px-2 sm:px-4">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EAF2FF] text-[#0D6EFD]">
        <Icon size={15} strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <div className="text-xs font-semibold leading-tight text-[#0F1F3D]">
          {value}
        </div>
        <div className="text-[11px] leading-tight text-[#71829B]">{label}</div>
      </div>
    </div>
  );
}

interface CohortCardProps {
  c: Cohort;
  onOpen: () => void;
  onDelete: () => void;
  onClose: () => void;
}

function CohortCard({ c, onOpen, onDelete, onClose }: CohortCardProps) {
  const place = [c.location, c.room].filter(Boolean).join(' · ');
  const statusLabel = COHORT_STATUS_MAP[c.status]?.label ?? c.status;
  const actionCls =
    'inline-flex h-8 items-center justify-center rounded-lg px-2 text-xs font-medium text-[#C7D4E8] hover:bg-white/10 hover:text-white';
  return (
    <div
      onClick={onOpen}
      className="cursor-pointer overflow-hidden rounded-2xl border border-[#DCE5F1] bg-white shadow-[0_8px_24px_rgba(15,31,61,0.08)]"
    >
      <div className="bg-gradient-to-br from-[#0F1F3D] to-[#132B52] px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="min-w-0 flex-1 basis-48 text-base font-semibold uppercase leading-tight text-white">
            {c.name}
          </h3>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#263F67] px-2.5 py-1 text-[11px] text-white">
            <span aria-hidden>●</span>
            {statusLabel}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {c.instructor ? (
              <>
                {c.instructor.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.instructor.avatarUrl}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0D6EFD] text-xs font-bold text-white">
                    {initials(c.instructor.fullName)}
                  </span>
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold leading-tight text-white">
                    {c.instructor.fullName}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#C7D4E8]">
                    <MapPin size={12} strokeWidth={1.75} className="shrink-0" />
                    <span className="truncate">{place || '—'}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="min-w-0">
                <div className="text-sm font-semibold leading-tight text-white">
                  Sem formador
                </div>
                <div className="flex items-center gap-1 text-xs text-[#C7D4E8]">
                  <MapPin size={12} strokeWidth={1.75} className="shrink-0" />
                  <span className="truncate">{place || '—'}</span>
                </div>
              </div>
            )}
          </div>
          <div
            className="flex shrink-0 items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={actionCls}
              aria-label="Ver participantes"
              title="Ver participantes"
              onClick={onOpen}
            >
              <Users2 size={15} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              className={actionCls}
              aria-label={`Eliminar turma ${c.name}`}
              title="Eliminar turma"
              onClick={onDelete}
            >
              <Trash2 size={15} strokeWidth={1.75} />
            </button>
            {c.status !== 'CLOSED' && c.status !== 'CANCELLED' && (
              <button
                type="button"
                className={`${actionCls} border border-white/25`}
                onClick={onClose}
              >
                Encerrar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-3 px-3 py-3 lg:grid-cols-4 lg:gap-y-0">
        <CohortInfo
          icon={CalendarDays}
          value={`${fmtDate(c.startDate)} — ${fmtDate(c.endDate)}`}
          label="Período"
        />
        <div className="lg:border-l lg:border-[#DCE5F1]">
          <CohortInfo icon={Clock} value={c.schedule ?? '—'} label="Horário" />
        </div>
        <div className="lg:border-l lg:border-[#DCE5F1]">
          <CohortInfo
            icon={Users}
            value={`${c.enrolled}/${c.capacity}`}
            label="Inscritos"
          />
        </div>
        <div className="lg:border-l lg:border-[#DCE5F1]">
          <CohortInfo
            icon={Briefcase}
            value={`Vagas: ${c.availableSlots}`}
            label="Disponíveis"
          />
        </div>
      </div>
    </div>
  );
}

export function TurmasView() {
  const confirm = useConfirm();
  const toast = useToast();
  const { options: courseOptions } = useCourseOptions();
  const [courseId, setCourseId] = useState<string | undefined>(undefined);
  const [showCreate, setShowCreate] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [showOpen, setShowOpen] = useState(false);

  const { data: openCohorts = [], isLoading: openLoading } = useApiQuery<
    Array<Cohort & { course: CohortDetail['course'] }>
  >(queryKeys.courses.openCohorts(), '/courses/cohorts/open', {
    staleTime: STALE_TIME.DYNAMIC,
  });

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
        queryKeys.courses.openCohorts(),
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
        queryKeys.courses.openCohorts(),
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
                if (v) setShowOpen(false);
              }}
              placeholder="Selecionar curso"
              searchPlaceholder="Escreva para filtrar cursos…"
              emptyText="Nenhum curso encontrado"
            />
          </div>
          <button
            type="button"
            aria-pressed={showOpen}
            onClick={() => setShowOpen((v) => !v)}
            className={`flex h-10 items-center gap-2.5 rounded-xl border px-3 text-left transition-colors ${
              showOpen
                ? 'border-[#0D6EFD] bg-[#EAF2FF]'
                : 'border-[#DCE5F1] bg-white hover:bg-[#F5F8FD]'
            }`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EAF2FF] text-[#0D6EFD]">
              <DoorOpen size={15} strokeWidth={1.75} />
            </span>
            <span className="text-sm font-semibold text-[#0F1F3D]">
              Turmas Abertas
            </span>
            <span className="rounded-full bg-[#0D6EFD] px-2 py-0.5 text-[11px] font-semibold text-white">
              {openCohorts.length}
            </span>
          </button>
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
              title="Sem turmas abertas"
              description="Não há turmas com inscrições abertas neste momento."
            />
          )}
          {!openLoading && openCohorts.length > 0 && (
            <div className="space-y-5">
              {openCohorts.map((c) => (
                <div key={c.id}>
                  <div className="mb-1 px-1 text-xs font-medium text-[#71829B]">
                    {c.course.title}
                  </div>
                  <CohortCard
                    c={c}
                    onOpen={() => setDetailId(c.id)}
                    onDelete={() => onDelete(c)}
                    onClose={() => onClose(c)}
                  />
                </div>
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
          <div className="space-y-5">
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

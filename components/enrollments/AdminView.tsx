// components/enrollments/AdminView.tsx
// Separador "Inscrições" da aba Cursos (docs/modulo_courses.md secção 3) —
// tabela filtrável, paginada, com acções de gestão de matrícula. Antes
// desta PR vivia isolada num separador "Gestão (Admin)" próprio do módulo
// standalone /enrollments (ver components/enrollments/*); consolidado aqui
// seguindo o mesmo padrão já usado no repo para learning-paths+lms e
// competencies+competency-map (single sidebar entry, wiring-only).

'use client';

import {
  AlertTriangle,
  CalendarDays,
  Hourglass,
  MoreHorizontal,
} from 'lucide-react';
import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Input } from '@/components/ui/Input';
import { PANEL, PILL, ProgressRing } from '@/components/courses/cardStyles';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { ORIGIN_LABELS, STATUS_CFG } from './constants';
import { useCourseOptions, useDepartmentOptions } from './enrollData';
import { deadlineCountdown, deadlineIntent } from './utils';
import type { Enrollment } from './types';

const STATUS_ITEMS = [
  { value: 'ALL', label: 'Todos os estados' },
  { value: 'NOT_STARTED', label: 'Inscrito' },
  { value: 'IN_PROGRESS', label: 'Em progresso' },
  { value: 'COMPLETED', label: 'Concluído' },
  { value: 'OVERDUE', label: 'Atrasado' },
  { value: 'CANCELLED', label: 'Cancelado' },
  { value: 'EXPIRED', label: 'Expirado' },
];

const MANDATORY_ITEMS = [
  { value: 'ALL', label: 'Obrigatório e opcional' },
  { value: 'true', label: 'Apenas obrigatórios' },
  { value: 'false', label: 'Apenas opcionais' },
];

const STATUS_ACCENT: Record<string, string> = {
  NOT_STARTED: 'border-l-blue-400',
  IN_PROGRESS: 'border-l-orange-400',
  COMPLETED: 'border-l-emerald-500',
  OVERDUE: 'border-l-red-500',
  CANCELLED: 'border-l-slate-400',
  EXPIRED: 'border-l-slate-400',
};

interface AdminViewProps {
  /** Pré-filtra por curso — usado pela acção "Ver inscrições" da aba Cursos. */
  initialCourseId?: number;
}

export function AdminView({ initialCourseId }: AdminViewProps) {
  const notify = useToast();
  const confirm = useConfirm();
  const [filters, setFilters] = useState({
    status: '',
    mandatory: '',
    overdue: '',
    courseId: initialCourseId ? String(initialCourseId) : '',
    departmentId: '',
    page: 1,
  });
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkDeadline, setBulkDeadline] = useState('');

  const { options: courseOptions } = useCourseOptions();
  const { options: departmentOptions } = useDepartmentOptions();

  function updateFilters(patch: Partial<Omit<typeof filters, 'page'>>) {
    setFilters((f) => ({ ...f, ...patch, page: 1 }));
  }
  function goToPage(delta: number) {
    setFilters((f) => ({ ...f, page: f.page + delta }));
  }

  const params = {
    page: filters.page,
    limit: 20,
    status: filters.status,
    mandatory: filters.mandatory,
    overdue: filters.overdue ? 'true' : undefined,
    courseId: filters.courseId || undefined,
    departmentId: filters.departmentId || undefined,
  };

  const { data, isLoading: loading } = useApiQuery<{
    data: Enrollment[];
    total: number;
    page: number;
    totalPages: number;
  }>(queryKeys.enrollments.list(params), '/enrollments', {
    params,
    staleTime: STALE_TIME.DYNAMIC,
    placeholderData: keepPreviousData,
  });

  const invalidateKeys = [queryKeys.enrollments.lists()];
  const toastError = (e: Error) =>
    notify({ title: e.message, intent: 'danger' });

  const remove = useApiMutation(
    (id: number) => apiClient.patch(`/enrollments/${id}/cancel`, {}),
    {
      invalidateKeys,
      onSuccess: () =>
        notify({ title: 'Inscrição removida', intent: 'success' }),
      onError: toastError,
    },
  );
  const reenroll = useApiMutation(
    (id: number) => apiClient.post(`/enrollments/${id}/reenroll`),
    {
      invalidateKeys,
      onSuccess: () =>
        notify({ title: 'Colaborador reinscrito', intent: 'success' }),
      onError: toastError,
    },
  );
  const resetProgress = useApiMutation(
    (id: number) => apiClient.post(`/enrollments/${id}/reset-progress`),
    {
      invalidateKeys,
      onSuccess: () =>
        notify({ title: 'Progresso reiniciado', intent: 'success' }),
      onError: toastError,
    },
  );
  const remind = useApiMutation(
    (id: number) => apiClient.post(`/enrollments/${id}/remind`),
    {
      onSuccess: () => notify({ title: 'Lembrete enviado', intent: 'success' }),
      onError: toastError,
    },
  );

  const rowBusy = (id: number) =>
    (remove.isPending && remove.variables === id) ||
    (reenroll.isPending && reenroll.variables === id) ||
    (resetProgress.isPending && resetProgress.variables === id) ||
    (remind.isPending && remind.variables === id);

  // Deadline em massa: dispara os PATCH em paralelo; ao concluir invalida as listas.
  const bulkDeadlineMut = useApiMutation(
    () =>
      Promise.all(
        selected.map((id) =>
          apiClient.patch(`/enrollments/${id}/deadline`, {
            deadline: bulkDeadline,
          }),
        ),
      ),
    {
      invalidateKeys,
      onSuccess: () => {
        setSelected([]);
        setBulkDeadline('');
      },
      onError: toastError,
    },
  );
  const bulkLoading = bulkDeadlineMut.isPending;

  const handleBulkDeadline = () => {
    if (!bulkDeadline || selected.length === 0) return;
    bulkDeadlineMut.mutate(undefined);
  };

  const toggleSelect = (id: number) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );

  async function onRemove(e: Enrollment) {
    const ok = await confirm({
      title: `Remover a inscrição de "${e.user.fullName}" em "${e.course.title}"?`,
      confirmLabel: 'Remover',
      destructive: true,
    });
    if (ok) remove.mutate(e.id);
  }

  async function onResetProgress(e: Enrollment) {
    const ok = await confirm({
      title: `Reiniciar o progresso de "${e.user.fullName}" em "${e.course.title}"?`,
      confirmLabel: 'Reiniciar',
      destructive: true,
    });
    if (ok) resetProgress.mutate(e.id);
  }

  return (
    <div>
      {/* Filtros — grid de largura uniforme (mesmo padrão da aba "Cursos",
          ver components/courses/GestaoView.tsx): todos os campos com
          w-full em vez de larguras w-* ad-hoc, alinhados em colunas. */}
      <div className="mb-5 rounded-2xl border border-[#0F1F3D]/20 bg-[#0F1F3D]/8 p-4">
        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            items={STATUS_ITEMS}
            value={filters.status || 'ALL'}
            onValueChange={(v) =>
              updateFilters({ status: v === 'ALL' ? '' : v })
            }
            className="w-full"
          />
          <Select
            items={[
              { value: 'ALL', label: 'Todos os cursos' },
              ...courseOptions,
            ]}
            value={filters.courseId || 'ALL'}
            onValueChange={(v) =>
              updateFilters({ courseId: v === 'ALL' ? '' : v })
            }
            className="w-full lg:col-span-2"
          />
          <Select
            items={[
              { value: 'ALL', label: 'Todos os departamentos' },
              ...departmentOptions,
            ]}
            value={filters.departmentId || 'ALL'}
            onValueChange={(v) =>
              updateFilters({ departmentId: v === 'ALL' ? '' : v })
            }
            className="w-full"
          />
          <Select
            items={MANDATORY_ITEMS}
            value={filters.mandatory || 'ALL'}
            onValueChange={(v) =>
              updateFilters({ mandatory: v === 'ALL' ? '' : v })
            }
            className="w-full"
          />
          <label className="flex w-full cursor-pointer items-center gap-2 rounded-control border-[1.5px] border-border-strong bg-surface px-3 py-[9px] text-sm text-black">
            <input
              type="checkbox"
              checked={!!filters.overdue}
              onChange={(e) =>
                updateFilters({ overdue: e.target.checked ? 'true' : '' })
              }
              className="h-4 w-4 rounded border-border-strong accent-primary"
            />
            Apenas atrasados
          </label>
        </div>
        <div className="flex justify-end">
          <span className="text-sm text-black">
            {data?.total ?? 0} matrículas
          </span>
        </div>
      </div>

      {/* Bulk deadline */}
      {selected.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-card border border-border bg-info-subtle px-4 py-2.5">
          <span className="text-sm font-medium text-info-ink">
            {selected.length} seleccionados
          </span>
          <Input
            type="date"
            value={bulkDeadline}
            onChange={(e) => setBulkDeadline(e.target.value)}
            className="py-1.5 text-sm"
          />
          <Button
            size="sm"
            onClick={handleBulkDeadline}
            disabled={!bulkDeadline || bulkLoading}
          >
            {bulkLoading ? 'A aplicar…' : 'Actualizar deadline'}
          </Button>
          <button
            onClick={() => setSelected([])}
            className="ml-auto text-xs text-info-ink"
          >
            Limpar
          </button>
        </div>
      )}

      {/* Tabela em cartões */}
      <div>
        {loading && (
          <Skeleton
            rows={4}
            wrapperClassName="space-y-3 animate-pulse"
            itemClassName="h-24 rounded-2xl bg-surface-sunken"
          />
        )}

        <div className="space-y-3">
          {!loading &&
            data?.data?.map((e) => (
              <div
                key={e.id}
                className={`flex flex-col gap-2 rounded-2xl border border-l-4 border-border bg-surface/60 p-2 shadow-sm backdrop-blur-md hover:bg-surface lg:flex-row lg:items-center lg:gap-3 ${STATUS_ACCENT[e.status] ?? ''}`}
              >
                {/* Topo: selecção, colaborador, curso e acções */}
                <div className="flex items-start gap-3 lg:w-72 lg:shrink-0">
                  <div className="flex items-center pt-2">
                    <input
                      type="checkbox"
                      checked={selected.includes(e.id)}
                      onChange={() => toggleSelect(e.id)}
                      className="h-4 w-4 rounded border-border-strong accent-primary"
                    />
                  </div>

                  {/* 1. Colaborador / Curso */}
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={e.user?.fullName ?? ''}
                        url={e.user?.avatarUrl ?? undefined}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-black">
                          {e.user?.fullName}
                        </div>
                        <div className="truncate text-xs text-black">
                          {e.user?.email}
                        </div>
                      </div>
                    </div>
                    <span className="w-fit max-w-full break-words rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase text-black">
                      {e.course?.title}
                    </span>
                  </div>

                  {/* 6. Acções (igual ao que já tinhas) */}
                  <div className="flex shrink-0 items-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="rounded-control p-1.5 text-black hover:bg-surface-sunken hover:text-black"
                          disabled={rowBusy(e.id)}
                        >
                          <MoreHorizontal size={16} strokeWidth={1.75} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => remind.mutate(e.id)}>
                          Enviar lembrete
                        </DropdownMenuItem>
                        {(e.status === 'CANCELLED' ||
                          e.status === 'EXPIRED') && (
                          <DropdownMenuItem
                            onSelect={() => reenroll.mutate(e.id)}
                          >
                            Reinscrever
                          </DropdownMenuItem>
                        )}
                        {e.status !== 'CANCELLED' && (
                          <DropdownMenuItem onSelect={() => onResetProgress(e)}>
                            Reiniciar progresso
                          </DropdownMenuItem>
                        )}
                        {e.status !== 'COMPLETED' &&
                          e.status !== 'CANCELLED' && (
                            <DropdownMenuItem
                              className="text-danger-ink"
                              onSelect={() => onRemove(e)}
                            >
                              Remover inscrição
                            </DropdownMenuItem>
                          )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Detalhes em grelha fluida */}
                <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-1 lg:items-stretch [&>div]:!p-1.5 lg:[&>div]:flex-1">
                  {/* 2. Departamento & Origem */}
                  <div
                    className={`${PANEL} flex min-w-0 flex-col items-start justify-center gap-1.5`}
                  >
                    <span className={`${PILL} bg-fuchsia-500/20 text-black`}>
                      {e.user.department?.name ?? '—'}
                    </span>
                    {e.user.unit?.name && (
                      <span className="max-w-full truncate text-xs text-black">
                        {e.user.unit.name}
                      </span>
                    )}
                    <span className={`${PILL} bg-violet-500/20 text-black`}>
                      {ORIGIN_LABELS[e.origin]}
                    </span>
                  </div>

                  {/* 3. Estado & Nota */}
                  <div
                    className={`${PANEL} flex flex-col items-start justify-center gap-1.5`}
                  >
                    <span className="[&_*]:!text-black">
                      <StatusBadge
                        value={e.status}
                        map={STATUS_CFG}
                        variant="dot"
                      />
                    </span>
                    <span className="text-xs text-black">
                      Nota:{' '}
                      <span className="font-mono">
                        {e.certificate?.score != null
                          ? `${e.certificate.score}%`
                          : '—'}
                      </span>
                    </span>
                  </div>

                  {/* 4. Progresso */}
                  <div className={`${PANEL} flex items-center justify-center`}>
                    <ProgressRing value={e.progressPercent ?? 0} />
                  </div>

                  {/* 5. Inscrição, Conclusão & Deadline */}
                  <div
                    className={`${PANEL} flex min-w-0 flex-col justify-center gap-1`}
                  >
                    <span className="flex items-center gap-1 text-xs text-black">
                      <CalendarDays size={12} strokeWidth={1.75} />
                      Inscrição:{' '}
                      {new Date(e.enrolledAt).toLocaleDateString('pt')}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-black">
                      <CalendarDays size={12} strokeWidth={1.75} />
                      Conclusão:{' '}
                      {e.completedAt
                        ? new Date(e.completedAt).toLocaleDateString('pt')
                        : '—'}
                    </span>
                    <div className="text-xs">
                      {e.deadline ? (
                        <Badge
                          intent={deadlineIntent(e.deadline, e.isOverdue)}
                          className="!text-black"
                        >
                          {e.isOverdue ? (
                            <AlertTriangle
                              size={12}
                              strokeWidth={1.75}
                              className="mr-1 inline"
                            />
                          ) : (
                            <Hourglass
                              size={12}
                              strokeWidth={1.75}
                              className="mr-1 inline"
                            />
                          )}
                          {deadlineCountdown(e.deadline)}
                        </Badge>
                      ) : (
                        <span className="text-black">Deadline: —</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Paginação */}
      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-black">
            Página {data.page} de {data.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              intent="secondary"
              size="sm"
              disabled={filters.page === 1}
              onClick={() => goToPage(-1)}
            >
              ← Anterior
            </Button>
            <Button
              intent="secondary"
              size="sm"
              disabled={filters.page === data.totalPages}
              onClick={() => goToPage(1)}
            >
              Próxima →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

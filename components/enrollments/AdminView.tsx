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
  Bell,
  Building2,
  CalendarDays,
  GraduationCap,
  Hourglass,
  ListFilter,
  Mail,
  MapPin,
  MoreHorizontal,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { AdminEnrollmentCard } from './AdminEnrollmentCard';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { ORIGIN_LABELS, STATUS_CFG, STATUS_TONE } from './constants';
import { useCourseOptions, useDepartmentOptions } from './enrollData';
import { deadlineCountdown } from './utils';
import { RunsModal } from './RunsModal';
import type { Enrollment } from './types';
import { Checkbox } from '@/components/ui/Checkbox';
import { formatDateNumeric } from '@/lib/format';

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

interface AdminViewProps {
  /** Pré-filtra por curso — usado pela acção "Ver inscrições" da aba Cursos. */
  initialCourseId?: number;
}

export function AdminView({ initialCourseId }: AdminViewProps) {
  const notify = useToast();
  const confirm = useConfirm();
  const [runsFor, setRunsFor] = useState<Enrollment | null>(null);
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

  // As inscrições só são carregadas quando há pelo menos um filtro aplicado
  // (a lista completa pode ter milhares de linhas).
  const hasFilter = Boolean(
    filters.status ||
    filters.mandatory ||
    filters.overdue ||
    filters.courseId ||
    filters.departmentId,
  );

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
    enabled: hasFilter,
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
  const recycle = useApiMutation(
    (id: number) => apiClient.post(`/enrollments/${id}/recycle`),
    {
      invalidateKeys,
      onSuccess: () =>
        notify({ title: 'Reciclagem iniciada', intent: 'success' }),
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
    (recycle.isPending && recycle.variables === id) ||
    (remind.isPending && remind.variables === id);

  // Prazo limite em massa: dispara os PATCH em paralelo; ao concluir invalida as listas.
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

  async function onRecycle(e: Enrollment) {
    const ok = await confirm({
      title: `Iniciar a reciclagem de "${e.user.fullName}" em "${e.course.title}"?`,
      message:
        'A matrícula passa a uma nova realização do curso. O certificado anterior fica no histórico.',
      confirmLabel: 'Reciclar',
    });
    if (ok) recycle.mutate(e.id);
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
      <Card className="mb-5 p-4">
        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            variant="underline"
            icon={MapPin}
            items={STATUS_ITEMS}
            value={filters.status || 'ALL'}
            onValueChange={(v) =>
              updateFilters({ status: v === 'ALL' ? '' : v })
            }
            className="w-full"
          />
          <Select
            variant="underline"
            icon={GraduationCap}
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
            variant="underline"
            icon={Building2}
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
            variant="underline"
            icon={ListFilter}
            items={MANDATORY_ITEMS}
            value={filters.mandatory || 'ALL'}
            onValueChange={(v) =>
              updateFilters({ mandatory: v === 'ALL' ? '' : v })
            }
            className="w-full"
          />
          <label className="flex w-full cursor-pointer items-center gap-2 rounded-control border-[1.5px] border-border-strong bg-surface px-3 py-[9px] text-sm text-ink">
            <Checkbox
              checked={!!filters.overdue}
              onChange={(e) =>
                updateFilters({ overdue: e.target.checked ? 'true' : '' })
              }
            />
            Apenas atrasados
          </label>
        </div>
        <div className="flex justify-end">
          <span className="text-sm text-ink">
            {hasFilter ? (data?.total ?? 0) : 0} matrículas
          </span>
        </div>
      </Card>

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
            {bulkLoading ? 'A aplicar…' : 'Actualizar prazo limite'}
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
            wrapperClassName="space-y-3"
            itemClassName="h-24 rounded-panel bg-surface-sunken"
          />
        )}

        {!hasFilter && (
          <EmptyState
            title="Pesquise para ver inscrições"
            description="Escolha um curso, departamento, estado ou outro filtro acima para listar as inscrições."
          />
        )}

        <div className="space-y-3">
          {hasFilter &&
            !loading &&
            data?.data?.map((e) => (
              <AdminEnrollmentCard
                key={e.id}
                seed={e.courseId}
                title={e.course?.title ?? ''}
                subtitle={e.user?.fullName}
                avatar={{
                  name: e.user?.fullName ?? '',
                  url: e.user?.avatarUrl,
                }}
                lead={
                  <Checkbox
                    checked={selected.includes(e.id)}
                    onChange={() => toggleSelect(e.id)}
                    aria-label={`Seleccionar ${e.user?.fullName ?? ''}`}
                    className="shrink-0"
                  />
                }
                status={{
                  label: STATUS_CFG[e.status]?.label ?? e.status,
                  tone: STATUS_TONE[e.status] ?? 'neutral',
                }}
                tags={[
                  ...(e.mandatory ? ['Obrigatório'] : []),
                  ...(ORIGIN_LABELS[e.origin] ? [ORIGIN_LABELS[e.origin]] : []),
                ]}
                infos={[
                  {
                    icon: Mail,
                    text: e.user?.email ?? '—',
                  },
                  {
                    icon: TrendingUp,
                    text: `Progresso: ${Math.round(e.progressPercent ?? 0)}% · Nota: ${
                      e.certificate?.score != null
                        ? `${e.certificate.score}%`
                        : '—'
                    }`,
                  },
                  {
                    icon: CalendarDays,
                    text: `Inscrição: ${formatDateNumeric(e.enrolledAt)} → Conclusão: ${
                      e.completedAt ? formatDateNumeric(e.completedAt) : '—'
                    }`,
                  },
                  {
                    icon: e.isOverdue ? AlertTriangle : Hourglass,
                    text: `Prazo limite: ${e.deadline ? deadlineCountdown(e.deadline) : '—'}`,
                    danger: !!e.isOverdue,
                  },
                ]}
                footerLabel={
                  [e.user.department?.name, e.user.unit?.name]
                    .filter(Boolean)
                    .join(' · ') || '—'
                }
                actions={
                  <>
                    <Button
                      type="button"
                      intent="primary"
                      size="sm"
                      disabled={rowBusy(e.id)}
                      onClick={() => remind.mutate(e.id)}
                    >
                      <Bell size={15} strokeWidth={1.75} />
                      Enviar lembrete
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          intent="secondary"
                          size="sm"
                          disabled={rowBusy(e.id)}
                        >
                          <MoreHorizontal size={16} strokeWidth={1.75} />
                        </Button>
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
                        <DropdownMenuItem onSelect={() => setRunsFor(e)}>
                          Histórico de realizações
                        </DropdownMenuItem>
                        {e.status === 'COMPLETED' && (
                          <DropdownMenuItem onSelect={() => onRecycle(e)}>
                            Reciclar formação
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
                  </>
                }
              />
            ))}
        </div>
      </div>

      {/* Paginação */}
      {hasFilter && data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-ink">
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
      {runsFor && (
        <RunsModal
          enrollmentId={runsFor.id}
          title={`${runsFor.user.fullName} · ${runsFor.course.title}`}
          onClose={() => setRunsFor(null)}
        />
      )}
    </div>
  );
}

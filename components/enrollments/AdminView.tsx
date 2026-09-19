// components/enrollments/AdminView.tsx
// Separador "Inscrições" da aba Cursos (docs/modulo_courses.md secção 3) —
// tabela filtrável, paginada, com acções de gestão de matrícula. Antes
// desta PR vivia isolada num separador "Gestão (Admin)" próprio do módulo
// standalone /enrollments (ver components/enrollments/*); consolidado aqui
// seguindo o mesmo padrão já usado no repo para learning-paths+lms e
// competencies+competency-map (single sidebar entry, wiring-only).

'use client';

import { AlertTriangle, Hourglass, MoreHorizontal } from 'lucide-react';
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
import { ProgressBar } from '@/components/ui/ProgressBar';
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
  const toastError = (e: Error) => notify({ title: e.message, intent: 'danger' });

  const remove = useApiMutation((id: number) => apiClient.patch(`/enrollments/${id}/cancel`, {}), {
    invalidateKeys,
    onSuccess: () => notify({ title: 'Inscrição removida', intent: 'success' }),
    onError: toastError,
  });
  const reenroll = useApiMutation((id: number) => apiClient.post(`/enrollments/${id}/reenroll`), {
    invalidateKeys,
    onSuccess: () => notify({ title: 'Colaborador reinscrito', intent: 'success' }),
    onError: toastError,
  });
  const resetProgress = useApiMutation(
    (id: number) => apiClient.post(`/enrollments/${id}/reset-progress`),
    {
      invalidateKeys,
      onSuccess: () => notify({ title: 'Progresso reiniciado', intent: 'success' }),
      onError: toastError,
    },
  );
  const remind = useApiMutation((id: number) => apiClient.post(`/enrollments/${id}/remind`), {
    onSuccess: () => notify({ title: 'Lembrete enviado', intent: 'success' }),
    onError: toastError,
  });

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
          apiClient.patch(`/enrollments/${id}/deadline`, { deadline: bulkDeadline }),
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
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

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
      {/* Filtros */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Select
          items={STATUS_ITEMS}
          value={filters.status || 'ALL'}
          onValueChange={(v) => updateFilters({ status: v === 'ALL' ? '' : v })}
          className="w-44"
        />
        <Select
          items={[{ value: 'ALL', label: 'Todos os cursos' }, ...courseOptions]}
          value={filters.courseId || 'ALL'}
          onValueChange={(v) => updateFilters({ courseId: v === 'ALL' ? '' : v })}
          className="w-52"
        />
        <Select
          items={[{ value: 'ALL', label: 'Todos os departamentos' }, ...departmentOptions]}
          value={filters.departmentId || 'ALL'}
          onValueChange={(v) => updateFilters({ departmentId: v === 'ALL' ? '' : v })}
          className="w-52"
        />
        <Select
          items={MANDATORY_ITEMS}
          value={filters.mandatory || 'ALL'}
          onValueChange={(v) => updateFilters({ mandatory: v === 'ALL' ? '' : v })}
          className="w-52"
        />
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={!!filters.overdue}
            onChange={(e) => updateFilters({ overdue: e.target.checked ? 'true' : '' })}
            className="h-4 w-4 rounded border-border-strong accent-primary"
          />
          Apenas atrasados
        </label>
        <span className="ml-auto text-sm text-ink-faint">{data?.total ?? 0} matrículas</span>
      </div>

      {/* Bulk deadline */}
      {selected.length > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-card border border-border bg-info-subtle px-4 py-2.5">
          <span className="text-sm font-medium text-info-ink">{selected.length} seleccionados</span>
          <Input
            type="date"
            value={bulkDeadline}
            onChange={(e) => setBulkDeadline(e.target.value)}
            className="py-1.5 text-sm"
          />
          <Button size="sm" onClick={handleBulkDeadline} disabled={!bulkDeadline || bulkLoading}>
            {bulkLoading ? 'A aplicar…' : 'Actualizar deadline'}
          </Button>
          <button onClick={() => setSelected([])} className="ml-auto text-xs text-info-ink">
            Limpar
          </button>
        </div>
      )}

      {/* Tabela */}
      <div className="overflow-x-auto rounded-card border border-border bg-surface">
        <div className="grid min-w-[1080px] grid-cols-[32px_1.4fr_110px_120px_90px_100px_90px_90px_100px_90px_40px] gap-3 border-b border-border px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-ink-faint">
          <div />
          <div>Colaborador / Curso</div>
          <div>Departamento</div>
          <div>Estado</div>
          <div>Progresso</div>
          <div>Nota</div>
          <div>Origem</div>
          <div>Inscrição</div>
          <div>Conclusão</div>
          <div>Deadline</div>
          <div />
        </div>

        {loading && (
          <div className="p-4">
            <Skeleton
              rows={4}
              wrapperClassName="space-y-2 animate-pulse"
              itemClassName="h-12 rounded-card bg-surface-sunken"
            />
          </div>
        )}

        {!loading &&
          data?.data?.map((e) => (
            <div
              key={e.id}
              className="grid min-w-[1080px] grid-cols-[32px_1.4fr_110px_120px_90px_100px_90px_90px_100px_90px_40px] items-center gap-3 border-b border-border px-4 py-3 last:border-0 hover:bg-surface-sunken"
            >
              <input
                type="checkbox"
                checked={selected.includes(e.id)}
                onChange={() => toggleSelect(e.id)}
                className="h-4 w-4 rounded border-border-strong accent-primary"
              />
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Avatar name={e.user?.fullName ?? ''} url={e.user?.avatarUrl ?? undefined} size="sm" />
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium text-ink">{e.user?.fullName}</div>
                    <div className="truncate text-xs text-ink-faint">{e.user?.email}</div>
                  </div>
                </div>
                <div className="truncate pl-10 text-xs text-ink-muted">{e.course?.title}</div>
              </div>
              <div className="truncate text-xs text-ink-muted">
                {e.user.department?.name ?? '—'}
                {e.user.unit?.name ? <span className="text-ink-faint"> · {e.user.unit.name}</span> : null}
              </div>
              <div>
                <StatusBadge value={e.status} map={STATUS_CFG} variant="dot" />
              </div>
              <div>
                <ProgressBar value={e.progressPercent ?? 0} />
              </div>
              <div className="font-mono text-xs text-ink-muted">
                {e.certificate?.score != null ? `${e.certificate.score}%` : '—'}
              </div>
              <div>
                <span className="text-xs text-ink-faint">{ORIGIN_LABELS[e.origin]}</span>
              </div>
              <div className="text-xs text-ink-faint">
                {new Date(e.enrolledAt).toLocaleDateString('pt')}
              </div>
              <div className="text-xs text-ink-faint">
                {e.completedAt ? new Date(e.completedAt).toLocaleDateString('pt') : '—'}
              </div>
              <div className="text-xs">
                {e.deadline ? (
                  <Badge intent={deadlineIntent(e.deadline, e.isOverdue)}>
                    {e.isOverdue ? (
                      <AlertTriangle size={12} strokeWidth={1.75} className="inline mr-1" />
                    ) : (
                      <Hourglass size={12} strokeWidth={1.75} className="inline mr-1" />
                    )}
                    {deadlineCountdown(e.deadline)}
                  </Badge>
                ) : (
                  <span className="text-ink-faint">—</span>
                )}
              </div>
              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="rounded-control p-1.5 text-ink-muted hover:bg-surface-sunken hover:text-ink"
                      disabled={rowBusy(e.id)}
                    >
                      <MoreHorizontal size={16} strokeWidth={1.75} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => remind.mutate(e.id)}>
                      Enviar lembrete
                    </DropdownMenuItem>
                    {(e.status === 'CANCELLED' || e.status === 'EXPIRED') && (
                      <DropdownMenuItem onSelect={() => reenroll.mutate(e.id)}>
                        Reinscrever
                      </DropdownMenuItem>
                    )}
                    {e.status !== 'CANCELLED' && (
                      <DropdownMenuItem onSelect={() => onResetProgress(e)}>
                        Reiniciar progresso
                      </DropdownMenuItem>
                    )}
                    {e.status !== 'COMPLETED' && e.status !== 'CANCELLED' && (
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
          ))}
      </div>

      {/* Paginação */}
      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-ink-faint">
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

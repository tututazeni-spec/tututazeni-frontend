// components/enrollments/AdminView.tsx
// Separador "Gestão (Admin)" — tabela filtrável, paginada e com
// actualização de deadline em massa. Dados próprios + apresentação.
// Extraído de app/(platform)/enrollments/page.tsx.

'use client';

import { AlertTriangle, Hourglass } from 'lucide-react';
import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/providers/ToastProvider';
import { ORIGIN_LABELS, STATUS_CFG } from './constants';
import { deadlineCountdown, deadlineIntent } from './utils';
import type { Enrollment } from './types';

export function AdminView() {
  const notify = useToast();
  // Um só objecto para os filtros + page: mudar qualquer filtro repõe a
  // página a 1 automaticamente (o checkbox "overdue" não fazia isto antes).
  const [filters, setFilters] = useState({
    status: '',
    mandatory: '',
    overdue: '',
    page: 1,
  });
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkDeadline, setBulkDeadline] = useState('');

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
      invalidateKeys: [queryKeys.enrollments.lists()],
      onSuccess: () => {
        setSelected([]);
        setBulkDeadline('');
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
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

  return (
    <div>
      {/* Filtros */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <select
          value={filters.status}
          onChange={(e) => updateFilters({ status: e.target.value })}
          className="rounded-control border-[1.5px] border-border-strong bg-surface px-3 py-[9px] font-body text-sm text-ink focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent-subtle"
        >
          <option value="">Todos os estados</option>
          <option value="NOT_STARTED">Não iniciado</option>
          <option value="IN_PROGRESS">Em progresso</option>
          <option value="COMPLETED">Concluído</option>
          <option value="OVERDUE">Atrasado</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
        <select
          value={filters.mandatory}
          onChange={(e) => updateFilters({ mandatory: e.target.value })}
          className="rounded-control border-[1.5px] border-border-strong bg-surface px-3 py-[9px] font-body text-sm text-ink focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent-subtle"
        >
          <option value="">Obrigatório e opcional</option>
          <option value="true">Apenas obrigatórios</option>
          <option value="false">Apenas opcionais</option>
        </select>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-muted">
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
        <span className="ml-auto text-sm text-ink-faint">
          {data?.total ?? 0} matrículas
        </span>
      </div>

      {/* Bulk deadline */}
      {selected.length > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-card border border-border bg-info-subtle px-4 py-2.5">
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

      {/* Tabela */}
      <div className="overflow-hidden rounded-card border border-border bg-surface">
        <div className="grid grid-cols-[32px_1fr_180px_120px_100px_120px_80px] gap-3 border-b border-border px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-ink-faint">
          <div />
          <div>Colaborador / Curso</div>
          <div>Estado</div>
          <div>Progresso</div>
          <div>Origem</div>
          <div>Deadline</div>
          <div>Tipo</div>
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
              className="grid grid-cols-[32px_1fr_180px_120px_100px_120px_80px] items-center gap-3 border-b border-border px-4 py-3 last:border-0 hover:bg-surface-sunken"
            >
              <input
                type="checkbox"
                checked={selected.includes(e.id)}
                onChange={() => toggleSelect(e.id)}
                className="h-4 w-4 rounded border-border-strong accent-primary"
              />
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Avatar
                    name={e.user?.fullName ?? ''}
                    url={e.user?.avatarUrl ?? undefined}
                    size="sm"
                  />
                  <div>
                    <div className="text-xs font-medium text-ink">
                      {e.user?.fullName}
                    </div>
                    <div className="text-xs text-ink-faint">
                      {e.user?.email}
                    </div>
                  </div>
                </div>
                <div className="truncate pl-10 text-xs text-ink-muted">
                  {e.course?.title}
                </div>
              </div>
              <div>
                <StatusBadge value={e.status} map={STATUS_CFG} variant="dot" />
              </div>
              <div>
                <ProgressBar value={e.progressPercent ?? 0} />
              </div>
              <div>
                <span className="text-xs text-ink-faint">
                  {ORIGIN_LABELS[e.origin]}
                </span>
              </div>
              <div className="text-xs">
                {e.deadline ? (
                  <Badge intent={deadlineIntent(e.deadline, e.isOverdue)}>
                    {e.isOverdue ? (
                      <AlertTriangle
                        size={12}
                        strokeWidth={1.75}
                        className="inline mr-1"
                      />
                    ) : (
                      <Hourglass
                        size={12}
                        strokeWidth={1.75}
                        className="inline mr-1"
                      />
                    )}
                    {deadlineCountdown(e.deadline)}
                  </Badge>
                ) : (
                  <span className="text-ink-faint">—</span>
                )}
              </div>
              <div>
                {e.mandatory ? (
                  <span className="text-xs font-medium text-danger-ink">
                    Obrigatório
                  </span>
                ) : (
                  <span className="text-xs text-ink-faint">Opcional</span>
                )}
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

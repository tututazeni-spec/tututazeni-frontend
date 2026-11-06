// components/events/EvaluationTab.tsx
// Separador "Avaliação" (docs/events.md secção 10) — avalia a experiência dos
// participantes. "Evento" É coluna própria no spec ("Evento, participante,
// data, avaliação geral…") — listagem cross-evento sobre GET
// /events/evaluations, mesmo critério de Check-in/Comunicação. Base é
// EventParticipant (todos os inscritos, não só quem já avaliou), "estado"
// Avaliado/Pendente calculado no backend — mesma convenção de
// computeCheckinState. Clicar numa linha avaliada abre um modal com a
// repartição por aspecto (organização/conteúdo/local/oradores/logística/
// comunicação) — os 6 ratings extra do spec não cabem numa linha de tabela.
// O formulário de auto-serviço (participante avalia o próprio evento) fica
// em DetailView.tsx, não aqui — esta aba é só gestão/leitura (ADMIN/RH/GESTOR).

'use client';

import { PdfFromCsvButton } from '@/components/ui/PdfFromCsvButton';
import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import {
  Building2,
  Download,
  Landmark,
  MessageSquareText,
  Star,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime } from '@/lib/format';
import { Avatar } from '@/components/ui/Avatar';
import { buttonVariants } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { QueryError } from '@/components/ui/QueryError';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn } from '@/lib/cn';
import { proximityLevel, relativeLabel } from './proximity';
import { EVALUATION_STATUS_CFG } from './constants';
import {
  useDepartmentOptions,
  useEventPickerOptions,
  useUnitOptions,
} from './eventFormData';
import { EventEvaluationDetailModal } from './EventEvaluationDetailModal';
import type { EventEvaluationRow } from './types';

interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

function Stars({ value, dark }: { value: number | null; dark?: boolean }) {
  if (value == null)
    return (
      <span
        className={cn(
          'font-body text-xs',
          dark ? 'text-brand-muted' : 'text-ink-faint',
        )}
      >
        —
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={13}
          strokeWidth={1.75}
          className={
            n <= value
              ? 'fill-accent text-accent'
              : dark
                ? 'text-brand/20'
                : 'text-border-strong'
          }
        />
      ))}
    </span>
  );
}

export function EvaluationTab() {
  const eventOptions = useEventPickerOptions('evaluations');
  const { options: departmentOptions } = useDepartmentOptions();
  const { options: unitOptions } = useUnitOptions();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [filters, setFilters] = useState({
    eventId: 'ALL',
    departmentId: 'ALL',
    unitId: 'ALL',
    page: 1,
  });
  const [detailRow, setDetailRow] = useState<EventEvaluationRow | null>(null);

  function updateFilters(patch: Partial<Omit<typeof filters, 'page'>>) {
    setFilters((f) => ({ ...f, ...patch, page: 1 }));
  }

  const params = {
    page: filters.page,
    limit: 20,
    search: debouncedSearch || undefined,
    eventId: filters.eventId === 'ALL' ? undefined : filters.eventId,
    departmentId:
      filters.departmentId === 'ALL' ? undefined : filters.departmentId,
    unitId: filters.unitId === 'ALL' ? undefined : filters.unitId,
  };

  const { data, isLoading, error, refetch } = useApiQuery<
    Paginated<EventEvaluationRow>
  >(queryKeys.events.evaluations(params), '/events/evaluations', {
    params,
    staleTime: STALE_TIME.DYNAMIC,
    placeholderData: keepPreviousData,
  });
  const rows = data?.data ?? [];

  const exportParams = new URLSearchParams(
    Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
      if (v !== undefined) acc[k] = String(v);
      return acc;
    }, {}),
  ).toString();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <Combobox
            items={[
              { value: 'ALL', label: 'Todos os eventos' },
              ...eventOptions,
            ]}
            value={filters.eventId}
            onValueChange={(v) => updateFilters({ eventId: v })}
            placeholder="Filtrar por evento"
            searchPlaceholder="Pesquisar evento…"
            emptyText="Nenhum evento encontrado"
            className="min-w-[160px] flex-1"
          />
          <Input
            variant="underline"
            placeholder="Pesquisar por nome…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-52"
          />
          <Select
            variant="underline"
            icon={Building2}
            items={[
              { value: 'ALL', label: 'Todos os departamentos' },
              ...departmentOptions,
            ]}
            value={filters.departmentId}
            onValueChange={(v) => updateFilters({ departmentId: v })}
          />
          <Select
            variant="underline"
            icon={Landmark}
            items={[
              { value: 'ALL', label: 'Todas as unidades' },
              ...unitOptions,
            ]}
            value={filters.unitId}
            onValueChange={(v) => updateFilters({ unitId: v })}
          />
        </div>
        <a
          href={`/api/events/evaluations/export?${exportParams}`}
          className={buttonVariants({ intent: 'ghost', size: 'sm' })}
        >
          <Download size={14} strokeWidth={1.75} />
          Exportar
        </a>
        <PdfFromCsvButton
          path={`/events/evaluations/export?${exportParams}`}
          title="Avaliações do evento"
        />
      </div>

      {error ? (
        <QueryError error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton rows={5} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Star}
          title="Sem avaliações"
          description="Ainda não há avaliações para os filtros escolhidos."
        />
      ) : (
        <div className="space-y-3">
          {rows.map((p) => {
            const level = proximityLevel(p.event.startAt);
            return (
              <div
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={() => setDetailRow(p)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setDetailRow(p);
                  }
                }}
                aria-label={`Ver avaliação de ${p.user.fullName}`}
                className="relative flex w-full cursor-pointer flex-wrap items-center gap-3 overflow-hidden rounded-[24px] border border-brand-line bg-surface p-5 text-left shadow-[0_8px_24px_rgba(21,47,89,0.10)] transition hover:border-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
              >
                <Avatar
                  name={p.user.fullName}
                  url={p.user.avatarUrl ?? undefined}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-body text-sm font-semibold text-brand">
                    {p.user.fullName}
                  </div>
                  <div className="truncate font-body text-xs text-brand-muted">
                    {p.event.title}
                    {p.user.department && ` · ${p.user.department.name}`}
                    {p.user.unit && ` · ${p.user.unit.name}`}
                  </div>
                </div>

                <div className="hidden w-32 shrink-0 sm:block">
                  <Stars value={p.evaluation?.rating ?? null} dark />
                </div>
                <div className="hidden w-28 shrink-0 font-body text-xs text-brand-muted md:block">
                  {p.evaluation ? `NPS ${p.evaluation.nps}/10` : '—'}
                </div>
                <div className="hidden w-40 shrink-0 font-body text-xs text-brand-muted lg:block">
                  {p.evaluation?.createdAt
                    ? formatDateTime(p.evaluation.createdAt)
                    : '—'}
                </div>

                <span
                  className={cn(
                    'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 font-body text-xs font-semibold',
                    level.cls,
                  )}
                >
                  {relativeLabel(p.event.startAt)}
                </span>
                <StatusBadge
                  value={p.evaluationStatus}
                  map={EVALUATION_STATUS_CFG}
                  variant="dot"
                />

                {p.evaluation?.comment && (
                  <MessageSquareText
                    size={14}
                    strokeWidth={1.75}
                    className="shrink-0 text-brand-muted"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {data && data.meta.totalPages > 1 && (
        <Pagination
          page={data.meta.page}
          totalPages={data.meta.totalPages}
          onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
        />
      )}

      {detailRow && (
        <EventEvaluationDetailModal
          row={detailRow}
          onClose={() => setDetailRow(null)}
        />
      )}
    </div>
  );
}

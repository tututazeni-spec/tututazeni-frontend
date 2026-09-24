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

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { Download, MessageSquareText, Star } from 'lucide-react';
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
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { QueryError } from '@/components/ui/QueryError';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EVALUATION_STATUS_CFG } from './constants';
import { useDepartmentOptions, useEventPickerOptions, useUnitOptions } from './eventFormData';
import type { EventEvaluationRow } from './types';

interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const ASPECTS: Array<{ key: keyof NonNullable<EventEvaluationRow['evaluation']>; label: string }> = [
  { key: 'rating', label: 'Avaliação geral' },
  { key: 'organizationRating', label: 'Organização' },
  { key: 'contentRating', label: 'Conteúdo' },
  { key: 'locationRating', label: 'Local' },
  { key: 'speakersRating', label: 'Oradores' },
  { key: 'logisticsRating', label: 'Logística' },
  { key: 'communicationRating', label: 'Comunicação' },
];

function Stars({ value }: { value: number | null }) {
  if (value == null) return <span className="font-body text-xs text-ink-faint">—</span>;
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={13}
          strokeWidth={1.75}
          className={n <= value ? 'fill-accent text-accent' : 'text-border-strong'}
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
    departmentId: filters.departmentId === 'ALL' ? undefined : filters.departmentId,
    unitId: filters.unitId === 'ALL' ? undefined : filters.unitId,
  };

  const { data, isLoading, error, refetch } = useApiQuery<Paginated<EventEvaluationRow>>(
    queryKeys.events.evaluations(params),
    '/events/evaluations',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );
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
            items={[{ value: 'ALL', label: 'Todos os eventos' }, ...eventOptions]}
            value={filters.eventId}
            onValueChange={(v) => updateFilters({ eventId: v })}
            placeholder="Filtrar por evento"
            searchPlaceholder="Pesquisar evento…"
            emptyText="Nenhum evento encontrado"
            className="w-64"
          />
          <Input
            placeholder="Pesquisar por nome…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-52"
          />
          <Select
            items={[{ value: 'ALL', label: 'Todos os departamentos' }, ...departmentOptions]}
            value={filters.departmentId}
            onValueChange={(v) => updateFilters({ departmentId: v })}
          />
          <Select
            items={[{ value: 'ALL', label: 'Todas as unidades' }, ...unitOptions]}
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
      </div>

      {error ? (
        <QueryError error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton rows={5} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Star}
          title="Sem avaliações"
          description="Nenhum participante corresponde aos filtros escolhidos."
        />
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          {rows.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => p.evaluation && setDetailRow(p)}
              disabled={!p.evaluation}
              className="flex w-full flex-wrap items-center gap-3 border-b border-border px-4 py-3 text-left last:border-0 enabled:hover:bg-surface-sunken disabled:cursor-default"
            >
              <Avatar name={p.user.fullName} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-body text-sm font-medium text-ink">{p.user.fullName}</div>
                <div className="truncate font-body text-xs text-ink-faint">
                  {p.event.title}
                  {p.user.department && ` · ${p.user.department.name}`}
                  {p.user.unit && ` · ${p.user.unit.name}`}
                </div>
              </div>

              <div className="hidden w-32 shrink-0 sm:block">
                <Stars value={p.evaluation?.rating ?? null} />
              </div>
              <div className="hidden w-28 shrink-0 font-body text-xs text-ink-faint md:block">
                {p.evaluation ? `NPS ${p.evaluation.nps}/10` : '—'}
              </div>
              <div className="hidden w-40 shrink-0 font-body text-xs text-ink-faint lg:block">
                {p.evaluation?.createdAt ? formatDateTime(p.evaluation.createdAt) : '—'}
              </div>

              <StatusBadge value={p.evaluationStatus} map={EVALUATION_STATUS_CFG} />

              {p.evaluation?.comment && (
                <MessageSquareText size={14} strokeWidth={1.75} className="shrink-0 text-ink-faint" />
              )}
            </button>
          ))}
        </div>
      )}

      {data && data.meta.totalPages > 1 && (
        <Pagination
          page={data.meta.page}
          totalPages={data.meta.totalPages}
          onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
        />
      )}

      {detailRow?.evaluation && (
        <Modal open onOpenChange={(open) => !open && setDetailRow(null)}>
          <ModalContent
            title="Avaliação do evento"
            description={`${detailRow.user.fullName} — ${detailRow.event.title}`}
          >
            <div className="mt-4 space-y-3">
              {ASPECTS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <span className="font-body text-sm text-ink-muted">{label}</span>
                  <Stars value={(detailRow.evaluation?.[key] as number | null) ?? null} />
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                <span className="font-body text-sm text-ink-muted">
                  Recomendaria a um colega (NPS)
                </span>
                <span className="font-mono text-sm text-ink">{detailRow.evaluation.nps}/10</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-body text-sm text-ink-muted">Participaria novamente</span>
                <Stars value={detailRow.evaluation.wouldAttendAgain} />
              </div>
              {detailRow.evaluation.comment && (
                <div className="border-t border-border pt-3">
                  <div className="mb-1 font-body text-xs text-ink-faint">Comentário</div>
                  <p className="font-body text-sm text-ink">{detailRow.evaluation.comment}</p>
                </div>
              )}
            </div>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}

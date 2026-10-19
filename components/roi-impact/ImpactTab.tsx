// components/roi-impact/ImpactTab.tsx
// Tab "Impacto no Negócio" (docs/roi-impact.md §3): categorias de impacto +
// tabela + "Novo Registo de Impacto". Participantes/iniciativa vêm
// resolvidos pelo backend a partir da origem — esta tab nunca duplica esses
// valores, só apresenta o que a API devolve.

'use client';

import { useState } from 'react';
import {
  ArrowRightLeft,
  Database,
  Percent,
  Plus,
  Target,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Card, CardBody } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { NavyPanel, NAVY_PANEL_VARIANTS_SOFT } from './NavyPanel';
import { PALETTE } from '@/components/onboarding/TemplateCard';
import { EventBadge } from '@/components/events/EventBadges';
import { Metric } from '@/components/events/EventListCard';
import { cn } from '@/lib/cn';
import { DonutChart } from '@/components/ui/charts/DonutChart';
import { NewImpactRecordModal } from './NewImpactRecordModal';
import {
  INITIATIVE_TYPE_LABELS,
  IMPACT_CATEGORY_LABELS,
  IMPACT_SUBJECT_TYPE_LABELS,
} from './utils';
import type { ImpactCategorySummaryRow, ImpactRecordListData } from './types';

const PAGE_SIZE = 9;

export function ImpactTab() {
  const notify = useToast();
  const confirm = useConfirm();
  const { data: me } = useCurrentUser();
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading: loading } = useApiQuery<ImpactRecordListData>(
    queryKeys.roiImpact.impactRecords(),
    '/roi-impact/impact-records',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const { data: byCategory } = useApiQuery<ImpactCategorySummaryRow[]>(
    queryKeys.roiImpact.impactByCategory(),
    '/roi-impact/impact-records/by-category',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const validate = useApiMutation(
    (id: number) =>
      apiClient.post(`/roi-impact/impact-records/${id}/validate`, {
        validatedById: me?.id,
      }),
    {
      invalidateKeys: [
        queryKeys.roiImpact.impactRecords(),
        queryKeys.roiImpact.impactByCategory(),
      ],
      onSuccess: () => notify({ title: 'Registo validado', intent: 'success' }),
      onError: (e) =>
        notify({
          title: 'Erro ao validar',
          description: e.message,
          intent: 'danger',
        }),
    },
  );

  const remove = useApiMutation(
    (id: number) => apiClient.delete(`/roi-impact/impact-records/${id}`),
    {
      invalidateKeys: [
        queryKeys.roiImpact.impactRecords(),
        queryKeys.roiImpact.impactByCategory(),
      ],
      onSuccess: () => notify({ title: 'Registo apagado', intent: 'success' }),
      onError: (e) =>
        notify({
          title: 'Erro ao apagar',
          description: e.message,
          intent: 'danger',
        }),
    },
  );

  const askRemove = async (id: number, name: string) => {
    if (
      await confirm({
        title: `Apagar o registo "${name}"?`,
        message: 'Esta ação não pode ser desfeita.',
        confirmLabel: 'Apagar',
        destructive: true,
      })
    ) {
      remove.mutate(id);
    }
  };

  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-3 animate-pulse"
        itemClassName="h-14 rounded-card bg-surface-sunken"
      />
    );

  const records = data?.records ?? [];
  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = records.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-body text-sm text-ink-muted">
          {data?.total ?? 0} registo(s) — liga iniciativas de RH/Academia a
          indicadores de negócio reais
        </p>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus size={14} strokeWidth={1.75} className="mr-1" />
          Novo Registo de Impacto
        </Button>
      </div>

      {(byCategory?.length ?? 0) > 0 && (
        <div className="flex flex-wrap items-start gap-4">
          <Card className="shrink-0">
            <CardBody>
              <DonutChart
                size={140}
                centerLabel="Registos"
                data={byCategory!.map((c) => ({
                  label: IMPACT_CATEGORY_LABELS[c.category] ?? c.category,
                  value: c.count,
                }))}
              />
            </CardBody>
          </Card>
          <div className="grid flex-1 grid-cols-2 gap-4 md:grid-cols-4">
            {byCategory!.map((c, i) => {
              const pct =
                c.avgAttributionPercent != null
                  ? Math.max(0, Math.min(100, c.avgAttributionPercent))
                  : null;
              return (
                <div
                  key={c.category}
                  className={cn(
                    'flex min-w-0 flex-col justify-between gap-4 rounded-panel bg-gradient-to-br p-4 text-white shadow-[0_8px_24px_rgba(15,31,61,0.25)]',
                    NAVY_PANEL_VARIANTS_SOFT[
                      i % NAVY_PANEL_VARIANTS_SOFT.length
                    ],
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-display text-sm font-semibold leading-snug">
                      {IMPACT_CATEGORY_LABELS[c.category] ?? c.category}
                    </p>
                    <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-0.5 font-body text-xs font-semibold">
                      {c.count} {c.count === 1 ? 'registo' : 'registos'}
                    </span>
                  </div>
                  <div>
                    <p className="font-display text-3xl font-extrabold leading-none">
                      {pct != null ? `${c.avgAttributionPercent}%` : '—'}
                    </p>
                    <p className="mt-1 font-body text-xs font-medium text-white/80">
                      atribuição média
                    </p>
                    <div
                      className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15"
                      role="img"
                      aria-label={
                        pct != null
                          ? `Atribuição média de ${pct}%`
                          : 'Sem atribuição registada'
                      }
                    >
                      <div
                        className="h-full rounded-full bg-white"
                        style={{ width: `${pct ?? 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {records.length === 0 ? (
        <EmptyState
          title="Sem registos de impacto"
          description="Cria o primeiro registo para ligar uma iniciativa a um indicador de negócio real."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pageRows.map((r) => {
            const palette = PALETTE[Math.abs(r.id) % PALETTE.length];
            return (
              <div
                key={r.id}
                className="relative min-w-0 overflow-hidden rounded-[24px] border border-[#E3EAF4] bg-white shadow-[0_8px_24px_rgba(21,47,89,0.10)]"
              >
                <div
                  aria-hidden
                  className="absolute right-0 top-0 hidden h-[58%] w-[26%] items-center justify-center text-white/70 sm:flex"
                  style={{
                    clipPath: 'polygon(16% 0, 100% 0, 100% 100%, 0 76%)',
                    background: `linear-gradient(160deg, ${palette[0]} 0%, ${palette[2]} 100%)`,
                  }}
                >
                  <Target size={44} strokeWidth={1.25} />
                </div>

                <div className="relative space-y-5 p-6 sm:pr-[28%]">
                  <div className="flex flex-wrap items-center gap-2">
                    <EventBadge color={r.validatedById ? '#16A765' : '#F28C28'}>
                      {r.validatedById ? 'Validado' : 'Por validar'}
                    </EventBadge>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      aria-hidden
                      className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full text-white"
                      style={{ background: palette[3] }}
                    >
                      <Target size={28} strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="break-words font-display text-[24px] font-bold leading-tight text-[#0F1F3D]">
                        {r.indicatorName}
                      </h3>
                      <p className="mt-0.5 break-words text-base text-[#49658A]">
                        {IMPACT_CATEGORY_LABELS[r.category] ?? r.category}
                        {r.initiative ? ` · ${r.initiative}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-y-3 divide-x divide-[#E6ECF4]">
                    <Metric icon={Users}>
                      Sujeito: {r.subjectLabel ?? '—'} (
                      {IMPACT_SUBJECT_TYPE_LABELS[r.subjectType] ??
                        r.subjectType}
                      )
                    </Metric>
                    <Metric icon={ArrowRightLeft}>
                      Antes → Depois: {r.valueBefore ?? '—'} →{' '}
                      {r.valueAfter ?? '—'}
                      {r.variation != null && ` (variação ${r.variation})`}
                    </Metric>
                  </div>
                  <div className="flex flex-wrap items-center gap-y-3 divide-x divide-[#E6ECF4]">
                    <Metric icon={Percent}>
                      Atribuição:{' '}
                      {r.attributionPercent != null
                        ? `${r.attributionPercent}%`
                        : '—'}
                    </Metric>
                    <Metric icon={TrendingUp}>
                      Impacto atribuído:{' '}
                      {r.attributedImpact != null ? r.attributedImpact : '—'}
                    </Metric>
                    {r.dataSource && (
                      <Metric icon={Database}>Fonte: {r.dataSource}</Metric>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-[#E6ECF4] pt-4">
                    {!r.validatedById && (
                      <Button
                        size="sm"
                        disabled={validate.isPending}
                        onClick={() => validate.mutate(r.id)}
                      >
                        Validar
                      </Button>
                    )}
                    <button
                      type="button"
                      aria-label={`Apagar o registo ${r.indicatorName}`}
                      title="Apagar"
                      disabled={remove.isPending && remove.variables === r.id}
                      onClick={() => askRemove(r.id, r.indicatorName)}
                      className="rounded-full p-2 text-[#49658A] transition-colors hover:bg-[#C23A52]/10 hover:text-[#C23A52] disabled:opacity-40"
                    >
                      <Trash2 size={16} strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Pagination
        page={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {modalOpen && (
        <NewImpactRecordModal onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}

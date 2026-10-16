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
import { NavyPanel, NavyPanelRow, NAVY_PANEL_VARIANTS_SOFT } from './NavyPanel';
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
          {pageRows.map((r) => (
            <NavyPanel
              key={r.id}
              variant={r.id}
              soft
              className="flex h-full min-w-0 flex-col"
              title={r.indicatorName}
              icon={Target}
              aside={
                <span className="rounded-full bg-white/10 px-3 py-1 font-body text-xs font-semibold">
                  {r.validatedById ? 'Validado' : 'Por validar'}
                </span>
              }
            >
              <p className="-mt-2 mb-3 font-body text-xs font-medium text-white">
                {IMPACT_CATEGORY_LABELS[r.category] ?? r.category}
                {r.initiative ? ` · ${r.initiative}` : ''}
              </p>
              <ul className="grid grid-cols-1 gap-2 font-semibold text-white md:grid-cols-2 xl:grid-cols-3">
                <NavyPanelRow iconBadge iconClassName="text-white" icon={Users}>
                  Sujeito:{' '}
                  <strong className="font-extrabold">
                    {r.subjectLabel ?? '—'}
                  </strong>{' '}
                  ({IMPACT_SUBJECT_TYPE_LABELS[r.subjectType] ?? r.subjectType})
                </NavyPanelRow>
                <NavyPanelRow
                  iconBadge
                  iconClassName="text-white"
                  icon={ArrowRightLeft}
                >
                  Antes → Depois:{' '}
                  <strong className="font-extrabold">
                    {r.valueBefore ?? '—'} → {r.valueAfter ?? '—'}
                  </strong>
                  {r.variation != null && <> (variação {r.variation})</>}
                </NavyPanelRow>
                <NavyPanelRow
                  iconBadge
                  iconClassName="text-white"
                  icon={Percent}
                >
                  Atribuição:{' '}
                  <strong className="font-extrabold">
                    {r.attributionPercent != null
                      ? `${r.attributionPercent}%`
                      : '—'}
                  </strong>
                </NavyPanelRow>
                <NavyPanelRow
                  iconBadge
                  iconClassName="text-white"
                  icon={TrendingUp}
                >
                  Impacto atribuído:{' '}
                  <strong className="font-extrabold">
                    {r.attributedImpact != null ? r.attributedImpact : '—'}
                  </strong>
                </NavyPanelRow>
                {r.dataSource && (
                  <NavyPanelRow
                    iconBadge
                    iconClassName="text-white"
                    icon={Database}
                  >
                    Fonte:{' '}
                    <strong className="font-extrabold">{r.dataSource}</strong>
                  </NavyPanelRow>
                )}
              </ul>
              <div className="mt-auto flex items-center justify-end gap-2 pt-3">
                {!r.validatedById && (
                  <button
                    type="button"
                    disabled={validate.isPending}
                    onClick={() => validate.mutate(r.id)}
                    className="rounded-full border border-white/40 px-2.5 py-0.5 font-body text-[11px] font-medium text-white/90 transition-colors hover:border-white hover:bg-white/15 hover:text-white disabled:opacity-40"
                  >
                    Validar
                  </button>
                )}
                <button
                  type="button"
                  aria-label={`Apagar o registo ${r.indicatorName}`}
                  title="Apagar"
                  disabled={remove.isPending && remove.variables === r.id}
                  onClick={() => askRemove(r.id, r.indicatorName)}
                  className="rounded-full p-1 text-white/50 transition-colors hover:bg-white/15 hover:text-white disabled:opacity-40"
                >
                  <Trash2 size={14} strokeWidth={1.75} />
                </button>
              </div>
            </NavyPanel>
          ))}
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

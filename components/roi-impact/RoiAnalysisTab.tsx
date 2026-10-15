// components/roi-impact/RoiAnalysisTab.tsx
// Tab "ROI da Formação" (docs/roi-impact.md §2): tabela de análises +
// "Nova Análise de ROI". Participantes/custo/benefício vêm resolvidos pelo
// backend a partir da iniciativa de origem — esta tab nunca duplica esses
// valores, só apresenta o que a API devolve.

'use client';

import { useState } from 'react';
import {
  BarChart3,
  Clock,
  Info,
  Lightbulb,
  Plus,
  Trash2,
  TrendingUp,
  TriangleAlert,
  Users,
  Wallet,
} from 'lucide-react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { NewRoiAnalysisWizard } from './NewRoiAnalysisWizard';
import { NavyPanel, NavyPanelRow } from './NavyPanel';
import {
  fmt$,
  INITIATIVE_TYPE_LABELS,
  ANALYSIS_STATUS_LABELS,
  CONFIDENCE_LABELS,
} from './utils';
import type { RoiAnalysisListData } from './types';

const PAGE_SIZE = 10;

export function RoiAnalysisTab() {
  const notify = useToast();
  const confirm = useConfirm();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading: loading } = useApiQuery<RoiAnalysisListData>(
    queryKeys.roiImpact.analyses(),
    '/roi-impact/analyses',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const approve = useApiMutation(
    (id: number) =>
      apiClient.post(`/roi-impact/analyses/${id}/approve`, {
        status: 'VALIDADO',
      }),
    {
      invalidateKeys: [
        queryKeys.roiImpact.analyses(),
        queryKeys.roiImpact.executive(),
      ],
      onSuccess: () => notify({ title: 'Análise validada', intent: 'success' }),
      onError: (e) =>
        notify({
          title: 'Erro ao validar',
          description: e.message,
          intent: 'danger',
        }),
    },
  );

  const remove = useApiMutation(
    (id: number) => apiClient.delete(`/roi-impact/analyses/${id}`),
    {
      invalidateKeys: [
        queryKeys.roiImpact.analyses(),
        queryKeys.roiImpact.executive(),
      ],
      onSuccess: () => notify({ title: 'Análise apagada', intent: 'success' }),
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
        title: `Apagar a análise "${name}"?`,
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

  const analyses = data?.analyses ?? [];
  const q = query.trim().toLowerCase();
  const filtered = q
    ? analyses.filter((a) => a.name.toLowerCase().includes(q))
    : analyses;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-body text-sm text-ink-muted">
          {data?.total ?? 0} análise(s) — Quanto custou? O que mudou? Valeu a
          pena?
        </p>
        <Button size="sm" onClick={() => setWizardOpen(true)}>
          <Plus size={14} strokeWidth={1.75} className="mr-1" />
          Nova Análise de ROI
        </Button>
      </div>

      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setPage(1);
        }}
        placeholder="Pesquisar iniciativa…"
        className="w-64"
      />

      {filtered.length === 0 ? (
        <EmptyState
          title="Sem resultados"
          description="Cria a primeira análise para começar a medir o retorno de uma iniciativa."
        />
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pageRows.map((a) => {
            const insufficient = a.status === 'DADOS_INSUFICIENTES';
            return (
              <NavyPanel
                key={a.id}
                variant={a.id}
                soft
                className="flex h-full flex-col"
                title={a.name}
                icon={Lightbulb}
                aside={
                  <span className="rounded-full bg-white/10 px-3 py-1 font-body text-xs font-semibold">
                    {ANALYSIS_STATUS_LABELS[a.status] ?? a.status}
                  </span>
                }
              >
                <p className="-mt-2 mb-3 font-body text-xs font-medium text-white">
                  {INITIATIVE_TYPE_LABELS[a.initiativeType] ?? a.initiativeType}
                  {a.initiative ? ` · ${a.initiative}` : ''}
                </p>
                <ul className="grid grid-cols-1 gap-2 font-semibold text-white">
                  <NavyPanelRow
                    iconBadge
                    iconClassName="text-white"
                    icon={Users}
                  >
                    Participantes:{' '}
                    <strong className="font-extrabold">
                      {a.participants ?? '—'}
                    </strong>
                  </NavyPanelRow>
                  <NavyPanelRow
                    iconBadge
                    iconClassName="text-white"
                    icon={Wallet}
                  >
                    Custo total:{' '}
                    <strong className="font-extrabold">
                      {fmt$(a.totalCost)}
                    </strong>
                    {a.costPerParticipant != null && (
                      <> ({fmt$(a.costPerParticipant)} / partic.)</>
                    )}
                  </NavyPanelRow>
                  <NavyPanelRow
                    iconBadge
                    iconClassName="text-white"
                    icon={TrendingUp}
                  >
                    Benefício realizado:{' '}
                    <strong className="font-extrabold">
                      {a.realizedBenefit != null
                        ? fmt$(a.realizedBenefit)
                        : '—'}
                    </strong>
                  </NavyPanelRow>
                  <NavyPanelRow
                    iconBadge
                    iconClassName="text-white"
                    icon={BarChart3}
                  >
                    ROI:{' '}
                    <strong className="font-extrabold">
                      {a.roiPercent != null ? `${a.roiPercent}%` : '—'}
                    </strong>
                  </NavyPanelRow>
                  <NavyPanelRow
                    iconBadge
                    iconClassName="text-white"
                    icon={Clock}
                  >
                    Payback:{' '}
                    <strong className="font-extrabold">
                      {a.paybackMonths != null
                        ? `${a.paybackMonths} meses`
                        : '—'}
                    </strong>
                  </NavyPanelRow>
                  <NavyPanelRow
                    iconBadge
                    icon={insufficient ? TriangleAlert : Info}
                    iconClassName={
                      insufficient ? 'text-[#FDE047]' : 'text-white'
                    }
                  >
                    Confiança:{' '}
                    <strong className="font-extrabold">
                      {a.confidenceLevel
                        ? (CONFIDENCE_LABELS[a.confidenceLevel] ??
                          a.confidenceLevel)
                        : '—'}
                    </strong>
                  </NavyPanelRow>
                </ul>
                <div className="mt-auto flex items-center justify-end gap-2 pt-3">
                  {a.status === 'CALCULADO' ? (
                    <Button
                      size="sm"
                      intent="secondary"
                      loading={approve.isPending}
                      onClick={() => approve.mutate(a.id)}
                    >
                      Validar
                    </Button>
                  ) : null}
                  <button
                    type="button"
                    aria-label={`Apagar a análise ${a.name}`}
                    title="Apagar"
                    disabled={remove.isPending && remove.variables === a.id}
                    onClick={() => askRemove(a.id, a.name)}
                    className="rounded-full p-1 text-white/50 transition-colors hover:bg-white/15 hover:text-white disabled:opacity-40"
                  >
                    <Trash2 size={14} strokeWidth={1.75} />
                  </button>
                </div>
              </NavyPanel>
            );
          })}
        </div>
      )}
      <Pagination
        page={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {wizardOpen && (
        <NewRoiAnalysisWizard onClose={() => setWizardOpen(false)} />
      )}
    </div>
  );
}

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
import { PALETTE } from '@/components/onboarding/TemplateCard';
import { EventBadge } from '@/components/events/EventBadges';
import { Metric } from '@/components/events/EventListCard';
import {
  fmt$,
  INITIATIVE_TYPE_LABELS,
  ANALYSIS_STATUS_LABELS,
  CONFIDENCE_LABELS,
} from './utils';
import type { RoiAnalysisListData } from './types';

// Cor sólida da etiqueta de estado da análise.
const STATUS_COLOR: Record<string, string> = {
  VALIDADO: '#16A765',
  CALCULADO: '#1267B8',
  REVISTO: '#1267B8',
  DADOS_INSUFICIENTES: '#F28C28',
  EM_MEDICAO: '#7B5CD6',
  EM_PREPARACAO: '#64748B',
  ARQUIVADO: '#64748B',
};

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
        wrapperClassName="space-y-3"
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
        <div className="grid grid-cols-1 gap-4">
          {pageRows.map((a) => {
            const insufficient = a.status === 'DADOS_INSUFICIENTES';
            const palette = PALETTE[Math.abs(a.id) % PALETTE.length];
            return (
              <div
                key={a.id}
                className="relative overflow-hidden rounded-[24px] border border-brand-line bg-white shadow-[0_8px_24px_rgba(21,47,89,0.10)]"
              >
                <div
                  aria-hidden
                  className="absolute right-0 top-0 hidden h-[58%] w-[26%] items-center justify-center text-white/70 sm:flex"
                  style={{
                    clipPath: 'polygon(16% 0, 100% 0, 100% 100%, 0 76%)',
                    background: `linear-gradient(160deg, ${palette[0]} 0%, ${palette[2]} 100%)`,
                  }}
                >
                  <TrendingUp size={44} strokeWidth={1.25} />
                </div>

                <div className="relative space-y-5 p-6 sm:pr-[28%]">
                  <div className="flex flex-wrap items-center gap-2">
                    <EventBadge color={STATUS_COLOR[a.status] ?? '#64748B'}>
                      {ANALYSIS_STATUS_LABELS[a.status] ?? a.status}
                    </EventBadge>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      aria-hidden
                      className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full text-white"
                      style={{ background: palette[3] }}
                    >
                      <Lightbulb size={28} strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="break-words font-display text-[24px] font-bold leading-tight text-brand">
                        {a.name}
                      </h3>
                      <p className="mt-0.5 break-words text-base text-brand-muted">
                        {INITIATIVE_TYPE_LABELS[a.initiativeType] ??
                          a.initiativeType}
                        {a.initiative ? ` · ${a.initiative}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-y-3 divide-x divide-brand-line">
                    <Metric icon={Users}>
                      Participantes: {a.participants ?? '—'}
                    </Metric>
                    <Metric icon={Wallet}>
                      Custo total: {fmt$(a.totalCost)}
                      {a.costPerParticipant != null &&
                        ` (${fmt$(a.costPerParticipant)} / partic.)`}
                    </Metric>
                    <Metric icon={TrendingUp}>
                      Benefício realizado:{' '}
                      {a.realizedBenefit != null
                        ? fmt$(a.realizedBenefit)
                        : '—'}
                    </Metric>
                  </div>
                  <div className="flex flex-wrap items-center gap-y-3 divide-x divide-brand-line">
                    <Metric icon={BarChart3}>
                      ROI: {a.roiPercent != null ? `${a.roiPercent}%` : '—'}
                    </Metric>
                    <Metric icon={Clock}>
                      Payback:{' '}
                      {a.paybackMonths != null
                        ? `${a.paybackMonths} meses`
                        : '—'}
                    </Metric>
                    <Metric
                      icon={insufficient ? TriangleAlert : Info}
                      iconClassName={
                        insufficient ? 'text-danger' : 'text-brand-muted'
                      }
                    >
                      Confiança:{' '}
                      {a.confidenceLevel
                        ? (CONFIDENCE_LABELS[a.confidenceLevel] ??
                          a.confidenceLevel)
                        : '—'}
                    </Metric>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-brand-line pt-4">
                    {a.status === 'CALCULADO' ? (
                      <Button
                        size="sm"
                        disabled={approve.isPending}
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
                      className="rounded-full p-2 text-brand-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-40"
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

      {wizardOpen && (
        <NewRoiAnalysisWizard onClose={() => setWizardOpen(false)} />
      )}
    </div>
  );
}

// components/competencies/OverviewView.tsx
// Separador "Visão Geral" (docs/módulo_competencies.md §1) — painel de
// KPIs organizacionais do módulo, primeira aba da estrutura final do
// spec. Consome GET /competencies/overview (ADMIN/RH/GESTOR, mesmo nível
// de acesso do "Dashboard RH"). Segue o mesmo padrão visual de
// DashboardView.tsx: ProgressBar mono-cor, severidade comunicada por
// texto, não por recoloração.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { CATEGORY_CFG } from './constants';
import type { CompetencyCategory, CompetencyOverview } from './types';

export function OverviewView() {
  const { data, isLoading } = useApiQuery<CompetencyOverview>(
    queryKeys.competencies.overview(),
    '/competencies/overview',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={4} />;

  return (
    <div className="space-y-6">
      {/* KPIs gerais */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Total de competências" value={data.total} intent="primary" />
        <KpiCard label="Competências activas" value={data.active} intent="success" />
        <KpiCard
          label="Em revisão"
          value={data.inReview}
          intent={data.inReview > 0 ? 'warning' : 'primary'}
        />
        <KpiCard
          label="Competências críticas"
          value={data.critical}
          intent={data.critical > 0 ? 'danger' : 'primary'}
        />
      </div>

      {/* Por categoria */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Técnicas" value={data.byCategory.technical} intent="info" />
        <KpiCard label="Comportamentais" value={data.byCategory.behavioral} intent="primary" />
        <KpiCard label="Liderança" value={data.byCategory.leadership} intent="accent" />
        <KpiCard label="Funcionais" value={data.byCategory.functional} intent="danger" />
      </div>

      {/* Avaliação da organização */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Competências estratégicas" value={data.strategic} intent="accent" />
        <KpiCard label="Colaboradores avaliados" value={data.evaluatedUsers} intent="info" />
        <KpiCard
          label="Média global de proficiência"
          value={data.avgProficiency}
          intent="success"
        />
        <KpiCard
          label="Avaliações pendentes"
          value={data.pendingEvaluations ?? '—'}
          intent="primary"
        />
      </div>

      {/* Alertas de competências críticas */}
      {data.criticalAlerts.length > 0 && (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Alertas — competências críticas com lacunas
          </div>
          {data.criticalAlerts.map((c) => {
            const pct =
              data.evaluatedUsers > 0
                ? Math.round((c.usersWithGap / data.evaluatedUsers) * 100)
                : 0;
            return (
              <div
                key={c.id}
                className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0"
              >
                <div className="flex-1">
                  <div className="font-body text-sm font-medium text-ink">{c.name}</div>
                  <StatusBadge
                    value={c.category as CompetencyCategory}
                    map={CATEGORY_CFG}
                  />
                </div>
                <div className="w-40">
                  <div className="mb-1 flex justify-between font-body text-xs text-ink-faint">
                    <span>{c.usersWithGap} utilizadores</span>
                    <span className="font-semibold text-danger">{pct}%</span>
                  </div>
                  <ProgressBar value={pct} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Competências com maior lacuna */}
      <div className="overflow-hidden rounded-card border border-border bg-surface">
        <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
          Competências com maior lacuna
        </div>
        {data.biggestGaps.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="Sem lacunas identificadas"
              description="Nenhum colaborador tem um nível abaixo do alvo definido."
            />
          </div>
        ) : (
          data.biggestGaps.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0"
            >
              <div className="flex-1">
                <div className="font-body text-sm font-medium text-ink">{c.name}</div>
                <StatusBadge value={c.category as CompetencyCategory} map={CATEGORY_CFG} />
              </div>
              <span className="font-data text-sm text-ink-muted">
                {c.usersWithGap} utilizadores com lacuna
              </span>
            </div>
          ))
        )}
      </div>

      {/* Top competências */}
      {data.topCompetencies.length > 0 && (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Top competências da organização
          </div>
          {data.topCompetencies.map((t, idx) => (
            <div
              key={t.competencyId}
              className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0"
            >
              <span className="w-6 text-center font-data text-lg font-bold text-ink-faint">
                {idx + 1}
              </span>
              <div className="flex-1">
                <div className="font-body text-sm font-medium text-ink">
                  {t.competency?.name ?? '—'}
                </div>
                <StatusBadge
                  value={(t.competency?.category ?? 'HARD_SKILL') as CompetencyCategory}
                  map={CATEGORY_CFG}
                />
              </div>
              <div className="text-right">
                <div className="font-data text-sm text-ink-muted">
                  {t._count.competencyId} utilizadores
                </div>
                <div className="font-body text-xs text-ink-faint">
                  Nível médio: {t.avgLevel}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

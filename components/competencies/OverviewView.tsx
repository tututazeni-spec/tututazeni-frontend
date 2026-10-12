// components/competencies/OverviewView.tsx
// Separador "Visão Geral" (docs/módulo_competencies.md §1) — painel de
// KPIs organizacionais do módulo, primeira aba da estrutura final do
// spec. Consome GET /competencies/overview (ADMIN/RH/GESTOR, mesmo nível
// de acesso do "Dashboard RH"). Segue o mesmo padrão visual de
// DashboardView.tsx: ProgressBar mono-cor, severidade comunicada por
// texto, não por recoloração.

'use client';

import {
  AlertTriangle,
  Award,
  Briefcase,
  CheckCircle2,
  ClipboardList,
  Clock,
  Layers,
  Target,
  TrendingUp,
  UserCheck,
  Users,
  Wrench,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
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
      <div className="grid grid-cols-4 gap-4">
        <NavyStatCard
          icon={Layers}
          tone="blue"
          label="Total de competências"
          value={data.total}
        />
        <NavyStatCard
          icon={CheckCircle2}
          tone="green"
          label="Competências activas"
          value={data.active}
        />
        <NavyStatCard
          icon={Clock}
          tone={data.inReview > 0 ? 'orange' : 'blue'}
          label="Em revisão"
          value={data.inReview}
        />
        <NavyStatCard
          icon={AlertTriangle}
          tone={data.critical > 0 ? 'red' : 'blue'}
          label="Competências críticas"
          value={data.critical}
        />
      </div>

      {/* Por categoria */}
      <div className="grid grid-cols-4 gap-4">
        <NavyStatCard
          icon={Wrench}
          tone="blue"
          label="Técnicas"
          value={data.byCategory.technical}
        />
        <NavyStatCard
          icon={Users}
          tone="blue"
          label="Comportamentais"
          value={data.byCategory.behavioral}
        />
        <NavyStatCard
          icon={Award}
          tone="blue"
          label="Liderança"
          value={data.byCategory.leadership}
        />
        <NavyStatCard
          icon={Briefcase}
          tone="orange"
          label="Funcionais"
          value={data.byCategory.functional}
        />
      </div>

      {/* Avaliação da organização */}
      <div className="grid grid-cols-4 gap-4">
        <NavyStatCard
          icon={Target}
          tone="blue"
          label="Competências estratégicas"
          value={data.strategic}
        />
        <NavyStatCard
          icon={UserCheck}
          tone="blue"
          label="Colaboradores avaliados"
          value={data.evaluatedUsers}
        />
        <NavyStatCard
          icon={TrendingUp}
          tone="green"
          label="Média global de proficiência"
          value={data.avgProficiency}
        />
        <NavyStatCard
          icon={ClipboardList}
          tone={data.pendingEvaluations > 0 ? 'orange' : 'blue'}
          label="Avaliações pendentes"
          value={data.pendingEvaluations}
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
                  <div className="font-body text-sm font-medium text-ink">
                    {c.name}
                  </div>
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
        <div className="border-b border-border bg-[#0F1F3D]/60 px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-white">
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
                <div className="font-body text-sm font-medium text-ink">
                  {c.name}
                </div>
                <StatusBadge
                  value={c.category as CompetencyCategory}
                  map={CATEGORY_CFG}
                />
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
          <div className="border-b border-border bg-[#0F1F3D]/60 px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-white">
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
                  value={
                    (t.competency?.category ??
                      'HARD_SKILL') as CompetencyCategory
                  }
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

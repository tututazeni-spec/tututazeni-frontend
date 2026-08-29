// components/engagement/OverviewTab.tsx
// Separador "Visão Geral" — check-in de humor, resumo pessoal, KPIs, eNPS
// e reconhecimentos recentes. Dados próprios (useApiQuery) + apresentação,
// mesmo padrão auto-contido usado em components/payslips/page.tsx.
// Extraído de app/(platform)/engagement/page.tsx.
//
// `userId` nunca é passado pelo container (page.tsx renderiza
// `<OverviewTab />` sem prop) — mesmo padrão (não corrigido aqui) de
// components/evaluation/OverviewTab.tsx.

'use client';

import { AlertTriangle } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { GRADE_COLOR, LEVEL_CONFIG } from './constants';
import { MoodCheckin } from './MoodCheckin';
import type { DashboardData, MySummary } from './types';

export interface OverviewTabProps {
  userId?: number;
}

const ENPS_ROWS = [
  { key: 'promoter', label: 'Promotores', dotClass: 'bg-success' },
  { key: 'passive', label: 'Passivos', dotClass: 'bg-warning' },
  { key: 'detractor', label: 'Detractores', dotClass: 'bg-danger' },
] as const;

export function OverviewTab({ userId }: OverviewTabProps) {
  const dashQuery = useApiQuery<DashboardData>(
    queryKeys.engagement.dashboard(),
    '/engagement/dashboard',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const summaryQuery = useApiQuery<MySummary>(
    queryKeys.engagement.mySummary(),
    '/engagement/my-summary',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const dash = dashQuery.data ?? null;
  const summary = summaryQuery.data ?? null;

  const load = () => {
    dashQuery.refetch();
    summaryQuery.refetch();
  };

  if (dashQuery.isLoading || summaryQuery.isLoading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-4"
        itemClassName="skeleton-shimmer h-24 rounded-card"
      />
    );

  const level = LEVEL_CONFIG[dash?.kpis.engagementLevel ?? 'FAIR'];
  const grade = GRADE_COLOR[summary?.hssGrade ?? 'C'];
  const enpsPromoterPct = dash?.enpsBreakdown.promoterPct ?? 0;
  const enpsDetractorPct = dash?.enpsBreakdown.detractorPct ?? 0;
  const enpsPassivePct = 100 - enpsPromoterPct - enpsDetractorPct;
  const enpsPctByKey: Record<(typeof ENPS_ROWS)[number]['key'], number> = {
    promoter: enpsPromoterPct,
    passive: enpsPassivePct,
    detractor: enpsDetractorPct,
  };

  return (
    <div className="space-y-6">
      {/* Mood checkin */}
      <MoodCheckin onDone={load} />

      {/* Personal summary */}
      {summary && (
        <div className={`rounded-card border p-4 ${level.bg}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 font-body text-xs text-ink-muted">
                Pontuação de Engajamento da Organização
              </p>
              <p className={`font-display text-3xl font-black ${level.color}`}>
                {dash?.kpis.engagementIndex ?? 0}%
              </p>
              <span className={`font-body text-xs font-medium ${level.color}`}>
                {level.label}
              </span>
            </div>
            <div className="text-right">
              <p className="font-body text-xs text-ink-muted">
                Índice de Sucesso das Pessoas
              </p>
              <div
                className={`flex h-16 w-16 flex-col items-center justify-center rounded-full border-4 ${grade.border}`}
              >
                <span
                  className={`font-display text-2xl font-black ${grade.text}`}
                >
                  {summary.hssGrade}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          label="Engajamento"
          value={`${dash?.kpis.engagementIndex ?? 0}%`}
          intent="primary"
          trend={dash?.kpis.engagementTrend}
        />
        <KpiCard
          label="Participação"
          value={`${dash?.kpis.participationRate ?? 0}%`}
          intent="accent"
        />
        <KpiCard
          label="Índice de Recomendação dos Colaboradores"
          value={dash?.kpis.enps ?? 0}
          sub={dash?.enpsBreakdown.label}
          intent={(dash?.kpis.enps ?? 0) >= 0 ? 'success' : 'danger'}
        />
        <KpiCard
          label="Reconhecimentos"
          value={dash?.kpis.totalRecognitions ?? 0}
          intent="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* eNPS visual */}
        <Card>
          <CardBody>
            <h3 className="mb-4 font-display font-semibold text-ink">
              Detalhamento do Índice de Recomendação dos Colaboradores
            </h3>
            {dash?.enpsBreakdown && (
              <div className="space-y-3">
                {ENPS_ROWS.map((row) => (
                  <div key={row.key}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-ink-muted">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${row.dotClass}`}
                        />
                        {row.label}
                      </span>
                      <span className="font-semibold text-ink">
                        {enpsPctByKey[row.key].toFixed(1)}%
                      </span>
                    </div>
                    <ProgressBar value={enpsPctByKey[row.key]} />
                  </div>
                ))}
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <span className="font-body text-sm text-ink-muted">
                    Pontuação do Índice de Recomendação dos Colaboradores
                  </span>
                  <span
                    className={`font-display text-2xl font-bold ${(dash.enpsBreakdown.enps ?? 0) >= 0 ? 'text-success' : 'text-danger'}`}
                  >
                    {dash.enpsBreakdown.enps ?? 'N/A'}
                  </span>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Recent recognitions */}
        <Card>
          <CardBody>
            <h3 className="mb-4 font-display font-semibold text-ink">
              Reconhecimentos Recentes
            </h3>
            {(dash?.recentRecognitions.length ?? 0) === 0 ? (
              <p className="py-8 text-center font-body text-sm text-ink-faint">
                Sem reconhecimentos recentes
              </p>
            ) : (
              <div className="space-y-3">
                {dash?.recentRecognitions.map((r, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Avatar
                      name={r.from?.fullName ?? 'User'}
                      url={r.from?.avatarUrl}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-body text-xs text-ink-muted">
                        <span className="font-medium text-ink">
                          {r.from?.fullName}
                        </span>
                        {' → '}
                        <span className="font-medium text-ink">
                          {r.to?.fullName}
                        </span>
                      </p>
                      <p className="truncate font-body text-[10px] text-ink-faint">
                        {r.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Pending surveys */}
      {(summary?.surveys.length ?? 0) > 0 && (
        <div className="rounded-card border border-warning bg-warning-subtle p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle
              size={16}
              strokeWidth={1.75}
              className="text-warning-ink"
            />
            <p className="font-body text-sm font-semibold text-warning-ink">
              {summary!.surveys.length} inquérito
              {summary!.surveys.length > 1 ? 's' : ''} pendente
              {summary!.surveys.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="space-y-2">
            {summary!.surveys.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-control bg-surface px-3 py-2"
              >
                <div>
                  <p className="font-body text-sm font-medium text-ink">
                    {s.title}
                  </p>
                  <p className="font-body text-xs text-ink-faint">{s.type}</p>
                </div>
                <Button size="sm">Responder</Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

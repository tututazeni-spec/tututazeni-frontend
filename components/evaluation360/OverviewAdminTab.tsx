// components/evaluation360/OverviewAdminTab.tsx
// Separador "Painel Geral" (docs/evaluation360.md §1) — KPIs agregados de
// TODAS as avaliações 360° do tenant, visível só a ADMIN/RH/GESTOR/DIRECTOR
// (ver EVAL_OVERVIEW_ROLES em lib/roles.ts, espelhando o @Roles de
// GET /evaluation360/overview). Distinto do separador pessoal "Visão Geral"
// (OverviewTab.tsx, sempre os MEUS resultados) — este nunca identifica um
// participante ou avaliador individual, só agregados, mesma regra de
// getTeamAnalytics/getOrganizationalAnalytics no backend.
//
// Busca os seus próprios dados (useApiQuery directo, não via
// hooks/useEvaluation360.ts) — mesmo padrão de EvaluateOthersTab.tsx/
// GiveFeedbackModal.tsx: cada aba de gestão é dona da sua própria query.

'use client';

import {
  ShareGaugeCard,
  SpeedometerStatCard,
  SCORE5_BANDS,
} from '@/components/ui/charts/SpeedometerStatCard';
import { DonutStatCard } from '@/components/ui/charts/DonutStatCard';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { scoreColor } from './colors';

interface RawOverview {
  totalCycles: number;
  inPreparation: number;
  open: number;
  inProgress: number;
  completed: number;
  closed: number;
  evaluatedCount: number;
  invitedEvaluatorsCount: number;
  respondedEvaluatorsCount: number;
  participationRate: number;
  completionRate: number;
  avgOverall: number;
  competencyAverages: { competencyId: string; name: string; average: number }[];
  topCompetencies: { competencyId: string; name: string; average: number }[];
  bottomCompetencies: { competencyId: string; name: string; average: number }[];
  pendingAssignments: number;
  upcomingDeadline: { id: string; name: string; endDate: string }[];
  recentCompleted: {
    id: string;
    name: string;
    endDate: string;
    createdByName: string;
  }[];
}

export function OverviewAdminTab() {
  const { data, isLoading } = useApiQuery<RawOverview>(
    queryKeys.evaluation360.overview(),
    '/evaluation360/overview',
    { params: { tenantId: 'default' }, staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading) {
    return (
      <div className="text-sm text-ink-muted">A carregar painel geral…</div>
    );
  }
  if (!data) {
    return (
      <div className="rounded-card border border-border bg-surface p-5 font-body text-sm text-ink-muted">
        Ainda sem dados de avaliação 360º.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="m-0 text-lg font-bold text-ink">Painel Geral</h2>
        <p className="m-0 mt-1 text-sm text-ink-muted">
          Visão agregada de todas as avaliações 360° — nunca identifica um
          colaborador ou avaliador individual.
        </p>
      </div>

      {/* Estado das avaliações */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <ShareGaugeCard label="Total" value={data.totalCycles} total={data.totalCycles} />
        <ShareGaugeCard label="Em preparação" value={data.inPreparation} total={data.totalCycles} />
        <ShareGaugeCard label="Abertas" value={data.open} total={data.totalCycles} />
        <ShareGaugeCard label="Em preenchimento" value={data.inProgress} total={data.totalCycles} />
        <ShareGaugeCard label="Concluídas" value={data.completed} total={data.totalCycles} />
        <ShareGaugeCard label="Encerradas" value={data.closed} total={data.totalCycles} />
      </div>

      {/* Participação */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <ShareGaugeCard
          label="Colaboradores avaliados"
          value={data.evaluatedCount}
          total={data.evaluatedCount}
        />
        <ShareGaugeCard
          label="Avaliadores convidados"
          value={data.invitedEvaluatorsCount}
          total={data.invitedEvaluatorsCount}
        />
        <ShareGaugeCard
          label="Avaliadores que responderam"
          value={data.respondedEvaluatorsCount}
          total={data.invitedEvaluatorsCount}
        />
        <ShareGaugeCard
          label="Avaliações pendentes"
          value={data.pendingAssignments}
          total={data.invitedEvaluatorsCount}
          lowerIsBetter
        />
      </div>

      {/* Taxas */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <DonutStatCard label="Taxa de participação" value={data.participationRate} />
        <DonutStatCard label="Taxa de conclusão" value={data.completionRate} />
        <SpeedometerStatCard
          label="Média global"
          value={data.avgOverall}
          max={5}
          bands={SCORE5_BANDS}
          display={data.avgOverall > 0 ? data.avgOverall.toFixed(1) : '—'}
        />
      </div>

      {/* Média por competência (docs/evaluation360.md §1) — todas, não só top/bottom */}
      <div className="overflow-hidden rounded-card border border-border bg-surface p-5">
        <h3 className="-mx-5 -mt-5 mb-3.5 bg-[#0F1F3D]/60 px-5 py-3 font-body font-semibold text-white">
          Média por competência
        </h3>
        {data.competencyAverages.length === 0 && (
          <div className="text-sm text-ink-muted">
            Sem dados suficientes ainda.
          </div>
        )}
        <div className="flex flex-col gap-2.5">
          {data.competencyAverages.map((c) => (
            <div key={c.competencyId} className="flex items-center gap-3">
              <span className="text-sm text-ink w-44 shrink-0 truncate">
                {c.name}
              </span>
              <div className="flex-1 bg-surface-sunken rounded h-2 overflow-hidden">
                <div
                  className="h-full rounded"
                  style={{
                    width: `${Math.min(100, (c.average / 5) * 100)}%`,
                    background: scoreColor(c.average),
                  }}
                />
              </div>
              <span
                className="text-sm font-bold w-10 text-right shrink-0"
                style={{ color: scoreColor(c.average) }}
              >
                {c.average.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Competências */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="overflow-hidden rounded-card border border-border bg-surface p-5">
          <h3 className="-mx-5 -mt-5 mb-3.5 bg-[#0F1F3D]/60 px-5 py-3 font-body font-semibold text-white">
            Competências com maior pontuação
          </h3>
          {data.topCompetencies.length === 0 && (
            <div className="text-sm text-ink-muted">
              Sem dados suficientes ainda.
            </div>
          )}
          {data.topCompetencies.map((c) => (
            <div
              key={c.competencyId}
              className="flex justify-between items-center mb-2.5"
            >
              <span className="text-sm font-semibold text-ink">{c.name}</span>
              <span
                className="text-sm font-bold"
                style={{ color: scoreColor(c.average) }}
              >
                {c.average.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
        <div className="overflow-hidden rounded-card border border-border bg-surface p-5">
          <h3 className="-mx-5 -mt-5 mb-3.5 bg-[#0F1F3D]/60 px-5 py-3 font-body font-semibold text-white">
            Competências com menor pontuação
          </h3>
          {data.bottomCompetencies.length === 0 && (
            <div className="text-sm text-ink-muted">
              Sem dados suficientes ainda.
            </div>
          )}
          {data.bottomCompetencies.map((c) => (
            <div
              key={c.competencyId}
              className="flex justify-between items-center mb-2.5"
            >
              <span className="text-sm font-semibold text-ink">{c.name}</span>
              <span
                className="text-sm font-bold"
                style={{ color: scoreColor(c.average) }}
              >
                {c.average.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Prazos e últimas avaliações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="overflow-hidden rounded-card border border-border bg-surface p-5">
          <h3 className="-mx-5 -mt-5 mb-3.5 bg-[#0F1F3D]/60 px-5 py-3 font-body font-semibold text-white">
            Avaliações próximas do prazo (7 dias)
          </h3>
          {data.upcomingDeadline.length === 0 && (
            <div className="text-sm text-ink-muted">
              Nenhuma avaliação a terminar em breve.
            </div>
          )}
          {data.upcomingDeadline.map((c) => (
            <div
              key={c.id}
              className="flex justify-between items-center mb-2.5"
            >
              <span className="text-sm font-semibold text-ink">{c.name}</span>
              <span className="text-xs text-ink-muted">
                {c.endDate.slice(0, 10)}
              </span>
            </div>
          ))}
        </div>
        <div className="overflow-hidden rounded-card border border-border bg-surface p-5">
          <h3 className="-mx-5 -mt-5 mb-3.5 bg-[#0F1F3D]/60 px-5 py-3 font-body font-semibold text-white">
            Últimas avaliações realizadas
          </h3>
          {data.recentCompleted.length === 0 && (
            <div className="text-sm text-ink-muted">
              Ainda nenhuma avaliação concluída.
            </div>
          )}
          {data.recentCompleted.map((c) => (
            <div
              key={c.id}
              className="flex justify-between items-center mb-2.5"
            >
              <div>
                <span className="text-sm font-semibold text-ink">{c.name}</span>
                <span className="text-xs text-ink-muted ml-2">
                  por {c.createdByName}
                </span>
              </div>
              <span className="text-xs text-ink-muted">
                {c.endDate.slice(0, 10)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

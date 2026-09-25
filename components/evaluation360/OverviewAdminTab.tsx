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
  recentCompleted: { id: string; name: string; endDate: string; createdByName: string }[];
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-5 py-4.5">
      <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">
        {label}
      </div>
      <div className="text-2xl font-bold leading-tight tracking-tighter text-ink">{value}</div>
    </div>
  );
}

export function OverviewAdminTab() {
  const { data, isLoading } = useApiQuery<RawOverview>(
    queryKeys.evaluation360.overview(),
    '/evaluation360/overview',
    { params: { tenantId: 'default' }, staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading) {
    return <div className="text-sm text-ink-muted">A carregar painel geral…</div>;
  }
  if (!data) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5 text-sm text-ink-muted">
        Ainda sem dados de avaliação 360º.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="m-0 text-lg font-bold text-ink">Painel Geral</h2>
        <p className="m-0 mt-1 text-sm text-ink-muted">
          Visão agregada de todas as avaliações 360° — nunca identifica um colaborador ou
          avaliador individual.
        </p>
      </div>

      {/* Estado das avaliações */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Stat label="Total" value={data.totalCycles} />
        <Stat label="Em preparação" value={data.inPreparation} />
        <Stat label="Abertas" value={data.open} />
        <Stat label="Em preenchimento" value={data.inProgress} />
        <Stat label="Concluídas" value={data.completed} />
        <Stat label="Encerradas" value={data.closed} />
      </div>

      {/* Participação */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Colaboradores avaliados" value={data.evaluatedCount} />
        <Stat label="Avaliadores convidados" value={data.invitedEvaluatorsCount} />
        <Stat label="Avaliadores que responderam" value={data.respondedEvaluatorsCount} />
        <Stat label="Avaliações pendentes" value={data.pendingAssignments} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Taxa de participação" value={`${data.participationRate}%`} />
        <Stat label="Taxa de conclusão" value={`${data.completionRate}%`} />
        <Stat
          label="Média global"
          value={data.avgOverall > 0 ? data.avgOverall.toFixed(1) : '—'}
        />
      </div>

      {/* Média por competência (docs/evaluation360.md §1) — todas, não só top/bottom */}
      <div className="rounded-lg border border-border bg-surface px-5 py-4.5">
        <div className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3.5">
          Média por competência
        </div>
        {data.competencyAverages.length === 0 && (
          <div className="text-sm text-ink-muted">Sem dados suficientes ainda.</div>
        )}
        <div className="flex flex-col gap-2.5">
          {data.competencyAverages.map((c) => (
            <div key={c.competencyId} className="flex items-center gap-3">
              <span className="text-sm text-ink w-44 shrink-0 truncate">{c.name}</span>
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
        <div className="rounded-lg border border-border bg-surface px-5 py-4.5">
          <div className="text-xs font-bold text-success-ink uppercase tracking-wider mb-3.5">
            Competências com maior pontuação
          </div>
          {data.topCompetencies.length === 0 && (
            <div className="text-sm text-ink-muted">Sem dados suficientes ainda.</div>
          )}
          {data.topCompetencies.map((c) => (
            <div key={c.competencyId} className="flex justify-between items-center mb-2.5">
              <span className="text-sm font-semibold text-ink">{c.name}</span>
              <span className="text-sm font-bold" style={{ color: scoreColor(c.average) }}>
                {c.average.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-surface px-5 py-4.5">
          <div className="text-xs font-bold text-danger-ink uppercase tracking-wider mb-3.5">
            Competências com menor pontuação
          </div>
          {data.bottomCompetencies.length === 0 && (
            <div className="text-sm text-ink-muted">Sem dados suficientes ainda.</div>
          )}
          {data.bottomCompetencies.map((c) => (
            <div key={c.competencyId} className="flex justify-between items-center mb-2.5">
              <span className="text-sm font-semibold text-ink">{c.name}</span>
              <span className="text-sm font-bold" style={{ color: scoreColor(c.average) }}>
                {c.average.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Prazos e últimas avaliações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-surface px-5 py-4.5">
          <div className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3.5">
            Avaliações próximas do prazo (7 dias)
          </div>
          {data.upcomingDeadline.length === 0 && (
            <div className="text-sm text-ink-muted">Nenhuma avaliação a terminar em breve.</div>
          )}
          {data.upcomingDeadline.map((c) => (
            <div key={c.id} className="flex justify-between items-center mb-2.5">
              <span className="text-sm font-semibold text-ink">{c.name}</span>
              <span className="text-xs text-ink-muted">{c.endDate.slice(0, 10)}</span>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-surface px-5 py-4.5">
          <div className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3.5">
            Últimas avaliações realizadas
          </div>
          {data.recentCompleted.length === 0 && (
            <div className="text-sm text-ink-muted">Ainda nenhuma avaliação concluída.</div>
          )}
          {data.recentCompleted.map((c) => (
            <div key={c.id} className="flex justify-between items-center mb-2.5">
              <div>
                <span className="text-sm font-semibold text-ink">{c.name}</span>
                <span className="text-xs text-ink-muted ml-2">por {c.createdByName}</span>
              </div>
              <span className="text-xs text-ink-muted">{c.endDate.slice(0, 10)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

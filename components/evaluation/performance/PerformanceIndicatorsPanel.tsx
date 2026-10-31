// components/evaluation/performance/PerformanceIndicatorsPanel.tsx
// Indicadores agregados da avaliação de desempenho estruturada
// (docs/avaliacao_desempenho_robusta §12): classificações, pontos fortes e
// áreas de melhoria recorrentes, necessidades de formação, recomendações por
// estado/prioridade e progresso dos PDIs. Só agregados por competência —
// nunca texto ou nomes individuais.

import { Card, CardBody } from '@/components/ui/Card';
import {
  RECOMMENDATION_STATUS_LABELS,
  type CompetencyCount,
  type PerformanceIndicators,
  type RecommendationStatus,
} from './apiTypes';
import { RECOMMENDATION_PRIORITY_LABELS } from './types';

const HIDDEN = 'Oculto por privacidade: há poucas avaliações neste filtro.';

const HEAD =
  'px-4 py-3 border-b border-border bg-brand/60 text-xs font-medium text-white uppercase tracking-wide';

function CompetencyList({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: CompetencyCount[];
  empty: string;
}) {
  return (
    <Card className="overflow-hidden">
      <div className={HEAD}>{title}</div>
      <CardBody>
        {rows.length === 0 ? (
          <p className="text-xs text-ink-faint">{empty}</p>
        ) : (
          <ol className="space-y-1.5">
            {rows.map((r) => (
              <li
                key={r.competency}
                className="flex items-center justify-between gap-3 text-xs"
              >
                <span className="text-ink-muted">{r.competency}</span>
                <span className="shrink-0 font-semibold text-ink">
                  {r.count}×
                  {r.avgScore !== null && (
                    <span className="ml-1 font-normal text-ink-faint">
                      (média {r.avgScore.toFixed(1)}/5)
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardBody>
    </Card>
  );
}

export interface PerformanceIndicatorsPanelProps {
  data: PerformanceIndicators;
}

export function PerformanceIndicatorsPanel({
  data,
}: PerformanceIndicatorsPanelProps) {
  const recs = data.recommendations;
  return (
    <section aria-label="Indicadores de desempenho" className="space-y-4">
      <h3 className="text-sm font-semibold text-ink">
        Pontos fortes, melhorias e plano de ação
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CompetencyList
          title="Principais pontos fortes"
          rows={data.topStrengths}
          empty={
            data.restricted
              ? HIDDEN
              : 'Sem pontos fortes registados neste filtro.'
          }
        />
        <CompetencyList
          title="Áreas de melhoria mais recorrentes"
          rows={data.recurringImprovements}
          empty={
            data.restricted
              ? HIDDEN
              : 'Sem áreas de melhoria registadas neste filtro.'
          }
        />

        <Card className="overflow-hidden">
          <div className={HEAD}>Distribuição por classificação</div>
          <CardBody>
            {data.byRating.length === 0 ? (
              <p className="text-xs text-ink-faint">
                {data.restricted ? HIDDEN : 'Ainda sem classificações finais.'}
              </p>
            ) : (
              <ul className="space-y-1.5">
                {data.byRating.map((r) => (
                  <li
                    key={r.label}
                    className="flex justify-between text-xs text-ink-muted"
                  >
                    <span>{r.label}</span>
                    <span className="font-semibold text-ink">{r.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="overflow-hidden">
          <div className={HEAD}>Recomendações</div>
          <CardBody>
            <p className="mb-2 text-xs text-ink-muted">
              {recs.total} no total · {recs.trainingNeeds} necessidades de
              formação ·{' '}
              <span
                className={
                  recs.overdue > 0 ? 'font-semibold text-danger-ink' : ''
                }
              >
                {recs.overdue} em atraso
              </span>
            </p>
            <ul className="space-y-1 text-xs text-ink-muted">
              {(
                Object.keys(
                  RECOMMENDATION_STATUS_LABELS,
                ) as RecommendationStatus[]
              ).map((s) => (
                <li key={s} className="flex justify-between">
                  <span>{RECOMMENDATION_STATUS_LABELS[s]}</span>
                  <span className="font-semibold text-ink">
                    {recs.byStatus[s] ?? 0}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mb-1 mt-3 text-xs font-semibold text-ink">
              Por prioridade
            </p>
            <ul className="space-y-1 text-xs text-ink-muted">
              {[5, 4, 3, 2, 1].map((p) => (
                <li key={p} className="flex justify-between">
                  <span>
                    {p} — {RECOMMENDATION_PRIORITY_LABELS[p]}
                  </span>
                  <span className="font-semibold text-ink">
                    {recs.byPriority[String(p)] ?? 0}
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
      <p className="text-xs text-ink-muted">
        PDI: {data.pdi.plans} plano{data.pdi.plans === 1 ? '' : 's'} gerado
        {data.pdi.plans === 1 ? '' : 's'} a partir de avaliações
        {data.pdi.avgProgress !== null &&
          ` · progresso médio ${data.pdi.avgProgress}%`}
      </p>
    </section>
  );
}

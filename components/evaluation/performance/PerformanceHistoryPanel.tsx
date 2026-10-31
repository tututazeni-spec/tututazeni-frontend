// components/evaluation/performance/PerformanceHistoryPanel.tsx
// Histórico de avaliações submetidas de um colaborador e comparação das duas
// mais recentes do mesmo tipo (docs/avaliacao_desempenho_robusta §13). A
// comparação vem calculada do servidor; quando critérios/pesos mudaram entre
// ciclos mostra-se a limitação em vez de uma conclusão enganadora.

'use client';

import { useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { AlertCard } from '@/components/ui/AlertCard';
import { Badge } from '@/components/ui/Badge';
import { NativeSelect } from '@/components/ui/NativeSelect';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import type { EvaluationComparison, PerformanceHistory } from './apiTypes';

const TYPE_LABELS: Record<string, string> = {
  MANAGER: 'Avaliação pela chefia',
  SELF: 'Autoavaliação',
  PEER: 'Colegas',
  SUBORDINATE: 'Subordinados',
  CLIENT: 'Clientes',
};

function Delta({ value }: { value: number }) {
  // Texto + ícone + cor: a variação nunca depende só da cor.
  if (value === 0)
    return (
      <span className="inline-flex items-center gap-1 text-ink-muted">
        <ArrowRight size={12} aria-hidden /> sem alteração
      </span>
    );
  const up = value > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold ${up ? 'text-success-ink' : 'text-danger-ink'}`}
    >
      {up ? (
        <ArrowUp size={12} aria-hidden />
      ) : (
        <ArrowDown size={12} aria-hidden />
      )}
      {up ? '+' : ''}
      {value.toFixed(value % 1 === 0 ? 0 : 2)}
      <span className="sr-only">{up ? ' (melhoria)' : ' (descida)'}</span>
    </span>
  );
}

function NameList({ title, names }: { title: string; names: string[] }) {
  if (!names.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-ink">{title}</p>
      <p className="text-xs text-ink-muted">{names.join(', ')}</p>
    </div>
  );
}

function ComparisonView({ c }: { c: EvaluationComparison }) {
  return (
    <div className="space-y-3 rounded-card border border-border bg-surface p-4">
      <h4 className="text-sm font-semibold text-ink">
        {c.from.period} → {c.to.period}
      </h4>
      {c.limitation && (
        <AlertCard
          variant="warning"
          title="Comparação com reservas"
          message={c.limitation}
        />
      )}
      <p className="text-sm text-ink">
        Classificação global:{' '}
        <span className="font-semibold">
          {c.from.overallScore?.toFixed(2) ?? '—'} →{' '}
          {c.to.overallScore?.toFixed(2) ?? '—'}
        </span>{' '}
        {c.overallDelta !== null && c.comparable && (
          <Delta value={c.overallDelta} />
        )}
      </p>
      {c.competencies.length > 0 && (
        <table className="w-full text-xs">
          <caption className="sr-only">Evolução por competência</caption>
          <thead>
            <tr className="text-left text-ink-faint">
              <th scope="col" className="py-1 font-medium">
                Competência
              </th>
              <th scope="col" className="py-1 font-medium">
                Antes
              </th>
              <th scope="col" className="py-1 font-medium">
                Agora
              </th>
              <th scope="col" className="py-1 font-medium">
                Variação
              </th>
            </tr>
          </thead>
          <tbody>
            {c.competencies.map((k) => (
              <tr key={k.competency} className="border-t border-border">
                <td className="py-1 text-ink">{k.competency}</td>
                <td className="py-1 text-ink-muted">{k.previous}/5</td>
                <td className="py-1 text-ink-muted">{k.current}/5</td>
                <td className="py-1">
                  <Delta value={k.delta} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <NameList
          title="Pontos fortes mantidos"
          names={c.strengthsMaintained}
        />
        <NameList title="Novos pontos fortes" names={c.strengthsNew} />
        <NameList
          title="Áreas de melhoria resolvidas"
          names={c.improvementsResolved}
        />
        <NameList title="Áreas ainda pendentes" names={c.improvementsPending} />
        <NameList title="Novas áreas de melhoria" names={c.improvementsNew} />
      </div>
      <p className="text-xs text-ink-muted">
        Recomendações da avaliação anterior: {c.previousRecommendations.done}{' '}
        concluídas · {c.previousRecommendations.open} em aberto ·{' '}
        {c.previousRecommendations.overdue} em atraso
      </p>
    </div>
  );
}

export interface PerformanceHistoryPanelProps {
  userId: number | string;
  /** Título da secção (por omissão "Evolução entre ciclos"). */
  title?: string;
  /** Se definido, cada avaliação ganha o botão "Ver detalhe". */
  onOpenDetail?: (evaluationId: number) => void;
}

export function PerformanceHistoryPanel({
  userId,
  title = 'Evolução entre ciclos',
  onOpenDetail,
}: PerformanceHistoryPanelProps) {
  const [type, setType] = useState('MANAGER');
  const q = useApiQuery<PerformanceHistory>(
    queryKeys.evaluation.performanceHistory(userId, type),
    `/evaluations/performance/history/${userId}`,
    { params: { type } },
  );

  return (
    <section aria-label={title} className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <NativeSelect
          density="sm"
          aria-label="Tipo de avaliação"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {Object.entries(TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </NativeSelect>
      </div>

      {q.isLoading ? (
        <Skeleton
          rows={2}
          wrapperClassName="space-y-3"
          itemClassName="skeleton-shimmer h-16 rounded-card"
        />
      ) : q.isError ? (
        <QueryError error={q.error} onRetry={() => q.refetch()} />
      ) : q.data && q.data.entries.length === 0 ? (
        <p className="text-sm text-ink-muted">
          Ainda sem avaliações submetidas deste tipo.
        </p>
      ) : q.data ? (
        <>
          <ol className="space-y-2">
            {[...q.data.entries].reverse().map((e) => (
              <li
                key={e.evaluationId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-border bg-surface px-3 py-2 text-sm"
              >
                <span className="text-ink">
                  {e.period}
                  {e.cycleName ? ` · ${e.cycleName}` : ''}
                </span>
                <span className="flex flex-wrap items-center gap-2">
                  {e.overallScore !== null && e.ratingLabel ? (
                    <Badge intent="info">
                      {e.overallScore.toFixed(2)} — {e.ratingLabel}
                    </Badge>
                  ) : (
                    <Badge intent="neutral">Sem classificação final</Badge>
                  )}
                  <span className="text-xs text-ink-muted">
                    Ações: {e.recommendations.done}/{e.recommendations.total}
                    {e.recommendations.overdue > 0 &&
                      ` · ${e.recommendations.overdue} em atraso`}
                  </span>
                  {onOpenDetail && (
                    <button
                      type="button"
                      onClick={() => onOpenDetail(e.evaluationId)}
                      className="rounded-pill border-[1.5px] border-border-strong bg-surface px-3 py-1 text-xs font-semibold text-ink-muted hover:bg-surface-sunken"
                    >
                      Ver detalhe
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ol>
          {q.data.comparison ? (
            <ComparisonView c={q.data.comparison} />
          ) : (
            <p className="text-xs text-ink-faint">
              São precisas duas avaliações do mesmo tipo para comparar.
            </p>
          )}
        </>
      ) : null}
    </section>
  );
}

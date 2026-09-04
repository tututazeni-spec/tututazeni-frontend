// components/evaluation/OverviewTab.tsx
// Separador "Visão Geral" — progresso pessoal, pendentes urgentes e
// resultados/radar próprios. Dados próprios (useApiQuery) + apresentação,
// mesmo padrão auto-contido usado em components/payslips/page.tsx.
// Extraído de app/(platform)/evaluation/page.tsx.
//
// `userId` nunca é passado pelo container (page.tsx renderiza
// `<OverviewTab />` sem prop) — resultsQ fica sempre `enabled: false` e
// `myResults` é sempre null. Comportamento idêntico ao ficheiro original,
// não corrigido aqui (fora do âmbito de um refactor estrutural).

'use client';

import { AlertTriangle, ChevronRight } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { RadarChart } from './RadarChart';
import { SCORE_BG, SCORE_COLOR, TYPE_LABEL } from './constants';
import type { EvalRequest, EvalResults, MyProgress } from './types';

export interface OverviewTabProps {
  userId?: number;
}

export function OverviewTab({ userId }: OverviewTabProps) {
  const progressQ = useApiQuery<MyProgress>(
    queryKeys.evaluation.myProgress(),
    '/evaluations/my-progress',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const pendingQ = useApiQuery<EvalRequest[]>(
    queryKeys.evaluation.pending(),
    '/evaluations/pending',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const resultsQ = useApiQuery<EvalResults>(
    queryKeys.evaluation.results(userId ?? 0),
    `/evaluations/results/${userId}`,
    { enabled: !!userId, retry: false, staleTime: STALE_TIME.DYNAMIC },
  );
  const progress = progressQ.data ?? null;
  const pending = pendingQ.data ?? [];
  const myResults =
    resultsQ.data && resultsQ.data.hasResults !== false ? resultsQ.data : null;
  const loading = progressQ.isLoading;

  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="grid grid-cols-2 md:grid-cols-4 gap-4"
        itemClassName="skeleton-shimmer h-24 rounded-card"
      />
    );

  return (
    <div className="space-y-6">
      {/* My completion progress */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Concluídas"
          value={progress?.completed ?? 0}
          intent="success"
        />
        <KpiCard
          label="Pendentes"
          value={progress?.pending ?? 0}
          intent="warning"
        />
        <KpiCard
          label="Taxa Conclusão"
          value={`${progress?.completionRate ?? 0}%`}
          intent="primary"
        />
        <KpiCard
          label="Pontuação Mais Recente"
          value={myResults ? myResults.finalScore.toFixed(1) : '–'}
          sub={myResults?.scoreLabel}
          intent="accent"
        />
      </div>

      {/* Pending evaluations urgent banner */}
      {pending.length > 0 && (
        <div className="bg-warning-subtle border border-warning rounded-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle
              size={16}
              strokeWidth={1.75}
              className="text-warning-ink"
            />
            <p className="text-sm font-semibold text-warning-ink">
              {pending.length} avaliação{pending.length > 1 ? 'ões' : ''}{' '}
              pendente{pending.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="space-y-2">
            {pending.slice(0, 3).map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 bg-surface rounded-control px-3 py-2.5 border border-border"
              >
                <Avatar
                  name={r.evaluated.fullName}
                  url={r.evaluated.avatarUrl}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink">
                    {r.evaluated.fullName}
                  </p>
                  <p className="text-xs text-ink-faint">
                    {TYPE_LABEL[r.type]} · {r.cycle?.name}
                  </p>
                </div>
                {r.dueDate && (
                  <span className="text-xs text-warning-ink font-medium shrink-0">
                    {new Date(r.dueDate).toLocaleDateString('pt')}
                  </span>
                )}
                <ChevronRight
                  size={14}
                  strokeWidth={1.75}
                  className="text-ink-faint"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My results radar */}
      {myResults && (
        <Card>
          <CardBody>
            <h3 className="font-display font-semibold text-ink mb-4">
              Os Meus Resultados
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Score breakdown */}
              <div>
                <div
                  className={`rounded-card border p-4 mb-4 ${SCORE_BG(myResults.finalScore)}`}
                >
                  <p className="text-xs text-ink-faint mb-0.5">Score Final</p>
                  <p
                    className={`text-4xl font-black ${SCORE_COLOR(myResults.finalScore)}`}
                  >
                    {myResults.finalScore.toFixed(1)}
                  </p>
                  <p className="text-sm text-ink-muted font-medium">
                    {myResults.scoreLabel}
                  </p>
                </div>

                {/* By type */}
                <div className="space-y-2">
                  {Object.entries(myResults.byType).map(([type, score]) => (
                    <div key={type}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-ink-muted">
                          {TYPE_LABEL[type] ?? type}
                        </span>
                        <span className={`font-bold ${SCORE_COLOR(+score)}`}>
                          {(+score).toFixed(1)}
                        </span>
                      </div>
                      <ProgressBar value={(+score / 5) * 100} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Radar + Concordance */}
              <div>
                {Object.keys(myResults.competencies).length > 0 && (
                  <ErrorBoundary source="evaluation.OverviewTab.RadarChart">
                    <RadarChart
                      data={Object.entries(myResults.competencies).map(
                        ([id, score]) => ({
                          label: `Comp.${id}`,
                          value: +score,
                          max: 5,
                        }),
                      )}
                      size={180}
                    />
                  </ErrorBoundary>
                )}

                {myResults.concordance && (
                  <div className="mt-3 p-3 rounded-control bg-surface-sunken border border-border">
                    <p className="text-xs font-semibold text-ink-muted mb-1">
                      Concordância
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-ink-muted">
                        Auto:{' '}
                        <b>{myResults.concordance.selfScore.toFixed(1)}</b>
                      </span>
                      <Badge
                        intent={
                          myResults.concordance.label === 'Alinhado'
                            ? 'success'
                            : 'warning'
                        }
                      >
                        {myResults.concordance.label}
                      </Badge>
                      <span className="text-ink-muted">
                        Outros:{' '}
                        <b>{myResults.concordance.othersScore.toFixed(1)}</b>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

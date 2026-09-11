// components/evaluation/ResultsTab.tsx
// Separador "Resultados" — pesquisa por colaborador + score 360°,
// concordância, radar de competências e sugestão de PDI. Dados próprios
// (useApiMutation, pesquisa manual por ID) + apresentação. Extraído de
// app/(platform)/evaluation/page.tsx.
//
// COLABORADOR só pode ver os seus próprios resultados (GET
// /evaluations/results/:userId aplica assertCanAccess — ver
// evaluation.controller.ts) — por isso não tem a pesquisa livre por ID;
// em vez disso escolhe mês/ano (ou "Ver Total") e o ID usado é sempre o
// seu próprio, vindo de useCurrentUser().

'use client';

import { Flame, Target } from 'lucide-react';
import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/providers/ToastProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { QueryError } from '@/components/ui/QueryError';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { RadarChart } from './RadarChart';
import { MONTH_OPTIONS, SCORE_BG, SCORE_COLOR, TYPE_LABEL } from './constants';
import type { EvalResults } from './types';

const MONTH_ITEMS = [{ value: 'ALL', label: 'Todos os meses' }, ...MONTH_OPTIONS];
const YEAR_ITEMS = [
  { value: 'ALL', label: 'Todos os anos' },
  ...Array.from({ length: 5 }, (_, i) => {
    const year = String(new Date().getFullYear() - i);
    return { value: year, label: year };
  }),
];

interface LoadParams {
  uid: string;
  period?: string;
}

export function ResultsTab() {
  const role = useCurrentRole();
  const { data: me } = useCurrentUser();
  // Enquanto o role ainda não chegou (arranque pós-login/reload) tratamos
  // como não-colaborador — mesmo critério de canCreateCycle em
  // app/(platform)/evaluation/page.tsx — para não esconder e voltar a
  // mostrar a pesquisa por ID no primeiro render.
  const isColaborador = role === 'COLABORADOR';

  const [userId, setUserId] = useState('');
  const [month, setMonth] = useState('ALL');
  const [year, setYear] = useState('ALL');
  const notify = useToast();

  const loadResults = useApiMutation(({ uid, period }: LoadParams) =>
    Promise.all([
      apiClient.get<EvalResults>(
        `/evaluations/results/${uid}${period ? `?period=${period}` : ''}`,
      ),
      apiClient.get<unknown>(`/evaluations/evolution/${uid}`),
    ]),
  );
  const raw = loadResults.data?.[0] ?? null;
  const loading = loadResults.isPending;

  // O backend responde 200 com { evaluated, hasResults: false } quando o
  // colaborador ainda não tem nenhuma avaliação de desempenho registada
  // (evaluation.service.ts). Nesse caso não vêm finalScore/byType/
  // competencies/qualitative — e o bloco de resultados abaixo rebentava em
  // runtime logo no primeiro campo (`result.finalScore.toFixed(1)` →
  // "Cannot read properties of undefined"). Separamos os dois casos: `result`
  // só é verdadeiro quando há de facto um resultado completo para desenhar.
  const noResults =
    !!raw && (raw.hasResults === false || raw.finalScore == null);
  const result = raw && !noResults ? raw : null;

  const load = () => {
    const id = userId.trim();
    if (!id) return;
    if (!/^\d+$/.test(id)) {
      notify({
        title: 'ID inválido',
        description: 'O ID do colaborador é numérico (ex.: 42).',
        intent: 'danger',
      });
      return;
    }
    loadResults.mutate({ uid: id });
  };

  const periodFromFilters = () => {
    if (year === 'ALL') return undefined;
    return month === 'ALL' ? year : `${year}-${month}`;
  };

  const loadOwn = () => {
    if (!me) return;
    loadResults.mutate({ uid: String(me.id), period: periodFromFilters() });
  };

  const loadOwnTotal = () => {
    if (!me) return;
    setMonth('ALL');
    setYear('ALL');
    loadResults.mutate({ uid: String(me.id) });
  };

  const triggerPdi = useApiMutation(
    () =>
      apiClient.post(
        `/evaluations/results/${isColaborador ? me?.id : userId}/trigger-pdi`,
        {},
      ),
    {
      onSuccess: () =>
        notify({
          title: 'Sugestão de PDI gerada',
          description:
            'Já pode ser encontrada no plano de desenvolvimento do colaborador.',
          intent: 'success',
        }),
      // Erro já fica visível via toast global (QueryCache/MutationCache) —
      // aqui só precisamos do estado de loading no botão.
    },
  );

  return (
    <div className="space-y-4">
      {/* Search / filtros */}
      <Card>
        {isColaborador ? (
          <CardBody className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-muted">
                Mês
              </label>
              <Select
                items={MONTH_ITEMS}
                value={month}
                onValueChange={setMonth}
                className="w-40"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-muted">
                Ano
              </label>
              <Select
                items={YEAR_ITEMS}
                value={year}
                onValueChange={setYear}
                className="w-32"
              />
            </div>
            <Button onClick={loadOwn} disabled={!me}>
              Ver Resultados
            </Button>
            <Button intent="secondary" onClick={loadOwnTotal} disabled={!me}>
              Ver Total
            </Button>
          </CardBody>
        ) : (
          <CardBody className="flex gap-3">
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="ID do colaborador..."
              className="flex-1"
            />
            <Button onClick={load}>Ver Resultados</Button>
          </CardBody>
        )}
      </Card>

      {loading && (
        <Skeleton
          rows={3}
          wrapperClassName="space-y-3"
          itemClassName="skeleton-shimmer h-32 rounded-card"
        />
      )}

      {!loading && noResults && (
        <EmptyState
          title="Sem avaliações registadas"
          description={
            raw?.evaluated?.fullName
              ? `${raw.evaluated.fullName} ainda não tem avaliações de desempenho concluídas.`
              : 'Este colaborador ainda não tem avaliações de desempenho concluídas.'
          }
        />
      )}

      {!loading && result && (
        <div className="space-y-4">
          {/* Header */}
          <div
            className={`rounded-card border p-5 ${SCORE_BG(result.finalScore)}`}
          >
            <div className="flex items-start gap-4">
              <div>
                <p className="text-xs text-ink-faint mb-0.5">Score 360°</p>
                <p
                  className={`text-5xl font-black ${SCORE_COLOR(result.finalScore)}`}
                >
                  {result.finalScore.toFixed(1)}
                </p>
                <p className="font-semibold text-ink mt-1">
                  {result.scoreLabel}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-sm font-semibold text-ink">
                  {result.evaluated.fullName}
                </p>
                <p className="text-xs text-ink-faint">
                  {result.evaluated.position?.name}
                </p>
                <p className="text-xs text-ink-faint">
                  {result.evaluated.department?.name}
                </p>
                <p className="text-xs text-ink-muted mt-1">
                  {result.totalEvaluators} avaliadores
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* By evaluator type */}
            <Card>
              <CardBody>
                <h4 className="font-display font-semibold text-ink mb-3">
                  Por Tipo de Avaliador
                </h4>
                <div className="space-y-3">
                  {Object.entries(result.byType).map(([type, score]) => (
                    <div key={type}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-ink-muted">
                          {TYPE_LABEL[type] ?? type}
                        </span>
                        <span className={`font-bold ${SCORE_COLOR(+score)}`}>
                          {(+score).toFixed(1)}/5
                        </span>
                      </div>
                      <ProgressBar value={(+score / 5) * 100} />
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Concordance */}
            {result.concordance && (
              <Card>
                <CardBody>
                  <h4 className="font-display font-semibold text-ink mb-3">
                    Matriz de Concordância
                  </h4>
                  <div className="flex items-center justify-center gap-6 py-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary">
                        {result.concordance.selfScore.toFixed(1)}
                      </p>
                      <p className="text-xs text-ink-muted">Autoavaliação</p>
                    </div>
                    <div className="text-center">
                      <Badge
                        intent={
                          result.concordance.label === 'Alinhado'
                            ? 'success'
                            : Math.abs(result.concordance.gap) > 1
                              ? 'danger'
                              : 'warning'
                        }
                      >
                        {result.concordance.label}
                      </Badge>
                      <p className="text-xs text-ink-faint mt-1">
                        gap: {result.concordance.gap > 0 ? '+' : ''}
                        {result.concordance.gap.toFixed(1)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-ink">
                        {result.concordance.othersScore.toFixed(1)}
                      </p>
                      <p className="text-xs text-ink-muted">Outros</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>

          {/* Competency Radar */}
          {Object.keys(result.competencies).length > 0 && (
            <Card>
              <CardBody>
                <h4 className="font-display font-semibold text-ink mb-4">
                  Mapa de Competências
                </h4>
                <ErrorBoundary source="evaluation.ResultsTab.RadarChart">
                  <RadarChart
                    data={Object.entries(result.competencies).map(
                      ([id, score]) => ({
                        label: `C${id}`,
                        value: +score,
                        max: 5,
                      }),
                    )}
                    size={220}
                  />
                </ErrorBoundary>
              </CardBody>
            </Card>
          )}

          {/* Qualitative */}
          {(result.qualitative.strengths.length > 0 ||
            result.qualitative.improvements.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.qualitative.strengths.length > 0 && (
                <div className="bg-success-subtle border border-success rounded-card p-4">
                  <h4 className="font-semibold text-success-ink mb-2">
                    <Flame
                      size={16}
                      strokeWidth={1.75}
                      className="inline align-[-2px]"
                    />{' '}
                    Pontos Fortes
                  </h4>
                  <div className="space-y-1">
                    {result.qualitative.strengths.slice(0, 5).map((s, i) => (
                      <p key={i} className="text-xs text-success-ink">
                        • {s}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {result.qualitative.improvements.length > 0 && (
                <div className="bg-warning-subtle border border-warning rounded-card p-4">
                  <h4 className="font-semibold text-warning-ink mb-2">
                    <Target
                      size={16}
                      strokeWidth={1.75}
                      className="inline align-[-2px]"
                    />{' '}
                    Áreas de Melhoria
                  </h4>
                  <div className="space-y-1">
                    {result.qualitative.improvements.slice(0, 5).map((s, i) => (
                      <p key={i} className="text-xs text-warning-ink">
                        • {s}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PDI trigger — só quem gere avaliações (não-colaborador) desenha
              PDIs a partir dos resultados de outros; um colaborador a ver os
              seus próprios resultados não tem esta acção. */}
          {!isColaborador && (
            <Button
              size="md"
              className="w-full"
              disabled={triggerPdi.isPending}
              onClick={() => triggerPdi.mutate(undefined)}
            >
              <Target
                size={14}
                strokeWidth={1.75}
                className="inline align-[-2px]"
              />{' '}
              {triggerPdi.isPending
                ? 'A gerar sugestão de PDI...'
                : 'Gerar Sugestão de PDI com base nestes resultados'}
            </Button>
          )}
        </div>
      )}

      {!loading && loadResults.isError && (
        <QueryError error={loadResults.error} onRetry={isColaborador ? loadOwn : load} />
      )}
    </div>
  );
}

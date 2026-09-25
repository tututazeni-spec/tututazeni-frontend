// components/evaluation360/RelatoriosTab.tsx
// Separador "Relatórios" (docs/evaluation360.md §9) — só para quem gere o
// módulo (mesmo grupo de EVAL_OVERVIEW_ROLES que já vê o Painel Geral
// agregado). GET /evaluation360/cycles/:cycleId/reports para os relatórios à
// escala de UM ciclo (resultado geral, por competência/departamento/cargo/
// unidade/grupo de avaliador, comparações, pontos fortes/gaps, taxas,
// avaliadores pendentes, competências críticas) e GET
// /evaluation360/reports/evolution para "Evolução entre ciclos"/"Comparação
// entre ciclos" (a mesma série, `cycleIds` restringe a ciclos escolhidos).
//
// Nunca identifica um avaliador individual — mesma regra de
// OverviewAdminTab/getOrganizationalAnalytics: só agregados.

'use client';

import { useEffect, useState } from 'react';
import type { CycleEvolutionPoint, CycleReportData } from './types';
import { evaluatorRoleLabel, scoreColor, cycleStatusText } from './colors';
import { useCycleSelectorOptions, useDepartmentOptions, useUnitOptions, usePositionOptions } from './cycleData';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Select, type SelectItemOption } from '@/components/ui/Select';

const ALL = 'ALL';

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

function fmt(v: number | null): string {
  return v === null ? '—' : v.toFixed(1);
}

function BarList({ items }: { items: { key: string; label: string; average: number }[] }) {
  if (items.length === 0) return <div className="text-sm text-ink-muted">Sem dados suficientes ainda.</div>;
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((c) => (
        <div key={c.key} className="flex items-center gap-3">
          <span className="text-sm text-ink w-44 shrink-0 truncate">{c.label}</span>
          <div className="flex-1 bg-surface-sunken rounded h-2 overflow-hidden">
            <div
              className="h-full rounded"
              style={{ width: `${Math.min(100, (c.average / 5) * 100)}%`, background: scoreColor(c.average) }}
            />
          </div>
          <span className="text-sm font-bold w-10 text-right shrink-0" style={{ color: scoreColor(c.average) }}>
            {c.average.toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  );
}

const EVALUATOR_GROUP_LABEL: Record<string, string> = {
  self: 'Autoavaliação',
  manager: 'Gestor',
  peer: 'Pares',
  subordinate: 'Subordinados',
  external: 'Outras',
};

function ComparisonStat({
  title,
  labelA,
  labelB,
  cmp,
}: {
  title: string;
  labelA: string;
  labelB: string;
  cmp: { a: number | null; b: number | null; diff: number | null };
}) {
  return (
    <div className="rounded-lg border border-border bg-surface px-5 py-4.5">
      <div className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3.5">{title}</div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-muted">{labelA}</span>
        <span className="font-bold text-ink">{fmt(cmp.a)}</span>
      </div>
      <div className="flex items-center justify-between text-sm mt-1.5">
        <span className="text-ink-muted">{labelB}</span>
        <span className="font-bold text-ink">{fmt(cmp.b)}</span>
      </div>
      {cmp.diff !== null && (
        <div
          className="mt-2.5 text-xs font-bold"
          style={{ color: cmp.diff > 0 ? 'rgb(245, 158, 11)' : 'rgb(34, 197, 94)' }}
        >
          {cmp.diff > 0 ? '▲' : '▼'} diferença de {Math.abs(cmp.diff).toFixed(1)}
        </div>
      )}
    </div>
  );
}

export function RelatoriosTab() {
  const { cycles, options: cycleOptions, loading: cyclesLoading } = useCycleSelectorOptions();
  const [cycleId, setCycleId] = useState('');
  useEffect(() => {
    if (!cycleId && cycles.length > 0) setCycleId(cycles[0].id);
  }, [cycleId, cycles]);

  const [departmentId, setDepartmentId] = useState(ALL);
  const [unitId, setUnitId] = useState(ALL);
  const [positionId, setPositionId] = useState(ALL);
  const [evaluatorRole, setEvaluatorRole] = useState(ALL);

  const { options: departmentOptionsRaw } = useDepartmentOptions();
  const { options: unitOptionsRaw } = useUnitOptions();
  const { options: positionOptionsRaw } = usePositionOptions();
  const departmentOptions: SelectItemOption[] = [{ value: ALL, label: 'Todos os departamentos' }, ...departmentOptionsRaw];
  const unitOptions: SelectItemOption[] = [{ value: ALL, label: 'Todas as unidades' }, ...unitOptionsRaw];
  const positionOptions: SelectItemOption[] = [{ value: ALL, label: 'Todos os cargos' }, ...positionOptionsRaw];
  const roleOptions: SelectItemOption[] = [
    { value: ALL, label: 'Todos os tipos de avaliador' },
    ...Object.entries(evaluatorRoleLabel).map(([value, label]) => ({ value, label })),
  ];

  const params: Record<string, string> = {};
  if (departmentId !== ALL) params.departmentId = departmentId;
  if (unitId !== ALL) params.unitId = unitId;
  if (positionId !== ALL) params.positionId = positionId;
  if (evaluatorRole !== ALL) params.evaluatorRole = evaluatorRole;

  const { data, isLoading } = useApiQuery<CycleReportData>(
    queryKeys.evaluation360.cycleReport(cycleId, params),
    `/evaluation360/cycles/${cycleId}/reports`,
    { params, staleTime: STALE_TIME.DYNAMIC, enabled: !!cycleId },
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="m-0 text-lg font-bold text-ink">Relatórios</h2>
        <p className="m-0 mt-1 text-sm text-ink-muted">
          Relatórios agregados de um ciclo de avaliação 360° — nunca identifica um avaliador
          individual.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <div className="text-xs font-semibold text-ink-muted mb-1">Ciclo</div>
          <Select
            items={cycleOptions}
            value={cycleId || undefined}
            onValueChange={setCycleId}
            placeholder={cyclesLoading ? 'A carregar…' : 'Escolher ciclo'}
            className="min-w-[220px]"
          />
        </div>
        <div>
          <div className="text-xs font-semibold text-ink-muted mb-1">Departamento</div>
          <Select items={departmentOptions} value={departmentId} onValueChange={setDepartmentId} />
        </div>
        <div>
          <div className="text-xs font-semibold text-ink-muted mb-1">Unidade</div>
          <Select items={unitOptions} value={unitId} onValueChange={setUnitId} />
        </div>
        <div>
          <div className="text-xs font-semibold text-ink-muted mb-1">Cargo</div>
          <Select items={positionOptions} value={positionId} onValueChange={setPositionId} />
        </div>
        <div>
          <div className="text-xs font-semibold text-ink-muted mb-1">Grupo de avaliador</div>
          <Select items={roleOptions} value={evaluatorRole} onValueChange={setEvaluatorRole} />
        </div>
      </div>

      {!cycleId && !cyclesLoading && (
        <div className="rounded-lg border border-border bg-surface p-5 text-sm text-ink-muted">
          Ainda não existe nenhum ciclo de avaliação 360º.
        </div>
      )}
      {cycleId && isLoading && <div className="text-sm text-ink-muted">A carregar…</div>}

      {data && (
        <>
          {/* Resultado geral 360° */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Avaliados" value={data.overall.totalParticipants} />
            <Stat label="Média geral" value={data.overall.avgOverall ? data.overall.avgOverall.toFixed(1) : '—'} />
            <Stat label="Média ponderada" value={data.overall.avgWeighted ? data.overall.avgWeighted.toFixed(1) : '—'} />
            <Stat label="Elegíveis a promoção" value={data.overall.eligiblePromotion} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Taxa de participação" value={`${data.participationRate}%`} />
            <Stat label="Taxa de conclusão" value={`${data.completionRate}%`} />
          </div>

          {/* Resultados por competência */}
          <div className="rounded-lg border border-border bg-surface px-5 py-4.5">
            <div className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3.5">
              Resultados por competência
            </div>
            <BarList items={data.byCompetency.map((c) => ({ key: c.competencyId, label: c.name, average: c.average }))} />
          </div>

          {/* Resultados por departamento / cargo / unidade */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-border bg-surface px-5 py-4.5">
              <div className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3.5">
                Por departamento
              </div>
              <BarList items={data.byDepartment.map((d) => ({ key: d.id, label: `${d.name} (${d.count})`, average: d.average }))} />
            </div>
            <div className="rounded-lg border border-border bg-surface px-5 py-4.5">
              <div className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3.5">
                Por cargo
              </div>
              <BarList items={data.byPosition.map((d) => ({ key: d.id, label: `${d.name} (${d.count})`, average: d.average }))} />
            </div>
            <div className="rounded-lg border border-border bg-surface px-5 py-4.5">
              <div className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3.5">
                Por unidade
              </div>
              <BarList items={data.byUnit.map((d) => ({ key: d.id, label: `${d.name} (${d.count})`, average: d.average }))} />
            </div>
          </div>

          {/* Por grupo de avaliadores */}
          <div className="rounded-lg border border-border bg-surface px-5 py-4.5">
            <div className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3.5">
              Resultados por grupo de avaliadores
            </div>
            <BarList
              items={Object.entries(data.byEvaluatorGroup)
                .filter(([, v]) => v !== null)
                .map(([k, v]) => ({ key: k, label: EVALUATOR_GROUP_LABEL[k] ?? k, average: v as number }))}
            />
          </div>

          {/* Comparações */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ComparisonStat
              title="Autoavaliação vs. avaliação externa"
              labelA="Autoavaliação"
              labelB="Externa"
              cmp={data.selfVsExternal}
            />
            <ComparisonStat title="Gestor vs. pares" labelA="Gestor" labelB="Pares" cmp={data.managerVsPeer} />
            <ComparisonStat
              title="Gestor vs. subordinados"
              labelA="Gestor"
              labelB="Subordinados"
              cmp={data.managerVsSubordinate}
            />
          </div>

          {/* Pontos fortes / gaps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-surface px-5 py-4.5">
              <div className="text-xs font-bold text-success-ink uppercase tracking-wider mb-3.5">
                Principais pontos fortes
              </div>
              {data.topStrengths.length === 0 && <div className="text-sm text-ink-muted">Sem dados suficientes ainda.</div>}
              {data.topStrengths.map((c) => (
                <div key={c.competencyId} className="flex justify-between items-center mb-2.5">
                  <span className="text-sm font-semibold text-ink">{c.name}</span>
                  <span className="text-xs text-ink-muted">{c.occurrences}× · {fmt(c.avgScore)}</span>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-border bg-surface px-5 py-4.5">
              <div className="text-xs font-bold text-danger-ink uppercase tracking-wider mb-3.5">
                Principais gaps
              </div>
              {data.topGaps.length === 0 && <div className="text-sm text-ink-muted">Sem dados suficientes ainda.</div>}
              {data.topGaps.map((c) => (
                <div key={c.competencyId} className="flex justify-between items-center mb-2.5">
                  <span className="text-sm font-semibold text-ink">{c.name}</span>
                  <span className="text-xs text-ink-muted">{c.occurrences}× · {fmt(c.avgScore)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Competências críticas */}
          <div className="rounded-lg border border-border bg-surface px-5 py-4.5">
            <div className="text-xs font-bold text-danger-ink uppercase tracking-wider mb-3.5">
              Competências críticas (abaixo do nível esperado)
            </div>
            {data.criticalCompetencies.length === 0 && (
              <div className="text-sm text-ink-muted">Nenhuma competência abaixo do nível esperado.</div>
            )}
            {data.criticalCompetencies.map((c) => (
              <div key={c.competencyId} className="flex justify-between items-center mb-2.5 text-sm">
                <span className="font-semibold text-ink">{c.name}</span>
                <span className="text-ink-muted">
                  {c.average.toFixed(1)} / esperado {fmt(c.expectedLevel)}
                  <span className="ml-2 font-bold" style={{ color: 'rgb(239, 68, 68)' }}>
                    {c.gapToExpected?.toFixed(1)}
                  </span>
                </span>
              </div>
            ))}
          </div>

          {/* Avaliadores pendentes */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="text-xs font-bold text-ink-muted uppercase tracking-wider">Avaliadores pendentes</div>
              <span className="text-sm font-bold text-ink">{data.pendingEvaluators.count}</span>
            </div>
            {data.pendingEvaluators.list.length === 0 ? (
              <div className="px-5 py-4 text-sm text-ink-muted">Sem avaliadores pendentes.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      <th className="px-4 py-2.5">Avaliador</th>
                      <th className="px-4 py-2.5">Avaliado</th>
                      <th className="px-4 py-2.5">Tipo</th>
                      <th className="px-4 py-2.5">Estado</th>
                      <th className="px-4 py-2.5">Convidado em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.pendingEvaluators.list.map((p, i) => (
                      <tr key={`${p.evaluatorId}-${p.evaluateeId}-${i}`} className="border-b border-border last:border-0">
                        <td className="px-4 py-2.5 text-ink">{p.evaluatorName}</td>
                        <td className="px-4 py-2.5 text-ink-muted">{p.evaluateeName}</td>
                        <td className="px-4 py-2.5 text-ink-muted">{evaluatorRoleLabel[p.role] ?? p.role}</td>
                        <td className="px-4 py-2.5 text-ink-muted">{p.status}</td>
                        <td className="px-4 py-2.5 text-ink-muted">{p.invitedAt ? p.invitedAt.slice(0, 10) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <CycleEvolutionSection cycles={cycles} />
    </div>
  );
}

// "Evolução entre ciclos" / "Comparação entre ciclos" (docs/evaluation360.md
// §9) — a mesma série de métricas por ciclo. Sem selecção, mostra a
// evolução completa (ordenada por data); escolher 2+ ciclos abaixo restringe
// a tabela só a esses (comparação lado a lado).
function CycleEvolutionSection({ cycles }: { cycles: { id: string; name: string }[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const cycleIds = selected.length > 0 ? selected.join(',') : '';
  const params: Record<string, string> = {};
  if (cycleIds) params.cycleIds = cycleIds;

  const { data, isLoading } = useApiQuery<{ data: CycleEvolutionPoint[] }>(
    queryKeys.evaluation360.cycleEvolution(params),
    '/evaluation360/reports/evolution',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );
  const points = data?.data ?? [];

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <section className="flex flex-col gap-5 border-t border-border pt-6">
      <div>
        <h2 className="m-0 text-lg font-bold text-ink">Evolução e Comparação entre Ciclos</h2>
        <p className="m-0 mt-1 text-sm text-ink-muted">
          Escolhe ciclos específicos para comparar, ou deixa em branco para ver a evolução completa.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {cycles.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => toggle(c.id)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              selected.includes(c.id)
                ? 'border-primary bg-primary-subtle text-primary'
                : 'border-border bg-surface text-ink-muted hover:text-ink'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {isLoading && <div className="text-sm text-ink-muted">A carregar…</div>}
      {!isLoading && points.length === 0 && (
        <div className="rounded-lg border border-border bg-surface p-5 text-sm text-ink-muted">
          Sem ciclos para comparar.
        </div>
      )}

      {points.length > 0 && (
        <div className="rounded-xl border border-border bg-surface overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-ink-muted">
                <th className="px-4 py-3">Ciclo</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Início</th>
                <th className="px-4 py-3 text-right">Avaliados</th>
                <th className="px-4 py-3 text-right">Média geral</th>
                <th className="px-4 py-3 text-right">Média ponderada</th>
                <th className="px-4 py-3 text-right">Participação</th>
                <th className="px-4 py-3 text-right">Conclusão</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.cycleId} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-semibold text-ink">{p.name}</td>
                  <td className="px-4 py-3 text-ink-muted">{cycleStatusText(p.status)}</td>
                  <td className="px-4 py-3 text-ink-muted whitespace-nowrap">{p.startDate.slice(0, 10)}</td>
                  <td className="px-4 py-3 text-right text-ink">{p.totalParticipants}</td>
                  <td className="px-4 py-3 text-right font-semibold text-ink">
                    {p.avgOverall ? p.avgOverall.toFixed(1) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-ink">{p.avgWeighted ? p.avgWeighted.toFixed(1) : '—'}</td>
                  <td className="px-4 py-3 text-right text-ink-muted">{p.participationRate}%</td>
                  <td className="px-4 py-3 text-right text-ink-muted">{p.completionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// components/evaluation360/ResultadosTab.tsx
// Separador "Resultados" (docs/evaluation360.md §7) — substitui os antigos
// separadores "Radar 360°" e "Competências" (o mesmo dado, agora reunido
// numa única vista com a tabela de comparação pedida pelo documento: auto ×
// gestor × pares × subordinados × outras × média × nível esperado × gap ×
// nº de respostas).
//
// Regra do produto mantida (ver evaluation360.service.ts#getParticipantResult):
// ninguém vê o resultado de outro utilizador — a secção pessoal abaixo é
// sempre "a minha". Só ADMIN/RH têm, adicionalmente, a tabela agregada de
// todo o ciclo (GET /evaluation360/cycles/:cycleId/results), gated pelo
// mesmo papel que o backend exige (lib/roles.ts#EVAL_RESULTS_ADMIN_ROLES).

'use client';

import { FilterPanelCard } from './FilterPanelCard';
import { useEffect, useMemo, useState } from 'react';
import type { CompetencyScore, CycleResultRow } from './types';
import { scoreColor, typeColor, typeLabel } from './colors';
import { RadarChart } from './RadarChart';
import { useHasRole } from '@/hooks/useCurrentRole';
import { EVAL_RESULTS_ADMIN_ROLES } from '@/lib/roles';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Select, type SelectItemOption } from '@/components/ui/Select';
import {
  useDepartmentOptions,
  usePositionOptions,
} from '@/components/competencies/modelFormData';
import { useCycleSelectorOptions } from './cycleData';
import { Skeleton } from '@/components/ui/Skeleton';

const ALL = '__ALL__';
const NONE = '—';

function distinctOptions(
  values: (string | null | undefined)[],
  allLabel: string,
): SelectItemOption[] {
  const unique = Array.from(
    new Set(values.map((v) => (v && v.trim() ? v : NONE))),
  ).sort((a, b) => a.localeCompare(b, 'pt'));
  return [
    { value: ALL, label: allLabel },
    ...unique.map((v) => ({ value: v, label: v })),
  ];
}

function fmt(v: number | null): string {
  return v === null ? '—' : v.toFixed(1);
}

function gapDisplay(c: CompetencyScore): { text: string; color: string } {
  if (c.gap !== null) {
    const color =
      c.gap > 0.5
        ? 'rgb(245, 158, 11)'
        : c.gap < -0.5
          ? 'rgb(34, 197, 94)'
          : 'var(--color-ink-muted)';
    const text = c.gap > 0 ? `▲ +${c.gap.toFixed(1)}` : `▼ ${c.gap.toFixed(1)}`;
    return { text, color };
  }
  if (c.selfRaw !== null)
    return {
      text: `Auto: ${c.selfRaw.toFixed(1)}`,
      color: 'var(--color-ink-muted)',
    };
  if (c.othersRaw !== null)
    return {
      text: `Outros: ${c.othersRaw.toFixed(1)}`,
      color: 'var(--color-ink-muted)',
    };
  return { text: 'Sem dados', color: 'var(--color-ink-faint)' };
}

// Nota com o sistema de cores por intervalo (verde ≥ 4,2 · azul ≥ 3,5 ·
// vermelho < 2,5). A faixa intermédia (âmbar) fica sem sombreado, só texto
// normal. Sem dados → "—".
const AMBER = 'rgb(245, 158, 11)';

function ScoreCell({ value }: { value: number | null }) {
  if (value === null) return <span>—</span>;
  const color = scoreColor(value);
  return (
    <span
      className="inline-block rounded px-2.5 py-0.5 text-sm font-bold"
      style={
        color === AMBER
          ? { color: 'var(--color-ink)' }
          : { background: `${color}22`, color }
      }
    >
      {value.toFixed(1)}
    </span>
  );
}

export interface ResultadosTabProps {
  competencies: CompetencyScore[];
}

export function ResultadosTab({ competencies }: ResultadosTabProps) {
  const canSeeAllResults = useHasRole(EVAL_RESULTS_ADMIN_ROLES);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-5">
        <div>
          <h2 className="m-0 text-lg font-bold text-ink">Os Meus Resultados</h2>
          <p className="m-0 mt-1 text-sm text-ink-muted">
            Comparação entre perspectivas: autoavaliação × gestor × pares ×
            subordinados × resultado global.
          </p>
        </div>

        {competencies.length === 0 ? (
          <div className="overflow-hidden rounded-[24px] border border-brand-line bg-surface p-5 shadow-[0_8px_24px_rgba(21,47,89,0.10)] font-body text-sm text-brand">
            <h3 className="-mx-5 -mt-5 mb-3 bg-brand-dark px-5 py-3 font-body text-xs font-semibold uppercase tracking-wider text-white">
              Resultados
            </h3>
            Ainda sem competências pontuadas para ti.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
              <div className="overflow-hidden rounded-[24px] border border-brand-line bg-surface p-5 shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
                <h3 className="-mx-5 -mt-5 mb-3.5 bg-brand-dark px-5 py-3 font-body text-xs font-semibold uppercase tracking-wider text-white">
                  Radar de competências
                </h3>
                <div className="flex justify-center">
                  <ErrorBoundary source="evaluation360.RadarChart">
                    <RadarChart competencies={competencies} />
                  </ErrorBoundary>
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                  Legenda de Lacunas
                </div>
                {competencies.map((c) => {
                  const { text, color } = gapDisplay(c);
                  return (
                    <div
                      key={c.id}
                      className="rounded-card border border-border bg-surface px-3.5 py-2.5 flex justify-between items-center"
                    >
                      <span className="text-sm font-semibold text-ink">
                        {c.name}
                      </span>
                      <span className="text-sm font-bold" style={{ color }}>
                        {text}
                      </span>
                    </div>
                  );
                })}
                <div className="text-xs text-ink-muted mt-2 leading-relaxed">
                  <span style={{ color: 'rgb(245, 158, 11)' }}>▲ positivo</span>{' '}
                  = sobreestima-se vs. outros
                  <br />
                  <span style={{ color: 'rgb(34, 197, 94)' }}>
                    ▼ negativo
                  </span>{' '}
                  = subestima-se (ponto forte!)
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {Object.entries(typeColor).map(([type, color]) => (
                <span
                  key={type}
                  className="flex items-center gap-1 text-xs text-ink-muted"
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ background: color }}
                  />
                  {typeLabel[type] ?? type}
                </span>
              ))}
            </div>
            <div className="rounded-card border border-border bg-surface overflow-x-auto">
              <table className="w-full text-sm border-collapse min-w-[1000px]">
                <thead>
                  <tr className="border-b border-border bg-brand-dark text-left text-xs font-semibold uppercase tracking-wider text-white">
                    <th className="px-4 py-3">Competência</th>
                    <th className="px-4 py-3 text-right">Auto</th>
                    <th className="px-4 py-3 text-right">Gestor</th>
                    <th className="px-4 py-3 text-right">Pares</th>
                    <th className="px-4 py-3 text-right">Subordinados</th>
                    <th className="px-4 py-3 text-right">Outras</th>
                    <th className="px-4 py-3 text-right">Média</th>
                    <th className="px-4 py-3 text-right">Referencial</th>
                    <th className="px-4 py-3 text-right">Nível esperado</th>
                    <th className="px-4 py-3 text-right">Lacuna</th>
                    <th className="px-4 py-3 text-right">Nº respostas</th>
                  </tr>
                </thead>
                <tbody>
                  {competencies.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{
                              background:
                                typeColor[c.type] ?? 'rgb(99, 102, 241)',
                            }}
                          />
                          <span className="font-semibold text-ink">
                            {c.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ScoreCell value={c.selfRaw} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ScoreCell value={c.managerRaw} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ScoreCell value={c.peerRaw} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ScoreCell value={c.subordinateScore} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ScoreCell value={c.externalScore} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ScoreCell value={c.score} />
                      </td>
                      <td className="px-4 py-3 text-right text-ink-muted">
                        {fmt(c.benchmark)}
                      </td>
                      <td className="px-4 py-3 text-right text-ink-muted">
                        {fmt(c.expectedLevel)}
                      </td>
                      <td className="px-4 py-3 text-right text-ink">
                        {fmt(c.gapToExpected ?? c.gap)}
                      </td>
                      <td className="px-4 py-3 text-right text-ink-muted">
                        {c.responseCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {canSeeAllResults && <CycleResultsMatrix />}
    </div>
  );
}

// Tabela agregada de todo o ciclo (ADMIN/RH) — uma linha por avaliado ×
// competência, GET /evaluation360/cycles/:cycleId/results.
function CycleResultsMatrix() {
  const {
    cycles,
    options: cycleOptions,
    loading: cyclesLoading,
  } = useCycleSelectorOptions();
  const [cycleId, setCycleId] = useState('');
  useEffect(() => {
    if (!cycleId && cycles.length > 0) setCycleId(cycles[0].id);
  }, [cycleId, cycles]);

  const { data, isLoading } = useApiQuery<{ data: CycleResultRow[] }>(
    queryKeys.evaluation360.cycleResults(cycleId),
    `/evaluation360/cycles/${cycleId}/results`,
    { staleTime: STALE_TIME.DYNAMIC, enabled: !!cycleId },
  );
  const rows = useMemo(() => data?.data ?? [], [data]);

  // Filtros: '' = ainda não escolhido. Enquanto nenhum for escolhido só se
  // mostra o cabeçalho da tabela; as linhas aparecem depois de filtrar.
  const [department, setDepartment] = useState('');
  const [competency, setCompetency] = useState('');
  const [position, setPosition] = useState('');
  useEffect(() => {
    setDepartment('');
    setCompetency('');
    setPosition('');
  }, [cycleId]);

  // Catálogo completo (todos os departamentos / funções), não só os que já
  // têm resultados no ciclo; juntam-se os nomes das linhas para não perder
  // valores antigos (ex.: departamento entretanto desactivado).
  const { options: allDepartments } = useDepartmentOptions();
  const { options: allPositions } = usePositionOptions();
  const departmentOptions = useMemo(
    () =>
      distinctOptions(
        [
          ...allDepartments.map((d) => d.label),
          ...rows.map((r) => r.department),
        ],
        'Todos os departamentos',
      ),
    [allDepartments, rows],
  );
  const competencyOptions = useMemo(
    () =>
      distinctOptions(
        rows.map((r) => r.competencyName),
        'Todas as competências',
      ),
    [rows],
  );
  const positionOptions = useMemo(
    () =>
      distinctOptions(
        [...allPositions.map((p) => p.label), ...rows.map((r) => r.position)],
        'Todas as funções',
      ),
    [allPositions, rows],
  );

  const hasFilter = department !== '' || competency !== '' || position !== '';
  const matches = (value: string | null | undefined, selected: string) =>
    selected === '' ||
    selected === ALL ||
    (value && value.trim() ? value : NONE) === selected;
  const filteredRows = hasFilter
    ? rows.filter(
        (r) =>
          matches(r.department, department) &&
          matches(r.competencyName, competency) &&
          matches(r.position, position),
      )
    : [];

  return (
    <section className="flex flex-col gap-5 border-t border-border pt-6">
      <div>
        <h2 className="m-0 text-lg font-bold text-ink">Resultados do Ciclo</h2>
        <p className="m-0 mt-1 text-sm text-ink-muted">
          Todos os avaliados × competência — visível apenas para ADMIN/RH.
        </p>
      </div>

      <FilterPanelCard>
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
          <div className="text-xs font-semibold text-ink-muted mb-1">
            Departamento
          </div>
          <Select
            items={departmentOptions}
            value={department || undefined}
            onValueChange={setDepartment}
            placeholder="Escolher departamento"
            className="min-w-[200px]"
          />
        </div>
        <div>
          <div className="text-xs font-semibold text-ink-muted mb-1">
            Competência
          </div>
          <Select
            items={competencyOptions}
            value={competency || undefined}
            onValueChange={setCompetency}
            placeholder="Escolher competência"
            className="min-w-[200px]"
          />
        </div>
        <div>
          <div className="text-xs font-semibold text-ink-muted mb-1">
            Função
          </div>
          <Select
            items={positionOptions}
            value={position || undefined}
            onValueChange={setPosition}
            placeholder="Escolher função"
            className="min-w-[200px]"
          />
        </div>
      </FilterPanelCard>

      {!cycleId && !cyclesLoading && (
        <div className="overflow-hidden rounded-[24px] border border-brand-line bg-surface p-5 shadow-[0_8px_24px_rgba(21,47,89,0.10)] font-body text-sm text-brand">
          <h3 className="-mx-5 -mt-5 mb-3 bg-brand-dark px-5 py-3 font-body text-xs font-semibold uppercase tracking-wider text-white">
            Resultados
          </h3>
          Ainda não existe nenhum ciclo de avaliação 360º.
        </div>
      )}
      {cycleId && isLoading && <Skeleton rows={3} />}
      {cycleId && !isLoading && rows.length === 0 && (
        <div className="overflow-hidden rounded-[24px] border border-brand-line bg-surface p-5 shadow-[0_8px_24px_rgba(21,47,89,0.10)] font-body text-sm text-brand">
          <h3 className="-mx-5 -mt-5 mb-3 bg-brand-dark px-5 py-3 font-body text-xs font-semibold uppercase tracking-wider text-white">
            Resultados
          </h3>
          Este ciclo ainda não tem resultados calculados.
        </div>
      )}

      {rows.length > 0 && (
        <div className="rounded-card border border-border bg-surface overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[1100px]">
            <thead>
              <tr className="border-b border-border bg-brand-dark text-left text-xs font-semibold uppercase tracking-wider text-white">
                <th className="px-4 py-3">Avaliado</th>
                <th className="px-4 py-3">Competência</th>
                <th className="px-4 py-3 text-right">Auto</th>
                <th className="px-4 py-3 text-right">Gestor</th>
                <th className="px-4 py-3 text-right">Pares</th>
                <th className="px-4 py-3 text-right">Subordinados</th>
                <th className="px-4 py-3 text-right">Outras</th>
                <th className="px-4 py-3 text-right">Média geral</th>
                <th className="px-4 py-3 text-right">Nível esperado</th>
                <th className="px-4 py-3 text-right">Lacuna</th>
                <th className="px-4 py-3 text-right">Nº respostas</th>
              </tr>
            </thead>
            <tbody>
              {!hasFilter && (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-6 text-center text-sm text-ink-muted"
                  >
                    Escolhe um departamento, competência ou função para ver os
                    resultados.
                  </td>
                </tr>
              )}
              {hasFilter && filteredRows.length === 0 && (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-6 text-center text-sm text-ink-muted"
                  >
                    Nenhum resultado para estes filtros.
                  </td>
                </tr>
              )}
              {filteredRows.map((r) => (
                <tr
                  key={`${r.userId}-${r.competencyId}`}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-ink">{r.fullName}</div>
                    <div className="text-xs text-ink-muted">
                      {r.position ?? '—'} · {r.department ?? '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink">{r.competencyName}</td>
                  <td className="px-4 py-3 text-right text-ink">
                    {fmt(r.selfScore)}
                  </td>
                  <td className="px-4 py-3 text-right text-ink">
                    {fmt(r.managerScore)}
                  </td>
                  <td className="px-4 py-3 text-right text-ink">
                    {fmt(r.peerScore)}
                  </td>
                  <td className="px-4 py-3 text-right text-ink">
                    {fmt(r.subordinateScore)}
                  </td>
                  <td className="px-4 py-3 text-right text-ink">
                    {fmt(r.externalScore)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-ink">
                    {fmt(r.overallScore)}
                  </td>
                  <td className="px-4 py-3 text-right text-ink-muted">
                    {fmt(r.expectedLevel)}
                  </td>
                  <td className="px-4 py-3 text-right text-ink">
                    {fmt(r.gap)}
                  </td>
                  <td className="px-4 py-3 text-right text-ink-muted">
                    {r.responseCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

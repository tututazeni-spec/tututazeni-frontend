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

import { useEffect, useState } from 'react';
import type { CompetencyScore, CycleResultRow } from './types';
import { typeColor, typeLabel } from './colors';
import { RadarChart } from './RadarChart';
import { CompetencyHeatmap } from './CompetencyHeatmap';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { EVAL_RESULTS_ADMIN_ROLES } from '@/lib/roles';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Select } from '@/components/ui/Select';
import { useCycleSelectorOptions } from './cycleData';

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

export interface ResultadosTabProps {
  competencies: CompetencyScore[];
}

export function ResultadosTab({ competencies }: ResultadosTabProps) {
  const role = useCurrentRole();
  const canSeeAllResults = !!role && EVAL_RESULTS_ADMIN_ROLES.includes(role);

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
          <div className="rounded-xl border border-border bg-surface p-6 text-sm text-ink-muted">
            Ainda sem competências pontuadas para ti.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
              <div className="rounded-xl border border-border bg-surface p-6 flex justify-center">
                <ErrorBoundary source="evaluation360.RadarChart">
                  <RadarChart competencies={competencies} />
                </ErrorBoundary>
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
                      className="rounded-lg border border-border bg-surface px-3.5 py-2.5 flex justify-between items-center"
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
            <div className="rounded-xl border border-border bg-surface overflow-hidden">
              <ErrorBoundary source="evaluation360.CompetencyHeatmap">
                <CompetencyHeatmap competencies={competencies} />
              </ErrorBoundary>
            </div>

            <div className="rounded-xl border border-border bg-surface overflow-x-auto">
              <table className="w-full text-sm border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    <th className="px-4 py-3">Competência</th>
                    <th className="px-4 py-3 text-right">Auto</th>
                    <th className="px-4 py-3 text-right">Gestor</th>
                    <th className="px-4 py-3 text-right">Pares</th>
                    <th className="px-4 py-3 text-right">Subordinados</th>
                    <th className="px-4 py-3 text-right">Outras</th>
                    <th className="px-4 py-3 text-right">Média</th>
                    <th className="px-4 py-3 text-right">Nível esperado</th>
                    <th className="px-4 py-3 text-right">Gap</th>
                    <th className="px-4 py-3 text-right">Nº respostas</th>
                  </tr>
                </thead>
                <tbody>
                  {competencies.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-4 py-3 font-semibold text-ink">
                        {c.name}
                      </td>
                      <td className="px-4 py-3 text-right text-ink">
                        {fmt(c.selfRaw)}
                      </td>
                      <td className="px-4 py-3 text-right text-ink">
                        {fmt(c.managerScore)}
                      </td>
                      <td className="px-4 py-3 text-right text-ink">
                        {fmt(c.peerScore)}
                      </td>
                      <td className="px-4 py-3 text-right text-ink">
                        {fmt(c.subordinateScore)}
                      </td>
                      <td className="px-4 py-3 text-right text-ink">
                        {fmt(c.externalScore)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-ink">
                        {fmt(c.score)}
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
  const rows = data?.data ?? [];

  return (
    <section className="flex flex-col gap-5 border-t border-border pt-6">
      <div>
        <h2 className="m-0 text-lg font-bold text-ink">Resultados do Ciclo</h2>
        <p className="m-0 mt-1 text-sm text-ink-muted">
          Todos os avaliados × competência — visível apenas para ADMIN/RH.
        </p>
      </div>

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

      {!cycleId && !cyclesLoading && (
        <div className="rounded-lg border border-border bg-surface p-5 text-sm text-ink-muted">
          Ainda não existe nenhum ciclo de avaliação 360º.
        </div>
      )}
      {cycleId && isLoading && (
        <div className="text-sm text-ink-muted">A carregar…</div>
      )}
      {cycleId && !isLoading && rows.length === 0 && (
        <div className="rounded-lg border border-border bg-surface p-5 text-sm text-ink-muted">
          Este ciclo ainda não tem resultados calculados.
        </div>
      )}

      {rows.length > 0 && (
        <div className="rounded-xl border border-border bg-surface overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[1100px]">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-ink-muted">
                <th className="px-4 py-3">Avaliado</th>
                <th className="px-4 py-3">Competência</th>
                <th className="px-4 py-3 text-right">Auto</th>
                <th className="px-4 py-3 text-right">Gestor</th>
                <th className="px-4 py-3 text-right">Pares</th>
                <th className="px-4 py-3 text-right">Subordinados</th>
                <th className="px-4 py-3 text-right">Outras</th>
                <th className="px-4 py-3 text-right">Média geral</th>
                <th className="px-4 py-3 text-right">Nível esperado</th>
                <th className="px-4 py-3 text-right">Gap</th>
                <th className="px-4 py-3 text-right">Nº respostas</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
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

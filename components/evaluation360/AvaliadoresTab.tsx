// components/evaluation360/AvaliadoresTab.tsx
// Separador "Avaliadores" (docs/evaluation360.md §5) — tabela de gestão das
// atribuições de um ciclo (uma linha por EvaluatorAssignment: avaliador +
// avaliado). Distinto de EvaluationCyclesTab (ciclos) e AvaliadosTab
// (avaliados) — mesmo selector de ciclo partilhado (cycleData.ts), porque
// esta é outra vista sobre o mesmo ciclo, não uma entidade própria com
// "ciclo activo" implícito.

'use client';

import { useEffect, useState } from 'react';
import type { CycleEvaluatorRow } from './types';
import { evaluatorAssignmentStatusLabel, evaluatorRoleLabel } from './colors';
import { useCycleSelectorOptions } from './cycleData';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Select, type SelectItemOption } from '@/components/ui/Select';

const ALL = 'ALL';

const STATUS_OPTIONS: SelectItemOption[] = [
  { value: ALL, label: 'Todos os estados' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'INVITED', label: 'Convite enviado' },
  { value: 'IN_PROGRESS', label: 'Em preenchimento' },
  { value: 'COMPLETED', label: 'Concluído' },
  { value: 'EXPIRED', label: 'Expirado' },
];

const ROLE_OPTIONS: SelectItemOption[] = [
  { value: ALL, label: 'Todos os tipos' },
  { value: 'SELF', label: 'Próprio' },
  { value: 'MANAGER', label: 'Gestor' },
  { value: 'PEER', label: 'Par' },
  { value: 'SUBORDINATE', label: 'Subordinado' },
  { value: 'EXTERNAL', label: 'Externo' },
];

export function AvaliadoresTab() {
  const { cycles, options: cycleOptions, loading: cyclesLoading } = useCycleSelectorOptions();
  const [cycleId, setCycleId] = useState('');
  useEffect(() => {
    if (!cycleId && cycles.length > 0) setCycleId(cycles[0].id);
  }, [cycleId, cycles]);

  const [status, setStatus] = useState(ALL);
  const [role, setRole] = useState(ALL);

  const params: Record<string, string> = { limit: '100' };
  if (status !== ALL) params.status = status;
  if (role !== ALL) params.role = role;

  const { data, isLoading } = useApiQuery<{ data: CycleEvaluatorRow[]; total: number }>(
    queryKeys.evaluation360.cycleEvaluators(cycleId, params),
    `/evaluation360/cycles/${cycleId}/evaluators`,
    { params, staleTime: STALE_TIME.DYNAMIC, enabled: !!cycleId },
  );
  const rows = data?.data ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="m-0 text-lg font-bold text-ink">Avaliadores</h2>
        <p className="m-0 mt-1 text-sm text-ink-muted">
          {cycleId && data ? `${data.total} atribuição(ões) neste ciclo` : 'Escolhe um ciclo de avaliação 360°.'}
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
          <div className="text-xs font-semibold text-ink-muted mb-1">Estado</div>
          <Select items={STATUS_OPTIONS} value={status} onValueChange={setStatus} />
        </div>
        <div>
          <div className="text-xs font-semibold text-ink-muted mb-1">Tipo de avaliador</div>
          <Select items={ROLE_OPTIONS} value={role} onValueChange={setRole} />
        </div>
      </div>

      {!cycleId && !cyclesLoading && (
        <div className="rounded-lg border border-border bg-surface p-5 text-sm text-ink-muted">
          Ainda não existe nenhum ciclo de avaliação 360º.
        </div>
      )}
      {cycleId && isLoading && <div className="text-sm text-ink-muted">A carregar…</div>}
      {cycleId && !isLoading && rows.length === 0 && (
        <div className="rounded-lg border border-border bg-surface p-5 text-sm text-ink-muted">
          Nenhum avaliador encontrado com estes filtros.
        </div>
      )}

      {rows.length > 0 && (
        <div className="rounded-xl border border-border bg-surface overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[1100px]">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-ink-muted">
                <th className="px-4 py-3">Avaliador</th>
                <th className="px-4 py-3">Cargo</th>
                <th className="px-4 py-3">Departamento</th>
                <th className="px-4 py-3">Relação com o avaliado</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Avaliado</th>
                <th className="px-4 py-3">Convite</th>
                <th className="px-4 py-3">Resposta</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Progresso</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-semibold text-ink">{e.evaluatorName}</td>
                  <td className="px-4 py-3 text-ink-muted">{e.position ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-muted">{e.department ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-muted">{evaluatorRoleLabel[e.role] ?? e.role}</td>
                  <td className="px-4 py-3 text-ink-muted">{e.role}</td>
                  <td className="px-4 py-3 text-ink">{e.evaluateeName}</td>
                  <td className="px-4 py-3 text-ink-muted whitespace-nowrap">
                    {e.invitedAt ? e.invitedAt.slice(0, 10) : 'Não enviado'}
                  </td>
                  <td className="px-4 py-3 text-ink-muted whitespace-nowrap">
                    {e.respondedAt ? e.respondedAt.slice(0, 10) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-surface-sunken text-ink">
                      {evaluatorAssignmentStatusLabel[e.status] ?? e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-ink">{e.progressPercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

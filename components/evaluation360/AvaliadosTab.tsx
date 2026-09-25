// components/evaluation360/AvaliadosTab.tsx
// Separador "Avaliados" (docs/evaluation360.md §4) — tabela de gestão dos
// participantes de um ciclo, com as colunas pedidas no documento e drill-down
// por colaborador (ParticipantDetailModal). Distinto de EvaluateOthersTab
// (esse é "quem EU avalio", pessoal) e de EvaluationCyclesTab (esse lista
// ciclos, não avaliados dentro de um ciclo).
//
// Como a aba não tem um "ciclo activo" implícito (é uma vista de gestão, não
// pessoal — ver useCycleSelectorOptions em cycleData.ts), há sempre um
// selector de ciclo no topo; sem isso não há como saber que CycleParticipant
// listar.

'use client';

import { useEffect, useState } from 'react';
import type { CycleParticipantRow } from './types';
import { participantStatusLabel } from './colors';
import { ParticipantDetailModal } from './ParticipantDetailModal';
import { useCycleSelectorOptions, useDepartmentOptions } from './cycleData';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Select, type SelectItemOption } from '@/components/ui/Select';

const ALL = 'ALL';

const STATUS_OPTIONS: SelectItemOption[] = [
  { value: ALL, label: 'Todos os estados' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'IN_PROGRESS', label: 'Em andamento' },
  { value: 'COMPLETED', label: 'Concluído' },
];

export function AvaliadosTab() {
  const { cycles, options: cycleOptions, loading: cyclesLoading } = useCycleSelectorOptions();
  const [cycleId, setCycleId] = useState('');
  // Assim que os ciclos chegam, selecciona o mais recente por omissão — sem
  // isto a aba ficava sempre vazia até o utilizador escolher manualmente.
  useEffect(() => {
    if (!cycleId && cycles.length > 0) setCycleId(cycles[0].id);
  }, [cycleId, cycles]);

  const [status, setStatus] = useState(ALL);
  const [departmentId, setDepartmentId] = useState(ALL);
  const [openUserId, setOpenUserId] = useState<string | null>(null);

  const { options: departmentOptionsRaw } = useDepartmentOptions();
  const departmentOptions: SelectItemOption[] = [
    { value: ALL, label: 'Todos os departamentos' },
    ...departmentOptionsRaw,
  ];

  const params: Record<string, string> = { limit: '100' };
  if (status !== ALL) params.status = status;
  if (departmentId !== ALL) params.departmentId = departmentId;

  const { data, isLoading } = useApiQuery<{ data: CycleParticipantRow[]; total: number }>(
    queryKeys.evaluation360.cycleParticipants(cycleId, params),
    `/evaluation360/cycles/${cycleId}/participants`,
    { params, staleTime: STALE_TIME.DYNAMIC, enabled: !!cycleId },
  );
  const rows = data?.data ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="m-0 text-lg font-bold text-ink">Avaliados</h2>
        <p className="m-0 mt-1 text-sm text-ink-muted">
          {cycleId && data ? `${data.total} avaliado(s) neste ciclo` : 'Escolhe um ciclo de avaliação 360°.'}
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
          <div className="text-xs font-semibold text-ink-muted mb-1">Departamento</div>
          <Select items={departmentOptions} value={departmentId} onValueChange={setDepartmentId} />
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
          Nenhum avaliado encontrado com estes filtros.
        </div>
      )}

      {rows.length > 0 && (
        <div className="rounded-xl border border-border bg-surface overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-ink-muted">
                <th className="px-4 py-3">Colaborador</th>
                <th className="px-4 py-3">Cargo</th>
                <th className="px-4 py-3">Departamento</th>
                <th className="px-4 py-3">Gestor</th>
                <th className="px-4 py-3 text-right">Avaliadores</th>
                <th className="px-4 py-3 text-right">Confirmados</th>
                <th className="px-4 py-3 text-right">Respostas</th>
                <th className="px-4 py-3 text-right">Progresso</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Resultado final</th>
                <th className="px-4 py-3">Conclusão</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr
                  key={p.userId}
                  className="border-b border-border last:border-0 cursor-pointer hover:bg-surface-sunken"
                  onClick={() => setOpenUserId(p.userId)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={p.fullName} url={p.avatarUrl ?? undefined} size="sm" />
                      <div>
                        <div className="font-semibold text-ink">{p.fullName}</div>
                        {p.employeeNumber && (
                          <div className="text-xs text-ink-muted">Nº {p.employeeNumber}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{p.position ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-muted">{p.department ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-muted">{p.managerName ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-ink">{p.evaluatorsCount}</td>
                  <td className="px-4 py-3 text-right text-ink">{p.confirmedEvaluators}</td>
                  <td className="px-4 py-3 text-right text-ink">{p.responsesReceived}</td>
                  <td className="px-4 py-3 text-right text-ink">{p.progressPercent}%</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-surface-sunken text-ink">
                      {participantStatusLabel[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-ink">
                    {p.finalScore !== null ? p.finalScore.toFixed(1) : '—'}
                  </td>
                  <td className="px-4 py-3 text-ink-muted whitespace-nowrap">
                    {p.completedAt ? p.completedAt.slice(0, 10) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {openUserId && cycleId && (
        <ParticipantDetailModal
          cycleId={cycleId}
          userId={openUserId}
          onClose={() => setOpenUserId(null)}
        />
      )}
    </div>
  );
}

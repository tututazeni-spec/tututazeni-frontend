// components/evaluation360/EvaluationCyclesTab.tsx
// Separador "Avaliações 360°" (docs/evaluation360.md §2) — lista principal
// dos ciclos de avaliação, com as colunas e filtros pedidos no documento
// (Nome, Código, Tipo, Período, Datas, Nº avaliados/avaliadores, Taxa de
// participação, Estado, Criado por, Data de criação; filtros por Estado,
// Tipo, Departamento, Unidade, Cargo, Responsável, Data). Substitui o antigo
// separador "Ciclos" (mesma entidade — um ciclo É uma avaliação 360°, ver
// docs/evaluation360.md "Estrutura final"), agora com os campos que o
// documento pede em vez do cartão simples anterior.
//
// Busca a sua própria query filtrada (useApiQuery directo, mesmo padrão de
// EvaluateOthersTab.tsx/GiveFeedbackModal.tsx) — distinta da query "top 50"
// que hooks/useEvaluation360.ts usa só para resolver o ciclo activo pessoal.

'use client';

import { useState } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { EVAL_CREATOR_ROLES, EVAL_CYCLE_DELETE_ROLES } from '@/lib/roles';
import { Button, IconButton } from '@/components/ui/Button';
import { Select, type SelectItemOption } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Trash2 } from 'lucide-react';
import { cycleStatusDisplay } from './colors';
import { CreateCycleModal } from './CreateCycleModal';
import { useDepartmentOptions, useUnitOptions, usePositionOptions } from './cycleData';

interface RawCycleRow {
  id: string;
  name: string;
  code: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  _count: { participants: number };
  evaluatorsCount: number;
  completedParticipants: number;
  participationRate: number;
}

const ALL = 'ALL';

const STATUS_OPTIONS: SelectItemOption[] = [
  { value: ALL, label: 'Todos os estados' },
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'PUBLISHED', label: 'Agendada / Aberta' },
  { value: 'IN_PROGRESS', label: 'Em andamento' },
  { value: 'PROCESSING', label: 'Em análise' },
  { value: 'COMPLETED', label: 'Concluída' },
  { value: 'CANCELLED', label: 'Arquivada' },
];

const TYPE_OPTIONS: SelectItemOption[] = [
  { value: ALL, label: 'Todos os tipos' },
  { value: 'TRIMESTRAL', label: 'Trimestral' },
  { value: 'SEMESTRAL', label: 'Semestral' },
  { value: 'ANUAL', label: 'Anual' },
  { value: 'PROJECT', label: 'Projecto' },
  { value: 'CUSTOM', label: 'Personalizado' },
];

export function EvaluationCyclesTab() {
  const role = useCurrentRole();
  // Espelha EVAL_CREATOR_ROLES/EVAL_CYCLE_DELETE_ROLES de
  // evaluation360.controller.ts — criar/distribuir é mais aberto do que
  // eliminar (soft delete, mas ainda assim destrutivo), ver lib/roles.ts.
  const canCreateCycle = !!role && EVAL_CREATOR_ROLES.includes(role);
  const canDeleteCycle = !!role && EVAL_CYCLE_DELETE_ROLES.includes(role);

  const [status, setStatus] = useState(ALL);
  const [type, setType] = useState(ALL);
  const [departmentId, setDepartmentId] = useState(ALL);
  const [unitId, setUnitId] = useState(ALL);
  const [positionId, setPositionId] = useState(ALL);
  const [createdBy, setCreatedBy] = useState(ALL);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [cycleModalOpen, setCycleModalOpen] = useState(false);

  const { options: departmentOptionsRaw } = useDepartmentOptions();
  const departmentOptions: SelectItemOption[] = [
    { value: ALL, label: 'Todos os departamentos' },
    ...departmentOptionsRaw,
  ];
  const { options: unitOptionsRaw } = useUnitOptions();
  const unitOptions: SelectItemOption[] = [
    { value: ALL, label: 'Todas as unidades' },
    ...unitOptionsRaw,
  ];
  const { options: positionOptionsRaw } = usePositionOptions();
  const positionOptions: SelectItemOption[] = [
    { value: ALL, label: 'Todos os cargos' },
    ...positionOptionsRaw,
  ];

  const params: Record<string, string> = { tenantId: 'default', limit: '100' };
  if (status !== ALL) params.status = status;
  if (type !== ALL) params.type = type;
  if (departmentId !== ALL) params.departmentId = departmentId;
  if (unitId !== ALL) params.unitId = unitId;
  if (positionId !== ALL) params.positionId = positionId;
  if (createdBy !== ALL) params.createdBy = createdBy;
  if (from) params.from = from;
  if (to) params.to = to;

  const { data, isLoading } = useApiQuery<{ data: RawCycleRow[]; total: number }>(
    queryKeys.evaluation360.cyclesList(params),
    '/evaluation360/cycles',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );
  const cycles = data?.data ?? [];

  // Opções do filtro "Responsável" — não há endpoint dedicado de "criadores
  // de ciclos"; deriva-se de uma leitura própria sem filtros (não da lista já
  // filtrada acima, que teria um problema de ovo-e-galinha ao filtrar por
  // criador antes de saber quem são os criadores possíveis).
  const creatorsParams = { tenantId: 'default', limit: '200' };
  const { data: allCyclesForCreators } = useApiQuery<{ data: RawCycleRow[]; total: number }>(
    queryKeys.evaluation360.cyclesList(creatorsParams),
    '/evaluation360/cycles',
    { params: creatorsParams, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const creatorOptions: SelectItemOption[] = [
    { value: ALL, label: 'Todos os responsáveis' },
    ...Array.from(
      new Map(
        (allCyclesForCreators?.data ?? []).map((c) => [c.createdBy, c.createdByName]),
      ).entries(),
    ).map(([value, label]) => ({ value, label })),
  ];

  const confirm = useConfirm();
  const notify = useToast();
  const deleteCycle = useApiMutation<unknown, string>(
    (id) => apiClient.delete<unknown>(`/evaluation360/cycles/${id}`),
    {
      invalidateKeys: [queryKeys.evaluation360.all],
      onSuccess: () => notify({ title: 'Ciclo eliminado', intent: 'success' }),
      onError: () =>
        notify({ title: 'Não foi possível eliminar o ciclo', intent: 'danger' }),
    },
  );

  async function handleDeleteCycle(c: RawCycleRow) {
    const ok = await confirm({
      title: 'Eliminar ciclo de avaliação',
      message: `Tens a certeza que queres eliminar "${c.name}"? Fica registado em Auditoria → Apagados e pode ser restaurado a partir de lá.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (ok) deleteCycle.mutate(c.id);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="m-0 text-lg font-bold text-ink">Avaliações 360°</h2>
          <p className="m-0 mt-1 text-sm text-ink-muted">
            {data ? `${data.total} avaliação(ões) 360°` : 'A carregar…'}
          </p>
        </div>
        {canCreateCycle && (
          <Button intent="primary" size="sm" onClick={() => setCycleModalOpen(true)}>
            + Novo Ciclo
          </Button>
        )}
      </div>

      {/* Filtros: Estado, Tipo, Departamento, Unidade, Cargo, Responsável, Data — docs/evaluation360.md §2 */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <div className="text-xs font-semibold text-ink-muted mb-1">Estado</div>
          <Select items={STATUS_OPTIONS} value={status} onValueChange={setStatus} />
        </div>
        <div>
          <div className="text-xs font-semibold text-ink-muted mb-1">Tipo</div>
          <Select items={TYPE_OPTIONS} value={type} onValueChange={setType} />
        </div>
        <div>
          <div className="text-xs font-semibold text-ink-muted mb-1">Departamento</div>
          <Select
            items={departmentOptions}
            value={departmentId}
            onValueChange={setDepartmentId}
          />
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
          <div className="text-xs font-semibold text-ink-muted mb-1">Responsável</div>
          <Select items={creatorOptions} value={createdBy} onValueChange={setCreatedBy} />
        </div>
        <div>
          <div className="text-xs font-semibold text-ink-muted mb-1">De</div>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <div className="text-xs font-semibold text-ink-muted mb-1">Até</div>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {isLoading && <div className="text-sm text-ink-muted">A carregar…</div>}
      {!isLoading && cycles.length === 0 && (
        <div className="rounded-lg border border-border bg-surface p-5 text-sm text-ink-muted">
          Nenhuma avaliação 360° encontrada com estes filtros.
        </div>
      )}

      {cycles.length > 0 && (
        <div className="rounded-xl border border-border bg-surface overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-ink-muted">
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Período</th>
                <th className="px-4 py-3 text-right">Avaliados</th>
                <th className="px-4 py-3 text-right">Avaliadores</th>
                <th className="px-4 py-3 text-right">Participação</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Criado por</th>
                <th className="px-4 py-3">Criado em</th>
                {canDeleteCycle && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {cycles.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-semibold text-ink">{c.name}</td>
                  <td className="px-4 py-3 text-ink-muted font-mono text-xs">{c.code}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {TYPE_OPTIONS.find((t) => t.value === c.type)?.label ?? c.type}
                  </td>
                  <td className="px-4 py-3 text-ink-muted whitespace-nowrap">
                    {c.startDate.slice(0, 10)} → {c.endDate.slice(0, 10)}
                  </td>
                  <td className="px-4 py-3 text-right text-ink">{c._count.participants}</td>
                  <td className="px-4 py-3 text-right text-ink">{c.evaluatorsCount}</td>
                  <td className="px-4 py-3 text-right text-ink">{c.participationRate}%</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-surface-sunken text-ink">
                      {cycleStatusDisplay(c.status, c.startDate, c.endDate)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{c.createdByName}</td>
                  <td className="px-4 py-3 text-ink-muted whitespace-nowrap">
                    {c.createdAt.slice(0, 10)}
                  </td>
                  {canDeleteCycle && (
                    <td className="px-4 py-3">
                      <IconButton
                        icon={Trash2}
                        label={`Eliminar ciclo ${c.name}`}
                        intent="danger"
                        size="sm"
                        onClick={() => handleDeleteCycle(c)}
                        disabled={deleteCycle.isPending}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {cycleModalOpen && canCreateCycle && (
        <CreateCycleModal
          onClose={() => setCycleModalOpen(false)}
          onSuccess={() => setCycleModalOpen(false)}
        />
      )}
    </div>
  );
}

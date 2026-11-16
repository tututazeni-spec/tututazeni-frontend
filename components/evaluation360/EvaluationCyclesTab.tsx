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

import { FilterPanelCard } from './FilterPanelCard';
import { useState } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useHasRole } from '@/hooks/useCurrentRole';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { EVAL_CREATOR_ROLES, EVAL_CYCLE_DELETE_ROLES } from '@/lib/roles';
import { Button, IconButton } from '@/components/ui/Button';
import { Select, type SelectItemOption } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import {
  Briefcase,
  Building2,
  Filter,
  Landmark,
  MapPin,
  Trash2,
  User,
} from 'lucide-react';
import { cycleStatusDisplay } from './colors';
import { CreateCycleModal } from './CreateCycleModal';
import { CycleDetailModal } from './CycleDetailModal';
import {
  useDepartmentOptions,
  useUnitOptions,
  usePositionOptions,
} from './cycleData';
import { cn } from '@/lib/cn';
import { Skeleton } from '@/components/ui/Skeleton';
import { CompetencyExportMenu } from '@/components/competencies/CompetencyExportMenu';

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

// Mesma grelha no cabeçalho e nas linhas para as colunas alinharem.
const CYCLE_GRID =
  'grid grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.7fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)_28px] items-center gap-x-8 px-4';

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
  // Espelha EVAL_CREATOR_ROLES/EVAL_CYCLE_DELETE_ROLES de
  // evaluation360.controller.ts — criar/distribuir é mais aberto do que
  // eliminar (soft delete, mas ainda assim destrutivo), ver lib/roles.ts.
  const canCreateCycle = useHasRole(EVAL_CREATOR_ROLES);
  const canDeleteCycle = useHasRole(EVAL_CYCLE_DELETE_ROLES);

  const [status, setStatus] = useState(ALL);
  const [type, setType] = useState(ALL);
  const [departmentId, setDepartmentId] = useState(ALL);
  const [unitId, setUnitId] = useState(ALL);
  const [positionId, setPositionId] = useState(ALL);
  const [createdBy, setCreatedBy] = useState(ALL);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [cycleModalOpen, setCycleModalOpen] = useState(false);
  const [selected, setSelected] = useState<{
    cycle: RawCycleRow;
    index: number;
  } | null>(null);

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

  const { data, isLoading } = useApiQuery<{
    data: RawCycleRow[];
    total: number;
  }>(queryKeys.evaluation360.cyclesList(params), '/evaluation360/cycles', {
    params,
    staleTime: STALE_TIME.DYNAMIC,
  });
  const cycles = data?.data ?? [];

  // Opções do filtro "Responsável" — não há endpoint dedicado de "criadores
  // de ciclos"; deriva-se de uma leitura própria sem filtros (não da lista já
  // filtrada acima, que teria um problema de ovo-e-galinha ao filtrar por
  // criador antes de saber quem são os criadores possíveis).
  const creatorsParams = { tenantId: 'default', limit: '200' };
  const { data: allCyclesForCreators } = useApiQuery<{
    data: RawCycleRow[];
    total: number;
  }>(
    queryKeys.evaluation360.cyclesList(creatorsParams),
    '/evaluation360/cycles',
    { params: creatorsParams, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const creatorOptions: SelectItemOption[] = [
    { value: ALL, label: 'Todos os responsáveis' },
    ...Array.from(
      new Map(
        (allCyclesForCreators?.data ?? []).map((c) => [
          c.createdBy,
          c.createdByName,
        ]),
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
        notify({
          title: 'Não foi possível eliminar o ciclo',
          intent: 'danger',
        }),
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
        <div className="flex items-center gap-2">
          <CompetencyExportMenu
            disabled={isLoading}
            build={() => ({
              title: 'Avaliações 360°',
              filename: 'avaliacoes-360',
              headers: [
                'Código',
                'Nome',
                'Tipo',
                'Estado',
                'Início',
                'Fim',
                'Responsável',
                'Avaliados',
                'Avaliadores',
                'Concluídos',
                'Participação (%)',
              ],
              rows: cycles.map((c) => [
                c.code,
                c.name,
                c.type,
                c.status,
                c.startDate?.slice(0, 10),
                c.endDate?.slice(0, 10),
                c.createdByName,
                c._count.participants,
                c.evaluatorsCount,
                c.completedParticipants,
                Math.round(c.participationRate),
              ]),
            })}
          />
          {canCreateCycle && (
            <Button
              intent="primary"
              size="sm"
              onClick={() => setCycleModalOpen(true)}
            >
              + Novo Ciclo
            </Button>
          )}
        </div>
      </div>

      {/* Filtros: Estado, Tipo, Departamento, Unidade, Cargo, Responsável, Data — docs/evaluation360.md §2 */}
      <FilterPanelCard>
        <div>
          <div className="text-xs font-semibold text-ink-muted mb-1">
            Estado
          </div>
          <Select
            variant="underline"
            icon={MapPin}
            items={STATUS_OPTIONS}
            value={status}
            onValueChange={setStatus}
          />
        </div>
        <div>
          <div className="text-xs font-semibold text-ink-muted mb-1">Tipo</div>
          <Select
            variant="underline"
            icon={Filter}
            items={TYPE_OPTIONS}
            value={type}
            onValueChange={setType}
          />
        </div>
        <div>
          <div className="text-xs font-semibold text-ink-muted mb-1">
            Departamento
          </div>
          <Select
            variant="underline"
            icon={Building2}
            items={departmentOptions}
            value={departmentId}
            onValueChange={setDepartmentId}
          />
        </div>
        <div>
          <div className="text-xs font-semibold text-ink-muted mb-1">
            Unidade
          </div>
          <Select
            variant="underline"
            icon={Landmark}
            items={unitOptions}
            value={unitId}
            onValueChange={setUnitId}
          />
        </div>
        <div>
          <div className="text-xs font-semibold text-ink-muted mb-1">Cargo</div>
          <Select
            variant="underline"
            icon={Briefcase}
            items={positionOptions}
            value={positionId}
            onValueChange={setPositionId}
          />
        </div>
        <div>
          <div className="text-xs font-semibold text-ink-muted mb-1">
            Responsável
          </div>
          <Select
            variant="underline"
            icon={User}
            items={creatorOptions}
            value={createdBy}
            onValueChange={setCreatedBy}
          />
        </div>
        <div>
          <div className="text-xs font-semibold text-ink-muted mb-1">De</div>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <div className="text-xs font-semibold text-ink-muted mb-1">Até</div>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </FilterPanelCard>

      {isLoading && <Skeleton rows={3} />}
      {!isLoading && cycles.length === 0 && (
        <div className="overflow-hidden rounded-card border border-brand bg-surface p-5 font-body text-sm text-brand">
          <h3 className="-mx-5 -mt-5 mb-3 bg-brand-dark px-5 py-3 font-semibold text-white">
            Avaliações 360°
          </h3>
          Nenhuma avaliação 360° encontrada com estes filtros.
        </div>
      )}

      {cycles.length > 0 && (
        <div className="overflow-hidden rounded-[24px] border border-brand-line bg-surface shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
          <div>
            <div>
              <div
                className={cn(
                  CYCLE_GRID,
                  'bg-brand-dark py-3 text-xs font-semibold uppercase tracking-wider text-white',
                )}
              >
                <div>Nome</div>
                <div>Código</div>
                <div>Tipo</div>
                <div>Período</div>
                <div className="text-right">Avaliados</div>
                <div className="text-right">Avaliadores</div>
                <div className="text-right">Participação</div>
                <div>Estado</div>
                <div>Criado por</div>
                <div>Criado em</div>
                {canDeleteCycle && <div />}
              </div>
              {cycles.map((c, idx) => (
                <div
                  key={c.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelected({ cycle: c, index: idx })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelected({ cycle: c, index: idx });
                    }
                  }}
                  className={cn(
                    CYCLE_GRID,
                    'cursor-pointer border-b border-brand-line bg-surface py-3 font-body text-sm text-ink-muted last:border-0 hover:bg-surface-sunken',
                  )}
                >
                  <div className="break-words font-semibold text-ink">
                    {c.name}
                  </div>
                  <div className="break-words">{c.code}</div>
                  <div className="break-words">
                    {TYPE_OPTIONS.find((t) => t.value === c.type)?.label ??
                      c.type}
                  </div>
                  <div className="break-words">
                    {c.startDate.slice(0, 10)} → {c.endDate.slice(0, 10)}
                  </div>
                  <div className="text-right text-ink">
                    {c._count.participants}
                  </div>
                  <div className="text-right text-ink">{c.evaluatorsCount}</div>
                  <div className="text-right text-ink">
                    {c.participationRate}%
                  </div>
                  <div>
                    <span className="inline-flex items-center rounded-full bg-surface-sunken px-2.5 py-1 text-xs font-bold text-ink">
                      {cycleStatusDisplay(c.status, c.startDate, c.endDate)}
                    </span>
                  </div>
                  <div className="break-words">{c.createdByName}</div>
                  <div className="break-words">{c.createdAt.slice(0, 10)}</div>
                  {canDeleteCycle && (
                    <div>
                      <IconButton
                        icon={Trash2}
                        label={`Eliminar ciclo ${c.name}`}
                        intent="danger"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCycle(c);
                        }}
                        disabled={deleteCycle.isPending}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selected && (
        <CycleDetailModal
          cycle={selected.cycle}
          // +1 salta a primeira cor (azul marinho)
          colorIndex={selected.index + 1}
          onClose={() => setSelected(null)}
        />
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

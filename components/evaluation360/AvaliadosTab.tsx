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

import { FilterPanelCard } from './FilterPanelCard';
import { useState } from 'react';
import type { CycleParticipantRow } from './types';
import { participantStatusLabel } from './colors';
import { ParticipantDetailModal } from './ParticipantDetailModal';
import { useCycleSelectorOptions, useDepartmentOptions } from './cycleData';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Select, type SelectItemOption } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { CompetencyExportMenu } from '@/components/competencies/CompetencyExportMenu';
import { Building2, MapPin } from 'lucide-react';
import { cn } from '@/lib/cn';

// Mesma grelha no cabeçalho e nas linhas (desenho da lista de Avaliações 360°).
const PARTICIPANT_GRID =
  'grid grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.4fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-8 px-4';

const ALL = 'ALL';

const STATUS_OPTIONS: SelectItemOption[] = [
  { value: ALL, label: 'Todos os estados' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'IN_PROGRESS', label: 'Em andamento' },
  { value: 'COMPLETED', label: 'Concluído' },
];

export function AvaliadosTab() {
  const { options: cycleOptions, loading: cyclesLoading } =
    useCycleSelectorOptions();
  const [cycleId, setCycleId] = useState('');

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

  const { data, isLoading } = useApiQuery<{
    data: CycleParticipantRow[];
    total: number;
  }>(
    queryKeys.evaluation360.cycleParticipants(cycleId, params),
    `/evaluation360/cycles/${cycleId}/participants`,
    { params, staleTime: STALE_TIME.DYNAMIC, enabled: !!cycleId },
  );
  const rows = data?.data ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="m-0 text-lg font-bold text-ink">Avaliados</h2>
          <p className="m-0 mt-1 text-sm text-ink-muted">
            {cycleId && data
              ? `${data.total} avaliado(s) neste ciclo`
              : 'Escolhe um ciclo de avaliação 360°.'}
          </p>
        </div>
        <CompetencyExportMenu
          disabled={!cycleId || isLoading}
          build={() => ({
            title: 'Avaliação 360° — Avaliados',
            filename: 'avaliados-360',
            headers: [
              'Colaborador',
              'Nº colaborador',
              'Cargo',
              'Departamento',
              'Gestor',
              'Avaliadores',
              'Confirmados',
              'Respostas',
              'Progresso (%)',
              'Estado',
              'Resultado final',
              'Conclusão',
            ],
            rows: rows.map((p) => [
              p.fullName,
              p.employeeNumber,
              p.position,
              p.department,
              p.managerName,
              p.evaluatorsCount,
              p.confirmedEvaluators,
              p.responsesReceived,
              Math.round(p.progressPercent),
              participantStatusLabel[p.status] ?? p.status,
              p.finalScore === null ? '' : p.finalScore.toFixed(2),
              p.completedAt?.slice(0, 10),
            ]),
          })}
        />
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
      </FilterPanelCard>

      {!cycleId && !cyclesLoading && (
        <div className="overflow-hidden rounded-[24px] border border-brand-line bg-surface p-5 shadow-[0_8px_24px_rgba(21,47,89,0.10)] font-body text-sm text-brand">
          <h3 className="-mx-5 -mt-5 mb-3 bg-brand-dark px-5 py-3 font-body text-xs font-semibold uppercase tracking-wider text-white">
            Avaliados
          </h3>
          {cycleOptions.length === 0
            ? 'Ainda não existe nenhum ciclo de avaliação 360º.'
            : 'Escolhe um ciclo para ver os resultados.'}
        </div>
      )}
      {cycleId && isLoading && <Skeleton rows={3} />}
      {cycleId && !isLoading && rows.length === 0 && (
        <div className="overflow-hidden rounded-[24px] border border-brand-line bg-surface p-5 shadow-[0_8px_24px_rgba(21,47,89,0.10)] font-body text-sm text-brand">
          <h3 className="-mx-5 -mt-5 mb-3 bg-brand-dark px-5 py-3 font-body text-xs font-semibold uppercase tracking-wider text-white">
            Avaliados
          </h3>
          Nenhum avaliado encontrado com estes filtros.
        </div>
      )}

      {rows.length > 0 && (
        <div className="overflow-hidden rounded-[24px] border border-brand-line bg-surface shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
          <div
            className={cn(
              PARTICIPANT_GRID,
              'bg-brand-dark py-3 text-xs font-semibold uppercase tracking-wider text-white',
            )}
          >
            <div>Colaborador</div>
            <div>Cargo</div>
            <div>Departamento</div>
            <div>Gestor</div>
            <div className="text-right">Avaliadores</div>
            <div className="text-right">Confirmados</div>
            <div className="text-right">Respostas</div>
            <div className="text-right">Progresso</div>
            <div>Estado</div>
            <div className="text-right">Resultado final</div>
            <div>Conclusão</div>
          </div>
          {rows.map((p) => (
            <div
              key={p.userId}
              role="button"
              tabIndex={0}
              onClick={() => setOpenUserId(p.userId)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setOpenUserId(p.userId);
                }
              }}
              className={cn(
                PARTICIPANT_GRID,
                'cursor-pointer border-b border-brand-line bg-surface py-3 font-body text-sm text-ink-muted last:border-0 hover:bg-surface-sunken',
              )}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <Avatar
                  name={p.fullName}
                  url={p.avatarUrl ?? undefined}
                  size="sm"
                />
                <div className="min-w-0">
                  <div className="break-words font-semibold text-ink">
                    {p.fullName}
                  </div>
                  {p.employeeNumber && (
                    <div className="text-xs text-ink-muted">
                      Nº {p.employeeNumber}
                    </div>
                  )}
                </div>
              </div>
              <div className="break-words">{p.position ?? '—'}</div>
              <div className="break-words">{p.department ?? '—'}</div>
              <div className="break-words">{p.managerName ?? '—'}</div>
              <div className="text-right text-ink">{p.evaluatorsCount}</div>
              <div className="text-right text-ink">{p.confirmedEvaluators}</div>
              <div className="text-right text-ink">{p.responsesReceived}</div>
              <div className="text-right text-ink">{p.progressPercent}%</div>
              <div>
                <span className="text-xs font-bold text-ink">
                  {participantStatusLabel[p.status] ?? p.status}
                </span>
              </div>
              <div className="text-right text-ink">
                {p.finalScore !== null ? p.finalScore.toFixed(1) : '—'}
              </div>
              <div className="break-words">
                {p.completedAt ? p.completedAt.slice(0, 10) : '—'}
              </div>
            </div>
          ))}
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

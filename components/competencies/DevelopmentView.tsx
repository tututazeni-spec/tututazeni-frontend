// components/competencies/DevelopmentView.tsx
// Separador "Desenvolvimento" (docs/módulo_competencies.md §8) — liga as
// lacunas de competências às acções de desenvolvimento do PDI (GET
// /competencies/development). Integração com Development Plans/PDI,
// Trainings e Courses — ver competencies.service.ts#getDevelopmentActions.
// Mesmo padrão de components/competencies/EvaluationsView.tsx/GapsView.tsx.

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DEV_ACTION_STATUS_CFG, DEV_ACTION_TYPE_CFG } from './constants';
import { useCompetencyOptions, type DirectoryUser } from './modelFormData';
import { UserFilterSearch } from './UserFilterSearch';
import type { CompetencyDevelopmentAction } from './types';
import { Filter, Layers, MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/providers/ToastProvider';
import { useHasRole } from '@/hooks/useCurrentRole';
import { DevelopmentDetailModal } from './DevelopmentDetailModal';
import { DevelopmentPlanFormModal } from './DevelopmentPlanFormModal';

// Mesmo RBAC de POST /development-plans (ADMIN, RH, GESTOR).
const CREATE_ROLES = ['ADMIN', 'RH', 'GESTOR'] as const;

const ALL = 'ALL';

const TYPE_ITEMS = [
  { value: ALL, label: 'Todos os tipos' },
  ...Object.entries(DEV_ACTION_TYPE_CFG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
  })),
];

const STATUS_ITEMS = [
  { value: ALL, label: 'Todos os estados' },
  ...Object.entries(DEV_ACTION_STATUS_CFG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
  })),
];

export function DevelopmentView() {
  const [competencyId, setCompetencyId] = useState(ALL);
  const [type, setType] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [user, setUser] = useState<DirectoryUser | null>(null);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<CompetencyDevelopmentAction | null>(
    null,
  );
  const canCreate = useHasRole(CREATE_ROLES);
  const notify = useToast();

  const { options: competencyOptions } = useCompetencyOptions();

  const params = {
    competencyId: competencyId === ALL ? undefined : competencyId,
    type: type === ALL ? undefined : type,
    status: status === ALL ? undefined : status,
    userId: user?.id,
  };

  // Sem nenhum filtro seleccionado não se mostram planos (como em Avaliações).
  const hasFilter = Object.values(params).some((v) => v !== undefined);

  const { data: rows, isLoading: loading } = useApiQuery<
    CompetencyDevelopmentAction[]
  >(queryKeys.competencies.development(params), '/competencies/development', {
    params,
    staleTime: STALE_TIME.DYNAMIC,
    enabled: hasFilter,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          variant="underline"
          icon={Layers}
          items={[
            { value: ALL, label: 'Todas as competências' },
            ...competencyOptions,
          ]}
          value={competencyId}
          onValueChange={setCompetencyId}
        />
        <Select
          variant="underline"
          icon={Filter}
          items={TYPE_ITEMS}
          value={type}
          onValueChange={setType}
        />
        <Select
          variant="underline"
          icon={MapPin}
          items={STATUS_ITEMS}
          value={status}
          onValueChange={setStatus}
        />
        <UserFilterSearch
          selected={user}
          onChange={setUser}
          className="w-[220px]"
        />
        {canCreate && (
          <Button className="ml-auto" onClick={() => setCreating(true)}>
            <Plus size={16} strokeWidth={1.75} className="mr-1.5" />
            Novo plano de evolução
          </Button>
        )}
      </div>

      {!hasFilter ? (
        <EmptyState
          title="Seleccione um filtro"
          description="Escolha uma competência, tipo, estado ou colaborador para ver os planos de evolução."
        />
      ) : loading ? (
        <Skeleton rows={6} />
      ) : !rows || rows.length === 0 ? (
        <EmptyState
          title="Sem acções de desenvolvimento"
          description="Nenhuma acção de desenvolvimento corresponde aos filtros seleccionados."
        />
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div
              key={r.id}
              onClick={() => setSelected(r)}
              role="button"
              tabIndex={0}
              aria-label={`Ver detalhes da acção ${r.acao} de ${r.colaborador}`}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelected(r);
                }
              }}
              className="relative flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 overflow-hidden rounded-[18px] border border-brand-line bg-surface px-4 py-[11px] shadow-[0_4px_12px_rgba(21,47,89,0.10)] transition hover:border-brand"
            >
              <div className="min-w-0 flex-1 truncate font-body text-sm text-brand">
                <span className="font-semibold">{r.acao}</span>
                <span className="ml-2 text-xs text-brand-muted">
                  {r.colaborador}
                  {r.departamento ? ` · ${r.departamento}` : ''}
                </span>
              </div>
              <span className="font-body text-xs text-brand-muted">
                {r.competencia}
              </span>
              <span className="font-body text-xs text-brand-muted">
                {r.pdiAssociado.name}
              </span>
              <span className="font-body text-xs font-semibold text-brand">
                {r.progresso}%
              </span>
              <StatusBadge value={r.tipoAcao} map={DEV_ACTION_TYPE_CFG} />
              <StatusBadge value={r.estado} map={DEV_ACTION_STATUS_CFG} />
            </div>
          ))}
        </div>
      )}
      {selected && (
        <DevelopmentDetailModal
          action={selected}
          onClose={() => setSelected(null)}
        />
      )}
      {creating && (
        <DevelopmentPlanFormModal
          onClose={() => setCreating(false)}
          onSuccess={() =>
            notify({
              title: 'Plano de evolução criado e atribuído.',
              intent: 'success',
            })
          }
        />
      )}
    </div>
  );
}

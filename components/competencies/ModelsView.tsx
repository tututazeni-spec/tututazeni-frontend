// components/competencies/ModelsView.tsx
// Separador "Modelos de Competências" (docs/módulo_competencies.md §4,
// Fase 2) — grid de modelos com filtro por departamento/estado. Mesmo
// padrão visual de CatalogView.tsx (cartão clicável abre o detalhe).

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { HIERARCHY_LEVEL_CFG, STATUS_CFG } from './constants';
import { useDepartmentOptions } from './modelFormData';
import type { CompetencyModel } from './types';
import { Building2, MapPin, Plus } from 'lucide-react';

const STATUS_ITEMS = [
  { value: 'ALL', label: 'Todos os estados' },
  { value: 'ACTIVE', label: 'Activos' },
  { value: 'IN_REVIEW', label: 'Em revisão' },
  { value: 'INACTIVE', label: 'Inactivos' },
];

interface ModelsViewProps {
  onSelect: (id: number) => void;
  canManage?: boolean;
  onCreate?: () => void;
}

export function ModelsView({
  onSelect,
  canManage = false,
  onCreate,
}: ModelsViewProps) {
  const [departmentId, setDepartmentId] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const { options: departmentOptions } = useDepartmentOptions();

  const params = {
    departmentId: departmentId === 'ALL' ? '' : departmentId,
    status: status === 'ALL' ? '' : status,
    limit: 50,
  };

  const { data, isLoading } = useApiQuery<{
    data: CompetencyModel[];
    total: number;
  }>(queryKeys.competencies.models(params), '/competencies/models', {
    params,
    staleTime: STALE_TIME.SEMI_STATIC,
    placeholderData: keepPreviousData,
  });

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            variant="underline"
            icon={Building2}
            items={[
              { value: 'ALL', label: 'Todos os departamentos' },
              ...departmentOptions,
            ]}
            value={departmentId}
            onValueChange={setDepartmentId}
            className="min-w-[200px]"
          />
          <Select
            variant="underline"
            icon={MapPin}
            items={STATUS_ITEMS}
            value={status}
            onValueChange={setStatus}
          />
          <span className="font-body text-sm text-ink-faint">
            {data?.total ?? 0} modelos
          </span>
        </div>
        {canManage && onCreate && (
          <Button onClick={onCreate}>
            <Plus size={16} strokeWidth={1.75} className="mr-1.5" />
            Novo modelo
          </Button>
        )}
      </div>

      {isLoading ? (
        <Skeleton rows={6} />
      ) : (
        <div className="space-y-3">
          {data?.data.map((model) => (
            <div
              key={model.id}
              onClick={() => onSelect(model.id)}
              role="button"
              tabIndex={0}
              aria-label={`Ver detalhes do modelo ${model.name}`}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(model.id);
                }
              }}
              className="relative flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 overflow-hidden rounded-[18px] border border-brand-line bg-surface px-4 py-[11px] shadow-[0_4px_12px_rgba(21,47,89,0.10)] transition hover:border-brand"
            >
              <div className="min-w-0 flex-1 truncate font-body text-sm text-brand">
                <span className="font-semibold">{model.name}</span>
                {model.code && (
                  <span className="ml-1.5 text-xs text-brand-muted">
                    {model.code}
                  </span>
                )}
                {model.description && (
                  <span
                    className="ml-2 text-xs text-brand-muted"
                    title={model.description}
                  >
                    {model.description}
                  </span>
                )}
              </div>
              {model.department && (
                <span className="font-body text-xs text-brand-muted">
                  {model.department.name}
                </span>
              )}
              {model.owner && (
                <span className="font-body text-xs text-brand-muted">
                  {model.owner.fullName}
                </span>
              )}
              <span className="font-body text-xs font-semibold text-brand">
                {model._count.items} competências
              </span>
              <span className="rounded bg-surface-sunken px-1.5 py-0.5 font-body text-xs text-ink-muted">
                v{model.version}
              </span>
              {model.hierarchyLevel && (
                <StatusBadge
                  value={model.hierarchyLevel}
                  map={HIERARCHY_LEVEL_CFG}
                />
              )}
              <StatusBadge value={model.status} map={STATUS_CFG} />
            </div>
          ))}
          {data?.data.length === 0 && (
            <EmptyState
              title="Nenhum modelo de competências encontrado"
              description="Ajusta os filtros ou cria um novo modelo."
            />
          )}
        </div>
      )}
    </div>
  );
}

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
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { HIERARCHY_LEVEL_CFG, STATUS_CFG } from './constants';
import { useDepartmentOptions } from './modelFormData';
import type { CompetencyModel } from './types';

const STATUS_ITEMS = [
  { value: 'ALL', label: 'Todos os estados' },
  { value: 'ACTIVE', label: 'Activos' },
  { value: 'IN_REVIEW', label: 'Em revisão' },
  { value: 'INACTIVE', label: 'Inactivos' },
];

interface ModelsViewProps {
  onSelect: (id: number) => void;
}

export function ModelsView({ onSelect }: ModelsViewProps) {
  const [departmentId, setDepartmentId] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const { options: departmentOptions } = useDepartmentOptions();

  const params = {
    departmentId: departmentId === 'ALL' ? '' : departmentId,
    status: status === 'ALL' ? '' : status,
    limit: 50,
  };

  const { data, isLoading } = useApiQuery<{ data: CompetencyModel[]; total: number }>(
    queryKeys.competencies.models(params),
    '/competencies/models',
    { params, staleTime: STALE_TIME.SEMI_STATIC, placeholderData: keepPreviousData },
  );

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Select
          items={[{ value: 'ALL', label: 'Todos os departamentos' }, ...departmentOptions]}
          value={departmentId}
          onValueChange={setDepartmentId}
          className="min-w-[200px]"
        />
        <Select items={STATUS_ITEMS} value={status} onValueChange={setStatus} />
        <span className="font-body text-sm text-ink-faint">{data?.total ?? 0} modelos</span>
      </div>

      {isLoading ? (
        <Skeleton rows={6} />
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {data?.data.map((model) => (
            <div
              key={model.id}
              onClick={() => onSelect(model.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(model.id);
                }
              }}
              className="cursor-pointer rounded-card border border-border bg-surface p-4 shadow-resting transition-shadow duration-150 hover:shadow-hover"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="mb-1 font-body text-sm font-semibold text-ink">
                    {model.name}
                    {model.code && (
                      <span className="ml-1.5 font-body text-xs font-normal text-ink-faint">
                        {model.code}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge value={model.status} map={STATUS_CFG} />
                    {model.hierarchyLevel && (
                      <StatusBadge value={model.hierarchyLevel} map={HIERARCHY_LEVEL_CFG} />
                    )}
                    <span className="rounded bg-surface-sunken px-1.5 py-0.5 font-body text-xs text-ink-muted">
                      v{model.version}
                    </span>
                  </div>
                </div>
              </div>
              {model.description && (
                <p className="mb-2 line-clamp-2 font-body text-xs text-ink-muted">
                  {model.description}
                </p>
              )}
              <div className="flex items-center gap-3 font-body text-xs text-ink-faint">
                {model.department && <span>{model.department.name}</span>}
                <span>{model._count.items} competências</span>
              </div>
              {model.owner && (
                <div className="mt-2 font-body text-xs text-ink-faint">
                  Responsável: {model.owner.fullName}
                </div>
              )}
            </div>
          ))}
          {data?.data.length === 0 && (
            <div className="col-span-3">
              <EmptyState
                title="Nenhum modelo de competências encontrado"
                description="Ajusta os filtros ou cria um novo modelo."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

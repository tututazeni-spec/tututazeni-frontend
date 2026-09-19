// components/evaluation/CompetenciesTab.tsx
// Separador "Competências" (docs/modulo_evaluation.md pt.6) — integração
// directa com o módulo Competências: reutiliza o motor de gap já existente
// (CompetenciesService.getCompetencyGap/getCompetencyGapForUser) em vez de
// duplicar o cálculo aqui. Mostra Competência → nível esperado → nível
// demonstrado → gap para o colaborador seleccionado (MGMT_ROLES) ou para o
// próprio (COLABORADOR).

'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { MGMT_ROLES } from '@/lib/roles';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { DepartmentUserPicker } from '@/components/departments/DepartmentUserPicker';
import type { DirectoryUser } from '@/components/departments/departmentFormData';
import type { CompetencyGapView } from './types';

export function CompetenciesTab() {
  const role = useCurrentRole();
  const isMgmt = !!role && MGMT_ROLES.includes(role);
  const [selected, setSelected] = useState<DirectoryUser | null>(null);

  const userId = isMgmt ? selected?.id : undefined;
  const url = isMgmt && userId ? `/competencies/user/${userId}/gap` : '/competencies/my/gap';

  const { data, isLoading: loading } = useApiQuery<CompetencyGapView>(
    isMgmt ? queryKeys.competencies.gap(userId ?? 'none') : queryKeys.competencies.gap('me'),
    url,
    { staleTime: STALE_TIME.DYNAMIC, enabled: !isMgmt || !!userId },
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-ink">
          Competências — Esperado vs. Demonstrado
        </h3>
      </div>

      {isMgmt && (
        <Card>
          <CardBody>
            <DepartmentUserPicker
              label="Colaborador"
              htmlFor="comp-gap-user"
              value={selected}
              onChange={setSelected}
            />
          </CardBody>
        </Card>
      )}

      {isMgmt && !selected ? (
        <EmptyState
          title="Selecciona um colaborador"
          description="Escolhe um colaborador para ver o gap de competências face ao cargo actual."
        />
      ) : loading ? (
        <Skeleton rows={4} wrapperClassName="space-y-3" itemClassName="skeleton-shimmer h-16 rounded-card" />
      ) : data?.noPosition ? (
        <EmptyState
          title="Sem cargo atribuído"
          description="Este colaborador não tem um cargo associado — não é possível calcular o gap de competências."
        />
      ) : (data?.gaps.length ?? 0) === 0 ? (
        <EmptyState
          title="Sem competências mapeadas para o cargo"
          description="O cargo actual não tem competências requeridas configuradas."
        />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardBody className="text-center">
                <p className="text-xs text-ink-faint">Prontidão</p>
                <p className="text-2xl font-display font-bold text-ink">
                  {data!.readinessPercent}%
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center">
                <p className="text-xs text-ink-faint">Gaps obrigatórios</p>
                <p className="text-2xl font-display font-bold text-danger-ink">
                  {data!.mandatoryGaps}
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center">
                <p className="text-xs text-ink-faint">Gap total</p>
                <p className="text-2xl font-display font-bold text-ink">{data!.totalGap}</p>
              </CardBody>
            </Card>
          </div>

          <div className="space-y-2">
            {data!.gaps.map((g) => (
              <Card key={g.competency.id}>
                <CardBody>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-semibold text-ink">{g.competency.name}</p>
                        {g.priority === 'MANDATORY' && (
                          <Badge intent="neutral">Obrigatória</Badge>
                        )}
                        {g.met ? (
                          <Badge intent="success">
                            <CheckCircle2 size={11} strokeWidth={1.75} className="inline mr-1" />
                            Cumprida
                          </Badge>
                        ) : (
                          <Badge intent="warning">
                            <AlertTriangle size={11} strokeWidth={1.75} className="inline mr-1" />
                            Gap de {g.gap}
                          </Badge>
                        )}
                      </div>
                      <ProgressBar value={(g.currentLevel / Math.max(1, g.requiredLevel)) * 100} />
                      <p className="text-xs text-ink-faint mt-1">
                        Demonstrado: {g.currentLevel} · Esperado: {g.requiredLevel}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

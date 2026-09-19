// components/evaluation/SettingsTab.tsx
// Separador "Configurações" (docs/modulo_evaluation.md ponto 12) — vista
// agregada e só de leitura sobre a configuração que já existe por peça
// (Escalas/Critérios/Modelos têm CRUD próprio nos separadores dedicados) +
// as listas fixas dos enums do domínio (tipos, estados, fluxo de aprovação,
// visibilidade). Não inventa um mecanismo novo de configuração para o que
// já é código em vez de dados configuráveis — ver evaluation.service.ts
// getSettings().

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { QueryError } from '@/components/ui/QueryError';
import { PURPOSE_LABEL, STAGE_LABEL, STATUS_MAP, TYPE_LABEL } from './constants';
import type { EvaluationSettings } from './types';

const VISIBILITY_LABEL: Record<string, string> = {
  MANAGER_ONLY: 'Apenas o gestor',
  SELF_AND_MANAGER: 'Colaborador e gestor',
  HR_ONLY: 'Apenas RH',
  ALL: 'Todos os intervenientes',
};

export function SettingsTab() {
  const { data, isLoading, error, refetch } = useApiQuery<EvaluationSettings>(
    queryKeys.evaluation.settings(),
    '/evaluations/settings',
  );

  if (isLoading) {
    return (
      <Skeleton rows={4} wrapperClassName="space-y-3" itemClassName="skeleton-shimmer h-24 rounded-card" />
    );
  }

  if (error || !data) {
    return <QueryError error={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <p className="text-xs text-ink-faint">Escalas configuradas</p>
            <p className="text-2xl font-bold text-ink">{data.scales.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-ink-faint">Critérios activos</p>
            <p className="text-2xl font-bold text-ink">{data.criteriaCount}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-ink-faint">Modelos activos</p>
            <p className="text-2xl font-bold text-ink">{data.templatesCount}</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody>
          <h4 className="font-display font-semibold text-ink mb-3">Fluxo de Aprovação</h4>
          <div className="flex flex-wrap items-center gap-2">
            {data.approvalFlow.map((stage, i) => (
              <div key={stage} className="flex items-center gap-2">
                <Badge intent="info">{STAGE_LABEL[stage] ?? stage}</Badge>
                {i < data.approvalFlow.length - 1 && <span className="text-ink-faint">→</span>}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardBody>
            <h4 className="font-display font-semibold text-ink mb-3">Tipos de Avaliação</h4>
            <div className="flex flex-wrap gap-2">
              {data.evalPurposes.map((p) => (
                <Badge key={p} intent="neutral">
                  {PURPOSE_LABEL[p] ?? p}
                </Badge>
              ))}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h4 className="font-display font-semibold text-ink mb-3">Tipos de Avaliador</h4>
            <div className="flex flex-wrap gap-2">
              {data.evalTypes.map((t) => (
                <Badge key={t} intent="neutral">
                  {TYPE_LABEL[t] ?? t}
                </Badge>
              ))}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h4 className="font-display font-semibold text-ink mb-3">Estados do Ciclo</h4>
            <div className="flex flex-wrap gap-2">
              {data.cycleStatuses.map((s) => (
                <Badge key={s} intent="neutral" className={STATUS_MAP[s]?.cls}>
                  {STATUS_MAP[s]?.label ?? s}
                </Badge>
              ))}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h4 className="font-display font-semibold text-ink mb-3">Visibilidade dos Resultados</h4>
            <div className="flex flex-wrap gap-2">
              {data.resultsVisibilityOptions.map((v) => (
                <Badge key={v} intent="neutral">
                  {VISIBILITY_LABEL[v] ?? v}
                </Badge>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody>
          <h4 className="font-display font-semibold text-ink mb-3">Escalas</h4>
          {data.scales.length === 0 && <p className="text-xs text-ink-faint">Sem escalas criadas.</p>}
          <div className="space-y-2">
            {data.scales.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm rounded-control bg-surface-sunken px-3 py-2">
                <span className="text-ink">
                  {s.name} {s.isDefault && <Badge intent="success">Por omissão</Badge>}
                </span>
                <span className="text-xs text-ink-faint">
                  {s.minValue}–{s.maxValue}
                </span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

// components/evaluation/ReportsTab.tsx
// Separador "Relatórios" (docs/modulo_evaluation.md ponto 11) — filtros por
// ciclo/departamento/unidade/cargo/gestor, KPIs, distribuição, evolução,
// gaps de competências, objetivos alcançados e exportação Excel/PDF/CSV.
// Dados próprios (useApiMutation, pesquisa manual) + apresentação, mesmo
// padrão que ResultsTab/CalibrationTab.

'use client';

import { Download } from 'lucide-react';
import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { Button, buttonVariants } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { QueryError } from '@/components/ui/QueryError';
import { SCORE_COLOR } from './constants';
import type { EvaluationReportGroup, EvaluationReportsOverview } from './types';

function GroupTable({ title, rows }: { title: string; rows: EvaluationReportGroup[] }) {
  if (!rows.length) return null;
  return (
    <Card>
      <CardBody>
        <h4 className="font-display font-semibold text-ink mb-3">{title}</h4>
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between text-xs">
              <span className="text-ink-muted">{r.name}</span>
              <span className={`font-bold ${SCORE_COLOR(r.avgScore)}`}>
                {r.avgScore.toFixed(1)} ({r.count})
              </span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

export function ReportsTab() {
  const [filters, setFilters] = useState({
    cycleId: '',
    departmentId: '',
    unitId: '',
    positionId: '',
    managerId: '',
    period: '',
  });

  const load = useApiMutation((qs: string) =>
    apiClient.get<EvaluationReportsOverview>(`/evaluations/reports/overview${qs}`),
  );
  const data = load.data ?? null;

  const buildQuery = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  };

  const run = () => load.mutate(buildQuery());

  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">Ciclo</label>
            <Input
              value={filters.cycleId}
              onChange={(e) => setFilters((f) => ({ ...f, cycleId: e.target.value }))}
              placeholder="ID do ciclo"
              className="w-32"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">Departamento</label>
            <Input
              value={filters.departmentId}
              onChange={(e) => setFilters((f) => ({ ...f, departmentId: e.target.value }))}
              placeholder="ID"
              className="w-24"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">Unidade</label>
            <Input
              value={filters.unitId}
              onChange={(e) => setFilters((f) => ({ ...f, unitId: e.target.value }))}
              placeholder="ID"
              className="w-24"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">Cargo</label>
            <Input
              value={filters.positionId}
              onChange={(e) => setFilters((f) => ({ ...f, positionId: e.target.value }))}
              placeholder="ID"
              className="w-24"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">Gestor</label>
            <Input
              value={filters.managerId}
              onChange={(e) => setFilters((f) => ({ ...f, managerId: e.target.value }))}
              placeholder="ID"
              className="w-24"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">Período</label>
            <Input
              value={filters.period}
              onChange={(e) => setFilters((f) => ({ ...f, period: e.target.value }))}
              placeholder="2026 ou 2026-03"
              className="w-32"
            />
          </div>
          <Button onClick={run} loading={load.isPending}>
            Gerar Relatório
          </Button>
          <a
            href={`/api/evaluations/reports/export.csv${buildQuery()}`}
            className={buttonVariants({ intent: 'secondary', size: 'md' })}
          >
            <Download size={14} strokeWidth={1.75} /> CSV
          </a>
          <a
            href={`/api/evaluations/reports/export.xlsx${buildQuery()}`}
            className={buttonVariants({ intent: 'secondary', size: 'md' })}
          >
            <Download size={14} strokeWidth={1.75} /> Excel
          </a>
          <a
            href={`/api/evaluations/reports/export.pdf${buildQuery()}`}
            className={buttonVariants({ intent: 'secondary', size: 'md' })}
          >
            <Download size={14} strokeWidth={1.75} /> PDF
          </a>
        </CardBody>
      </Card>

      {load.isPending && (
        <Skeleton rows={4} wrapperClassName="space-y-3" itemClassName="skeleton-shimmer h-24 rounded-card" />
      )}

      {load.isError && <QueryError error={load.error} onRetry={run} />}

      {!load.isPending && !data && !load.isError && (
        <EmptyState title="Sem relatório gerado" description="Ajusta os filtros e carrega em «Gerar Relatório»." />
      )}

      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardBody>
                <p className="text-xs text-ink-faint">Total de Avaliações</p>
                <p className="text-2xl font-bold text-ink">{data.totalEvaluations}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-xs text-ink-faint">Score Médio</p>
                <p className={`text-2xl font-bold ${SCORE_COLOR(data.avgScore)}`}>{data.avgScore.toFixed(1)}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-xs text-ink-faint">Taxa de Conclusão</p>
                <p className="text-2xl font-bold text-ink">{data.completionRate}%</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-xs text-ink-faint">Objetivos Alcançados</p>
                <p className="text-2xl font-bold text-ink">
                  {data.objectivesAchieved.avgAchievement != null
                    ? `${data.objectivesAchieved.avgAchievement}%`
                    : '—'}
                </p>
              </CardBody>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GroupTable title="Por Departamento" rows={data.byDepartment} />
            <GroupTable title="Por Unidade" rows={data.byUnit} />
            <GroupTable title="Por Cargo" rows={data.byPosition} />
            <GroupTable title="Por Gestor" rows={data.byManager} />
          </div>

          {data.competencyGaps.length > 0 && (
            <Card>
              <CardBody>
                <h4 className="font-display font-semibold text-ink mb-3">Gaps de Competências</h4>
                <div className="space-y-2">
                  {data.competencyGaps.map((c) => (
                    <div key={c.competencyId} className="flex items-center justify-between text-xs">
                      <span className="text-ink-muted">{c.name}</span>
                      <span className="font-bold text-danger-ink">
                        média {c.avgScore.toFixed(1)} · gap {c.gap.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {data.evolution.length > 1 && (
            <Card>
              <CardBody>
                <h4 className="font-display font-semibold text-ink mb-3">Evolução do Desempenho</h4>
                <div className="flex items-end gap-2 h-24">
                  {data.evolution.map((e) => (
                    <div key={e.period} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t bg-primary-subtle border-primary"
                        style={{ height: `${(e.avgScore / 5) * 100}%` }}
                      />
                      <span className="text-[10px] text-ink-faint">{e.period}</span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

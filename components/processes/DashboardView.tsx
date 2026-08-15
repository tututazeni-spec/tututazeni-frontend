// components/processes/DashboardView.tsx
// Separador "Dashboard" — métricas operacionais + instâncias recentes.
// Dados próprios (useApiQuery) + apresentação. Extraído de
// app/(platform)/processes/page.tsx.

'use client';

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Eye,
  FileEdit,
  Layers,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { KpiCard } from '@/components/ui/KpiCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { INSTANCE_STATUS_MAP, RISK_LEVEL_MAP } from './constants';
import { Skeleton } from './Skeleton';
import type { Dashboard } from './types';

export interface DashboardViewProps {
  onOpenInstance: (id: number) => void;
}

export function DashboardView({ onOpenInstance }: DashboardViewProps) {
  const { data, isLoading, error } = useApiQuery<Dashboard>(
    queryKeys.processes.dashboard(),
    '/processes/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading) return <Skeleton rows={3} />;
  if (error)
    return <div className="font-body text-sm text-danger">{error.message}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Métricas de processos */}
      <div>
        <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
          Biblioteca de processos
        </div>
        <div className="grid grid-cols-3 gap-3">
          <KpiCard
            icon={Layers}
            label="Activos"
            value={data.processes.active}
            sub="Em uso"
            intent="success"
          />
          <KpiCard
            icon={Eye}
            label="Em revisão"
            value={data.processes.inReview}
            sub="Aguardam aprovação"
            intent="warning"
          />
          <KpiCard
            icon={FileEdit}
            label="Rascunhos"
            value={data.processes.draft}
            sub="Em construção"
            intent="primary"
          />
        </div>
      </div>

      {/* Métricas de instâncias */}
      <div>
        <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
          Execuções
        </div>
        <div className="grid grid-cols-3 gap-3">
          <KpiCard
            icon={Activity}
            label="Em progresso"
            value={data.instances.inProgress}
            intent="info"
          />
          <KpiCard
            icon={CheckCircle2}
            label="Concluídas"
            value={data.instances.completed}
            intent="success"
          />
          <KpiCard
            icon={AlertTriangle}
            label="SLA expirados"
            value={data.compliance.overdueSteps}
            intent={data.compliance.overdueSteps > 0 ? 'danger' : 'primary'}
          />
        </div>
      </div>

      {/* Instâncias recentes */}
      {data.recentInstances.length > 0 && (
        <div>
          <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Instâncias recentes
          </div>
          <div className="overflow-hidden rounded-card border border-border bg-surface">
            {data.recentInstances.map((inst) => (
              <div
                key={inst.id}
                className="flex cursor-pointer items-center gap-4 border-b border-border px-4 py-3 last:border-0 hover:bg-surface-sunken"
                onClick={() => onOpenInstance(inst.id)}
              >
                <div className="flex-1">
                  <div className="font-body text-sm font-medium text-ink">
                    {inst.process.title}
                  </div>
                  <div className="font-body text-xs text-ink-faint">
                    {inst.targetUser.fullName} · {fmtDate(inst.startedAt)}
                  </div>
                </div>
                <StatusBadge
                  value={inst.status}
                  map={INSTANCE_STATUS_MAP}
                  variant="pill"
                />
                <StatusBadge
                  value={inst.process.riskLevel}
                  map={RISK_LEVEL_MAP}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

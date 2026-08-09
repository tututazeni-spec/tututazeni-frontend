// components/processes/DashboardView.tsx
// Separador "Dashboard" — métricas operacionais + instâncias recentes.
// Dados próprios (useApiQuery) + apresentação. Extraído de
// app/(platform)/processes/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { INSTANCE_STATUS_MAP, RISK_LEVEL_MAP } from './constants';
import { Skeleton } from './Skeleton';
import type { Dashboard } from './types';

export interface DashboardViewProps {
  onOpenInstance: (id: number) => void;
}

interface MetricCardProps {
  label: string;
  value: number | string;
  sub?: string;
  accent?: string;
}

function MetricCard({ label, value, sub, accent }: MetricCardProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="text-xs text-gray-400 mb-1.5">{label}</div>
      <div
        className={`text-2xl font-semibold font-mono ${accent ?? 'text-gray-900'}`}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

export function DashboardView({ onOpenInstance }: DashboardViewProps) {
  const { data, isLoading, error } = useApiQuery<Dashboard>(
    queryKeys.processes.dashboard(),
    '/processes/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading) return <Skeleton rows={3} />;
  if (error) return <div className="text-sm text-red-500">{error.message}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Métricas de processos */}
      <div>
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
          Biblioteca de processos
        </div>
        <div className="grid grid-cols-3 gap-3">
          <MetricCard
            label="Activos"
            value={data.processes.active}
            sub="Em uso"
            accent="text-emerald-600"
          />
          <MetricCard
            label="Em revisão"
            value={data.processes.inReview}
            sub="Aguardam aprovação"
            accent="text-amber-600"
          />
          <MetricCard
            label="Rascunhos"
            value={data.processes.draft}
            sub="Em construção"
          />
        </div>
      </div>

      {/* Métricas de instâncias */}
      <div>
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
          Execuções
        </div>
        <div className="grid grid-cols-3 gap-3">
          <MetricCard
            label="Em progresso"
            value={data.instances.inProgress}
            accent="text-blue-600"
          />
          <MetricCard
            label="Concluídas"
            value={data.instances.completed}
            accent="text-emerald-600"
          />
          <MetricCard
            label="SLA expirados"
            value={data.compliance.overdueSteps}
            accent={
              data.compliance.overdueSteps > 0
                ? 'text-red-600'
                : 'text-gray-900'
            }
          />
        </div>
      </div>

      {/* Instâncias recentes */}
      {data.recentInstances.length > 0 && (
        <div>
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Instâncias recentes
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {data.recentInstances.map((inst) => (
              <div
                key={inst.id}
                className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer"
                onClick={() => onOpenInstance(inst.id)}
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {inst.process.title}
                  </div>
                  <div className="text-xs text-gray-400">
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

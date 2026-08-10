// components/api-integrations/MonitoringTab.tsx

import { Plug, Activity, AlertTriangle, TrendingUp } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton, HEALTH_CONFIG } from './atoms';
import type { MonitoringStats } from './types';

export function MonitoringTab() {
  const { data, isLoading: loading } = useApiQuery<MonitoringStats>(
    queryKeys.apiIntegrations.stats(),
    '/api-integrations/stats',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  if (loading) return <Skeleton />;
  const s = data?.summary ?? {};

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Integrações Activas',
            value: s.activeIntegrations ?? 0,
            icon: Plug,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
          },
          {
            label: 'Chamadas (24h)',
            value: s.totalLogs24h ?? 0,
            icon: Activity,
            color: 'text-teal-600',
            bg: 'bg-teal-50',
          },
          {
            label: 'Taxa de Erro',
            value: `${s.errorRate24h ?? 0}%`,
            icon: AlertTriangle,
            color:
              (s.errorRate24h ?? 0) > 5 ? 'text-red-600' : 'text-emerald-600',
            bg: (s.errorRate24h ?? 0) > 5 ? 'bg-red-50' : 'bg-emerald-50',
          },
          {
            label: 'Latência Média',
            value: s.avgLatencyMs ? `${s.avgLatencyMs}ms` : '–',
            icon: TrendingUp,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
        ].map((k) => (
          <div
            key={k.label}
            className="bg-white rounded-xl border border-slate-100 p-4"
          >
            <div className={`p-2 rounded-lg ${k.bg} w-fit mb-2`}>
              <k.icon size={16} className={k.color} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{k.value}</p>
            <p className="text-xs text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Integration health grid */}
      {(data?.integrationHealth ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-4">
            Saúde das Integrações
          </h4>
          <div className="grid gap-2">
            {(data?.integrationHealth ?? []).map((i, idx) => {
              const hc = HEALTH_CONFIG[i.health] ?? HEALTH_CONFIG.UNKNOWN;
              return (
                <div key={idx} className="flex items-center gap-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${hc.dot}`}
                  />
                  <span className="text-sm text-slate-700 flex-1">
                    {i.name}
                  </span>
                  <span className="text-xs text-slate-400">
                    {i.logs7d} calls/7d
                  </span>
                  <span
                    className={`text-xs font-bold ${i.errorRate > 5 ? 'text-red-600' : 'text-emerald-600'}`}
                  >
                    {i.errorRate}% err
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${hc.bg} ${hc.color} font-medium`}
                  >
                    {i.health}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="text-xs text-slate-400 text-right">
        Actualizado:{' '}
        {new Date(data?.generatedAt ?? Date.now()).toLocaleString('pt')}
      </div>
    </div>
  );
}

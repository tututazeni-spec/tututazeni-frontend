// components/dashboard-rh/TalentPanel.tsx
// Painel "Talento" — pipeline de sucessão, high potentials e posições em
// risco. Dados próprios (useApiQuery) + apresentação. Extraído de
// app/(platform)/dashboard-rh/page.tsx.

'use client';

import { AlertTriangle, Star, Target, Users } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar, KPICard, Skeleton } from './atoms';
import type { TalentData } from './types';

export function TalentPanel() {
  const { data, isLoading: loading } = useApiQuery<TalentData>(
    queryKeys.dashboardRh.talent(),
    '/dashboard-rh/talent-pipeline',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  if (loading) return <Skeleton count={3} />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          icon={Target}
          label="Posições Cobertas"
          value={`${data?.coverageRate ?? 0}%`}
          color="text-indigo-600"
          bg="bg-indigo-50"
        />
        <KPICard
          icon={Users}
          label="Planos de Sucessão"
          value={data?.successionPlans?.length ?? 0}
        />
        <KPICard
          icon={Star}
          label="High Potentials"
          value={data?.hiPoCount ?? 0}
          color="text-amber-600"
          bg="bg-amber-50"
        />
        <KPICard
          icon={AlertTriangle}
          label="Posições em Risco"
          value={data?.positionsAtRisk?.length ?? 0}
          color="text-red-500"
          bg="bg-red-50"
        />
      </div>

      {/* Succession plans */}
      {(data?.successionPlans ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-3">
            Planos de Sucessão
          </h4>
          <div className="space-y-2">
            {(data?.successionPlans ?? []).slice(0, 8).map((p, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0"
              >
                <Avatar
                  name={p.candidate?.fullName ?? '?'}
                  url={p.candidate?.avatarUrl}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700">
                    {p.candidate?.fullName}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    → {p.position?.name}
                  </p>
                </div>
                {p.readiness && (
                  <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                    {p.readiness}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Positions at risk */}
      {(data?.positionsAtRisk ?? []).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h4 className="font-semibold text-red-700 mb-2">
            ⚠️ Posições Sem Sucessor
          </h4>
          <div className="space-y-1">
            {(data?.positionsAtRisk ?? []).map((p, i) => (
              <p key={i} className="text-xs text-red-700">
                • {p.name} (Nível {p.level})
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

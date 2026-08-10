// components/trainings/DashboardView.tsx
// Separador "Dashboard (Admin)" — KPIs, participantes e top
// treinamentos. Dados próprios + apresentação. Extraído de
// app/(platform)/trainings/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton, StarRating } from './atoms';
import { TYPE_CFG } from './constants';
import type { Dashboard } from './types';

export function DashboardView() {
  const { data, isLoading } = useApiQuery<Dashboard>(
    queryKeys.trainings.adminDashboard(),
    '/trainings/admin/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={3} />;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total treinamentos', value: data.trainings.total },
          {
            label: 'Publicados',
            value: data.trainings.published,
            color: 'text-emerald-600',
          },
          {
            label: 'Obrigatórios',
            value: data.trainings.mandatory,
            color: 'text-red-600',
          },
          {
            label: 'Taxa de conclusão',
            value: `${data.completionRate}%`,
            color: 'text-blue-600',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div
              className={`text-2xl font-semibold font-mono ${color ?? 'text-gray-900'}`}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Participantes */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-400 mb-1">Total inscrições</div>
          <div className="text-3xl font-bold font-mono text-gray-900">
            {data.participants.total}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-400 mb-1">Rating médio</div>
          <div className="flex items-center gap-2">
            <div className="text-3xl font-bold font-mono text-amber-600">
              {data.avgRating.toFixed(1)}
            </div>
            <StarRating value={data.avgRating} />
          </div>
        </div>
      </div>

      {/* Top */}
      {data.topTrainings.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Mais populares
          </div>
          {data.topTrainings.map((t, idx) => (
            <div
              key={t.id}
              className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0"
            >
              <span className="text-lg font-bold font-mono text-gray-200 w-6 text-center">
                {idx + 1}
              </span>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {t.title}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className={`${TYPE_CFG[t.type].cls} px-1.5 rounded`}>
                    {TYPE_CFG[t.type].icon}
                  </span>
                  <span>{t._count.participants} inscritos</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

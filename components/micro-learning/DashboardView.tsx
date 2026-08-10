// components/micro-learning/DashboardView.tsx
// Vista "O meu progresso": streak, stats e actividade recente.
// Extraído de app/(platform)/micro-learning/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import { TYPE_CFG } from './constants';
import type { ContentType, MyDashboard } from './types';

export function DashboardView() {
  const { data, isLoading } = useApiQuery<MyDashboard>(
    queryKeys.microLearning.dashboard(),
    '/micro-learning/dashboard/me',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading || !data) return <Skeleton rows={4} />;

  const { streak, stats } = data;

  return (
    <div className="space-y-6">
      {/* Streak */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-6 flex items-center justify-between">
        <div>
          <div className="text-sm text-amber-100 mb-1">Streak actual</div>
          <div className="text-5xl font-bold">{streak.current}</div>
          <div className="text-sm text-amber-100 mt-1">
            dias consecutivos 🔥
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-amber-100">Recorde</div>
          <div className="text-3xl font-bold">{streak.longest}</div>
          <div className="text-sm text-amber-100 mt-1">dias</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: 'Concluídos',
            value: stats.completed,
            color: 'text-emerald-600',
          },
          {
            label: 'Minutos',
            value: stats.totalMinutes,
            color: 'text-blue-600',
          },
          { label: 'XP ganho', value: stats.totalXp, color: 'text-amber-600' },
          { label: 'Quiz médio', value: `${stats.avgQuizScore}%` },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div
              className={`text-2xl font-bold font-mono ${color ?? 'text-gray-900'}`}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Actividade recente */}
      {data.recentActivity.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Actividade recente
          </div>
          {data.recentActivity.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0"
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${TYPE_CFG[a.microLearning?.contentType as ContentType]?.cls ?? 'bg-gray-100'}`}
              >
                {TYPE_CFG[a.microLearning?.contentType as ContentType]?.icon ??
                  '📄'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {a.microLearning?.title}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs font-mono font-bold text-blue-600">
                  {a.progress}%
                </div>
                {a.completedAt && (
                  <div className="text-xs text-emerald-600">✓ Concluído</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// components/onboarding/TemplatesView.tsx
// Separador "Templates" — catálogo de templates de onboarding. Dados
// próprios + apresentação. Extraído de
// app/(platform)/onboarding/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import { CATEGORY_CFG } from './constants';
import type { OnboardingTemplate } from './types';

export function TemplatesView() {
  const { data = [], isLoading: loading } = useApiQuery<OnboardingTemplate[]>(
    queryKeys.onboarding.templates(),
    '/onboarding/templates',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading) return <Skeleton />;

  return (
    <div className="grid grid-cols-3 gap-4">
      {data.map((t) => (
        <div
          key={t.id}
          className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {t.name}
              </div>
              {t.description && (
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                  {t.description}
                </p>
              )}
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${t.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}
            >
              {t.active ? 'Activo' : 'Inactivo'}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-gray-400 mb-4">
            <span>📅 {t.durationDays} dias</span>
            <span>📋 {t._count?.tasks ?? 0} tarefas</span>
            <span>👥 {t._count?.plans ?? 0} planos</span>
            {t.position && <span>💼 {t.position.name}</span>}
            {t.department && <span>🏢 {t.department.name}</span>}
          </div>

          {t.tasks && t.tasks.length > 0 && (
            <div className="space-y-1">
              {t.tasks.slice(0, 3).map((task) => {
                const catCfg = CATEGORY_CFG[task.category];
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 text-xs text-gray-600"
                  >
                    <span>{catCfg?.icon ?? '•'}</span>
                    <span className="truncate">{task.title}</span>
                    <span className="ml-auto text-amber-500">
                      +{task.xpReward}xp
                    </span>
                  </div>
                );
              })}
              {t.tasks.length > 3 && (
                <div className="text-xs text-gray-400">
                  +{t.tasks.length - 3} mais tarefas…
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      {data.length === 0 && (
        <div className="col-span-3 py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
          Sem templates configurados
        </div>
      )}
    </div>
  );
}

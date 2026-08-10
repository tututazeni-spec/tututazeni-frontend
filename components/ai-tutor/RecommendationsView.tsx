// components/ai-tutor/RecommendationsView.tsx
// Vista "Recomendações": insight IA, gaps de competência e cursos
// recomendados. Extraído de app/(platform)/ai-tutor/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import type { Recommendation } from './types';

export function RecommendationsView() {
  const { data, isLoading: loading } = useApiQuery<Recommendation>(
    queryKeys.aiTutor.recommendations(),
    '/ai-tutor/recommendations',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading) return <Skeleton rows={4} />;
  if (!data) return null;

  return (
    <div className="space-y-5">
      {/* AI Insight */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            N
          </div>
          <span className="text-xs font-semibold text-blue-700">
            Insight do NOVA
          </span>
          <span className="text-xs text-gray-400 ml-auto">{data.provider}</span>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
          {data.aiInsight}
        </p>
      </div>

      {/* Gaps */}
      {data.competencyGaps.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            ⚡ Gaps de competência identificados
          </div>
          <div className="flex flex-wrap gap-2">
            {data.competencyGaps.map((g) => (
              <span
                key={g}
                className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg border border-amber-200"
              >
                {g}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Cursos */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
          Cursos recomendados
        </div>
        {data.courses.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0"
          >
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 text-lg flex-shrink-0">
              🎓
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {c.title}
              </div>
              <div className="text-xs text-gray-400">
                {c.category}
                {c.workloadHours ? ` · ${c.workloadHours}h` : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

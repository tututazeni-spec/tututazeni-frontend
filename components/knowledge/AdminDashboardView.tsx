// components/knowledge/AdminDashboardView.tsx
// Separador "Admin" — KPIs, gaps de conhecimento e tops de artigos.
// Dados próprios + apresentação. Extraído de
// app/(platform)/knowledge/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import { timeAgo } from './utils';
import type { Dashboard } from './types';

export function AdminDashboardView() {
  const { data, isLoading } = useApiQuery<Dashboard>(
    queryKeys.knowledge.adminDashboard(),
    '/knowledge/admin/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={4} />;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total artigos', value: data.articles.total },
          {
            label: 'Publicados',
            value: data.articles.published,
            color: 'text-emerald-600',
          },
          { label: 'Total visualizações', value: data.views },
          {
            label: 'Artigos desactualiz.',
            value: data.articles.stale,
            color: data.articles.stale > 0 ? 'text-amber-600' : undefined,
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

      {/* Gaps de conhecimento */}
      {data.knowledgeGaps.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="text-sm font-semibold text-amber-800 mb-3">
            🔍 Gaps de Conhecimento — Buscas sem resultado ({data.emptySearches}
            )
          </div>
          <div className="grid grid-cols-2 gap-2">
            {data.knowledgeGaps.map((gap) => (
              <div
                key={gap.query}
                className="flex justify-between text-xs py-1.5 border-b border-amber-100"
              >
                <span className="text-amber-800 font-medium">
                  &quot;{gap.query}&quot;
                </span>
                <span className="text-amber-600">{gap.searches}× buscado</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top artigos */}
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Mais vistos
          </div>
          {data.topArticles.map((a, idx) => (
            <div
              key={a.id}
              className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0"
            >
              <span className="text-lg font-bold font-mono text-gray-200 w-5 text-center">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-900 truncate">
                  {a.title}
                </div>
                <div className="text-xs text-gray-400">{a.author.fullName}</div>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">
                👁 {a.viewCount}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Actualizados recentemente
          </div>
          {data.recentlyUpdated.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-900 truncate">
                  {a.title}
                </div>
                <div className="text-xs text-gray-400">{a.author.fullName}</div>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {timeAgo(a.updatedAt)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

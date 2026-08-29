// components/knowledge/AdminDashboardView.tsx
// Separador "Admin" — KPIs, gaps de conhecimento e tops de artigos.
// Dados próprios + apresentação. Extraído de
// app/(platform)/knowledge/page.tsx. Migrado para a fundação de design:
// skeleton local passa a components/ui/Skeleton; cartões de KPI e listas
// passam a tokens semânticos.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/Skeleton';
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
            color: 'text-success-ink',
          },
          { label: 'Total visualizações', value: data.views },
          {
            label: 'Artigos desactualiz.',
            value: data.articles.stale,
            color: data.articles.stale > 0 ? 'text-warning-ink' : undefined,
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-card bg-surface-sunken p-4">
            <div className="mb-1 font-body text-xs text-ink-faint">{label}</div>
            <div
              className={`font-data text-2xl font-semibold ${color ?? 'text-ink'}`}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Gaps de conhecimento */}
      {data.knowledgeGaps.length > 0 && (
        <div className="rounded-card border border-black bg-white p-5">
          <div className="mb-3 font-body text-sm font-semibold text-black">
            Lacunas de Conhecimento — Buscas sem resultado ({data.emptySearches}
            )
          </div>
          <div className="grid grid-cols-2 gap-2">
            {data.knowledgeGaps.map((gap) => (
              <div
                key={gap.query}
                className="flex justify-between border-b border-black py-1.5 font-body text-xs"
              >
                <span className="font-medium text-black">
                  &quot;{gap.query}&quot;
                </span>
                <span className="text-black">{gap.searches}× buscado</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top artigos */}
      <div className="grid grid-cols-2 gap-5">
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Mais vistos
          </div>
          {data.topArticles.map((a, idx) => (
            <div
              key={a.id}
              className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0"
            >
              <span className="w-5 text-center font-data text-lg font-bold text-border-strong">
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-body text-xs font-medium text-ink">
                  {a.title}
                </div>
                <div className="font-body text-xs text-ink-faint">
                  {a.author.fullName}
                </div>
              </div>
              <span className="flex-shrink-0 font-body text-xs text-ink-faint">
                👁 {a.viewCount}
              </span>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Actualizados recentemente
          </div>
          {data.recentlyUpdated.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-body text-xs font-medium text-ink">
                  {a.title}
                </div>
                <div className="font-body text-xs text-ink-faint">
                  {a.author.fullName}
                </div>
              </div>
              <span className="flex-shrink-0 font-body text-xs text-ink-faint">
                {timeAgo(a.updatedAt)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

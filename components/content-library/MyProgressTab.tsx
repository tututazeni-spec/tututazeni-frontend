// components/content-library/MyProgressTab.tsx
// Separador "O Meu Percurso" — stats pessoais, em progresso, concluídos e
// guardados. Dados próprios (useApiQuery) + apresentação. Extraído de
// app/(platform)/content-library/page.tsx.

'use client';

import {
  Bookmark,
  CheckCircle,
  Clock,
  Eye,
  BookMarked,
  RotateCcw,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { ProgressBar, Skeleton } from './atoms';
import { ContentCard } from './ContentCard';
import type { Content, MyContentStats, MyProgressResponse } from './types';

export function MyProgressTab() {
  const progressQuery = useApiQuery<MyProgressResponse>(
    queryKeys.contentLibrary.myProgress(),
    '/content-library/my/progress',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const statsQuery = useApiQuery<MyContentStats>(
    queryKeys.contentLibrary.myStats(),
    '/content-library/analytics/my-stats',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const bookmarksQuery = useApiQuery<Content[]>(
    queryKeys.contentLibrary.bookmarks(),
    '/content-library/bookmarks',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const progress = progressQuery.data ?? null;
  const stats = statsQuery.data ?? null;
  const bookmarks = bookmarksQuery.data ?? [];

  if (
    progressQuery.isLoading ||
    statsQuery.isLoading ||
    bookmarksQuery.isLoading
  )
    return <Skeleton count={4} />;

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Visualizações',
              value: stats.viewCount,
              icon: Eye,
              color: 'text-indigo-600',
              bg: 'bg-indigo-50',
            },
            {
              label: 'Concluídos',
              value: stats.completions,
              icon: CheckCircle,
              color: 'text-emerald-600',
              bg: 'bg-emerald-50',
            },
            {
              label: 'Guardados',
              value: stats.bookmarkCount,
              icon: BookMarked,
              color: 'text-amber-600',
              bg: 'bg-amber-50',
            },
            {
              label: 'Horas de aprendizagem',
              value: `${stats.totalHours}h`,
              icon: Clock,
              color: 'text-violet-600',
              bg: 'bg-violet-50',
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-xl border border-slate-100 p-4"
            >
              <div className={`p-2 rounded-lg ${s.bg} w-fit mb-2`}>
                <s.icon size={16} className={s.color} />
              </div>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* In progress */}
      {(progress?.data.filter((p) => p.progress > 0 && p.progress < 100)
        .length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <RotateCcw size={16} className="text-indigo-500" />
            Em Progresso
          </h3>
          <div className="space-y-2">
            {progress!.data
              .filter((p) => p.progress > 0 && p.progress < 100)
              .slice(0, 5)
              .map((p) => (
                <div key={p.contentId} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {p.content?.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <ProgressBar value={p.progress} height="h-1" />
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {p.progress}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {(progress?.stats.completed ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-500" />
            Concluídos ({progress?.stats.completed})
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {progress!.data
              .filter((p) => p.progress === 100 && p.content)
              .slice(0, 8)
              .map((p) => (
                <ContentCard
                  key={p.contentId}
                  content={{ ...p.content!, progress: p }}
                  compact
                />
              ))}
          </div>
        </div>
      )}

      {/* Bookmarks */}
      {bookmarks.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Bookmark size={16} className="text-amber-500" />
            Guardados ({bookmarks.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {bookmarks.map((c) => (
              <ContentCard key={c.id} content={{ ...c, isBookmarked: true }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

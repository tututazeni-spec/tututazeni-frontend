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
import { Card, CardBody } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
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
    return <Skeleton rows={4} />;

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard
            label="Visualizações"
            value={stats.viewCount}
            intent="info"
            className="w-full"
          />
          <KpiCard
            label="Concluídos"
            value={stats.completions}
            intent="success"
            className="w-full"
          />
          <KpiCard
            label="Guardados"
            value={stats.bookmarkCount}
            intent="warning"
            className="w-full"
          />
          <KpiCard
            label="Horas de aprendizagem"
            value={`${stats.totalHours}h`}
            intent="accent"
            className="w-full"
          />
        </div>
      )}

      {/* In progress */}
      {(progress?.data.filter((p) => p.progress > 0 && p.progress < 100)
        .length ?? 0) > 0 && (
        <Card>
          <CardBody>
            <h3 className="mb-3 flex items-center gap-2 font-body font-semibold text-ink">
              <RotateCcw
                size={16}
                strokeWidth={1.75}
                className="text-primary"
              />
              Em Progresso
            </h3>
            <div className="space-y-2">
              {progress!.data
                .filter((p) => p.progress > 0 && p.progress < 100)
                .slice(0, 5)
                .map((p) => (
                  <div key={p.contentId} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-body text-sm font-medium text-ink">
                        {p.content?.title}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <ProgressBar value={p.progress} className="h-1" />
                        <span className="shrink-0 font-body text-[10px] text-ink-faint">
                          {p.progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Completed */}
      {(progress?.stats.completed ?? 0) > 0 && (
        <Card>
          <CardBody>
            <h3 className="mb-3 flex items-center gap-2 font-body font-semibold text-ink">
              <CheckCircle
                size={16}
                strokeWidth={1.75}
                className="text-success"
              />
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
          </CardBody>
        </Card>
      )}

      {/* Bookmarks */}
      {bookmarks.length > 0 && (
        <Card>
          <CardBody>
            <h3 className="mb-3 flex items-center gap-2 font-body font-semibold text-ink">
              <Bookmark size={16} strokeWidth={1.75} className="text-accent" />
              Guardados ({bookmarks.length})
            </h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {bookmarks.map((c) => (
                <ContentCard
                  key={c.id}
                  content={{ ...c, isBookmarked: true }}
                />
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

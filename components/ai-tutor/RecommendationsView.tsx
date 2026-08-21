// components/ai-tutor/RecommendationsView.tsx
// Vista "Recomendações": insight IA, gaps de competência e cursos
// recomendados. Extraído de app/(platform)/ai-tutor/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Recommendation } from './types';

export function RecommendationsView() {
  const { data, isLoading: loading } = useApiQuery<Recommendation>(
    queryKeys.aiTutor.recommendations(),
    '/ai-tutor/recommendations',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-3"
        itemClassName="skeleton-shimmer h-20 rounded-card"
      />
    );
  if (!data) return null;

  return (
    <div className="space-y-5">
      {/* AI Insight */}
      <Card className="border-primary-subtle bg-gradient-to-r from-primary-subtle to-accent-subtle p-5">
        <div className="flex items-center gap-2 mb-3">
          <Avatar name="Ísis" size="sm" />
          <span className="font-body text-xs font-semibold text-primary">
            Análises da Ísis
          </span>
          <span className="font-body text-xs text-ink-faint ml-auto">
            {data.provider}
          </span>
        </div>
        <p className="font-body text-sm text-ink leading-relaxed whitespace-pre-line">
          {data.aiInsight}
        </p>
      </Card>

      {/* Gaps */}
      {data.competencyGaps.length > 0 && (
        <Card className="p-4">
          <div className="font-body text-xs font-medium text-ink-faint uppercase tracking-wide mb-3">
            Lacunas de competência identificados
          </div>
          <div className="flex flex-wrap gap-2">
            {data.competencyGaps.map((g) => (
              <Badge key={g} intent="warning">
                {g}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Cursos */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border font-body text-xs font-medium text-ink-faint uppercase tracking-wide">
          Cursos recomendados
        </div>
        {data.courses.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0"
          >
            <div className="w-9 h-9 bg-primary-subtle rounded-control flex items-center justify-center text-primary text-lg flex-shrink-0">
              🎓
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-body text-sm font-medium text-ink truncate">
                {c.title}
              </div>
              <div className="font-body text-xs text-ink-faint">
                {c.category}
                {c.workloadHours ? ` · ${c.workloadHours}h` : ''}
              </div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

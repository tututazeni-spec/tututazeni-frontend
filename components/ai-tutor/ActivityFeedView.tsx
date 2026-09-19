// components/ai-tutor/ActivityFeedView.tsx
// "Aba Histórico (a aumentar)" (docs/ai-tutor.md secção 6): feed unificado
// de perguntas, exercícios, recomendações e conteúdos consultados — em vez
// de uma aba própria, vive dentro de Sessões como o separador "Actividade".

'use client';

import { HelpCircle, Lightbulb, MessageCircle, Sparkles } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime as fmtDate } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ActivityFeed } from './types';

export function ActivityFeedView() {
  const { data, isLoading: loading } = useApiQuery<ActivityFeed>(
    queryKeys.aiTutor.history(),
    '/ai-tutor/history',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="grid grid-cols-1 md:grid-cols-2 gap-4"
        itemClassName="skeleton-shimmer h-40 rounded-card"
      />
    );
  if (!data) return null;

  const isEmpty =
    data.questions.length === 0 &&
    data.exercises.length === 0 &&
    data.recommendations.length === 0;

  if (isEmpty)
    return (
      <EmptyState
        icon={MessageCircle}
        title="Ainda sem actividade registada"
        description="Perguntas, exercícios e recomendações vão aparecer aqui à medida que usares a Ísis."
      />
    );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border font-body text-xs font-medium text-ink-faint uppercase tracking-wide">
          <MessageCircle size={14} strokeWidth={1.75} />
          Perguntas realizadas
        </div>
        {data.questions.length === 0 ? (
          <div className="px-4 py-4 font-body text-sm text-ink-faint">Nenhuma ainda.</div>
        ) : (
          data.questions.map((q) => (
            <div key={q.id} className="px-4 py-2.5 border-b border-border last:border-0">
              <div className="font-body text-sm text-ink truncate">{q.content}</div>
              <div className="font-body text-xs text-ink-faint">{fmtDate(q.createdAt)}</div>
            </div>
          ))
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border font-body text-xs font-medium text-ink-faint uppercase tracking-wide">
          <HelpCircle size={14} strokeWidth={1.75} />
          Exercícios gerados
        </div>
        {data.exercises.length === 0 ? (
          <div className="px-4 py-4 font-body text-sm text-ink-faint">Nenhum ainda.</div>
        ) : (
          data.exercises.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border last:border-0"
            >
              <div className="min-w-0">
                <div className="font-body text-sm text-ink truncate">{e.topic ?? 'Curso'}</div>
                <div className="font-body text-xs text-ink-faint">{fmtDate(e.createdAt)}</div>
              </div>
              <Badge intent="neutral" className="flex-shrink-0">
                {e.type}
              </Badge>
            </div>
          ))
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border font-body text-xs font-medium text-ink-faint uppercase tracking-wide">
          <Sparkles size={14} strokeWidth={1.75} />
          Recomendações
        </div>
        {data.recommendations.length === 0 ? (
          <div className="px-4 py-4 font-body text-sm text-ink-faint">Nenhuma ainda.</div>
        ) : (
          data.recommendations.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border last:border-0"
            >
              <span className="font-body text-sm text-ink">
                {r.courseIds.length} curso(s) recomendado(s)
              </span>
              <Badge intent={r.accepted ? 'success' : 'neutral'} className="flex-shrink-0">
                {r.accepted ? 'Aceite' : fmtDate(r.createdAt)}
              </Badge>
            </div>
          ))
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border font-body text-xs font-medium text-ink-faint uppercase tracking-wide">
          <Lightbulb size={14} strokeWidth={1.75} />
          Conteúdos consultados
        </div>
        {data.sourcesConsulted.length === 0 ? (
          <div className="px-4 py-4 font-body text-sm text-ink-faint">Nenhum ainda.</div>
        ) : (
          data.sourcesConsulted.map((s, i) => (
            <div key={i} className="px-4 py-2.5 border-b border-border last:border-0">
              <div className="font-body text-sm text-ink truncate">{s.title}</div>
              <div className="font-body text-xs text-ink-faint">{fmtDate(s.consultedAt)}</div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
